#!/bin/sh
# Pull the latest hero insight widget (github.com/brannonwellington-design/
# hero-insight-widget, private) into hero-widget/, where /home embeds it as the
# hero image. The repo is private, so Vercel can't fetch it at build time; run
# this whenever you want the mock to pick up widget changes, then commit.
#
#   sh scripts/sync-hero-widget.sh            # latest main
#   sh scripts/sync-hero-widget.sh <ref>      # a branch, tag, or commit
#
# The widget files are copied as-is. Embed mode lives in two extra files
# (embed.css, embed.js) that the script links into index.html: with ?embed=1
# the page shows only the media stage, filling the frame, so the widget repo
# itself never needs to change.
set -e
cd "$(dirname "$0")/.." || exit 1
REF="${1:-main}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
gh repo clone brannonwellington-design/hero-insight-widget "$TMP/src" -- -q
git -C "$TMP/src" checkout -q "$REF"
SHA="$(git -C "$TMP/src" rev-parse --short HEAD)"

rm -rf hero-widget
mkdir -p hero-widget
cp "$TMP/src/index.html" hero-widget/
cp -R "$TMP/src/media" "$TMP/src/assets" hero-widget/

cat > hero-widget/embed.css <<'CSS'
/* added by scripts/sync-hero-widget.sh: ?embed=1 shows only the media stage,
   filling the iframe, for the homepage mock's hero */
html.embed, html.embed body { background: transparent; height: 100%; overflow: hidden; }
html.embed .nav, html.embed .hero-copy, html.embed .controls { display: none !important; }
html.embed .hero { display: block; padding: 0; height: 100%; }
html.embed .stage { aspect-ratio: auto !important; width: 100%; height: 100%; }
CSS
cat > hero-widget/embed.js <<'JS'
// added by scripts/sync-hero-widget.sh — see embed.css
if (new URLSearchParams(location.search).get("embed") === "1") document.documentElement.classList.add("embed")
JS
# link the embed files in just before </head>
sed -i.bak 's#</head>#<link rel="stylesheet" href="embed.css"><script src="embed.js"></script>\n</head>#' hero-widget/index.html
rm hero-widget/index.html.bak
echo "$SHA $(date -u +%Y-%m-%dT%H:%MZ) $REF" > hero-widget/VERSION
echo "hero-widget synced at $SHA"
