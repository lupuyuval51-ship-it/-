"""Offline tests for generate-dish-photos.py (no network, no API key). Run: python3 -m unittest scripts/test_generate_dish_photos.py"""
import importlib.util
import io
import tempfile
import unittest
import zipfile
from pathlib import Path

from PIL import Image

SPEC = importlib.util.spec_from_file_location("gen", Path(__file__).resolve().parent / "generate-dish-photos.py")
gen = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gen)  # type: ignore[union-attr]

ROWS = {r["id"]: r for r in gen.load_rows(gen.DEFAULT_CSV)}


def noisy_jpeg(w: int, h: int) -> bytes:
    import random

    random.seed(1)
    img = Image.new("RGB", (w, h))
    img.putdata([(random.randrange(256), random.randrange(256), random.randrange(256)) for _ in range(w * h)])
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


class PromptTests(unittest.TestCase):
    def test_table_has_all_dishes(self):
        self.assertEqual(len(ROWS), 300)

    def test_prompt_never_contains_the_id(self):
        for dish_id, row in ROWS.items():
            self.assertNotRegex(gen.build_prompt(row), rf"\b{dish_id}\b", dish_id)

    def test_prompt_forbids_text_and_has_name_and_ingredients(self):
        for row in ROWS.values():
            p = gen.build_prompt(row)
            self.assertIn(row["name_en"], p)
            self.assertIn(row["ingredients_en"], p)
            self.assertIn("No text", p)

    def test_drinks_are_not_served_on_a_plate(self):
        for dish_id in [i for i in ROWS if i.startswith("w")]:
            self.assertIn(gen.serving_style(ROWS[dish_id]), ("glass", "mug"), dish_id)
            self.assertNotIn("plate", gen.build_prompt(ROWS[dish_id]).split(".")[0], dish_id)
        for dish_id in ("s16", "s24", "s35", "s51", "p10", "o01", "o20"):
            self.assertEqual(gen.serving_style(ROWS[dish_id]), "glass", dish_id)
        self.assertEqual(gen.serving_style(ROWS["w05"]), "mug")  # hot chocolate
        self.assertEqual(gen.serving_style(ROWS["w21"]), "mug")  # herbal tea

    def test_food_stays_food(self):
        self.assertEqual(gen.serving_style(ROWS["b01"]), "plate")
        self.assertEqual(gen.serving_style(ROWS["l19"]), "bowl")  # lentil soup
        self.assertEqual(gen.serving_style(ROWS["b26"]), "bowl")  # smoothie bowl
        self.assertEqual(gen.serving_style(ROWS["s11"]), "board")
        self.assertEqual(gen.serving_style(ROWS["o02"]), "plate")  # chocolate milk AND a sandwich

    def test_every_dish_gets_a_known_style(self):
        for row in ROWS.values():
            self.assertIn(gen.serving_style(row), gen.SERVING_TEXT)


class ImageTests(unittest.TestCase):
    def test_square_480_webp_within_budget(self):
        data, quality = gen.to_square_webp(noisy_jpeg(1024, 768))
        img = Image.open(io.BytesIO(data))
        self.assertEqual(img.format, "WEBP")
        self.assertEqual(img.size, (480, 480))
        self.assertLessEqual(quality, 82)

    def test_quality_drops_to_fit(self):
        loose, _ = gen.to_square_webp(noisy_jpeg(1024, 1024), max_kb=10_000)
        tight, q = gen.to_square_webp(noisy_jpeg(1024, 1024), max_kb=20)
        self.assertLess(len(tight), len(loose))
        self.assertLess(q, 82)

    def test_crops_the_centre(self):
        img = Image.new("RGB", (900, 300), (255, 0, 0))
        img.paste((0, 0, 255), (300, 0, 600, 300))  # blue centre square
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        data, _ = gen.to_square_webp(buf.getvalue())
        px = Image.open(io.BytesIO(data)).convert("RGB").getpixel((240, 240))
        self.assertGreater(px[2], 200)
        self.assertLess(px[0], 60)


class ErrorTests(unittest.TestCase):
    def test_transient_vs_fatal(self):
        class E(Exception):
            def __init__(self, code, msg=""):
                super().__init__(msg or f"{code} error")
                self.code = code

        self.assertTrue(gen.is_transient(E(429)))
        self.assertTrue(gen.is_transient(E(503)))
        self.assertFalse(gen.is_transient(E(400)))
        self.assertEqual(gen.error_code(Exception("403 PERMISSION_DENIED")), 403)


class ZipTests(unittest.TestCase):
    def test_zip_has_only_existing_photos(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d)
            (out / "b01.webp").write_bytes(b"x")
            (out / "b02.webp").write_bytes(b"y")
            n = gen.make_zip(out, ["b01", "b02", "b03"], out / "z.zip")
            self.assertEqual(n, 2)
            self.assertEqual(sorted(zipfile.ZipFile(out / "z.zip").namelist()), ["b01.webp", "b02.webp"])


class RunTests(unittest.TestCase):
    """The whole run against a fake Imagen client: blocked images, temporary errors, resuming, zip."""

    def run_main(self, out: Path, behaviour, extra=()):
        import os
        import sys
        import types as pytypes

        calls = []

        class Result:
            def __init__(self, images):
                self.generated_images = images

        class Img:
            def __init__(self, b):
                self.image = pytypes.SimpleNamespace(image_bytes=b)

        class Models:
            def generate_images(self, model, prompt, config):
                calls.append(prompt)
                return behaviour(len(calls), prompt, Result, Img)

        class Client:
            def __init__(self, api_key):
                self.models = Models()

        genai = pytypes.ModuleType("google.genai")
        genai.Client = Client
        genai.types = pytypes.SimpleNamespace(GenerateImagesConfig=lambda **kw: kw)
        google = pytypes.ModuleType("google")
        google.genai = genai
        saved = {k: sys.modules.get(k) for k in ("google", "google.genai", "google.genai.types")}
        sys.modules.update({"google": google, "google.genai": genai, "google.genai.types": genai.types})
        old_sleep, gen.time.sleep = gen.time.sleep, lambda *_: None
        os.environ["GEMINI_API_KEY"] = "test-key"
        try:
            code = gen.main(["--out", str(out), "--yes", "--delay", "0", "--only", "b01,b02,b03", *extra])
        finally:
            gen.time.sleep = old_sleep
            os.environ.pop("GEMINI_API_KEY", None)
            for k, v in saved.items():
                if v is None:
                    sys.modules.pop(k, None)
                else:
                    sys.modules[k] = v
        return code, calls

    def test_blocked_dish_is_recorded_and_run_continues_then_resumes(self):
        jpeg = noisy_jpeg(640, 640)

        def behaviour(n, prompt, Result, Img):
            return Result([]) if "Herb omelette" in prompt else Result([Img(jpeg)])

        with tempfile.TemporaryDirectory() as d:
            out = Path(d)
            code, calls = self.run_main(out, behaviour)
            self.assertEqual(code, 0)
            self.assertEqual(len(calls), 3)
            self.assertTrue((out / "b01.webp").exists() and (out / "b03.webp").exists())
            self.assertFalse((out / "b02.webp").exists())
            self.assertIn("b02", (out / "failed.txt").read_text())
            self.assertIn("safety filter", (out / "failed.txt").read_text())
            # Rerun: only the missing dish is requested.
            code, calls = self.run_main(out, behaviour)
            self.assertEqual(len(calls), 1)
            self.assertIn("Herb omelette", calls[0])

    def test_temporary_error_is_retried(self):
        jpeg = noisy_jpeg(640, 640)

        class Temp(Exception):
            code = 429

        def behaviour(n, prompt, Result, Img):
            if n == 1:
                raise Temp("429 RESOURCE_EXHAUSTED")
            return Result([Img(jpeg)])

        with tempfile.TemporaryDirectory() as d:
            code, calls = self.run_main(Path(d), behaviour, ("--limit", "1"))
            self.assertEqual(code, 0)
            self.assertEqual(len(calls), 2)
            self.assertTrue((Path(d) / "b01.webp").exists())

    def test_bad_key_stops_the_run_at_once(self):
        class Denied(Exception):
            code = 403

        def behaviour(n, prompt, Result, Img):
            raise Denied("403 PERMISSION_DENIED")

        with tempfile.TemporaryDirectory() as d:
            code, calls = self.run_main(Path(d), behaviour)
            self.assertEqual(code, 2)
            self.assertEqual(len(calls), 1)


if __name__ == "__main__":
    unittest.main()
