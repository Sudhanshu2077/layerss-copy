// Admin API smoke test (run: node backend/scripts/smoke.js)
const { execSync } = require("child_process");
const hash = execSync('node backend/scripts/make-hash.js "test-password-12345"', { encoding: "utf8" }).trim();
process.env.ADMIN_PASSWORD_HASH = hash;
const app = require("../src/index.js");
const srv = app.listen(0, async () => {
  const p = srv.address().port;
  const B = `http://127.0.0.1:${p}`;
  const log = (...a) => console.log(...a);
  // 1. Unauthenticated admin read must 401
  let r = await fetch(`${B}/api/admin/menu`);
  log("UNAUTH_MENU", r.status);
  // 2. Bad login 401
  r = await fetch(`${B}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "wrong" }) });
  log("BAD_LOGIN", r.status, await r.text());
  // 3. Good login -> cookie + csrf
  r = await fetch(`${B}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "test-password-12345" }) });
  const setCookie = r.headers.get("set-cookie") || "";
  const body = await r.json();
  log("GOOD_LOGIN", r.status, "cookieHttpOnly=" + /httponly/i.test(setCookie), "csrf=" + Boolean(body.csrf));
  const cookie = setCookie.split(";")[0];
  const H = { "Content-Type": "application/json", Cookie: cookie, "X-CSRF-Token": body.csrf };
  // 4. Auth menu read
  r = await fetch(`${B}/api/admin/menu`, { headers: { Cookie: cookie } });
  const menu = await r.json();
  log("AUTH_MENU", r.status, "cats=" + menu.categories.length);
  // 5. Mutation without CSRF must 403
  r = await fetch(`${B}/api/admin/items`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ categoryId: "extras", name: "X" }) });
  log("NO_CSRF", r.status);
  // 6. Create item
  r = await fetch(`${B}/api/admin/items`, { method: "POST", headers: H, body: JSON.stringify({ categoryId: "extras", name: "Smoke Cookie", desc: "test", price: "100", placeholder: "smoke-cookie" }) });
  const created = await r.json();
  log("CREATE", r.status, created.item && created.item.id);
  const id = created.item.id;
  // 7. Validation: bad price
  r = await fetch(`${B}/api/admin/items`, { method: "POST", headers: H, body: JSON.stringify({ categoryId: "extras", name: "Bad", price: "free!!!" }) });
  log("BAD_PRICE", r.status, await r.text());
  // 8. Edit bestseller
  r = await fetch(`${B}/api/admin/items/${id}`, { method: "PUT", headers: H, body: JSON.stringify({ name: "Smoke Cookie", desc: "test", price: "150", bestseller: true }) });
  log("EDIT", r.status, (await r.json()).item.badge);
  // 9. Reorder extras (move new item first)
  const cats = (await (await fetch(`${B}/api/admin/menu`, { headers: { Cookie: cookie } })).json()).categories;
  const extras = cats.find((c) => c.id === "extras");
  const order = [id, ...extras.items.filter((i) => i.id !== id).map((i) => i.id)];
  r = await fetch(`${B}/api/admin/reorder`, { method: "POST", headers: H, body: JSON.stringify({ categoryId: "extras", order }) });
  log("REORDER", r.status);
  // 10. Delete (restore seed state)
  r = await fetch(`${B}/api/admin/items/${id}`, { method: "DELETE", headers: { Cookie: cookie, "X-CSRF-Token": body.csrf } });
  log("DELETE", r.status);
  // 11. Logout then read must 401
  r = await fetch(`${B}/api/admin/logout`, { method: "POST", headers: { Cookie: cookie } });
  log("LOGOUT", r.status);
  r = await fetch(`${B}/api/admin/menu`, { headers: { Cookie: cookie } });
  log("POST_LOGOUT", r.status);
  // 12. Public menu still fine
  r = await fetch(`${B}/api/menu`);
  log("PUBLIC_MENU", r.status, r.headers.get("cache-control"));
  srv.close();
});
