// Tiny static server for the cloned bundle (handles Range requests so the hero video seeks/loops).
// Usage:  node serve.mjs [port]      then open http://127.0.0.1:8080
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || 8080);
const MIME = {'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8',
  '.mjs':'text/javascript;charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.webm':'video/webm','.mp4':'video/mp4','.woff2':'font/woff2',
  '.woff':'font/woff','.ttf':'font/ttf','.ico':'image/x-icon'};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const fp = path.resolve(path.join(ROOT, p));
  if (!fp.toLowerCase().startsWith(ROOT.toLowerCase())) { res.writeHead(403); return res.end('forbidden'); }
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.writeHead(404, {'content-type':'text/plain'}); return res.end('404 ' + p); }
  const st = fs.statSync(fp);
  const head = {'content-type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'accept-ranges':'bytes'};
  const range = req.headers.range;
  if (range && /^bytes=/.test(range)) {                       // required for video scrubbing
    const [a, b] = range.replace('bytes=', '').split('-');
    const start = parseInt(a, 10) || 0, end = b ? parseInt(b, 10) : st.size - 1;
    res.writeHead(206, {...head, 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1});
    return fs.createReadStream(fp, {start, end}).pipe(res);
  }
  res.writeHead(200, {...head, 'content-length': st.size});
  fs.createReadStream(fp).pipe(res);
}).listen(PORT, () => console.log(`Tree of Life clone → http://127.0.0.1:${PORT}`));
