#!/usr/bin/env python3
"""Create a Gemini-friendly export of the repository.

Features:
- Excludes heavy/binary artifacts.
- Splits large text files into smaller chunks.
- Optionally splits output into batch folders for import tools with file-count/size limits.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

DEFAULT_MAX_CHARS = 18_000
DEFAULT_MAX_FILES_PER_BATCH = 70
DEFAULT_MAX_CHARS_PER_BATCH = 450_000

EXCLUDE_DIR_PREFIXES = (
    ".git/",
    "node_modules/",
    "dist/",
    "coverage/",
    "playwright-report/",
    ".playwright/",
    "gemini-import/",
)

EXCLUDE_SUFFIXES = {
    ".pth",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".icns",
    ".pdf",
    ".zip",
    ".dmg",
    ".appimage",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
}


def run_git_ls_files(repo_root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "ls-files"],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def is_excluded(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if normalized.startswith(EXCLUDE_DIR_PREFIXES):
        return True
    return Path(normalized).suffix.lower() in EXCLUDE_SUFFIXES


def read_utf8(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return None


def split_text(text: str, chunk_size: int) -> list[str]:
    chunks: list[str] = []
    idx = 0
    while idx < len(text):
        end = min(len(text), idx + chunk_size)
        if end < len(text):
            newline_pos = text.rfind("\n", idx, end)
            if newline_pos > idx + int(chunk_size * 0.4):
                end = newline_pos + 1
        chunks.append(text[idx:end])
        idx = end
    return chunks


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def chunk_path(base_path: str, idx: int, total: int) -> str:
    p = Path(base_path)
    return str(p.with_name(f"{p.stem}.part{idx:03d}-of-{total:03d}{p.suffix}"))


def materialize(repo_root: Path, max_chars: int) -> tuple[list[dict], dict]:
    files = run_git_ls_files(repo_root)
    manifest = {"max_chars": max_chars, "copied": [], "split": [], "excluded": [], "binary": []}
    items: list[dict] = []

    for rel in files:
        if is_excluded(rel):
            manifest["excluded"].append(rel)
            continue

        src = repo_root / rel
        if not src.is_file():
            continue

        text = read_utf8(src)
        if text is None:
            manifest["binary"].append(rel)
            continue

        if len(text) <= max_chars:
            items.append({"path": rel, "content": text, "source": rel})
            manifest["copied"].append(rel)
            continue

        chunks = split_text(text, max_chars)
        chunk_files = []
        for i, chunk in enumerate(chunks, start=1):
            rel_chunk = chunk_path(rel, i, len(chunks))
            items.append({"path": rel_chunk, "content": chunk, "source": rel})
            chunk_files.append(rel_chunk)
        manifest["split"].append({"source": rel, "parts": chunk_files})

    return items, manifest


def assign_batches(items: list[dict], max_files: int, max_chars_total: int) -> list[list[dict]]:
    batches: list[list[dict]] = []
    current: list[dict] = []
    current_chars = 0

    for item in items:
        item_len = len(item["content"])
        must_roll = current and (
            len(current) >= max_files or current_chars + item_len > max_chars_total
        )
        if must_roll:
            batches.append(current)
            current = []
            current_chars = 0

        current.append(item)
        current_chars += item_len

    if current:
        batches.append(current)

    return batches


def build_export(repo_root: Path, out_dir: Path, max_chars: int, max_files_per_batch: int, max_chars_per_batch: int) -> dict:
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    items, manifest = materialize(repo_root, max_chars)
    batches = assign_batches(items, max_files_per_batch, max_chars_per_batch)

    batch_index = []
    for i, batch in enumerate(batches, start=1):
        batch_dir = out_dir / f"batch-{i:03d}"
        batch_paths = []
        char_count = 0
        for item in batch:
            rel = item["path"]
            write_file(batch_dir / rel, item["content"])
            batch_paths.append(rel)
            char_count += len(item["content"])

        batch_index.append(
            {
                "batch": f"batch-{i:03d}",
                "file_count": len(batch),
                "char_count": char_count,
                "files": batch_paths,
            }
        )

    summary = {
        "max_chars": max_chars,
        "max_files_per_batch": max_files_per_batch,
        "max_chars_per_batch": max_chars_per_batch,
        "batch_count": len(batch_index),
        "batch_index": batch_index,
        **manifest,
    }

    readme = (
        "# Gemini Import Bundle\n\n"
        "Import `batch-001`, then `batch-002`, and so on.\n\n"
        "- Large files are split: `*.partNNN-of-NNN.*`\n"
        "- Heavy/binary artifacts are excluded\n"
        "- Full mapping is in `gemini-import-manifest.json`\n"
    )
    write_file(out_dir / "README.md", readme)
    write_file(out_dir / "gemini-import-manifest.json", json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare Gemini-friendly repository export")
    parser.add_argument("--out", default="gemini-import", help="Output directory (default: gemini-import)")
    parser.add_argument("--max-chars", type=int, default=DEFAULT_MAX_CHARS, help="Max chars per file before splitting")
    parser.add_argument(
        "--max-files-per-batch",
        type=int,
        default=DEFAULT_MAX_FILES_PER_BATCH,
        help=f"Max files per batch folder (default: {DEFAULT_MAX_FILES_PER_BATCH})",
    )
    parser.add_argument(
        "--max-chars-per-batch",
        type=int,
        default=DEFAULT_MAX_CHARS_PER_BATCH,
        help=f"Approx max chars per batch folder (default: {DEFAULT_MAX_CHARS_PER_BATCH})",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    out_dir = repo_root / args.out
    summary = build_export(
        repo_root,
        out_dir,
        args.max_chars,
        args.max_files_per_batch,
        args.max_chars_per_batch,
    )
    print(
        "Prepared Gemini import bundle:",
        f"batch_count={summary['batch_count']}",
        f"copied={len(summary['copied'])}",
        f"split={len(summary['split'])}",
        f"excluded={len(summary['excluded'])}",
        f"binary={len(summary['binary'])}",
        sep="\n  ",
    )


if __name__ == "__main__":
    main()
