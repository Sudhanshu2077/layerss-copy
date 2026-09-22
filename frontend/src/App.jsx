import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalogue, useReveal } from "./hooks.js";
import Placeholder from "./Placeholder.jsx";
import SmartImage from "./SmartImage.jsx";
import { AdminLogin, AdminPanel, useAdminSession } from "./admin.jsx";
import { ICONS } from "./icons.jsx";
import { INSTAGRAM_URL as INSTAGRAM, MAP_EMBED_URL, waLink } from "./config.js";
import { ArrowLeftIcon, InstagramIcon, WhatsAppIcon } from "./brand.jsx";

// Elegant muted flavour tints (never neon/cartoonish). Used as --tint CSS var;
// row/icon backgrounds are derived via color-mix so both themes stay balanced.
const FLAVOUR_TINTS = {
  strawberry: "#a63d4a",
  chocolate: "#6f4a2f",
  pineapple: "#9a7418",
  butterscotch: "#9c6b1e",
  blueberry: "#5b5fa6",
  blackcurrant: "#6a4a7a",
  "chocolate-truffle": "#5a3a28",
  kitkat: "#8a4a2e",
  "ferrero-rocher": "#8a6a2a",
  rasamalai: "#a67c2a",
  rosemilk: "#a65a6e",
  mango: "#b7791f",
  "black-forest": "#6e2f36",
  biscoff: "#8f6238",
};

function scrollToEl(id) {
  var el = document.getElementById(id);
  if (!el) return false;
  try {
    el.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    el.scrollIntoView();
  }
  return true;
}

function FlavourIcon({ item }) {
  const [failed, setFailed] = useState(false);
  const tint = FLAVOUR_TINTS[item.placeholder];
  const style = tint ? { color: tint, ["--tint"]: tint } : undefined;
  if (failed) {
    return (
      <span className="flavour-icon" style={style}>
        {ICONS[item.placeholder] || item.icon}
      </span>
    );
  }
  return (
    <span className="flavour-icon" style={style}>
      <SmartImage
        src={`/icons/${item.placeholder}.png`}
        webpSrc={`/icons/${item.placeholder}-128.webp`}
        alt=""
        width={76}
        height={76}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function ScrollSpy({ dots, onDot }) {
  const [active, setActive] = useState(dots[0][0]);
  const ids = dots.map((d) => d[0]);
  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 60;
      if (nearBottom) {
        setActive(ids[ids.length - 1]);
        return;
      }
      const y = window.scrollY + window.innerHeight * 0.35;
      let cur = ids[0];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) cur = id;
      });
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [dots]);
  return (
    <nav className="scrollspy" aria-label="Section navigation">
      {dots.map(([id, label]) => (
        <button
          key={id}
          className={`spy-dot ${active === id ? "on" : ""}`}
          onClick={() => onDot(id)}
          aria-label={label}
        >
          <span className="tip">{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Nav({ theme, onToggle, view, onHome, onView, onSection }) {
  const [open, setOpen] = useState(false);
  const go = (fn) => (e) => {
    e.preventDefault();
    setOpen(false);
    fn();
  };
  return (
    <header className="nav">
      <div className="nav-inner container">
        <a className="logo" href="#top" onClick={go(onHome)}>
          <img className="logo-mark" src="/logo-32.png" alt="Layerss logo" width={34} height={34} />
          <span className="logo-text">layerss<span>_thebakehouse</span></span>
        </a>
        <nav className={`links ${open ? "open" : ""}`}>
          <a href="#top" onClick={go(onHome)}>Home</a>
          <a href="#news" onClick={go(() => onSection("news"))}>News</a>
          <a href="#about" onClick={go(() => onSection("about"))}>About</a>
          <a href="#blog" onClick={go(() => onSection("blog"))}>Blog</a>
          <a href="#visit" onClick={go(() => onSection("visit"))}>Visit Us</a>
          <a href="#contact" onClick={go(() => onSection("contact"))}>Contact</a>
          <a
            className="btn pill"
            href={waLink("Hi Layerss! I'd like to place an order.")}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            DM to Order
          </a>
        </nav>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={onToggle}
            aria-label="Toggle dark / light mode"
            title="Toggle dark / light mode"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            className="burger"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open ? "true" : "false"}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const slides = useMemo(
    () => [
      { key: "slide-1", label: "Signature Dessert Tubs", image: "/hero/slide-1.jpg" },
      { key: "slide-2", label: "14 Cake Flavours", image: "/hero/slide-2.jpg" },
      { key: "slide-3", label: "Made Fresh to Order", image: "/hero/slide-3.jpg" },
    ],
    []
  );
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  // Autoplay: pause on hover/focus, respect prefers-reduced-motion.
  useEffect(() => {
    if (paused) return undefined;
    if (typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length, paused]);
  // Prefetch the likely-next slide so transitions feel instant.
  useEffect(() => {
    const next = slides[(i + 1) % slides.length];
    if (!next) return;
    const webp = next.image.replace(/\.(jpe?g|png)$/i, ".webp");
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 800));
    const id = idle(() => {
      [webp, next.image].forEach((src) => {
        const im = new Image();
        im.decoding = "async";
        im.src = src;
      });
    });
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [i, slides]);

  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Sambhajinagar, Maharashtra · Order 24 hr prior</p>
          <h1>
            Layer upon layer <br />of <em>happiness</em>
          </h1>
          <p className="lead">
            Signature dessert tubs and custom cakes, made fresh to order with
            love — six irresistible flavours, one unforgettable experience.
          </p>
          <div className="hero-cta">
            <a className="btn pill hero-primary" href="#pick">Explore the menu</a>
            <a
              className="btn pill outline"
              href={waLink("Hi Layerss! I'd like to place an order.")}
              target="_blank"
              rel="noreferrer"
            >
              DM to Order
            </a>
          </div>
        </div>
        <div
          className="hero-art"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {slides.map((s, idx) => (
            <div
              key={s.key}
              className={`slide ${idx === i ? "on" : ""}`}
              aria-hidden={idx === i ? "false" : "true"}
            >
              <Placeholder
                name={s.key}
                label={s.label}
                big
                image={s.image}
                eager={idx === 0}
              />
            </div>
          ))}
          <div className="dots">
            {slides.map((s, idx) => (
              <button
                key={s.key}
                className={idx === i ? "dot on" : "dot"}
                onClick={() => setI(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function orderText(catId, itemName) {
  if (catId === "flavours") {
    return `Hi Layerss! I'd like to order the ${itemName} flavour Dessert Tub.`;
  }
  if (catId === "signature-tubs") {
    return `Hi Layerss! I'd like to order the ${itemName} tub.`;
  }
  return `Hi Layerss! I'd like to order: ${itemName}.`;
}

function TubCards({ items, catId }) {
  const visible = (items || []).filter((it) => it.enabled !== false);
  if (visible.length === 0) {
    return <p className="muted empty-note">Nothing here right now — check back soon.</p>;
  }
  return (
    <div className="grid product-grid">
      {visible.map((it) => (
        <article className="card" key={it.id}>
          <Placeholder name={it.placeholder} label={it.name} image={it.image} pos={it.focus} />
          <div className="card-body">
            <div className="card-top">
              <h4>{it.name}</h4>
              <div className="price-col">
                {it.price && <span className="price">{it.price}</span>}
                {it.badge && <span className="badge">{it.badge}</span>}
              </div>
            </div>
            <p>{it.desc}</p>
            <a
              className="btn pill small"
              href={waLink(orderText(catId, it.name))}
              target="_blank"
              rel="noreferrer"
            >
              Order
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

function FlavoursGrid({ cat }) {
  const visible = (cat.items || []).filter((it) => it.enabled !== false);
  if (visible.length === 0) {
    return <p className="muted empty-note">Flavours are being refreshed — check back soon.</p>;
  }
  return (
    <div className="flavours">
      {visible.map((it) => {
        const tint = FLAVOUR_TINTS[it.placeholder];
        return (
          <a
            key={it.id}
            className="flavour-row"
            style={tint ? { ["--tint"]: tint } : undefined}
            href={waLink(orderText(cat.id, it.name))}
            target="_blank"
            rel="noreferrer"
            title={`Order ${it.name} on WhatsApp`}
            aria-label={`Order ${it.name} on WhatsApp`}
          >
            <FlavourIcon item={it} />
            <span className="flavour-name">{it.name}</span>
          </a>
        );
      })}
    </div>
  );
}

function PageBack({ onHome, label }) {
  return (
    <div className="page-back reveal">
      <button className="back-btn" onClick={onHome}>
        <ArrowLeftIcon size={16} />
        <span>{label || "Back"}</span>
      </button>
    </div>
  );
}

function BackHome({ onHome }) {
  return (
    <div className="back-row">
      <button className="btn pill outline" onClick={onHome}>← Back to home</button>
    </div>
  );
}

function HomePicker({ onPick }) {
  return (
    <section className="section pick" id="pick">
      <div className="container">
        <div className="head reveal">
          <p className="eyebrow">What are you craving?</p>
          <h2>Pick a lane</h2>
          <p className="lead center">
            Two signature paths — custom celebration cakes or layered dessert tubs.
          </p>
        </div>
        <div className="pick-grid reveal">
          <button className="pick-card pick-cakes" onClick={() => onPick("cakes")}>
            <span className="pick-media">
              <picture style={{ display: "contents" }}>
                <source srcSet="/hero/cake-1-480.webp" type="image/webp" />
                <img
                  src="/hero/cake-1.jpg"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={480}
                  height={300}
                />
              </picture>
              <span className="pick-chip">Custom · Cookies · Crunchies</span>
            </span>
            <span className="pick-body">
              <span className="pick-title">Cake &amp; Extras</span>
              <span className="pick-sub">
                Custom cakes made to order in any of 14 flavours, plus crunchies &amp; cookie tins
              </span>
              <span className="pick-cta">
                Explore cakes <span className="pick-arrow" aria-hidden="true">→</span>
              </span>
            </span>
          </button>
          <button className="pick-card pick-tubs" onClick={() => onPick("tubs")}>
            <span className="pick-media">
              <picture style={{ display: "contents" }}>
                <source srcSet="/tubs/dubai-kunafa.webp" type="image/webp" />
                <img
                  src="/tubs/dubai-kunafa.jpeg"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={480}
                  height={300}
                />
              </picture>
              <span className="pick-chip">250 ml · 500 ml</span>
            </span>
            <span className="pick-body">
              <span className="pick-title">Dessert Tubs</span>
              <span className="pick-sub">
                Signature layered tubs — Dubai Kunafa, Biscoff, Oreo Crunch &amp; Matilda
              </span>
              <span className="pick-cta">
                Explore tubs <span className="pick-arrow" aria-hidden="true">→</span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

const CAKE_PHOTOS = [
  "cake-1.jpg",
  "cake-2.jpg",
  "cake-3.jpg",
  "cake-4.jpg",
  "cake-5.jpg",
  "cake-6.jpg",
  "cake-7.jpg",
];

function CakeCarousel() {
  const [i, setI] = useState(0);
  const n = CAKE_PHOTOS.length;
  const touchX = useRef(null);
  const offset = (idx) => {
    let d = (idx - i) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };
  // Prefetch neighbours so swipes feel instant; tiny -480.webp (~12-21KB).
  useEffect(() => {
    [1, -1].forEach((step) => {
      const f = CAKE_PHOTOS[(i + step + n) % n];
      const base = f.replace(/\.(jpe?g|png)$/i, "");
      ["-480.webp", ".webp"].forEach((sfx) => {
        const im = new Image();
        im.decoding = "async";
        im.src = `/hero/${base}${sfx}`;
      });
    });
  }, [i, n]);
  return (
    <div className="reveal">
      <div
        className="carousel"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) setI((v) => (v + (dx < 0 ? 1 : -1) + n) % n);
          touchX.current = null;
        }}
      >
        {CAKE_PHOTOS.map((f, idx) => {
          const d = offset(idx);
          const hidden = Math.abs(d) > 1;
          const base = f.replace(/\.(jpe?g|png)$/i, "");
          return (
            <button
              key={f}
              className={`cake-card ${d === 0 ? "center" : "side"}`}
              style={{
                transform: `translateX(calc(-50% + ${d * 190}px)) scale(${d === 0 ? 1.04 : 0.82})`,
                opacity: hidden ? 0 : d === 0 ? 1 : 0.6,
                zIndex: 10 - Math.abs(d),
                pointerEvents: hidden ? "none" : "auto",
                visibility: hidden ? "hidden" : "visible",
              }}
              onClick={() => setI(idx)}
              aria-label={`Show custom cake ${idx + 1}`}
              tabIndex={hidden ? -1 : 0}
            >
              <picture style={{ display: "contents" }}>
                <source srcSet={`/hero/${base}-480.webp`} type="image/webp" />
                <img
                  src={`/hero/${f}`}
                  alt={`Custom cake ${idx + 1}`}
                  loading={idx <= 2 ? "eager" : "lazy"}
                  decoding="async"
                  width={220}
                  height={300}
                />
              </picture>
            </button>
          );
        })}
        <button
          className="carousel-arrow left"
          onClick={() => setI((i - 1 + n) % n)}
          aria-label="Previous cake"
        >
          ‹
        </button>
        <button
          className="carousel-arrow right"
          onClick={() => setI((i + 1) % n)}
          aria-label="Next cake"
        >
          ›
        </button>
      </div>
      <div className="dots">
        {CAKE_PHOTOS.map((f, idx) => (
          <button
            key={f}
            className={idx === i ? "dot on" : "dot"}
            onClick={() => setI(idx)}
            aria-label={`Cake ${idx + 1}`}
          />
        ))}
      </div>
      <div className="carousel-cta">
        <a
          className="btn pill"
          href={waLink("Hi Layerss! I'd like to order a custom cake.")}
          target="_blank"
          rel="noreferrer"
        >
          Order your custom cake
        </a>
      </div>
    </div>
  );
}

function CatalogueState({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="grid product-grid" aria-busy="true" aria-label="Loading menu">
        {[0, 1, 2].map((k) => (
          <div className="card skeleton" key={k}>
            <div className="photo skeleton-block" />
            <div className="card-body">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="notice" role="status">
        <p>The menu is taking a moment to load. Please try again.</p>
        <button className="btn pill small outline" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  return null;
}

function CakesView({ catalogue, onHome }) {
  const { data: menu, loading, error, retry } = catalogue;
  const extras = (menu?.categories || []).find((c) => c.id === "extras");
  return (
    <section className="section" id="cakes">
      <div className="container">
        <PageBack onHome={onHome} label="Back to home" />
        <div className="head reveal">
          <p className="eyebrow">Baked to order · 24 hr prior</p>
          <h2>Cake &amp; Extras</h2>
          <p className="lead center">We take custom cake orders only — DM us your design in any of the 14 flavours from the Dessert Tubs section. Cookies bake fresh in limited rotating varieties.</p>
        </div>
        <div className="cat reveal gallery-card" id="cake-gallery">
          <div className="cat-head">
            <h3>Custom cake gallery</h3>
            <p>Tap a cake to bring it front and center</p>
          </div>
          <CakeCarousel />
        </div>
        {(loading || error) && <CatalogueState loading={loading} error={error} onRetry={retry} />}
        {!loading && !error && extras && (
          <div className="cat reveal" id="cake-extras">
            <div className="cat-head">
              <h3>{extras.name}</h3>
              <p>{extras.tagline}</p>
            </div>
            <TubCards items={extras.items} catId={extras.id} />
          </div>
        )}
        <BackHome onHome={onHome} />
      </div>
    </section>
  );
}

function TubsView({ catalogue, onHome }) {
  const { data: menu, loading, error, retry } = catalogue;
  const tubs = (menu?.categories || []).find((c) => c.id === "signature-tubs");
  const flavours = (menu?.categories || []).find((c) => c.id === "flavours");
  return (
    <section className="section" id="tubs">
      <div className="container">
        <PageBack onHome={onHome} label="Back to home" />
        <div className="head reveal">
          <p className="eyebrow">250 ml (1 serving) · 500 ml (sharing)</p>
          <h2>Dessert Tubs</h2>
          <p className="lead center">Signature tubs, made fresh to order with love.</p>
        </div>
        {(loading || error) && <CatalogueState loading={loading} error={error} onRetry={retry} />}
        {!loading && !error && tubs && (
          <div className="reveal" id="tub-list">
            <TubCards items={tubs.items} catId={tubs.id} />
          </div>
        )}
        {!loading && !error && flavours && (
          <div className="cat reveal" id="tubs-flavours">
            <div className="cat-head">
              <h3>{flavours.name}</h3>
              <p>{flavours.tagline}</p>
            </div>
            <FlavoursGrid cat={flavours} />
          </div>
        )}
        <BackHome onHome={onHome} />
      </div>
    </section>
  );
}

const BLOG_POSTS = [
  {
    tag: "Behind the scenes",
    date: "Fresh from the bake house",
    title: "Why we only bake after you order",
    text: "Every tub and cake starts when your message arrives — creams whipped, layers stacked, toppings finished the same day it leaves for you. It means a 24-hour wait, but no tub ever sits in a freezer waiting for a customer.",
    quote: "No two layers are alike.",
    img: "/about/about-us.jpg",
  },
  {
    tag: "Ingredient notes",
    date: "Flavour diary",
    title: "Rasamalai to Biscoff: how a flavour earns its tub",
    text: "A flavour makes the menu only after three full test batches — once for taste, once for texture after chilling, and once for neighbours. Rasamalai survived because the saffron milk soaks overnight without making the layers soggy.",
    quote: "Three batches before it meets you.",
    img: "/tubs/lotus-biscoff.jpeg",
  },
  {
    tag: "Dessert tips",
    date: "Good to know",
    title: "250 ml or 500 ml? A simple guide",
    text: "The 250 ml tub is one generous serving — built for a single craving. The 500 ml is a sharing tub for two or three, and it carries the crunch layers better. Either way, chill it 15 minutes before serving and eat with the spoon we pack.",
    quote: "Chill 15 minutes, then dig straight down.",
    img: "/hero/cake-5.jpg",
  },
];

function Blog() {
  return (
    <section className="section" id="blog">
      <div className="container">
        <div className="head reveal">
          <p className="eyebrow">From the oven notebook</p>
          <h2>Blog</h2>
          <p className="lead center">Short notes on baking, ingredients and Layerss updates.</p>
        </div>
        <div className="grid blog-grid">
          {BLOG_POSTS.map((p, idx) => (
            <article className="card blog-card reveal" key={idx}>
              <Placeholder name={`blog-${idx}`} label={p.tag} image={p.img} />
              <div className="card-body">
                <span className="tag">{p.tag} · {p.date}</span>
                <h4>{p.title}</h4>
                <p>{p.text}</p>
                <blockquote>“{p.quote}”</blockquote>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const NEWS = [
  { t: "Pure quality, always", d: "Every Layerss bake starts with pure, hand-picked quality ingredients — no shortcuts, ever.", tag: "Quality", img: "/news/news-1.jpg" },
  { t: "New flavours just dropped", d: "Fresh additions to our flavour family — 14 and counting, from Rasamalai to Biscoff.", tag: "New", img: "/news/news-2.jpeg" },
  { t: "The premium Layerss mark", d: "A brand built on love, layers and respect — premium bakes for your finest moments.", tag: "Premium", img: "/news/news-3.jpg" },
];

function News() {
  return (
    <section className="section alt" id="news">
      <div className="container">
        <div className="head reveal">
          <p className="eyebrow">From the bake house</p>
          <h2>News &amp; updates</h2>
        </div>
        <div className="grid news-grid">
          {NEWS.map((n, idx) => (
            <article className="card news reveal" key={idx}>
              <Placeholder name={`news-${idx}`} label={n.tag} image={n.img} />
              <div className="card-body">
                <span className="tag">{n.tag}</span>
                <h4>{n.t}</h4>
                <p>{n.d}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="section" id="about">
      <div className="container about-grid">
        <div className="reveal about-art">
          <Placeholder name="about-us" label="Made with love, in every layer" big image="/about/about-us.jpg" />
        </div>
        <div className="reveal">
          <p className="eyebrow">About us</p>
          <h2>Layerss — The Bake House</h2>
          <p className="lead">
            A home bake house in Sambhajinagar crafting signature dessert tubs
            and custom cakes. Every order is made fresh to order — no two
            layers are alike.
          </p>
          <ul className="ticks">
            <li>Signature dessert tubs — 250 ml &amp; 500 ml</li>
            <li>14 flavours for custom cakes &amp; tubs</li>
            <li>Made fresh to order, with love</li>
          </ul>
          <div className="about-cta">
            <a className="btn pill btn-brand" href={INSTAGRAM} target="_blank" rel="noreferrer">
              <InstagramIcon size={18} />
              <span>Follow on Instagram</span>
            </a>
            <a
              className="btn pill outline btn-brand"
              href={waLink("Hi Layerss! I'd like to place an order.")}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon size={18} />
              <span>DM to Order</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingSocial() {
  return (
    <div className="social-float" role="complementary" aria-label="Order and follow">
      <a
        className="social-btn"
        href={INSTAGRAM}
        target="_blank"
        rel="noreferrer"
        aria-label="Follow Layerss on Instagram"
        title="Instagram"
      >
        <InstagramIcon size={20} />
      </a>
      <a
        className="social-btn wa"
        href={waLink("Hi Layerss! I'd like to place an order.")}
        target="_blank"
        rel="noreferrer"
        aria-label="Order on WhatsApp"
        title="WhatsApp"
      >
        <WhatsAppIcon size={20} />
      </a>
    </div>
  );
}

function VisitUs() {
  return (
    <section className="section alt" id="visit">
      <div className="container">
        <div className="head reveal">
          <p className="eyebrow">Visit Us</p>
          <h2>Based in Chhatrapati Sambhajinagar</h2>
          <p className="lead center">
            A home bake house — freshly prepared to order, delivered across the city.
          </p>
        </div>
        <div className="visit-grid">
          <div className="reveal visit-map">
            <iframe
              title="Layerss location map — Chhatrapati Sambhajinagar"
              src={MAP_EMBED_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="reveal visit-info">
            <p className="visit-quote">
              “No storefront queues — just layers made for your moment, delivered fresh.”
            </p>
            <ul className="visit-list">
              <li>Based in Chhatrapati Sambhajinagar, Maharashtra</li>
              <li>Delivery available across Chhatrapati Sambhajinagar</li>
              <li>Freshly prepared to order — please order 24 hr prior</li>
              <li>Custom cakes, dessert tubs, cookies &amp; crunchies</li>
            </ul>
            <div className="visit-cta">
              <a
                className="btn pill btn-brand"
                href={waLink("Hi Layerss! I'd like to place an order.")}
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppIcon size={18} />
                <span>Order on WhatsApp</span>
              </a>
              <a className="btn pill outline btn-brand" href={INSTAGRAM} target="_blank" rel="noreferrer">
                <InstagramIcon size={18} />
                <span>See latest on Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ onHome }) {
  return (
    <footer className="footer" id="contact">
      <div className="container foot-grid">
        <div>
          <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); onHome(); }}>
            <img className="logo-mark" src="/logo-32.png" alt="Layerss logo" width={34} height={34} />
            <span className="logo-text">layerss<span>_thebakehouse</span></span>
          </a>
          <p className="muted">Made fresh to order, with love.</p>
          <div className="foot-cta">
            <a
              className="btn pill light btn-brand"
              href={waLink("Hi Layerss! I'd like to place an order.")}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon size={17} />
              <span>WhatsApp +91 73787 77740</span>
            </a>
            <a
              className="btn pill outline-light btn-brand"
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
            >
              <InstagramIcon size={17} />
              <span>Instagram</span>
            </a>
          </div>
        </div>
        <div>
          <h5>Hours</h5>
          <p className="muted">Open all days</p>
          <p className="muted">Order 24 hr prior</p>
        </div>
        <div>
          <h5>Visit Us</h5>
          <p className="muted">Based in Chhatrapati<br />Sambhajinagar, Maharashtra</p>
          <p className="muted">Delivery across the city ·<br />freshly prepared to order</p>
          <a className="muted link link-brand" href={INSTAGRAM} target="_blank" rel="noreferrer">
            <InstagramIcon size={15} />
            <span>Instagram</span>
          </a>
        </div>
        <div className="map">
          <iframe
            title="Layerss location map — Chhatrapati Sambhajinagar"
            src={MAP_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
      <p className="copy container">© {new Date().getFullYear()} Layerss — The Bake House</p>
    </footer>
  );
}

export default function App() {
  useReveal();
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("layerss-theme");
      if (saved === "dark" || saved === "light") return saved;
      if (typeof window.matchMedia !== "function") return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("layerss-theme", theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);
  const [view, setView] = useState("home");
  const catalogue = useCatalogue();
  // Hidden admin entry: 6 rapid theme-toggle clicks open the Admin Login.
  // Easter egg only — real security is server-side (session cookie + CSRF).
  const [adminOpen, setAdminOpen] = useState(false);
  const toggleTimes = useRef([]);
  const adminSession = useAdminSession();
  const handleToggle = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    const now = Date.now();
    const times = [...toggleTimes.current, now].slice(-6);
    toggleTimes.current = times;
    if (times.length === 6 && now - times[0] < 3000) {
      toggleTimes.current = [];
      setAdminOpen(true);
    }
  };
  const show = (v) => {
    setView(v);
    setTimeout(() => window.scrollTo(0, 0), 30);
  };
  const section = (id) => {
    const el = document.getElementById(id);
    if (el) {
      try {
        el.scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        el.scrollIntoView();
      }
      return;
    }
    if (view !== "home") {
      setView("home");
      setTimeout(
        () => scrollToEl(id),
        100
      );
    }
  };
  const dots =
    view === "cakes"
      ? [["cake-gallery", "Gallery"], ["cake-extras", "Extras"]]
      : view === "tubs"
        ? [["tub-list", "Tubs"], ["tubs-flavours", "Flavours"]]
        : [["top", "Home"], ["news", "News"], ["about", "About"], ["blog", "Blog"], ["visit", "Visit Us"], ["contact", "Contact"]];
  return (
    <>
      <Nav
        theme={theme}
        onToggle={handleToggle}
        view={view}
        onHome={() => show("home")}
        onView={show}
        onSection={section}
      />
      <ScrollSpy dots={dots} onDot={section} />
      {view === "home" && (
        <>
          <Hero />
          <HomePicker onPick={show} />
          <News />
          <About />
          <Blog />
          <VisitUs />
        </>
      )}
      {view === "cakes" && <CakesView catalogue={catalogue} onHome={() => show("home")} />}
      {view === "tubs" && <TubsView catalogue={catalogue} onHome={() => show("home")} />}
      <Footer onHome={() => show("home")} />
      <FloatingSocial />
      {adminOpen && (
        <div
          className="admin-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Layerss Admin"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAdminOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAdminOpen(false);
          }}
        >
          <div className="admin-modal">
            <button className="admin-close" onClick={() => setAdminOpen(false)} aria-label="Close admin">
              ✕
            </button>
            {adminSession.checking ? (
              <p className="muted">Checking session…</p>
            ) : adminSession.csrf ? (
              <AdminPanel
                csrf={adminSession.csrf}
                onLogout={() => {
                  adminSession.setCsrf(null);
                  catalogue.retry();
                }}
              />
            ) : (
              <AdminLogin onSuccess={(csrf) => { adminSession.setCsrf(csrf); catalogue.retry(); }} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
