const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");
const store = require("../lib/store");
const { verifyPassword, parseCookies, sessionCookie, clearSessionCookie, COOKIE_NAME } = require("../lib/auth");
const { CATEGORY_IDS, validateItem } = require("../lib/validate");

const router = express.Router();
const isProd = (process.env.NODE_ENV || "development") === "production";
const cookieSecure = () => isProd; // https in production; plain http on localhost

// Parse cookies once for admin routes (tiny, no extra dep).
router.use((req, _res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
});

// Throttle all admin traffic (brute-force + abuse guard).
router.use((req, res, next) => {
  if (!store.adminThrottleOk(store.clientIp(req))) {
    return res.status(429).json({ error: "too many requests, slow down" });
  }
  next();
});

function authed(req) {
  return store.getSession(req.cookies[COOKIE_NAME]);
}

function requireAuth(req, res, next) {
  const s = authed(req);
  if (!s) return res.status(401).json({ error: "not authenticated" });
  req.adminSession = s;
  next();
}

function requireCsrf(req, res, next) {
  const token = req.headers["x-csrf-token"];
  if (!token || token !== req.adminSession.csrf) {
    return res.status(403).json({ error: "invalid csrf token" });
  }
  next();
}

// --- Public (but rate-limited) auth endpoints ---
router.post("/login", express.json({ limit: "10kb" }), (req, res) => {
  const ip = store.clientIp(req);
  const waitMs = store.loginBlocked(ip);
  if (waitMs > 0) {
    res.setHeader("Retry-After", Math.ceil(waitMs / 1000));
    return res.status(429).json({ error: "too many attempts, try again later" });
  }
  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD_HASH || "";
  const ok =
    typeof password === "string" &&
    password.length > 0 &&
    password.length <= 200 &&
    expected &&
    verifyPassword(password, expected);
  if (!ok) {
    store.recordLoginFail(ip);
    // Generic message — never reveal whether a password is configured.
    return res.status(401).json({ error: "invalid credentials" });
  }
  store.recordLoginSuccess(ip);
  const { id, csrf } = store.createSession();
  res.setHeader("Set-Cookie", sessionCookie(id, cookieSecure()));
  res.json({ ok: true, csrf });
});

router.post("/logout", (req, res) => {
  store.destroySession(req.cookies[COOKIE_NAME]);
  res.setHeader("Set-Cookie", clearSessionCookie(cookieSecure()));
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const s = authed(req);
  if (!s) return res.status(401).json({ error: "not authenticated" });
  res.json({ ok: true, csrf: s.csrf });
});

// --- Authenticated catalogue reads (full detail incl. disabled) ---
router.get("/menu", requireAuth, (_req, res) => {
  res.json(store.loadMenu());
});

// --- Mutations (auth + CSRF) ---
const writeJson = express.json({ limit: "64kb" });

function findCategory(menu, id) {
  return (menu.categories || []).find((c) => c.id === id);
}

router.post("/items", requireAuth, requireCsrf, writeJson, (req, res) => {
  const { categoryId } = req.body || {};
  if (!CATEGORY_IDS.includes(categoryId)) return res.status(400).json({ error: "unknown category" });
  const { item, error } = validateItem(req.body, categoryId);
  if (error) return res.status(400).json({ error });
  const menu = store.loadMenu();
  const cat = findCategory(menu, categoryId);
  if (!cat) return res.status(400).json({ error: "unknown category" });
  item.id = crypto.randomBytes(8).toString("hex");
  cat.items = cat.items || [];
  cat.items.push(item);
  try {
    store.saveMenu(menu);
  } catch {
    return res.status(500).json({ error: "could not save catalogue" });
  }
  res.status(201).json({ ok: true, item });
});

router.put("/items/:id", requireAuth, requireCsrf, writeJson, (req, res) => {
  const menu = store.loadMenu();
  for (const cat of menu.categories || []) {
    const idx = (cat.items || []).findIndex((it) => it.id === req.params.id);
    if (idx >= 0) {
      const { item, error } = validateItem(req.body, cat.id);
      if (error) return res.status(400).json({ error });
      const prev = cat.items[idx];
      // If the image was replaced, remove the orphaned upload (best effort).
      if (prev.image && prev.image.startsWith("/uploads/") && item.image !== prev.image) {
        removeUpload(prev.image);
        if (prev.smallImage && prev.smallImage !== item.smallImage) removeUpload(prev.smallImage);
      }
      cat.items[idx] = { ...prev, ...item, id: prev.id };
      try {
        store.saveMenu(menu);
      } catch {
        return res.status(500).json({ error: "could not save catalogue" });
      }
      return res.json({ ok: true, item: cat.items[idx] });
    }
  }
  res.status(404).json({ error: "item not found" });
});

router.delete("/items/:id", requireAuth, requireCsrf, (req, res) => {
  const menu = store.loadMenu();
  for (const cat of menu.categories || []) {
    const idx = (cat.items || []).findIndex((it) => it.id === req.params.id);
    if (idx >= 0) {
      const [removed] = cat.items.splice(idx, 1);
      if (removed?.image?.startsWith("/uploads/")) removeUpload(removed.image);
      if (removed?.smallImage?.startsWith("/uploads/")) removeUpload(removed.smallImage);
      try {
        store.saveMenu(menu);
      } catch {
        return res.status(500).json({ error: "could not save catalogue" });
      }
      return res.json({ ok: true });
    }
  }
  res.status(404).json({ error: "item not found" });
});

router.post("/reorder", requireAuth, requireCsrf, writeJson, (req, res) => {
  const { categoryId, order } = req.body || {};
  if (!CATEGORY_IDS.includes(categoryId) || !Array.isArray(order)) {
    return res.status(400).json({ error: "invalid reorder payload" });
  }
  const menu = store.loadMenu();
  const cat = findCategory(menu, categoryId);
  if (!cat) return res.status(400).json({ error: "unknown category" });
  const current = new Set((cat.items || []).map((it) => it.id));
  if (order.length !== current.size || !order.every((id) => current.has(id))) {
    return res.status(400).json({ error: "order must contain exactly the category item ids" });
  }
  const byId = new Map(cat.items.map((it) => [it.id, it]));
  cat.items = order.map((id) => byId.get(id));
  try {
    store.saveMenu(menu);
  } catch {
    return res.status(500).json({ error: "could not save catalogue" });
  }
  res.json({ ok: true });
});

// --- Image uploads: validate type/size, optimize to WebP, hash filenames ---
let upload = null;
try {
  const multer = require("multer");
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (/^image\/(jpeg|png|webp)$/i.test(file.mimetype)) cb(null, true);
      else cb(new Error("only jpeg, png or webp images are allowed"));
    },
  });
} catch {
  upload = null; // sharp/multer missing -> endpoint reports 503 with guidance
}

function removeUpload(urlPath) {
  try {
    const name = path.basename(urlPath);
    if (!/^[\w.-]+\.webp$/.test(name)) return; // only our generated files
    const full = path.join(store.UPLOAD_DIR, name);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {
    /* best effort */
  }
}

router.post("/upload", requireAuth, requireCsrf, (req, res) => {
  if (!upload) {
    return res.status(503).json({ error: "image uploads unavailable (server missing sharp/multer)" });
  }
  upload.single("image")(req, res, async (err) => {
    if (err) {
      const msg = /file.*large|limit/i.test(err.message || "") ? "image must be under 5 MB" : err.message;
      return res.status(400).json({ error: msg || "upload failed" });
    }
    if (!req.file?.buffer) return res.status(400).json({ error: "no image received" });
    let sharp;
    try {
      sharp = require("sharp");
    } catch {
      return res.status(503).json({ error: "image processing unavailable" });
    }
    try {
      const base = `p-${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}`;
      // Main: max 1600px, WebP q82, never upscale, preserve orientation/aspect.
      const mainName = `${base}.webp`;
      const mainBuf = await sharp(req.file.buffer, { failOn: "none" })
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const meta = await sharp(mainBuf).metadata();
      if (!meta.width || !meta.height) throw new Error("unreadable image");
      store.ensureDirs();
      fs.writeFileSync(path.join(store.UPLOAD_DIR, mainName), mainBuf);
      // Card variant: max 800px q80 for fast cards.
      const smallName = `${base}-800.webp`;
      const smallBuf = await sharp(req.file.buffer, { failOn: "none" })
        .rotate()
        .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      fs.writeFileSync(path.join(store.UPLOAD_DIR, smallName), smallBuf);
      res.status(201).json({
        ok: true,
        url: `/uploads/${mainName}`,
        smallUrl: `/uploads/${smallName}`,
        width: meta.width,
        height: meta.height,
      });
    } catch {
      res.status(400).json({ error: "could not process that image (jpeg/png/webp only)" });
    }
  });
});

module.exports = router;
