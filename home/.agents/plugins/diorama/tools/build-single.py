#!/usr/bin/env python3
"""Regenerate a diorama single-file page from the engine, or check that it is current.

The engine has one source of truth, assets/collection/engine/. It is split in three layers:
the shell (diorama.css, diorama.js), templates (template-<name>.css/.js) and stages
(stage-<name>.css/.js). A single-file page inlines the shell plus one template and the stage that
template names, and embeds one walkthrough, so it opens from disk as one file.

Without arguments this writes assets/walkthrough.html: the step story ("story") on the isometric
stage, with assets/example-walkthrough.json. --template builds a page for another template, from
the engine folder or from --template-dir (for example tools/test-template), into --out.

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
DEFAULT_TEMPLATE = "story"

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
{css}
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
{js}
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
# A template file must open with this call, so the stage it needs can be read without running it.
DEFINE_TEMPLATE = re.compile(r"Diorama\.defineTemplate\(\s*'([a-z0-9-]+)'\s*,\s*\{\s*stage:\s*(?:null|'([a-z0-9-]+)')\s*\}")
NAME = re.compile(r"\A[a-z0-9]+(?:-[a-z0-9]+)*\Z")


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


def call_parts(path, fn):
    """The JSON text and object of a data file that must be exactly `Diorama.<fn>(<strict JSON>);`."""
    m = CALL.match(read(path))
    if not m:
        raise Problem(f"{rel(path)}: must be exactly one call `Diorama.{fn}({{...}});` and nothing else")
    if m.group(1) != fn:
        raise Problem(f"{rel(path)}: calls Diorama.{m.group(1)}() but must call Diorama.{fn}()")
    obj = strict_json(m.group(2), rel(path))
    if not isinstance(obj, dict):
        raise Problem(f"{rel(path)}: the argument must be a JSON object")
    return m.group(2).strip(), obj


def data_call(path, fn):
    return call_parts(path, fn)[1]


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


def layer_files(template, template_dir):
    """The (css, js) files to inline, in load order: the shell, the template's stage, the template."""
    tpl_js = template_dir / f"template-{template}.js"
    m = DEFINE_TEMPLATE.search(read(tpl_js))
    if not m or m.group(1) != template:
        raise Problem(f"{rel(tpl_js)} must call Diorama.defineTemplate('{template}', {{ stage: '<name>' }} or {{ stage: null }}, ...)")
    layers = [(ENGINE / "diorama.css", ENGINE / "diorama.js")]
    if m.group(2):
        layers.append((ENGINE / f"stage-{m.group(2)}.css", ENGINE / f"stage-{m.group(2)}.js"))
    layers.append((template_dir / f"template-{template}.css", tpl_js))
    return layers


def inline(path, closing):
    """One engine file inside the page's <style> or <script>, between markers naming its source."""
    source = f"assets/collection/engine/{path.name}" if path.parent == ENGINE else rel(path)
    text = embeddable(read(path).rstrip("\n"), rel(path), closing)
    return (f"/* ===== BEGIN engine/{path.name} (generated copy: edit {source}, then run tools/build-single.py) ===== */\n"
            f"{text}\n/* ===== END engine/{path.name} ===== */")


def example_data(template, template_dir, data):
    """The walkthrough to embed: --data, else the starter example (story) or the template's example."""
    if data is None:
        if template == DEFAULT_TEMPLATE and template_dir == ENGINE:
            data = EXAMPLE
        else:
            found = [p for p in (template_dir / f"example-{template}.json", template_dir / f"example-{template}.js") if p.exists()]
            if not found:
                raise Problem(f"no example for the template {template!r}: add {rel(template_dir)}/example-{template}.json or .js, or pass --data")
            data = found[0]
    if data.suffix == ".js":
        text, obj = call_parts(data, "walkthrough")
    else:
        text = read(data).rstrip("\n")
        obj = strict_json(text, rel(data))
    if not isinstance(obj, dict):
        raise Problem(f"{rel(data)}: the walkthrough must be a JSON object")
    named = obj.get("template", DEFAULT_TEMPLATE)
    if named != template:
        raise Problem(f"{rel(data)} uses the template {named!r}, not {template!r}")
    return embeddable(text, rel(data), "script")


def build(template, template_dir, data):
    if not NAME.match(template):
        raise Problem(f"{template!r} is not a template name (kebab-case, such as 'story')")
    layers = layer_files(template, template_dir)
    return TEMPLATE.format(
        version=engine_version(),
        css="\n".join(inline(css, "style") for css, _ in layers),
        js="\n".join(inline(js, "script") for _, js in layers),
        data=example_data(template, template_dir, data),
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
        description="Regenerate a single-file walkthrough page from the engine: by default "
        "skills/diorama-maker/assets/walkthrough.html, the step story with assets/example-walkthrough.json.",
        epilog="Edit the engine in assets/collection/engine/, then run this without arguments. "
        "Run with --check before committing: it exits 1 when the page is out of date, when "
        "example-walkthrough.json differs from collection/walkthroughs/badge-tap.js, or when a starter "
        "data file (collection.js, walkthroughs/*.js) is not a single Diorama.<fn>(<strict JSON>); call. "
        "Another template: --template plain --template-dir tools/test-template --out /tmp/plain.html",
    )
    parser.add_argument("--check", action="store_true", help="change nothing; report problems and exit 1 if there are any")
    parser.add_argument("--template", default=DEFAULT_TEMPLATE, help="the template to build the page for (default: story)")
    parser.add_argument("--template-dir", type=Path, default=None,
                        help="folder holding template-<name>.js/.css and its example (default: the engine folder); stages always come from the engine folder")
    parser.add_argument("--data", type=Path, default=None,
                        help="walkthrough to embed: a .json object or a .js Diorama.walkthrough({...}); file "
                        "(default: example-walkthrough.json for story, else <template-dir>/example-<name>.json or .js)")
    parser.add_argument("--out", type=Path, default=None, help="where to write the page (default: assets/walkthrough.html; required for another template)")
    args = parser.parse_args()

    template_dir = (args.template_dir or ENGINE).resolve()
    data = args.data.resolve() if args.data else None
    out = args.out.resolve() if args.out else None
    if out is None:
        if args.template != DEFAULT_TEMPLATE or template_dir != ENGINE or data is not None:
            print("error: pass --out for a page other than the starter walkthrough.html", file=sys.stderr)
            return 1
        out = SINGLE

    try:
        page = build(args.template, template_dir, data)
    except Problem as p:
        print(f"error: {p}", file=sys.stderr)
        return 1

    if not args.check:
        out.write_text(page, encoding="utf-8")
        print(f"wrote {rel(out)} ({len(page.encode('utf-8')):,} bytes)")
        problems = check_starter()
    else:
        problems = check_starter()
        current = out.read_text(encoding="utf-8") if out.exists() else None
        if current != page:
            problems.insert(0, f"{rel(out)} is out of date; run tools/build-single.py")

    for p in problems:
        print(f"problem: {p}", file=sys.stderr)
    if args.check and not problems:
        print(f"ok: {out.name} is current and the starter data is well formed")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
