#!/bin/sh
# Bundle the local demo. (Aliases pin module paths directly because some
# sandboxed shells break esbuild's node_modules directory search.)
cd "$(dirname "$0")" || exit 1
./node_modules/.bin/esbuild src/demo.tsx --bundle --outfile=dist/demo.js --jsx=automatic --log-level=warning \
  --alias:framer=./src/framer-stub.ts \
  --alias:react=./node_modules/react/index.js \
  "--alias:react/jsx-runtime=./node_modules/react/jsx-runtime.js" \
  "--alias:react-dom/client=./node_modules/react-dom/client.js" \
  "--alias:react-dom=./node_modules/react-dom/index.js" \
  --alias:scheduler=./node_modules/scheduler/index.js \
  --alias:loose-envify=./node_modules/loose-envify/index.js \
  && echo BUILD_OK
