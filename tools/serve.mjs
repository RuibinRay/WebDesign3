/*
 * Local preview server, no dependencies.
 *   node tools/serve.mjs [port]      → http://localhost:4183/
 * Serves the brand folder with byte ranges, like a static host would.
 *
 * One extra, for refs.html: POST /__ref/<chip>-pack  (a PNG body) saves the drawn pack to
 * higgsfield/refs/<chip>-pack.png, the reference image every photo of a bag is generated from.
 * It only accepts the four pack names, only PNG, only from this machine.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REFS = path.join(ROOT, 'higgsfield/refs');
const PORT = Number(process.argv[2] || process.env.PORT || 4183);
const PACKS = new Set(['verde-pack', 'pinton-pack', 'maduro-pack', 'miel-pack']);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8',
};

function saveRef(req, res, name) {
  const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  if (!local || !PACKS.has(name)) { res.writeHead(403).end(); return; }
  const chunks = [];
  let size = 0;
  req.on('data', (c) => { size += c.length; if (size > 16e6) req.destroy(); else chunks.push(c); });
  req.on('end', () => {
    const buf = Buffer.concat(chunks);
    const png = buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47;
    if (!png) { res.writeHead(400, { 'content-type': 'text/plain' }).end('not a png'); return; }
    fs.mkdirSync(REFS, { recursive: true });
    fs.writeFileSync(path.join(REFS, name + '.png'), buf);
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ saved: 'higgsfield/refs/' + name + '.png', bytes: buf.length }));
  });
}

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (req.method === 'POST' && p.startsWith('/__ref/')) { saveRef(req, res, p.slice(7)); return; }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, path.normalize(p).replace(/^([/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }).end('not found'); return; }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    const head = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': 'no-store' };
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Number(range[2]) : st.size - 1;
      res.writeHead(206, { ...head, 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { ...head, 'content-length': st.size });
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(PORT, () => console.log(`Racimo preview: http://localhost:${PORT}/`));
