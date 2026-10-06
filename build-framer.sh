#!/bin/sh
# Bundle the Framer components into framer/listen-scenes.js. Framer imports it
# from jsDelivr at a git tag, so every release is a fixed, cacheable URL:
#   sh build-framer.sh framer-v2   → build, commit, merge, then tag main framer-v2
# React, React DOM, and framer stay external: Framer supplies its own.
cd "$(dirname "$0")" || exit 1
TAG=$1
[ -z "$TAG" ] && { echo "usage: sh build-framer.sh <tag, e.g. framer-v2>"; exit 1; }
ROOT="https://cdn.jsdelivr.net/gh/brannonwellington-design/listen-scene-system@$TAG/"
./node_modules/.bin/esbuild src/framer.tsx --bundle --format=esm --minify --jsx=automatic --log-level=warning \
  --external:react --external:react/jsx-runtime --external:react-dom --external:framer \
  "--define:__LL_MEDIA_BASE__=\"$ROOT\"" \
  --outfile=framer/listen-scenes.js || exit 1
# point the paste-in code files at this release
for f in framer/*.tsx; do
  sed -i '' -E "s#listen-scene-system@[^/]+/#listen-scene-system@$TAG/#" "$f"
done
echo "FRAMER_OK $TAG ($(wc -c < framer/listen-scenes.js | tr -d ' ') bytes)"
