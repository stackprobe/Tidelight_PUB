import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const port = 8000;
const root = await realpath(fileURLToPath(new URL("../DocRoot/", import.meta.url)));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

function insideRoot(path) {
  const local = relative(root, path);
  return local !== ".." && !local.startsWith(".." + sep) && !isAbsolute(local);
}

createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://" + host).pathname);
    const path = resolve(root, "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname));
    const type = mime[extname(path).toLowerCase()];
    if (!type || !insideRoot(path)) throw new Error("Unsupported path");
    const target = await realpath(path);
    if (!insideRoot(target)) throw new Error("Outside DocRoot");
    const data = await readFile(target);
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": data.length,
      "Cache-Control": "no-cache"
    }).end(request.method === "HEAD" ? undefined : data);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, host, () => {
  console.log(`潮待ちの灯  http://${host}:${port}/`);
});
