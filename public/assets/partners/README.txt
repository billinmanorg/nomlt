PARTNER LOGOS
=============

The two SVG files here are NEUTRAL PLACEHOLDER WORDMARKS created for this
build. They are not the partners' official logos. Replace them with the real
assets before launch.

To replace: save the official file over the placeholder, keeping the filename.
Nothing else needs to change.

  angeltwin.png     AngelTwin.com  — real mark, supplied by the client
  angltoken.webp    ANGLToken.io   — real mark, supplied by the client

Both partner marks are now in place. No placeholders remain.

SVG is preferred. PNG or WEBP also work - if you use a different extension,
update the two <img src> attributes in src/pages/index.html and
src/pages/about.html, then run: python3 build.py

HOW THESE WERE PREPARED
-----------------------
AngelTwin: the supplied artwork was a JPEG on a white ground, drawn for light
backgrounds. The circular emblem was cropped out and placed on a white circular
chip, masked so no white corners escape. The logo's own colours are untouched -
only the ground it sits on was rebuilt, so it reads on navy without recolouring
the partner mark. The "Angel Twin" wordmark below the emblem in the original was
dropped, because the card sets the name in NOLMT typography beside the emblem.

If AngelTwin can supply a vector (SVG/EPS) or a transparent PNG intended for
dark backgrounds, use it instead - save over angeltwin.png, or drop in an SVG
and update the two <img src> attributes.

ANGLToken.io: done. The coin mark was supplied directly and is in place. It is
121x121 with transparency, which is enough for the 48px slot on a 2x display.
If a larger original exists, drop it in over angltoken.webp.

Ask both partners for their official brand assets anyway. Using a logo pulled
off a website risks the wrong version, the wrong colourway, or a file that
disappears when they redesign.

SIZING
------
Logos are displayed at a consistent height with the artwork's own aspect ratio
preserved. Supply a transparent background and a version that reads on a dark
navy surface. If a partner only has a dark-on-light logo, ask for the reversed
or monochrome-light variant.
