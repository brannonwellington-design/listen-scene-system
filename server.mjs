// Tiny static server for the local demo.
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(fileURLToPath(import.meta.url))
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" }

createServer(async (req, res) => {
  const pathname = decodeURIComponent(req.url.split("?")[0])
  const path = pathname === "/" ? "/demo.html" : pathname
  try {
    const data = await readFile(join(root, path))
    res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end("not found")
  }
}).listen(4173, () => console.log("demo server on http://localhost:4173"))
