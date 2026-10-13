// Local preview: node serve.js  then open http://localhost:8080
const http = require("http"), fs = require("fs"), path = require("path");
const DIST = path.join(__dirname, "dist");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".xml": "application/xml", ".txt": "text/plain", ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  let f = path.join(DIST, p);
  if (!f.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { res.writeHead(404, { "Content-Type": TYPES[".html"] }); return res.end(fs.readFileSync(path.join(DIST, "404.html"))); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(8080, () => console.log("Preview at http://localhost:8080"));
