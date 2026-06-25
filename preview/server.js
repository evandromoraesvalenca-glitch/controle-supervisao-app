const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const port = 3001;

http
  .createServer((req, res) => {
    fs.readFile(path.join(root, "index.html"), "utf8", (err, html) => {
      if (err) {
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
        res.end(err.message);
        return;
      }

      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(html);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Previa em http://127.0.0.1:${port}/`);
  });
