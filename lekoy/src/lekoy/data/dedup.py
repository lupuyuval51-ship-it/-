"""Deduplication, and the leakage check between training and evaluation.

Three passes, in increasing cost and decreasing precision:

  1. **Exact** — SHA-256 of the raw bytes. Catches a document crawled twice.
  2. **Normalised** — SHA-256 after case folding, whitespace collapse and
     punctuation removal. Catches the same article behind two URLs with
     different boilerplate.
  3. **Near-duplicate** — MinHash over word 5-grams with LSH banding. Catches
     the same article rewritten, translated back and forth, or padded with a
     different intro.

Implemented here rather than pulled from `datasketch` because the whole thing
is sixty lines of hashing and this project already asks a lot of its four
cores; a dependency whose value is a dozen lines of arithmetic is a dependency
that can fail to install on the GPU host later.

The leakage check is the part that matters most. If a Belebele passage is in
the training mix, RV5's Hebrew reading-comprehension score measures memorisation
and every conclusion drawn from it is wrong. `scripts/deduplicate.py
--check-leakage` runs before every training stage, not after.
"""
from __future__ import annotations

import hashlib
import re
import struct
from collections.abc import Iterable, Iterator
from dataclasses import dataclass, field

WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)
PUNCT_RE = re.compile(r"[^\w\s]", re.UNICODE)
SPACE_RE = re.compile(r"\s+")

MERSENNE_PRIME = (1 << 61) - 1
MAX_HASH = (1 << 32) - 1


def exact_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def normalised_hash(text: str) -> str:
    """Hash of the text with everything that is not a word removed.

    Case folding rather than lowercasing: `str.casefold` handles Spanish and
    the German sharp s correctly, and is a no-op for Hebrew, which is caseless.
    """
    reduced = SPACE_RE.sub(" ", PUNCT_RE.sub(" ", text.casefold())).strip()
    return hashlib.sha256(reduced.encode("utf-8")).hexdigest()


def shingles(text: str, n: int = 5) -> set[str]:
    """Word n-grams. 5 is long enough that natural collisions are rare and
    short enough that a paraphrase still shares some."""
    words = WORD_RE.findall(text.casefold())
    if len(words) < n:
        return {" ".join(words)} if words else set()
    return {" ".join(words[i:i + n]) for i in range(len(words) - n + 1)}


class MinHash:
    """MinHash signature over a set of shingles.

    The permutations are derived from a fixed seed, so two runs of the pipeline
    produce identical signatures and a stored signature stays comparable.
    """

    __slots__ = ("num_perm", "signature", "_seed")

    def __init__(self, num_perm: int = 128, seed: int = 20250901):
        self.num_perm = num_perm
        self.signature = [MAX_HASH] * num_perm
        self._seed = seed

    @staticmethod
    def _params(num_perm: int, seed: int) -> list[tuple[int, int]]:
        rng = _Rand(seed)
        return [(rng.next() % (MERSENNE_PRIME - 1) + 1, rng.next() % MERSENNE_PRIME)
                for _ in range(num_perm)]

    def update(self, items: Iterable[str]) -> "MinHash":
        params = _PARAM_CACHE.setdefault(
            (self.num_perm, self._seed), self._params(self.num_perm, self._seed))
        for item in items:
            h = struct.unpack("<I", hashlib.sha1(
                item.encode("utf-8")).digest()[:4])[0]
            for i, (a, b) in enumerate(params):
                value = ((a * h + b) % MERSENNE_PRIME) & MAX_HASH
                if value < self.signature[i]:
                    self.signature[i] = value
        return self

    def jaccard(self, other: "MinHash") -> float:
        if self.num_perm != other.num_perm:
            raise ValueError("signatures of different lengths are not comparable")
        same = sum(1 for a, b in zip(self.signature, other.signature) if a == b)
        return same / self.num_perm


class _Rand:
    """A small deterministic PRNG, so signatures do not depend on the host's
    `random` implementation across Python versions."""

    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFFFFFFFFFF or 0x9E3779B97F4A7C15

    def next(self) -> int:
        x = self.state
        x ^= (x << 13) & 0xFFFFFFFFFFFFFFFF
        x ^= x >> 7
        x ^= (x << 17) & 0xFFFFFFFFFFFFFFFF
        self.state = x
        return x


_PARAM_CACHE: dict[tuple[int, int], list[tuple[int, int]]] = {}


def signature_of(text: str, num_perm: int = 128, n: int = 5) -> MinHash:
    return MinHash(num_perm).update(shingles(text, n))


class LSHIndex:
    """Banded LSH over MinHash signatures.

    Splitting a 128-permutation signature into 32 bands of 4 makes any pair
    sharing a whole band a candidate. That is tuned for a ~0.6 Jaccard
    threshold: high enough not to flag two documents that merely share a
    subject, low enough to catch a rewrite.
    """

    def __init__(self, num_perm: int = 128, bands: int = 32):
        if num_perm % bands:
            raise ValueError(f"{num_perm} permutations do not divide into {bands} bands")
        self.num_perm = num_perm
        self.bands = bands
        self.rows = num_perm // bands
        self.buckets: list[dict[bytes, list[int]]] = [{} for _ in range(bands)]
        self.signatures: dict[int, MinHash] = {}

    def _keys(self, sig: MinHash) -> Iterator[tuple[int, bytes]]:
        for b in range(self.bands):
            chunk = sig.signature[b * self.rows:(b + 1) * self.rows]
            yield b, hashlib.blake2b(
                struct.pack(f"<{self.rows}I", *chunk), digest_size=12).digest()

    def add(self, key: int, sig: MinHash) -> None:
        self.signatures[key] = sig
        for band, bucket_key in self._keys(sig):
            self.buckets[band].setdefault(bucket_key, []).append(key)

    def query(self, sig: MinHash, threshold: float = 0.6) -> list[tuple[int, float]]:
        candidates: set[int] = set()
        for band, bucket_key in self._keys(sig):
            candidates.update(self.buckets[band].get(bucket_key, ()))
        hits = []
        for key in candidates:
            score = sig.jaccard(self.signatures[key])
            if score >= threshold:
                hits.append((key, score))
        return sorted(hits, key=lambda t: -t[1])


@dataclass
class DedupStats:
    total: int = 0
    kept: int = 0
    exact_duplicates: int = 0
    normalised_duplicates: int = 0
    near_duplicates: int = 0
    examples: list[dict] = field(default_factory=list)

    @property
    def removed(self) -> int:
        return self.total - self.kept

    def as_dict(self) -> dict:
        return {
            "total": self.total, "kept": self.kept, "removed": self.removed,
            "removed_fraction": round(self.removed / self.total, 4) if self.total else 0.0,
            "exact_duplicates": self.exact_duplicates,
            "normalised_duplicates": self.normalised_duplicates,
            "near_duplicates": self.near_duplicates,
        }


def deduplicate(documents: Iterable[tuple[int, str]], *, near: bool = True,
                threshold: float = 0.6, num_perm: int = 128,
                min_chars_for_near: int = 300,
                keep_examples: int = 5) -> tuple[list[int], DedupStats]:
    """Return the indices to keep, and what was removed.

    Near-duplicate detection is skipped for short documents: below a few
    hundred characters there are too few 5-grams for a MinHash estimate to mean
    anything, and short instruction answers legitimately repeat.
    """
    stats = DedupStats()
    seen_exact: set[str] = set()
    seen_normalised: set[str] = set()
    index = LSHIndex(num_perm) if near else None
    keep: list[int] = []

    for key, text in documents:
        stats.total += 1
        digest = exact_hash(text)
        if digest in seen_exact:
            stats.exact_duplicates += 1
            continue
        seen_exact.add(digest)

        norm = normalised_hash(text)
        if norm in seen_normalised:
            stats.normalised_duplicates += 1
            if len(stats.examples) < keep_examples:
                stats.examples.append({"key": key, "kind": "normalised",
                                       "preview": text[:120]})
            continue
        seen_normalised.add(norm)

        if index is not None and len(text) >= min_chars_for_near:
            sig = signature_of(text, num_perm)
            hits = index.query(sig, threshold)
            if hits:
                stats.near_duplicates += 1
                if len(stats.examples) < keep_examples:
                    stats.examples.append({
                        "key": key, "kind": "near", "matched": hits[0][0],
                        "jaccard": round(hits[0][1], 3), "preview": text[:120]})
                continue
            index.add(key, sig)

        keep.append(key)
        stats.kept += 1
    return keep, stats


def find_leakage(train: Iterable[tuple[int, str]], evaluation: Iterable[tuple[int, str]],
                 threshold: float = 0.6, num_perm: int = 128) -> list[dict]:
    """Training documents that overlap the evaluation sets.

    The evaluation side is indexed and the training side queried, not the other
    way round: evaluation sets are small and fixed, training sets are large and
    change every run.
    """
    index = LSHIndex(num_perm)
    eval_text: dict[int, str] = {}
    for key, text in evaluation:
        eval_text[key] = text
        index.add(key, signature_of(text, num_perm))

    leaks = []
    for key, text in train:
        hits = index.query(signature_of(text, num_perm), threshold)
        if hits:
            eval_key, score = hits[0]
            leaks.append({
                "train_key": key, "eval_key": eval_key,
                "jaccard": round(score, 3),
                "train_preview": text[:160],
                "eval_preview": eval_text[eval_key][:160],
            })
    return leaks
