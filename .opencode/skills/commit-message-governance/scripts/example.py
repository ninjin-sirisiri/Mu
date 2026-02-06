#!/usr/bin/env python3
"""Analyze recent git commit subjects and print likely conventions.

ASCII-only output to avoid Windows console encoding issues.
"""

from __future__ import annotations

import re
import subprocess
import sys
from collections import Counter


def _run_git(args: list[str]) -> str:
    try:
        out = subprocess.check_output(["git", *args], stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        msg = e.output.decode("utf-8", errors="replace")
        raise RuntimeError(msg.strip() or "git command failed")
    return out.decode("utf-8", errors="replace")


def _looks_conventional(subject: str) -> bool:
    return bool(
        re.match(
            r"^(feat|fix|docs|refactor|test|perf|build|ci|chore|revert)"
            r"(\([^)]+\))?: .+",
            subject,
        )
    )


def main() -> int:
    try:
        _run_git(["rev-parse", "--is-inside-work-tree"])
    except Exception as e:
        print(f"[ERROR] Not a git repository: {e}")
        return 2

    # New repos may have zero commits; git log will fail.
    try:
        subprocess.check_output(
            ["git", "rev-parse", "--verify", "HEAD"], stderr=subprocess.STDOUT
        )
    except subprocess.CalledProcessError:
        print("No commits found (repository has no commits yet).")
        return 0

    n = 50
    subjects_raw = _run_git(["log", f"-{n}", "--pretty=format:%s"])
    subjects = [s.strip() for s in subjects_raw.splitlines() if s.strip()]

    if not subjects:
        print("No commits found.")
        return 0

    conv = sum(1 for s in subjects if _looks_conventional(s))
    conv_ratio = conv / len(subjects)

    types: list[str] = []
    scopes: list[str] = []
    ticket_ids = 0
    gh_refs = 0

    ticket_re = re.compile(r"\b[A-Z]{2,10}-\d+\b")
    gh_re = re.compile(r"#\d+\b")
    conv_re = re.compile(
        r"^(feat|fix|docs|refactor|test|perf|build|ci|chore|revert)(\(([^)]+)\))?: (.+)$"
    )

    for s in subjects:
        m = conv_re.match(s)
        if m:
            types.append(m.group(1))
            if m.group(3):
                scopes.append(m.group(3))
        if ticket_re.search(s):
            ticket_ids += 1
        if gh_re.search(s):
            gh_refs += 1

    print("Commit subject style analysis")
    print("----------------------------")
    print(f"Recent subjects analyzed: {len(subjects)}")
    print(f"Conventional Commits-like: {conv} ({conv_ratio:.0%})")

    if types:
        top_types = Counter(types).most_common(8)
        print("Top types: " + ", ".join(f"{t}:{c}" for t, c in top_types))
    else:
        print("Top types: (none detected)")

    if scopes:
        top_scopes = Counter(scopes).most_common(8)
        print("Top scopes: " + ", ".join(f"{s}:{c}" for s, c in top_scopes))
    else:
        print("Top scopes: (none detected)")

    print(f"Ticket IDs (e.g. ABC-123): {ticket_ids} ({ticket_ids / len(subjects):.0%})")
    print(f"GitHub refs (e.g. #123): {gh_refs} ({gh_refs / len(subjects):.0%})")

    if conv_ratio >= 0.6:
        print("\nRecommendation: Use Conventional Commits for new messages.")
        print("Template: type(scope): subject")
    else:
        print("\nRecommendation: Mimic the dominant pattern from recent history.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
