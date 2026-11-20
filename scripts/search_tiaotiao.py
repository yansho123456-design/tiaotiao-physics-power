#!/usr/bin/env python3
"""
Portable knowledge-base search script for tiaotiao-physics-power (Scheme B: Local-first + Bundled kb.zip).
"""
from __future__ import annotations
import os
import subprocess
import sys
import tempfile
import urllib.request
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_ROOT = os.path.abspath(os.path.join(HERE, ".."))
BUNDLED_ZIP = os.path.join(SKILL_ROOT, "references", "kb.zip")
CACHE_DIR = os.path.expanduser("~/.cache/tiaotiao-physics-kb")
GITHUB_ZIP_URL = "https://github.com/yansho123456-design/tiaotiao-physics-skill/archive/refs/heads/main.zip"


def has_kb(root_dir: str) -> bool:
    return bool(
        root_dir
        and os.path.exists(os.path.join(root_dir, "references", "INDEX.md"))
        and os.path.exists(os.path.join(root_dir, "scripts", "find.py"))
    )


def extract_bundled_zip(zip_path: str) -> str:
    target = SKILL_ROOT
    try:
        test_file = os.path.join(SKILL_ROOT, "references", ".write_test")
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
    except OSError:
        target = CACHE_DIR

    os.makedirs(target, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(target)
    return target


def download_github_kb() -> str | None:
    try:
        print("[INFO] 正在从 GitHub 获取跳跳物理知识库...", file=sys.stderr)
        os.makedirs(CACHE_DIR, exist_ok=True)
        tmp_zip = os.path.join(tempfile.gettempdir(), "tiaotiao_kb_github.zip")
        urllib.request.urlretrieve(GITHUB_ZIP_URL, tmp_zip)
        with zipfile.ZipFile(tmp_zip, "r") as zf:
            zf.extractall(CACHE_DIR)
        os.remove(tmp_zip)
        for sub in os.listdir(CACHE_DIR):
            cand = os.path.join(CACHE_DIR, sub)
            if has_kb(cand):
                return cand
    except Exception as e:
        print(f"[WARN] GitHub 自动拉取失败: {e}", file=sys.stderr)
    return None


def resolve_tiaotiao_dir() -> str | None:
    candidates = [
        os.environ.get("TIAOTIAO_PHYSICS_DIR", ""),
        os.path.abspath(os.path.join(SKILL_ROOT, "..", "tiaotiao-physics")),
        os.path.expanduser("~/.gemini/config/skills/tiaotiao-physics"),
        os.path.expanduser("~/.claude/skills/tiaotiao-physics"),
        SKILL_ROOT,
        CACHE_DIR,
    ]
    for c in candidates:
        if has_kb(c):
            return c

    if os.path.exists(BUNDLED_ZIP):
        print("[INFO] 检测到未安装 tiaotiao-physics，正在离线解压内置知识库 kb.zip...", file=sys.stderr)
        extracted = extract_bundled_zip(BUNDLED_ZIP)
        if has_kb(extracted):
            return extracted

    return download_github_kb()


def main() -> int:
    tdir = resolve_tiaotiao_dir()
    if not tdir:
        print("[ERROR] 未找到跳跳物理知识库，且内置 kb.zip 不存在。", file=sys.stderr)
        return 1
    find_py = os.path.join(tdir, "scripts", "find.py")
    ref_dir = os.path.join(tdir, "references")
    args = sys.argv[1:]
    if not args:
        print("用法: python3 scripts/search_tiaotiao.py 关键词1 关键词2 [--top 8]")
        return 2
    proc = subprocess.run([sys.executable, find_py] + args, cwd=tdir)
    print(f"\n[提示] 知识库根目录: {ref_dir}")
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())
