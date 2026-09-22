const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, ".."); // backend/src
const SEED_FILE = path.join(SRC_DIR, "data", "menu.json");
const DATA_DIR = process.env.DATA_DIR || path.join(SRC_DIR, "data");
const LIVE_FILE = path.join(DATA_DIR, "menu.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(LIVE_FILE) && fs.existsSync(SEED_FILE)) {
    fs.copyFileSync(SEED_FILE, LIVE_FILE);
    console.log(`Seeded catalogue at ${LIVE_FILE}`);
  }
}

function loadMenu() {
  ensureDirs();
  try {
    const raw = fs.readFileSync(LIVE_FILE, "utf8");
    const menu = JSON.parse(raw);
    if (!menu || !Array.isArray(menu.categories)) throw new Error("bad shape");
    return menu;
  } catch (err) {
    // Never crash on corrupt data; fall back to seed so the site stays up.
    console.error(`Menu load failed (${LIVE_FILE}): ${err.message}`);
    try {
      return JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
    } catch {
      return { categories: [] };
    }
  }
}

function saveMenu(menu) {
  ensureDirs();
  const tmp = `${LIVE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(menu, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, LIVE_FILE);
}

// --- Admin sessions (server-side; cookie holds only a random id) ---
const sessions = new Map(); // id -> { csrf, expires }
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function createSession() {
  const id = crypto.randomBytes(32).toString("hex");
  const csrf = crypto.randomBytes(24).toString("hex");
  sessions.set(id, { csrf, expires: Date.now() + SESSION_TTL_MS });
  return { id, csrf };
}

function getSession(id) {
  if (!id) return null;
  const s = sessions.get(id);
  if (!s) return null;
  if (s.expires < Date.now()) {
    sessions.delete(id);
    return null;
  }
  // Sliding expiry
  s.expires = Date.now() + SESSION_TTL_MS;
  return s;
}

function destroySession(id) {
  if (id) sessions.delete(id);
}

// Periodic cleanup (hourly); unref so it never keeps the process alive alone.
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) if (s.expires < now) sessions.delete(id);
}, 60 * 60 * 1000);
if (sweep.unref) sweep.unref();

// --- Login brute-force protection (per IP) ---
const attempts = new Map(); // ip -> { fails, firstFail, blockedUntil }
const MAX_FAILS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 10 * 60 * 1000;

function loginBlocked(ip) {
  const a = attempts.get(ip);
  if (!a) return 0;
  const now = Date.now();
  if (a.blockedUntil && a.blockedUntil > now) return a.blockedUntil - now;
  if (now - a.firstFail > WINDOW_MS) attempts.delete(ip);
  return 0;
}

function recordLoginFail(ip) {
  const now = Date.now();
  let a = attempts.get(ip);
  if (!a || now - a.firstFail > WINDOW_MS) a = { fails: 0, firstFail: now, blockedUntil: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) a.blockedUntil = now + BLOCK_MS;
  attempts.set(ip, a);
  return a;
}

function recordLoginSuccess(ip) {
  attempts.delete(ip);
}

// --- Generic per-IP throttle for admin API (100 req / min) ---
const hits = new Map();
function adminThrottleOk(ip) {
  const now = Date.now();
  const win = 60 * 1000;
  let h = hits.get(ip);
  if (!h || now - h.start > win) h = { count: 0, start: now };
  h.count += 1;
  hits.set(ip, h);
  return h.count <= 100;
}

function clientIp(req) {
  const fwd = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.ip || req.socket?.remoteAddress || "unknown";
}

module.exports = {
  DATA_DIR,
  LIVE_FILE,
  UPLOAD_DIR,
  SEED_FILE,
  loadMenu,
  saveMenu,
  ensureDirs,
  createSession,
  getSession,
  destroySession,
  loginBlocked,
  recordLoginFail,
  recordLoginSuccess,
  adminThrottleOk,
  clientIp,
};
