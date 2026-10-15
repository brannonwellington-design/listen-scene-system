// Export product shots as 2x PNGs for the Framer CMS, using headless Chrome.
// Each shot renders alone at /?export=<key> (its design size, frozen on its
// poster frame, transparent outside its own rounded corners).
//
//   node scripts/dev-server.mjs            # in another terminal
//   node scripts/export-shots.mjs mm-      # every key starting with "mm-"
//   node scripts/export-shots.mjs mm-recruit mm-trace --out exports
//
// Options: --port 4173, --scale 2, --out exports
import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf("--" + name)
  return i >= 0 ? args.splice(i, 2)[1] : dflt
}
const port = opt("port", process.env.PORT || "4173")
const scale = opt("scale", "2")
const out = join(root, opt("out", "exports"))
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

// keys and design sizes, read from the registry source so this needs no build
const src = readFileSync(join(root, "src/ListenRegistry.tsx"), "utf8")
const consts = { ...readConsts("src/ListenKit.tsx"), ...readConsts("src/ListenMultiMarket.tsx"), ...readConsts("src/ListenScenes.tsx") }
const entries = [...src.matchAll(/key: "([^"]+)".*?w: (\w+), h: (\w+)/g)].map(([, key, w, h]) => ({ key, w: size(w), h: size(h) }))
const picked = entries.filter((e) => args.some((a) => e.key === a || (a.endsWith("-") && e.key.startsWith(a))))
if (!picked.length) {
  console.error("No shots matched. Keys:\n  " + entries.map((e) => e.key).join("\n  "))
  process.exit(1)
}

mkdirSync(out, { recursive: true })
for (const e of picked) {
  const file = join(out, `${e.key}@${scale}x.png`)
  execFileSync(CHROME, [
    "--headless=new", "--hide-scrollbars", "--disable-gpu",
    `--window-size=${e.w},${e.h}`, `--force-device-scale-factor=${scale}`,
    "--default-background-color=00000000", "--virtual-time-budget=4000",
    `--screenshot=${file}`, `http://localhost:${port}/?export=${e.key}`,
  ], { stdio: "ignore" })
  console.log(`${file}  (${e.w * scale}×${e.h * scale})`)
}

function readConsts(path) {
  const text = readFileSync(join(root, path), "utf8")
  return Object.fromEntries([...text.matchAll(/export const (\w+) = (\d+)\b/g)].map(([, k, v]) => [k, +v]))
}
function size(token) {
  const v = /^\d+$/.test(token) ? +token : consts[token]
  if (v == null) throw new Error(`unknown size ${token}`)
  return v
}
