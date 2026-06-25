const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 3000);
const root = __dirname;

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const filePath = path.join(root, urlPath === "/" ? "index.html" : urlPath);
  const safePath = filePath.startsWith(root) ? filePath : path.join(root, "index.html");

  fs.readFile(safePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Arquivo não encontrado");
      return;
    }

    const ext = path.extname(safePath);
    const type = ext === ".html" ? "text/html" : ext === ".css" ? "text/css" : "application/javascript";
    res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview disponível em http://localhost:${port}`);
});
