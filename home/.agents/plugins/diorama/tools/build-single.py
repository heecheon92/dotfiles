#!/usr/bin/env python3
"""Regenerate the diorama-maker single-file page from the engine, or check that it is current.

The engine has one source of truth, assets/collection/engine/diorama.css and diorama.js.
assets/walkthrough.html is a generated copy that inlines both and embeds
assets/example-walkthrough.json, so it opens from disk as one file.

This is a maintainer tool: it is not shipped inside the skill and uses only the Python 3
standard library.
"""

import argparse
import json
import re
import sys
from pathlib import Path

PLUGIN = Path(__file__).resolve().parent.parent
SKILL = PLUGIN / "skills" / "diorama-maker"
ASSETS = SKILL / "assets"
COLLECTION = ASSETS / "collection"
ENGINE = COLLECTION / "engine"
SINGLE = ASSETS / "walkthrough.html"
EXAMPLE = ASSETS / "example-walkthrough.json"
EXAMPLE_IN_COLLECTION = COLLECTION / "walkthroughs" / "badge-tap.js"

CSS_BEGIN = "/* ===== BEGIN engine/diorama.css (generated copy: edit assets/collection/engine/diorama.css, then run tools/build-single.py) ===== */"
CSS_END = "/* ===== END engine/diorama.css ===== */"
JS_BEGIN = "/* ===== BEGIN engine/diorama.js (generated copy: edit assets/collection/engine/diorama.js, then run tools/build-single.py) ===== */"
JS_END = "/* ===== END engine/diorama.js ===== */"

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Walkthrough</title>
<!--
  Diorama single-file walkthrough, engine {version}. Opens from disk: no server, no network.
  The styles and code are generated copies of the engine; only the data block below is edited.
-->
<style>
{css_begin}
{css}
{css_end}
</style>
</head>
<body>
<!--
  WALKTHROUGH DATA: this <script type="application/json"> block is the ONLY thing to replace.
  Paste one walkthrough object that follows references/walkthrough-schema.md. Everything else on
  the page is rendered from it; do not edit the styles or code in this file.
-->
<script type="application/json" id="walkthrough">
{data}
</script>

<script>
{js_begin}
{js}
{js_end}
</script>
<script>
  (function () {{
    var data = null;
    try {{ data = JSON.parse(document.getElementById('walkthrough').textContent); }}
    catch (err) {{ console.error('[diorama] the walkthrough data block is not valid JSON: ' + err.message); }}
    Diorama.startSingle(data);
  }})();
</script>
</body>
</html>
"""

CALL = re.compile(r"\A\s*Diorama\.([A-Za-z]+)\((.*)\);\s*\Z", re.S)


class Problem(Exception):
    pass


def read(path):
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise Problem(f"{rel(path)} is missing")


def rel(path):
    try:
        return str(path.relative_to(PLUGIN))
    except ValueError:
        return str(path)


def strict_json(text, where):
    """Parse JSON the way the schema demands: no NaN/Infinity, no duplicate keys."""

    def no_constants(name):
        raise ValueError(f"{name} is not valid JSON")

    def no_duplicates(pairs):
        obj = {}
        for k, v in pairs:
            if k in obj:
                raise ValueError(f"duplicate key {k!r}")
            obj[k] = v
        return obj

    try:
        return json.loads(text, parse_constant=no_constants, object_pairs_hook=no_duplicates)
    except ValueError as err:
        raise Problem(f"{where}: not strict JSON ({err})")


def data_call(path, fn):
    """Return the object of a data file that must be exactly `Diorama.<fn>(<strict JSON>);`."""
    m = CALL.match(read(path))
    if not m:
        raise Problem(f"{rel(path)}: must be exactly one call `Diorama.{fn}({{...}});` and nothing else")
    if m.group(1) != fn:
        raise Problem(f"{rel(path)}: calls Diorama.{m.group(1)}() but must call Diorama.{fn}()")
    obj = strict_json(m.group(2), rel(path))
    if not isinstance(obj, dict):
        raise Problem(f"{rel(path)}: the argument must be a JSON object")
    return obj


def embeddable(text, what, closing):
    if re.search(rf"</{closing}", text, re.I) or (closing == "script" and "<!--" in text):
        raise Problem(f"{what} contains '</{closing}' or '<!--', which would break the inlined <{closing}> block")
    return text


def engine_version():
    version = read(ENGINE / "VERSION").strip()
    m = re.search(r"const VERSION = '([^']+)';", read(ENGINE / "diorama.js"))
    if not m or m.group(1) != version:
        raise Problem(f"engine/VERSION says {version} but diorama.js says {m.group(1) if m else 'nothing'}")
    return version


def build():
    css = read(ENGINE / "diorama.css").rstrip("\n")
    js = read(ENGINE / "diorama.js").rstrip("\n")
    data = read(EXAMPLE).rstrip("\n")
    strict_json(data, rel(EXAMPLE))
    return TEMPLATE.format(
        version=engine_version(),
        css_begin=CSS_BEGIN, css=embeddable(css, "diorama.css", "style"), css_end=CSS_END,
        js_begin=JS_BEGIN, js=embeddable(js, "diorama.js", "script"), js_end=JS_END,
        data=embeddable(data, rel(EXAMPLE), "script"),
    )


def check_starter():
    """Every starter data file is one strict call; the example matches badge-tap.js."""
    problems = []
    try:
        outline = data_call(COLLECTION / "collection.js", "collection")
    except Problem as p:
        problems.append(str(p))
        outline = {}
    files = sorted((COLLECTION / "walkthroughs").glob("*.js"))
    for path in files:
        try:
            obj = data_call(path, "walkthrough")
            if obj.get("id") != path.stem:
                problems.append(f"{rel(path)}: id {obj.get('id')!r} does not match the file name")
        except Problem as p:
            problems.append(str(p))
    listed = {}
    for section in outline.get("sections", []) if isinstance(outline.get("sections"), list) else []:
        for item in section.get("items", []) if isinstance(section, dict) else []:
            if isinstance(item, dict):
                listed[item.get("id")] = item.get("status")
    names = {p.stem for p in files}
    for item_id, status in listed.items():
        if status != "planned" and item_id not in names:
            problems.append(f"collection.js lists {item_id!r} as {status!r} but walkthroughs/{item_id}.js does not exist")
    for name in sorted(names - set(listed)):
        problems.append(f"walkthroughs/{name}.js is not listed in collection.js")
    try:
        example = strict_json(read(EXAMPLE), rel(EXAMPLE))
        if example != data_call(EXAMPLE_IN_COLLECTION, "walkthrough"):
            problems.append(f"{rel(EXAMPLE)} and {rel(EXAMPLE_IN_COLLECTION)} hold different data; keep them identical")
    except Problem as p:
        problems.append(str(p))
    return problems


def main():
    parser = argparse.ArgumentParser(
        description="Regenerate skills/diorama-maker/assets/walkthrough.html from the engine "
        "(assets/collection/engine/diorama.css, diorama.js) and assets/example-walkthrough.json.",
        epilog="Edit the engine in assets/collection/engine/, then run this without arguments. "
        "Run with --check before committing: it exits 1 when walkthrough.html is out of date, when "
        "example-walkthrough.json differs from collection/walkthroughs/badge-tap.js, or when a starter "
        "data file (collection.js, walkthroughs/*.js) is not a single Diorama.<fn>(<strict JSON>); call.",
    )
    parser.add_argument("--check", action="store_true", help="change nothing; report problems and exit 1 if there are any")
    args = parser.parse_args()

    try:
        page = build()
    except Problem as p:
        print(f"error: {p}", file=sys.stderr)
        return 1

    if not args.check:
        SINGLE.write_text(page, encoding="utf-8")
        print(f"wrote {rel(SINGLE)} ({len(page.encode('utf-8')):,} bytes)")
        problems = check_starter()
    else:
        problems = check_starter()
        current = SINGLE.read_text(encoding="utf-8") if SINGLE.exists() else None
        if current != page:
            problems.insert(0, f"{rel(SINGLE)} is out of date; run tools/build-single.py")

    for p in problems:
        print(f"problem: {p}", file=sys.stderr)
    if args.check and not problems:
        print("ok: walkthrough.html is current and the starter data is well formed")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
