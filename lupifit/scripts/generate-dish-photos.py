#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates one photo per dish of the LUPU-FIT daily menu with Google Imagen, sized for phones.

Runs on YOUR machine with YOUR key; nothing here is part of the app or its CI.

Setup:
    pip install google-genai pillow
    export GEMINI_API_KEY="..."        # read from the environment only, never stored or printed

Typical use (from the lupifit/ folder):
    python3 scripts/generate-dish-photos.py --dry-run          # prompts only: no API calls, no cost
    python3 scripts/generate-dish-photos.py --limit 5          # look at the style first
    python3 scripts/generate-dish-photos.py                    # all 300 (asks before spending anything)
    python3 scripts/generate-dish-photos.py --only b01,l17     # redo specific dishes

Output (default dish_photos_out/): <id>.webp, 480x480, at most ~40 KB each, plus failed.txt and
all_dish_photos.zip. Copy the .webp files over client/public/dishes/ (same names, no code change).

Notes:
- Imagen is billed per image on your Google account; check current pricing. The script prints how many
  calls it is about to make and asks first (--yes skips the question).
- The model name changes over time; override it with --model if the default is no longer available.
- Images are AI-generated: they may not match the exact amount or every ingredient, and Google's terms for
  generated images apply to how you may use them. Check both before publishing.
"""

from __future__ import annotations

import argparse
import csv
import io
import os
import re
import sys
import time
import zipfile
from pathlib import Path

SIZE = 480
MAX_KB = 40
DEFAULT_MODEL = "imagen-3.0-generate-002"  # verify it is still offered to your account; see --model
DEFAULT_CSV = Path(__file__).resolve().parent.parent / "docs" / "menu-photos-needed.csv"

STYLE = (
    "Overhead food photograph, soft natural daylight from one side, plain light-grey stone surface, "
    "realistic and appetizing, a single serving, nothing else on the table, square composition. "
    "No text, no letters, no numbers, no labels, no logos, no watermark, no people, no hands."
)

# Words that make a dish a drink / something served in a bowl (checked on the English name).
DRINK = re.compile(
    r"\b(shake|smoothie|juice|lemonade|lassi|milkshake|cooler|iced tea|herbal tea|hot chocolate|chocolate milk|glass of milk|kefir|infused water|water with lemon)\b",
    re.I,
)
HOT_DRINK = re.compile(r"\b(hot chocolate|herbal tea)\b", re.I)
SOLID_WITH_DRINK = re.compile(r"\b(sandwich|toast|bowl|pancake|oatmeal|cornflakes|yogurt with|pudding)\b", re.I)
BOWL = re.compile(r"\b(soup|stew|porridge|oatmeal|oats|salad|poke|bowl|pudding|quinoa|muesli|granola|cornflakes|couscous|mujaddara|maqluba|ptitim|ful|masabacha)\b", re.I)


def serving_style(row: dict) -> str:
    """How the dish is served: 'glass', 'mug', 'bowl', 'board' (snacks) or 'plate'."""
    dish_id = row["id"]
    name = row["name_en"]
    if dish_id.startswith("w") or (DRINK.search(name) and not SOLID_WITH_DRINK.search(name)):
        return "mug" if HOT_DRINK.search(name) else "glass"
    if BOWL.search(name):
        return "bowl"
    if dish_id.startswith("s"):
        return "board"
    return "plate"


SERVING_TEXT = {
    "glass": "served in a clear glass",
    "mug": "served in a plain ceramic mug",
    "bowl": "served in a plain white ceramic bowl",
    "board": "served on a small plain plate or a light wooden board",
    "plate": "served on a plain white ceramic plate",
}


def build_prompt(row: dict) -> str:
    """The text sent to the model. Only the name and ingredients: never the dish id."""
    return f"{row['name_en']}, made with {row['ingredients_en']}, {SERVING_TEXT[serving_style(row)]}. {STYLE}"


def load_rows(path: Path) -> list[dict]:
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    needed = {"file", "id", "name_en", "ingredients_en"}
    if not rows or not needed <= set(rows[0]):
        raise SystemExit(f"{path} is missing columns {sorted(needed)}; regenerate it with `npm run docs:dishes`.")
    return rows


def to_square_webp(image_bytes: bytes, size: int = SIZE, max_kb: int = MAX_KB) -> tuple[bytes, int]:
    """Centre-crops to a square, resizes, and lowers WebP quality until the file fits. Returns (bytes, quality)."""
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    side = min(img.size)
    left, top = (img.width - side) // 2, (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side)).resize((size, size), Image.LANCZOS)
    data, quality = b"", 82
    for quality in range(82, 39, -6):
        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=quality, method=6)
        data = buf.getvalue()
        if len(data) <= max_kb * 1024:
            break
    return data, quality


class FatalError(Exception):
    """Something that will fail every call (bad key, no access, unknown model): stop instead of retrying 300 times."""


def error_code(err: Exception) -> int | None:
    code = getattr(err, "code", None) or getattr(err, "status_code", None)
    if isinstance(code, int):
        return code
    m = re.search(r"\b(4\d\d|5\d\d)\b", str(err))
    return int(m.group(1)) if m else None


def is_transient(err: Exception) -> bool:
    code = error_code(err)
    text = str(err).upper()
    return code in (429, 500, 502, 503, 504) or "RESOURCE_EXHAUSTED" in text or "UNAVAILABLE" in text or "DEADLINE" in text


def generate_image_bytes(client, types, model: str, prompt: str, attempts: int = 5) -> bytes:
    """One image from the API. Returns the raw bytes; raises RuntimeError with a readable reason otherwise."""
    for attempt in range(1, attempts + 1):
        try:
            result = client.models.generate_images(
                model=model,
                prompt=prompt,
                config=types.GenerateImagesConfig(number_of_images=1, aspect_ratio="1:1", output_mime_type="image/jpeg"),
            )
        except Exception as err:  # noqa: BLE001 - the SDK raises several types; classify by code
            code = error_code(err)
            if code in (401, 403, 404):
                raise FatalError(f"HTTP {code}: check GEMINI_API_KEY, billing / access to Imagen, and --model ({model}). {err}") from err
            if is_transient(err) and attempt < attempts:
                wait = 2 ** attempt
                print(f"    temporary error ({code or 'network'}), retrying in {wait}s")
                time.sleep(wait)
                continue
            raise RuntimeError(f"API error: {err}") from err
        images = getattr(result, "generated_images", None) or []
        if not images:
            raise RuntimeError("no image returned (most likely blocked by the safety filter)")
        return images[0].image.image_bytes
    raise RuntimeError("gave up after repeated temporary errors")


def make_zip(out_dir: Path, ids: list[str], zip_path: Path) -> int:
    n = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for dish_id in ids:
            p = out_dir / f"{dish_id}.webp"
            if p.exists():
                zf.write(p, arcname=p.name)
                n += 1
    return n


def contact_sheet(out_dir: Path, ids: list[str], path: Path, columns: int = 15, thumb: int = 120) -> None:
    """One image with every photo in menu order, for a quick look before importing."""
    from PIL import Image

    files = [out_dir / f"{i}.webp" for i in ids if (out_dir / f"{i}.webp").exists()]
    if not files:
        return
    rows = (len(files) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * thumb, rows * thumb), (24, 24, 27))
    for n, f in enumerate(files):
        sheet.paste(Image.open(f).convert("RGB").resize((thumb, thumb)), ((n % columns) * thumb, (n // columns) * thumb))
    sheet.save(path)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Generate LUPU-FIT dish photos with Google Imagen.")
    ap.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="dish table (default: docs/menu-photos-needed.csv)")
    ap.add_argument("--out", type=Path, default=Path("dish_photos_out"))
    ap.add_argument("--model", default=DEFAULT_MODEL, help=f"Imagen model (default {DEFAULT_MODEL}; check it is still available)")
    ap.add_argument("--only", help="comma-separated dish ids, e.g. b01,l17")
    ap.add_argument("--limit", type=int, help="make at most N new images this run")
    ap.add_argument("--delay", type=float, default=1.0, help="seconds between calls")
    ap.add_argument("--dry-run", action="store_true", help="print prompts and counts only: no API calls, no cost")
    ap.add_argument("--yes", action="store_true", help="do not ask before spending")
    ap.add_argument("--no-zip", action="store_true")
    ap.add_argument("--contact-sheet", action="store_true", help="also write contact_sheet.png")
    args = ap.parse_args(argv)

    rows = load_rows(args.csv)
    all_ids = [r["id"] for r in rows]
    if args.only:
        wanted = {s.strip() for s in args.only.split(",") if s.strip()}
        unknown = wanted - set(all_ids)
        if unknown:
            raise SystemExit(f"unknown dish ids: {', '.join(sorted(unknown))}")
        rows = [r for r in rows if r["id"] in wanted]
    todo = [r for r in rows if not (args.out / r["file"]).exists()]
    already = len(rows) - len(todo)
    if args.limit is not None:
        todo = todo[: max(args.limit, 0)]

    styles: dict[str, int] = {}
    for r in rows:
        styles[serving_style(r)] = styles.get(serving_style(r), 0) + 1
    print(f"{len(rows)} dishes selected, {already} already done, {len(todo)} to generate")
    print("serving styles: " + ", ".join(f"{k} {v}" for k, v in sorted(styles.items())))

    if args.dry_run:
        for r in todo[:10]:
            print(f"\n[{r['id']}] {build_prompt(r)}")
        if len(todo) > 10:
            print(f"\n... and {len(todo) - 10} more prompts (same format)")
        return 0

    if todo:
        key = os.environ.get("GEMINI_API_KEY")
        if not key:
            raise SystemExit("Set GEMINI_API_KEY in your environment first (it is never stored or printed).")
        if not args.yes:
            answer = input(f"About to make {len(todo)} paid image requests with model {args.model}. Continue? [y/N] ")
            if answer.strip().lower() not in ("y", "yes"):
                print("Cancelled.")
                return 1
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=key)
        args.out.mkdir(parents=True, exist_ok=True)
        failed: list[str] = []
        made = 0
        try:
            for n, r in enumerate(todo, start=1):
                print(f"[{n}/{len(todo)}] {r['id']} {r['name_en']}")
                try:
                    raw = generate_image_bytes(client, types, args.model, build_prompt(r))
                    data, quality = to_square_webp(raw)
                    (args.out / r["file"]).write_bytes(data)
                    made += 1
                    if len(data) > MAX_KB * 1024:
                        print(f"    warning: {len(data) // 1024} KB at lowest quality")
                except FatalError:
                    raise
                except Exception as err:  # noqa: BLE001
                    print(f"    failed: {err}")
                    failed.append(f"{r['id']}\t{err}")
                time.sleep(args.delay)
        except FatalError as err:
            print(f"\nStopped: {err}")
            return 2
        finally:
            if failed:
                (args.out / "failed.txt").write_text("\n".join(failed) + "\n", encoding="utf-8")
        print(f"\nmade {made}, failed {len(failed)}" + (f" (see {args.out / 'failed.txt'}; rerun with --only)" if failed else ""))

    if args.out.exists():
        if not args.no_zip:
            count = make_zip(args.out, all_ids, args.out / "all_dish_photos.zip")
            print(f"{args.out / 'all_dish_photos.zip'}: {count} of {len(all_ids)} photos")
        if args.contact_sheet:
            contact_sheet(args.out, all_ids, args.out / "contact_sheet.png")
    return 0


if __name__ == "__main__":
    sys.exit(main())
