import { useEffect, useState } from "react";
import { apiUrl } from "./config.js";

export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    const observeAll = () => {
      document
        .querySelectorAll(".reveal:not(.visible)")
        .forEach((el) => io.observe(el));
    };
    observeAll();
    var mo = null;
    if (typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(observeAll);
      mo.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      io.disconnect();
      if (mo) mo.disconnect();
    };
  }, []);
}

export function useApi(url) {
  const [data, setData] = useState(null);
  useEffect(() => {
    // Allow relative "/api/…" (same-origin / Vite proxy) or absolute Render URL via VITE_API_URL.
    const full = /^https?:\/\//.test(url) ? url : apiUrl(url);
    fetch(full)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ categories: [] }));
  }, [url]);
  return data;
}

// Catalogue fetch with loading / error / retry states for product pages.
// Uses the browser HTTP cache (backend sends max-age=60 + stale-while-revalidate)
// so admin edits propagate within minutes without users clearing anything.
export function useCatalogue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(apiUrl("/api/menu"))
      .then((r) => {
        if (!r.ok) throw new Error(`menu ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (alive) {
          setData(j && Array.isArray(j.categories) ? j : { categories: [] });
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError("menu-unavailable");
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [nonce]);
  return { data, loading, error, retry: () => setNonce((n) => n + 1) };
}
