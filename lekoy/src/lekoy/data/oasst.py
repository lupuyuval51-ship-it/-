"""Rebuilding conversations from the OpenAssistant message forest.

OASST ships as a flat table of messages with `parent_id` pointers, not as
conversations. Each tree is one opening prompt with many alternative replies,
ranked by human annotators. Two things come out of it, and the ranking is what
makes the second possible:

  * **Conversations** — one root-to-leaf path per tree, taking the best-ranked
    reply at each step. This is the only source of natural, human-written
    multi-turn Hebrew and Spanish assistant dialogue in the LEKOY corpus.
  * **Preference pairs** — where a message has siblings, the best-ranked reply
    is the chosen one and a worse-ranked sibling is the rejected one, sharing
    the same prompt. That is exactly the shape DPO needs, from human judgement
    rather than from a model asked to grade itself.

Quality gates: `deleted` messages are dropped, and so are ones the OASST
reviewers did not pass (`review_result` false).
"""
from __future__ import annotations

from collections import defaultdict

ROLE_MAP = {"prompter": "user", "assistant": "assistant"}


def _usable(message: dict) -> bool:
    if message.get("deleted"):
        return False
    # review_result is None for messages that were never reviewed; only an
    # explicit False is a rejection.
    if message.get("review_result") is False:
        return False
    text = message.get("text") or ""
    return bool(text.strip()) and message.get("role") in ROLE_MAP


def build_forest(messages: list[dict]) -> dict[str, dict]:
    """Index messages by id and attach children, best-ranked first."""
    by_id = {m["message_id"]: m for m in messages if _usable(m)}
    children: dict[str | None, list[dict]] = defaultdict(list)
    for message in by_id.values():
        parent = message.get("parent_id")
        if parent is not None and parent not in by_id:
            continue          # parent was deleted or failed review; orphan the subtree
        children[parent].append(message)
    for siblings in children.values():
        # rank 0 is best; unranked messages sort last rather than first.
        siblings.sort(key=lambda m: (m.get("rank") if m.get("rank") is not None else 99))
    return {"by_id": by_id, "children": children}


def conversations(messages: list[dict], languages: set[str] | None = None,
                  max_turns: int = 8) -> list[dict]:
    """One best-path conversation per tree.

    Only the best-ranked child is followed. Walking every path would multiply
    the corpus by the branching factor while adding almost no new content —
    the paths share every turn but the last.
    """
    forest = build_forest(messages)
    children = forest["children"]
    out: list[dict] = []

    for root in children.get(None, []):
        if root.get("role") != "prompter":
            continue
        lang = root.get("lang")
        if languages and lang not in languages:
            continue
        turns: list[dict] = []
        node: dict | None = root
        while node is not None and len(turns) < max_turns:
            turns.append({"role": ROLE_MAP[node["role"]], "content": node["text"]})
            kids = children.get(node["message_id"], [])
            node = kids[0] if kids else None
        # A conversation must end on an assistant turn to be trainable.
        while turns and turns[-1]["role"] != "assistant":
            turns.pop()
        if len(turns) >= 2:
            out.append({"messages": turns, "language": lang,
                        "tree_id": root.get("message_tree_id"),
                        "source": "oasst2"})
    return out


def preference_pairs(messages: list[dict], languages: set[str] | None = None,
                     min_rank_gap: int = 1) -> list[dict]:
    """(prompt, chosen, rejected) triples from ranked sibling replies.

    The prompt carries the conversation that preceded it, not just the last
    user turn — a reply is only better or worse in context.
    """
    forest = build_forest(messages)
    by_id, children = forest["by_id"], forest["children"]
    out: list[dict] = []

    for parent_id, siblings in children.items():
        if parent_id is None or len(siblings) < 2:
            continue
        parent = by_id.get(parent_id)
        if parent is None or parent.get("role") != "prompter":
            continue
        ranked = [m for m in siblings
                  if m.get("role") == "assistant" and m.get("rank") is not None]
        if len(ranked) < 2:
            continue
        best, worst = ranked[0], ranked[-1]
        if (worst["rank"] - best["rank"]) < min_rank_gap:
            continue
        lang = parent.get("lang")
        if languages and lang not in languages:
            continue

        # Walk back up to the root so the pair carries its context.
        history: list[dict] = []
        node: dict | None = parent
        while node is not None:
            history.append({"role": ROLE_MAP[node["role"]], "content": node["text"]})
            node = by_id.get(node.get("parent_id")) if node.get("parent_id") else None
        history.reverse()

        out.append({
            "prompt": history,
            "chosen": best["text"],
            "rejected": worst["text"],
            "rank_gap": worst["rank"] - best["rank"],
            "language": lang,
            "source": "oasst2",
        })
    return out
