import { useEffect, useState } from "react";

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
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ categories: [] }));
  }, [url]);
  return data;
}
