import { useCallback, useEffect, useState } from "react";
import { apiUrl, resolveImage } from "./config.js";

async function adminFetch(path, { method = "GET", body, csrf } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (csrf) headers["X-CSRF-Token"] = csrf;
  const res = await fetch(apiUrl(path), {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.error || `request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function useAdminSession() {
  const [csrf, setCsrf] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    fetch(apiUrl("/api/admin/me"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setCsrf(j?.csrf || null))
      .catch(() => setCsrf(null))
      .finally(() => setChecking(false));
  }, []);
  return { csrf, checking, setCsrf };
}

export function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const j = await adminFetch("/api/admin/login", { method: "POST", body: { password } });
      setPassword("");
      onSuccess(j.csrf);
    } catch (err) {
      setError(err.status === 429 ? "Too many attempts — please wait a few minutes." : "Wrong password. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="admin-login" onSubmit={submit}>
      <h3>Layerss Admin</h3>
      <p className="admin-hint">Enter the admin password to manage the menu.</p>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          disabled={busy}
        />
      </label>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button className="btn pill" type="submit" disabled={busy || !password}>
        {busy ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}

const EMPTY_FORM = {
  name: "",
  desc: "",
  price: "",
  badge: "",
  placeholder: "",
  image: "",
  focus: "",
  bestseller: false,
  enabled: true,
};

function ItemForm({ initial, categoryId, csrf, onSaved, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(initial || {}) });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial?.image || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };
  const upload = async () => {
    if (!file) return form.image;
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(apiUrl("/api/admin/upload"), {
      method: "POST",
      headers: { "X-CSRF-Token": csrf },
      credentials: "include",
      body: fd,
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || "upload failed");
    return j.smallUrl || j.url;
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const image = await upload();
      const payload = { ...form, image, categoryId };
      let saved;
      if (initial?.id) {
        saved = await adminFetch(`/api/admin/items/${initial.id}`, { method: "PUT", body: payload, csrf });
      } else {
        saved = await adminFetch("/api/admin/items", { method: "POST", body: payload, csrf });
      }
      onSaved(saved.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="admin-form" onSubmit={submit}>
      <label>
        Name
        <input value={form.name} onChange={set("name")} required minLength={2} maxLength={80} disabled={busy} />
      </label>
      {categoryId !== "flavours" && (
        <label>
          Price (e.g. ₹249 | ₹449)
          <input value={form.price} onChange={set("price")} maxLength={60} disabled={busy} placeholder="₹249 | ₹449" />
        </label>
      )}
      <label>
        Short description
        <textarea value={form.desc} onChange={set("desc")} maxLength={300} rows={2} disabled={busy} />
      </label>
      <label>
        Image (upload optimizes automatically)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFile(f || null);
            if (f) setPreview(URL.createObjectURL(f));
          }}
        />
      </label>
      {preview && (
        <img className="admin-preview" src={preview.startsWith("blob:") ? preview : resolveImage(preview)} alt="preview" />
      )}
      <label>
        …or image URL
        <input value={form.image} onChange={(e) => { set("image")(e); setPreview(e.target.value); }} maxLength={500} disabled={busy} />
      </label>
      {categoryId === "flavours" && (
        <label>
          Slug (a-z, 0-9, dashes)
          <input value={form.placeholder} onChange={set("placeholder")} maxLength={40} disabled={busy} placeholder="mango" />
        </label>
      )}
      <div className="admin-checks">
        <label>
          <input type="checkbox" checked={!!form.bestseller} onChange={set("bestseller")} disabled={busy} />
          Bestseller
        </label>
        <label>
          <input type="checkbox" checked={form.enabled !== false} onChange={set("enabled")} disabled={busy} />
          Enabled
        </label>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-row">
        <button className="btn pill small" type="submit" disabled={busy}>
          {busy ? "Saving…" : initial?.id ? "Save changes" : "Add item"}
        </button>
        <button className="btn pill small outline" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function SectionEditor({ category, csrf, onChanged }) {
  const [editing, setEditing] = useState(null); // item or "new"
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const items = category.items || [];

  const move = useCallback(
    async (id, dir) => {
      const order = items.map((it) => it.id);
      const idx = order.indexOf(id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= order.length) return;
      [order[idx], order[j]] = [order[j], order[idx]];
      setBusy(true);
      try {
        await adminFetch("/api/admin/reorder", { method: "POST", body: { categoryId: category.id, order }, csrf });
        onChanged();
      } catch {
        /* panel shows stale order; retry surfaces on next action */
      } finally {
        setBusy(false);
      }
    },
    [items, category.id, csrf, onChanged]
  );

  const remove = async (id) => {
    setBusy(true);
    try {
      await adminFetch(`/api/admin/items/${id}`, { method: "DELETE", csrf });
      setConfirmDelete(null);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h4>{category.name}</h4>
        <button className="btn pill small outline" onClick={() => setEditing("new")} disabled={busy}>
          + Add
        </button>
      </div>
      {editing && (
        <ItemForm
          initial={editing === "new" ? null : editing}
          categoryId={category.id}
          csrf={csrf}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
      {items.length === 0 && <p className="muted">No items yet.</p>}
      <ul className="admin-list">
        {items.map((it, idx) => (
          <li key={it.id} className={it.enabled === false ? "is-disabled" : ""}>
            {it.image && <img src={resolveImage(it.smallImage || it.image)} alt="" loading="lazy" />}
            <span className="admin-item-name">
              {it.name}
              {it.bestseller || it.badge === "Bestseller" ? <em> ★ bestseller</em> : null}
              {it.enabled === false ? <em> · hidden</em> : null}
            </span>
            <span className="admin-item-actions">
              <button onClick={() => move(it.id, -1)} disabled={busy || idx === 0} aria-label={`Move ${it.name} up`}>↑</button>
              <button onClick={() => move(it.id, 1)} disabled={busy || idx === items.length - 1} aria-label={`Move ${it.name} down`}>↓</button>
              <button onClick={() => setEditing(it)} disabled={busy}>Edit</button>
              {confirmDelete === it.id ? (
                <>
                  <button className="danger" onClick={() => remove(it.id)} disabled={busy}>Confirm delete</button>
                  <button onClick={() => setConfirmDelete(null)} disabled={busy}>Keep</button>
                </>
              ) : (
                <button className="danger" onClick={() => setConfirmDelete(it.id)} disabled={busy}>Delete</button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminPanel({ csrf, onLogout }) {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMenu(await adminFetch("/api/admin/menu", { csrf }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [csrf]);
  useEffect(() => {
    load();
  }, [load]);

  const logout = async () => {
    try {
      await fetch(apiUrl("/api/admin/logout"), { method: "POST", credentials: "include" });
    } finally {
      onLogout();
    }
  };

  const cakesExtras = menu?.categories?.find((c) => c.id === "extras");
  const tubs = menu?.categories?.find((c) => c.id === "signature-tubs");
  const flavours = menu?.categories?.find((c) => c.id === "flavours");

  return (
    <div className="admin-panel">
      <div className="admin-top">
        <h3>Layerss Admin</h3>
        <button className="btn pill small outline" onClick={logout}>Log out</button>
      </div>
      {loading && <p className="muted">Loading catalogue…</p>}
      {error && (
        <p className="admin-error" role="alert">
          {error} <button onClick={load}>Retry</button>
        </p>
      )}
      {menu && (
        <>
          <h4 className="admin-group">Cakes &amp; Extras</h4>
          {cakesExtras && <SectionEditor category={cakesExtras} csrf={csrf} onChanged={load} />}
          <h4 className="admin-group">Dessert Tubs</h4>
          {tubs && <SectionEditor category={tubs} csrf={csrf} onChanged={load} />}
          {flavours && <SectionEditor category={flavours} csrf={csrf} onChanged={load} />}
        </>
      )}
    </div>
  );
}
