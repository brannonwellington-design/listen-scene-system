// Tiny static server for the local demo. Lives in scripts/ so Vercel's
// Node entrypoint detection never picks it up — the deployed site is the
// static `site/` output (see vercel.json).
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// the desktop app assigns a free port via PORT; 4173 is the fallback for manual runs
const PORT = Number(process.env.PORT) || 4173

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png" }

createServer(async (req, res) => {
  const pathname = decodeURIComponent(req.url.split("?")[0])
  const path = pathname === "/" || pathname.replace(/\/+$/, "") === "/home" ? "/demo.html" : pathname
  try {
    const data = await readFile(join(root, path))
    const type = types[extname(path)] ?? "application/octet-stream"
    // byte ranges: browsers need them to seek video (the interview clip scrubs)
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "")
    if (range) {
      const start = range[1] ? +range[1] : data.length - +range[2]
      const end = range[1] && range[2] ? Math.min(+range[2], data.length - 1) : data.length - 1
      res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${data.length}`, "accept-ranges": "bytes", "content-length": end - start + 1 })
      res.end(data.subarray(start, end + 1))
      return
    }
    res.writeHead(200, { "content-type": type, "accept-ranges": "bytes" })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end("not found")
  }
}).listen(PORT, () => console.log(`demo server on http://localhost:${PORT}`))
