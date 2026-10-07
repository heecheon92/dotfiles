#!/usr/bin/env python3
"""Validate skill links and render selected examples without installing tools."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from html import escape
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FENCE = re.compile(r"^```mermaid[^\n]*\n(.*?)^```[ \t]*$", re.M | re.S)


def inspect_references() -> list[tuple[str, str, str]]:
    examples = []
    for path in ROOT.rglob("*.md"):
        text = path.read_text(encoding="utf-8")
        if len(re.findall(r"^```", text, re.M)) % 2:
            raise ValueError(f"Unbalanced fences: {path.relative_to(ROOT)}")
        for link in re.findall(r"\]\(([^\s)]+)\)", text):
            if re.match(r"[a-z]+:|#", link):
                continue
            target = link.split("#", 1)[0]
            if target and not (path.parent / target).exists():
                raise ValueError(f"Missing link target in {path.relative_to(ROOT)}: {target}")
        if path.parent.name == "diagrams":
            blocks = FENCE.findall(text)
            if len(blocks) != 1:
                raise ValueError(f"Expected one example: {path.name}")
            if not re.fullmatch(r"[a-z0-9-]+", path.stem):
                raise ValueError(f"Unsafe example filename: {path.name}")
            examples.append((path.stem, text.splitlines()[0].removeprefix("# "), blocks[0]))
    if not examples:
        raise ValueError("No examples found")
    catalog = (ROOT / "references/catalog.md").read_text(encoding="utf-8")
    for name, _, _ in examples:
        if f"diagrams/{name}.md" not in catalog:
            raise ValueError(f"Example not discoverable in catalog: {name}")
    return sorted(examples)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, help="New directory outside this skill")
    parser.add_argument("--render", action="store_true", help="Render SVGs using existing mmdc")
    parser.add_argument("--mmdc", default="mmdc", help="Executable path/name; not a shell command")
    parser.add_argument("--puppeteer-config", type=Path, help="Optional existing browser config")
    parser.add_argument("--only", nargs="+", help="Example IDs, e.g. swimlane sequence block")
    parser.add_argument("--jobs", type=int, default=2)
    parser.add_argument("--timeout", type=float, default=90)
    args = parser.parse_args()
    if args.jobs < 1 or args.timeout <= 0:
        parser.error("jobs and timeout must be positive")
    examples = inspect_references()
    print(f"Validated {len(examples)} discoverable examples and local file links (not anchors).")
    if args.only:
        missing = set(args.only) - {item[0] for item in examples}
        if missing:
            parser.error("Unknown example IDs: " + ", ".join(sorted(missing)))
        examples = [item for item in examples if item[0] in args.only]
    if args.render and args.output_dir is None:
        parser.error("--render requires --output-dir")
    if args.output_dir is None:
        return 0
    output = args.output_dir.expanduser().resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error("Output must be outside the skill directory")
    renderer = None
    version = None
    if args.render:
        renderer = shutil.which(args.mmdc)
        if renderer is None:
            parser.error("mmdc not found; install a compatible renderer under your environment policy")
        if args.puppeteer_config and not args.puppeteer_config.is_file():
            parser.error("Puppeteer config not found")
        version = subprocess.check_output([renderer, "--version"], text=True, timeout=15).strip()
    # Do not overwrite a previous render or arbitrary user files.
    output.mkdir(parents=True, exist_ok=False)
    for name, _, source in examples:
        (output / f"{name}.mmd").write_text(source, encoding="utf-8")
    if not args.render:
        print(f"Extracted {len(examples)} sources to {output}")
        return 0
    config = output / "mermaid-config.json"
    config.write_text(json.dumps({"securityLevel": "strict"}), encoding="utf-8")

    def render(item: tuple[str, str, str]) -> dict:
        name, title, _ = item
        command = [renderer, "-i", str(output / f"{name}.mmd"), "-o", str(output / f"{name}.svg"),
                   "-c", str(config), "-b", "white", "-q"]
        if args.puppeteer_config:
            command.extend(["-p", str(args.puppeteer_config.resolve())])
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=args.timeout)
            svg = output / f"{name}.svg"
            passed = result.returncode == 0 and svg.is_file() and "<svg" in svg.read_text(encoding="utf-8")
            error = "" if passed else (result.stderr or result.stdout or "No SVG produced")[-4000:]
        except subprocess.TimeoutExpired:
            passed, error = False, "Renderer timeout"
        print(f"{'PASS' if passed else 'FAIL'} {name}", flush=True)
        return {"id": name, "title": title, "rendered": passed, "error": error}

    with ThreadPoolExecutor(max_workers=args.jobs) as executor:
        results = list(executor.map(render, examples))
    report = {"cli_version": version, "examples": results,
              "note": "Rendering success is not semantic or visual validation."}
    (output / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    cards = []
    for item in results:
        name, title = escape(item["id"], quote=True), escape(item["title"])
        visual = (f'<a href="{name}.svg"><img src="{name}.svg" alt="{title}" loading="lazy"></a>'
                  if item["rendered"] else f'<pre>{escape(item["error"])}</pre>')
        cards.append(f'<section id="{name}"><h2>{title}</h2>{visual}<p><a href="{name}.mmd">Source</a></p></section>')
    html = '''<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Mermaid example review</title>
<style>body{font:16px/1.6 system-ui;max-width:1200px;margin:30px auto;padding:20px;background:#f3f6f7;color:#17323a}section{background:white;border:1px solid #ccd9dd;padding:24px;margin:24px 0;border-radius:10px}img{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#126e79}</style>
<h1>Mermaid example review</h1><p>Fictional examples. Click an SVG for full-size inspection. Rendering alone does not prove semantics.</p>'''+"\n".join(cards)+"</html>"
    (output / "index.html").write_text(html, encoding="utf-8")
    failed = sum(not item["rendered"] for item in results)
    print(f"{len(results)-failed}/{len(results)} rendered; review {output / 'index.html'}")
    return 1 if failed else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(2)
