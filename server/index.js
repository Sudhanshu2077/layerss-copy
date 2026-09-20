const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.get("/api/menu", (_req, res) => {
  res.sendFile(path.join(__dirname, "data", "menu.json"));
});

const distDir = path.join(__dirname, "..", "client", "dist");
const publicDir = path.join(__dirname, "..", "client", "public");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}
if (fs.existsSync(distDir)) {
  app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(PORT, () => {
  console.log(`Layerss server running at http://localhost:${PORT}`);
});
