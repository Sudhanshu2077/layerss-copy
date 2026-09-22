const express = require("express");
const path = require("path");
const fs = require("fs");
const store = require("./lib/store");

// Load .env in development (optional dependency — safe if missing).
try {
  require("dotenv").config();
} catch {
  /* dotenv not installed or no .env file */
}

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Render / proxies: needed for correct IPs + secure cookies behind proxy.
app.set("trust proxy", 1);

// Gzip/deflate for JSON + SVG + text — big win on slow mobile (optional dep).
try {
  app.use(require("compression")());
} catch {
  /* compression not installed */
}

app.use(express.json({ limit: "1mb" }));

// --- Request logger (minimal, no secrets) ---
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// --- Secure headers (lightweight helmet replacement, no extra dep required) ---
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  if (NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  next();
});

// --- CORS: restricted in production, permissive localhost in development ---
const frontendUrls = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  // No Origin (curl, SSR, same-origin) -> skip CORS headers.
  if (!origin) return next();
  const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowed =
    frontendUrls.length === 0
      ? NODE_ENV !== "production" && isLocalhost
      : frontendUrls.includes(origin) ||
        (NODE_ENV !== "production" && isLocalhost);
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token"
    );
    // Cookies are used for admin sessions (Phase 12); allow credentials only for allowlisted origins.
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") return res.sendStatus(allowed ? 204 : 403);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: NODE_ENV, time: new Date().toISOString() });
});

app.get("/api/menu", (_req, res) => {
  const file = store.LIVE_FILE;
  // CDN-friendly: short cache + stale-while-revalidate so admin edits propagate
  // without users being stuck on old data (uploads use hashed names = auto-invalidate).
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
  );
  res.sendFile(file, (err) => {
    if (err && !res.headersSent) res.status(500).json({ error: "menu unavailable" });
  });
});

// Persistent uploads (Render disk via DATA_DIR; hashed names = immutable cache).
try {
  store.ensureDirs();
  app.use(
    "/uploads",
    express.static(store.UPLOAD_DIR, {
      maxAge: "365d",
      immutable: true,
      fallthrough: true,
    })
  );
} catch {
  /* uploads dir unavailable */
}

// Secure admin API (auth, rate limits, validation live in routes/admin.js).
try {
  app.use("/api/admin", require("./routes/admin"));
} catch (err) {
  console.error(`Admin routes unavailable: ${err.message}`);
}

// JSON 404 for unknown API routes (never leak stack traces).
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "not found" });
});

// --- Optional static serving for local monorepo runs ---
// On Render the backend is API-only; the frontend is deployed separately on Vercel.
// Locally (`npm start` from repo root) we still serve the built frontend if present.
const distDir = path.join(__dirname, "..", "..", "frontend", "dist");
const publicDir = path.join(__dirname, "..", "..", "frontend", "public");
if (fs.existsSync(distDir)) {
  app.use(
    express.static(distDir, {
      maxAge: "1y",
      immutable: true,
      setHeaders: (res, filePath) => {
        // HTML must never be immutably cached — otherwise users see stale UI.
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );
}
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { maxAge: "7d" }));
}
if (fs.existsSync(distDir)) {
  app.get(/.*/, (_req, res) =>
    res.sendFile(path.join(distDir, "index.html"), {
      headers: { "Cache-Control": "no-cache" },
    })
  );
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Layerss backend (${NODE_ENV}) on :${PORT}`);
  });
}

module.exports = app;
