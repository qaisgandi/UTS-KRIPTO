import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const files = {
  "/": "index.html",
  "/index.html": "index.html",
  "/style.css": "style.css",
  "/app.js": "app.js",
  "/cipher.js": "cipher.js",
};
const mime = { html: "text/html", css: "text/css", js: "text/javascript" };
http
  .createServer(async (req, res) => {
    const file = files[new URL(req.url, "http://localhost").pathname];
    if (!file) {
      res.writeHead(404);
      return res.end("Tidak ditemukan");
    }
    try {
      const data = await readFile(
        fileURLToPath(new URL(file, import.meta.url)),
      );
      res.writeHead(200, {
        "Content-Type": mime[file.split(".").pop()] + "; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(data);
    } catch {
      res.writeHead(500);
      res.end("Gagal membaca aplikasi");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log(
      "Aksara berjalan di http://localhost:4173 — Ctrl+C untuk berhenti.",
    ),
  );
