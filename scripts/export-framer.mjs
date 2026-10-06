// Export the Framer code files: `npm run export:framer` → framer/.
// Writes exactly the files a Framer project needs for ListenScene (the
// single-shot component) and nothing from the multi-step carousels. Media the
// scenes reference by site path ("media/…") is inlined as data URIs, so the
// files are self-contained: no hosting, no Framer asset uploads.
// Then bundles framer-preview.html from those same exported files, so the
// local preview (/framer on the dev server) tests what you paste.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { join, dirname, extname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const out = join(root, "framer")

// paste order in Framer: dependencies first, the component last
const FILES = [
  "ListenIcons.tsx",
  "ListenKit.tsx",
  "ListenClip.tsx",
  "ListenScenes.tsx",
  "ListenRegistry.tsx",
  "ListenShot.tsx",
  "ListenScene.tsx",
]
const MIME = { ".mp4": "video/mp4", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" }

await rm(out, { recursive: true, force: true })
await mkdir(out)

const rows = []
for (const f of FILES) {
  let src = await readFile(join(root, "src", f), "utf8")
  // "media/x.ext" string literals → data URIs
  const refs = [...new Set([...src.matchAll(/"(media\/[^"]+)"/g)].map((m) => m[1]))]
  for (const ref of refs) {
    const mime = MIME[extname(ref).toLowerCase()]
    if (!mime) throw new Error(`${f}: no MIME type for ${ref}`)
    const b64 = (await readFile(join(root, ref))).toString("base64")
    src = src.split(`"${ref}"`).join(`"data:${mime};base64,${b64}"`)
  }
  // the multi-step half must not leak in: Framer would ask for its files too
  const bad = [...src.matchAll(/from "\.\/(\w+)"/g)].map((m) => m[1] + ".tsx").filter((d) => !FILES.includes(d))
  if (bad.length) throw new Error(`${f} imports ${bad.join(", ")}, which isn't exported`)
  // Framer resolves code-file imports only with the extension ("./ListenKit.tsx")
  src = src.replace(/from "\.\/(\w+)"/g, 'from "./$1.tsx"')
  await writeFile(join(out, f), src)
  rows.push([f, (Buffer.byteLength(src) / 1024).toFixed(0) + " KB", refs.length ? `inlined ${refs.join(", ")}` : ""])
}

// bundle the preview from the exported copies (framer → local stub)
const nm = join(root, "node_modules")
execFileSync(join(nm, ".bin/esbuild"), [
  "scripts/framer-preview.tsx", "--bundle", "--outfile=dist/framer-preview.js", "--jsx=automatic", "--log-level=warning",
  "--alias:framer=./src/framer-stub.ts",
  "--alias:react=./node_modules/react/index.js",
  "--alias:react/jsx-runtime=./node_modules/react/jsx-runtime.js",
  "--alias:react-dom/client=./node_modules/react-dom/client.js",
  "--alias:react-dom=./node_modules/react-dom/index.js",
  "--alias:scheduler=./node_modules/scheduler/index.js",
  "--alias:loose-envify=./node_modules/loose-envify/index.js",
], { cwd: root, stdio: "inherit" })

const w = Math.max(...rows.map((r) => r[0].length))
console.log("framer/ — paste in this order (Assets → Code):")
rows.forEach(([f, size, note], i) => console.log(`  ${i + 1}. ${f.padEnd(w)}  ${size.padStart(6)}  ${i === rows.length - 1 ? "← code component" : "code file"}${note ? "  · " + note : ""}`))
console.log("preview: /framer on the dev server (node scripts/dev-server.mjs)")
