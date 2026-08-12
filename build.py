#!/usr/bin/env python3
"""
NOLMT static build.

Reads src/layout.html + src/pages/*.html and writes flat HTML into public/.
Run `python3 build.py` after editing anything in src/. The generated files in
public/ are committed, so Render needs no build command.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
PAGES = os.path.join(SRC, "pages")
OUT = os.path.join(ROOT, "public")

# slug -> label. Order is the order in the header.
NAV = [
    ("ai-app-development", "AI App Development"),
    ("tokenization", "Tokenization"),
    ("subtokens", "Subtokens"),
    ("education", "Education"),
    ("apps", "Apps"),
    ("partners", "Partners"),
    ("about", "About"),
]

META_RE = re.compile(r"^<!--meta(.*?)-->", re.S)


def parse(raw):
    meta = {}
    match = META_RE.match(raw.strip())
    body = raw
    if match:
        for line in match.group(1).strip().splitlines():
            if ":" in line:
                key, value = line.split(":", 1)
                meta[key.strip()] = value.strip()
        body = raw.strip()[match.end():]
    return meta, body.strip()


def nav_html(active):
    items = []
    for slug, label in NAV:
        current = ' aria-current="page"' if slug == active else ""
        items.append('<li><a href="%s.html"%s>%s</a></li>' % (slug, current, label))
    return "\n        ".join(items)


def build():
    with open(os.path.join(SRC, "layout.html"), encoding="utf-8") as fh:
        layout = fh.read()

    if not os.path.isdir(PAGES):
        sys.exit("No src/pages directory found.")

    built = []
    for name in sorted(os.listdir(PAGES)):
        if not name.endswith(".html"):
            continue
        slug = name[:-5]
        with open(os.path.join(PAGES, name), encoding="utf-8") as fh:
            meta, body = parse(fh.read())

        title = meta.get("title", "NOLMT")
        if slug != "index":
            title = "%s — NOLMT" % title

        script = ""
        if os.path.exists(os.path.join(OUT, "js", "pages", slug + ".js")):
            script = '<script src="js/pages/%s.js"></script>' % slug

        html = (layout
                .replace("{{TITLE}}", title)
                .replace("{{DESCRIPTION}}", meta.get("description", ""))
                .replace("{{CANONICAL}}", "" if slug == "index" else slug + ".html")
                .replace("{{SLUG}}", slug)
                .replace("{{NAV}}", nav_html(meta.get("nav", slug)))
                .replace("{{PAGE_SCRIPT}}", script)
                .replace("{{BODY}}", body))

        with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
            fh.write(html)
        built.append(name)

    print("Built %d pages into public/:" % len(built))
    for name in built:
        print("  " + name)


if __name__ == "__main__":
    build()
