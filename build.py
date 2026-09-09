#!/usr/bin/env python3
"""
NOLMT static build.

Reads src/layout.html + src/pages/*.html and writes flat HTML into public/.
Run `python3 build.py` after editing anything in src/. The generated files in
public/ are committed, so Render needs no build command.
"""

import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
PAGES = os.path.join(SRC, "pages")
OUT = os.path.join(ROOT, "public")

# slug -> label. Order is the order in the header.
NAV = [
    ("ai-agents", "AI Agents"),
    ("ai-app-development", "AI Apps"),
    ("tokenization", "Tokenization"),
    ("pricing", "Pricing"),
    ("apps", "Examples"),
    ("about", "About"),
]

META_RE = re.compile(r"^<!--meta(.*?)-->", re.S)

# Local css/, js/ and assets/ references get a content hash appended, so a
# browser can never serve a stale stylesheet, script or image alongside fresh
# HTML. Swap a logo file and the URL changes with it.
ASSET_RE = re.compile(r'(href|src)="((?:css|js|assets)/[^"?]+)"')
_hashes = {}


def asset_version(rel):
    if rel not in _hashes:
        path = os.path.join(OUT, rel)
        try:
            with open(path, "rb") as fh:
                _hashes[rel] = hashlib.sha1(fh.read()).hexdigest()[:8]
        except OSError:
            _hashes[rel] = "0"
    return _hashes[rel]


def version_assets(html):
    def sub(match):
        attr, rel = match.group(1), match.group(2)
        return '%s="%s?v=%s"' % (attr, rel, asset_version(rel))
    return ASSET_RE.sub(sub, html)


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


def build_stamp():
    """A short fingerprint of every non-HTML asset, so you can confirm at a
    glance which build a deployed page is actually running."""
    import datetime
    digest = hashlib.sha1()
    for root, dirs, files in os.walk(OUT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for name in sorted(files):
            if name.endswith(".html"):
                continue
            with open(os.path.join(root, name), "rb") as fh:
                digest.update(fh.read())
    return "%s-%s" % (datetime.date.today().isoformat(), digest.hexdigest()[:8])


def build():
    with open(os.path.join(SRC, "layout.html"), encoding="utf-8") as fh:
        layout = fh.read()

    if not os.path.isdir(PAGES):
        sys.exit("No src/pages directory found.")

    stamp = build_stamp()
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

        scripts = []
        if os.path.exists(os.path.join(OUT, "js", "pages", slug + ".js")):
            scripts.append(slug)
        for extra in [x.strip() for x in meta.get("scripts", "").split(",") if x.strip()]:
            if extra not in scripts:
                scripts.append(extra)
        script = "\n".join('<script src="js/pages/%s.js"></script>' % n for n in scripts)

        html = (layout
                .replace("{{TITLE}}", title)
                .replace("{{DESCRIPTION}}", meta.get("description", ""))
                .replace("{{CANONICAL}}", "" if slug == "index" else slug + ".html")
                .replace("{{SLUG}}", slug)
                .replace("{{NAV}}", nav_html(meta.get("nav", slug)))
                .replace("{{PAGE_SCRIPT}}", script)
                .replace("{{STICKY_HREF}}", meta.get("cta_href", "ai-agents.html"))
                .replace("{{STICKY_LABEL}}", meta.get("cta_label", "Try an AI Agent"))
                .replace("{{BUILD}}", stamp)
                .replace("{{BODY}}", body))

        html = version_assets(html)

        with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
            fh.write(html)
        built.append(name)

    print("Build stamp: %s" % stamp)
    print("Built %d pages into public/:" % len(built))
    for name in built:
        print("  " + name)


if __name__ == "__main__":
    build()
