"""Fetching real text from the Hugging Face hub, without downloading corpora.

The datasets-server `/rows` endpoint serves any public dataset a page at a time
over plain HTTPS. That is the difference between a probe corpus we can build in
this environment and one we cannot: `wikimedia/wikipedia` Hebrew is ~2 GB as a
download and a few hundred kilobytes as five hundred rows, and for measuring
tokenizer fertility or smoke-testing a training loop the five hundred rows are
the same data.

Every source carries its licence with it. `download_data.py` refuses to write a
source whose licence is not on the permitted list, so a corpus cannot quietly
acquire a non-commercial or unlicensed shard.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field

ROWS_ENDPOINT = "https://datasets-server.huggingface.co/rows"
INFO_ENDPOINT = "https://datasets-server.huggingface.co/info"
USER_AGENT = "lekoy-rv5-data-pipeline/0.1 (+https://huggingface.co/docs/datasets-server)"

# Licences LEKOY RV5 will train on. Anything outside this set is rejected at
# ingest rather than filtered later, so an unlicensed shard never reaches disk.
PERMITTED_LICENCES = {
    "apache-2.0", "mit", "bsd", "bsd-2-clause", "bsd-3-clause", "cc0-1.0",
    "cc-by-4.0", "cc-by-3.0", "cc-by-sa-4.0", "cc-by-sa-3.0", "public-domain",
    "odc-by", "odbl", "gfdl", "unlicense", "wtfpl", "artistic-2.0",
    "openrail", "llama3", "gemma",
}

# Explicitly not permitted, with the reason, so the rejection is legible in the
# registry rather than being an unexplained absence.
REJECTED_LICENCES = {
    "cc-by-nc-4.0": "non-commercial clause",
    "cc-by-nc-sa-4.0": "non-commercial clause",
    "cc-by-nc-nd-4.0": "non-commercial, no-derivatives",
    "unknown": "licence not stated by the publisher",
    "other": "licence not machine-readable; needs a human read before use",
    "proprietary": "not redistributable",
}


# Keys the pipeline owns. A source's own columns may not overwrite them.
RESERVED_KEYS = frozenset({"source", "language", "licence", "category",
                           "text", "messages", "quality_score"})


class SourceError(RuntimeError):
    """A dataset could not be fetched, or came back in a shape we cannot use."""


@dataclass
class DatasetSource:
    """One slice of one public dataset, with the licence it comes under."""

    name: str                     # the registry key, e.g. "wikipedia_he"
    dataset: str                  # hub id, e.g. "wikimedia/wikipedia"
    language: str                 # hebrew | english | spanish | multi | code
    licence: str
    category: str                 # pretrain | instruction | reasoning | coding | preference
    text_field: str = "text"
    config: str | None = None
    split: str = "train"
    offset: int = 0
    rows: int = 500
    notes: str = ""
    # For chat-shaped datasets the useful content is a list of turns, not a
    # string; `messages_field` names it and `text_field` is then ignored.
    messages_field: str | None = None
    extra_fields: list[str] = field(default_factory=list)

    # "parquet" pulls whole shards and filters locally — the mode used for any
    # real volume. "rows" pages the API, which is cheaper for a few hundred
    # records and works on datasets whose shards exceed this machine's disk.
    access: str = "parquet"
    max_shards: int = 1
    # An instruction/prompt column that pairs with `text_field` as the target,
    # for datasets stored as two columns rather than a message list.
    prompt_field: str | None = None
    # Keep only rows where `filter_field` is one of `filter_values`. Used for
    # datasets that put several languages in one split.
    filter_field: str | None = None
    filter_values: list[str] = field(default_factory=list)
    min_chars: int = 0

    @property
    def permitted(self) -> bool:
        return self.licence.lower() in PERMITTED_LICENCES

    @property
    def rejection_reason(self) -> str | None:
        if self.permitted:
            return None
        return REJECTED_LICENCES.get(
            self.licence.lower(), f"licence {self.licence!r} is not on the permitted list")


def _get(url: str, params: dict, retries: int = 4, timeout: int = 60) -> dict:
    """GET JSON with backoff. The rows endpoint 500s under load often enough
    that a single failure is not a reason to abandon a corpus build."""
    query = urllib.parse.urlencode(params)
    full = f"{url}?{query}"
    last: Exception | None = None
    for attempt in range(retries):
        req = urllib.request.Request(full, headers={
            "User-Agent": USER_AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", "replace")[:400]
            # 4xx other than 429 will not become true by being asked again.
            if exc.code not in (429, 500, 502, 503, 504):
                raise SourceError(f"{url} returned HTTP {exc.code}: {body}") from exc
            last = SourceError(f"HTTP {exc.code}: {body}")
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last = exc
        if attempt < retries - 1:
            time.sleep(2 ** attempt)
    raise SourceError(f"{url} failed after {retries} attempts: {last}")


def fetch_rows(source: DatasetSource, batch: int = 100,
               progress: bool = False) -> list[dict]:
    """Fetch `source.rows` rows, paginating at the endpoint's 100-row cap."""
    collected: list[dict] = []
    offset = source.offset
    remaining = source.rows
    while remaining > 0:
        want = min(batch, remaining, 100)
        params = {
            "dataset": source.dataset, "split": source.split,
            "offset": offset, "length": want,
        }
        if source.config:
            params["config"] = source.config
        payload = _get(ROWS_ENDPOINT, params)
        rows = payload.get("rows", [])
        if not rows:
            break
        for entry in rows:
            row = entry.get("row", {})
            record = _normalise(row, source)
            if record:
                collected.append(record)
        offset += len(rows)
        remaining -= len(rows)
        if progress:
            print(f"    {source.name}: {len(collected)} rows", flush=True)
        if len(rows) < want:
            break
    return collected


def _normalise(row: dict, source: DatasetSource) -> dict | None:
    """Reduce one dataset row to the shape the rest of the pipeline expects."""
    record: dict = {"source": source.name, "language": source.language,
                    "licence": source.licence, "category": source.category}
    if source.messages_field:
        messages = row.get(source.messages_field)
        if not isinstance(messages, list) or not messages:
            return None
        cleaned = []
        for turn in messages:
            if not isinstance(turn, dict):
                return None
            role = turn.get("role") or turn.get("from")
            content = turn.get("content") or turn.get("value")
            if not role or not isinstance(content, str) or not content.strip():
                return None
            role = {"human": "user", "gpt": "assistant"}.get(role, role)
            cleaned.append({"role": role, "content": content})
        record["messages"] = cleaned
    elif source.prompt_field:
        prompt = row.get(source.prompt_field)
        target = row.get(source.text_field)
        if not (isinstance(prompt, str) and prompt.strip()
                and isinstance(target, str) and target.strip()):
            return None
        record["messages"] = [{"role": "user", "content": prompt},
                              {"role": "assistant", "content": target}]
    else:
        text = row.get(source.text_field)
        if not isinstance(text, str) or not text.strip():
            return None
        if len(text) < source.min_chars:
            return None
        record["text"] = text
        title = row.get("title")
        if isinstance(title, str) and title.strip():
            record["title"] = title
    # Provenance columns are copied under a prefix. Copying them bare let a
    # dataset's own `language` column ("Spanish") overwrite the pipeline's
    # canonical value ("spanish"), and every row then failed its own language
    # check — 3,081 of 3,854 Aya Spanish rows, before this was caught.
    for extra in source.extra_fields:
        if extra in row and isinstance(row[extra], (str, int, float, bool)):
            key = extra if extra not in RESERVED_KEYS else f"src_{extra}"
            record[key] = row[extra]
    return record


def dataset_info(dataset: str, config: str | None = None) -> dict:
    params = {"dataset": dataset}
    if config:
        params["config"] = config
    return _get(INFO_ENDPOINT, params)


# --- Parquet access --------------------------------------------------------
#
# The hub keeps an auto-converted parquet copy of every public dataset. Pulling
# one shard and filtering locally beats paging /rows for anything past a few
# thousand records: one HTTPS transfer instead of hundreds, and the filtering
# happens on columns rather than on whatever order the rows happen to be in.
# This is how the Hebrew corpus is actually built — /rows is kept for cheap
# probes and for datasets whose shards are larger than this machine's disk.

PARQUET_ENDPOINT = "https://datasets-server.huggingface.co/parquet"


@dataclass
class ParquetShard:
    dataset: str
    config: str
    split: str
    url: str
    size_bytes: int
    num_rows: int


def list_parquet_shards(dataset: str, config: str | None = None,
                        split: str | None = None) -> list[ParquetShard]:
    params = {"dataset": dataset}
    if config:
        params["config"] = config
    payload = _get(PARQUET_ENDPOINT, params)
    shards = []
    for f in payload.get("parquet_files", []):
        if config and f.get("config") != config:
            continue
        if split and f.get("split") != split:
            continue
        shards.append(ParquetShard(
            dataset=f["dataset"], config=f["config"], split=f["split"],
            url=f["url"], size_bytes=f.get("size", 0),
            num_rows=f.get("num_rows", 0)))
    if not shards:
        raise SourceError(
            f"no parquet shards for {dataset} config={config} split={split}; "
            "the hub may not have converted this dataset")
    return shards


def download_shard(shard: ParquetShard, dest, timeout: int = 900,
                   progress: bool = True):
    """Fetch one parquet shard to `dest`, skipping a complete existing copy."""
    from pathlib import Path
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and shard.size_bytes and dest.stat().st_size == shard.size_bytes:
        if progress:
            print(f"    cached {dest.name} ({dest.stat().st_size / 1e6:.0f} MB)")
        return dest
    tmp = dest.with_suffix(dest.suffix + ".part")
    req = urllib.request.Request(shard.url, headers={"User-Agent": USER_AGENT})
    last: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp, tmp.open("wb") as out:
                done = 0
                while chunk := resp.read(1 << 20):
                    out.write(chunk)
                    done += len(chunk)
                    if progress and shard.size_bytes and done % (32 << 20) < (1 << 20):
                        print(f"    {dest.name}: {done / 1e6:.0f}/"
                              f"{shard.size_bytes / 1e6:.0f} MB", flush=True)
            tmp.replace(dest)
            return dest
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last = exc
            tmp.unlink(missing_ok=True)
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise SourceError(f"could not download {shard.url}: {last}")


def read_parquet_rows(path, columns: list[str] | None = None,
                      limit: int | None = None, batch_size: int = 2048):
    """Stream a parquet file row by row.

    Batched rather than `read_table().to_pylist()`: a FineWeb shard is a few
    hundred megabytes on disk and several gigabytes as Python dicts, which this
    machine does not have to spare.
    """
    import pyarrow.parquet as pq

    pf = pq.ParquetFile(str(path))
    available = set(pf.schema_arrow.names)
    if columns:
        missing = [c for c in columns if c not in available]
        if missing:
            raise SourceError(
                f"{path} has no column(s) {missing}; it has {sorted(available)}")
    seen = 0
    for batch in pf.iter_batches(batch_size=batch_size, columns=columns):
        for row in batch.to_pylist():
            yield row
            seen += 1
            if limit is not None and seen >= limit:
                return


def fetch(source: DatasetSource, cache_dir, progress: bool = True) -> list[dict]:
    """Fetch a source by whichever access mode it declares."""
    if source.access == "rows":
        return fetch_rows(source, progress=progress)
    if source.access != "parquet":
        raise SourceError(f"{source.name}: unknown access mode {source.access!r}")

    from pathlib import Path
    cache_dir = Path(cache_dir)
    try:
        shards = list_parquet_shards(source.dataset, source.config, source.split)
    except SourceError as exc:
        # The hub converts only part of a very wide dataset to parquet — xP3x
        # has 277 configs and Spanish is not among the converted ones. The rows
        # endpoint serves it regardless, a hundred at a time, so fall back
        # rather than dropping the language from the corpus.
        if progress:
            print(f"    {source.name}: no parquet export ({str(exc)[:80]}...); "
                  "falling back to the rows API")
        return fetch_rows(source, progress=progress)
    wanted = source.filter_values and set(source.filter_values)
    records: list[dict] = []
    for index, shard in enumerate(shards[:source.max_shards]):
        local = cache_dir / f"{source.name}__{index:04d}.parquet"
        download_shard(shard, local, progress=progress)
        columns = _columns_for(source)
        for row in read_parquet_rows(local, columns=columns):
            if wanted and str(row.get(source.filter_field)) not in wanted:
                continue
            record = _normalise(row, source)
            if record:
                records.append(record)
                if len(records) >= source.rows:
                    return records
        if progress:
            print(f"    {source.name}: {len(records)} kept after shard {index}")
    return records


def _columns_for(source: DatasetSource) -> list[str] | None:
    """Read only the columns a source declares.

    Parquet is columnar, so naming them turns a 300 MB shard read into a 40 MB
    one when the payload is one text column beside sixteen provenance columns.
    Returning None means "read everything", which is only right when a source
    needs the whole row.
    """
    # A chat-shaped source has no text column; asking for one is a hard error
    # at read time rather than an empty result, so do not ask.
    cols = set() if source.messages_field else ({source.text_field} if source.text_field else set())
    for extra in (source.messages_field, source.prompt_field, source.filter_field):
        if extra:
            cols.add(extra)
    cols.update(source.extra_fields)
    cols.discard(None)
    return sorted(cols) or None
