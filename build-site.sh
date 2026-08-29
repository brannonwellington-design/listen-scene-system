#!/bin/sh
# Assemble the static site for deployment (Vercel runs this as buildCommand).
cd "$(dirname "$0")" || exit 1
sh build.sh || exit 1
rm -rf site
mkdir -p site
cp dist/demo.js site/
# demo.html is the app shell; serve it as the site index
sed 's#src="dist/demo.js"#src="demo.js"#' demo.html > site/index.html
# reference screenshots power compare mode (?scene=X&ref=01.png)
cp -R "image examples" "site/image examples"
echo SITE_OK
