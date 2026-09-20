import { useEffect, useMemo, useState } from "react";
import { useApi, useReveal } from "./hooks.js";
import Placeholder from "./Placeholder.jsx";
import { ICONS } from "./icons.jsx";

const WA_NUMBER = "917378777740";
const INSTAGRAM = "https://www.instagram.com/layerss_thebakehouse/";

const waLink = (text) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

function FlavourIcon({ item }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="flavour-icon">{ICONS[item.placeholder] || item.icon}</span>;
  }
  return (
    <span className="flavour-icon">
      <img
        src={`/icons/${item.placeholder}.png`}
        alt={item.name}
        loading="lazy"
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
          layerss<span>_thebakehouse</span>
        </a>
        <nav className={`links ${open ? "open" : ""}`}>
          <a href="#top" onClick={go(onHome)}>Home</a>
          <a href="#news" onClick={go(() => onSection("news"))}>News</a>
          <a href="#about" onClick={go(() => onSection("about"))}>About</a>
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
          <button className="burger" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const slides = useMemo(
    () => [
      { key: "slide-1", label: "Signature Dessert Tubs", image: "/hero/slide-1.png" },
      { key: "slide-2", label: "14 Cake Flavours", image: "/hero/slide-2.png" },
      { key: "slide-3", label: "Made Fresh to Order", image: "/hero/slide-3.jpg" },
    ],
    []
  );
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

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
        <div className="hero-art">
          {slides.map((s, idx) => (
            <div key={s.key} className={`slide ${idx === i ? "on" : ""}`}>
              <Placeholder name={s.key} label={s.label} big image={s.image} />
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
    return `Hi Layerss! I'd like a custom cake in ${itemName} flavour.`;
  }
  if (catId === "signature-tubs") {
    return `Hi Layerss! I'd like to order the ${itemName} tub.`;
  }
  return `Hi Layerss! I'd like to order: ${itemName}.`;
}

function TubCards({ items, catId }) {
  return (
    <div className="grid">
      {items.map((it) => (
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
  return (
    <div className="flavours">
      {cat.items.map((it) => (
        <a
          key={it.id}
          className="flavour-row"
          href={waLink(orderText(cat.id, it.name))}
          target="_blank"
          rel="noreferrer"
          title={`Order ${it.name} on WhatsApp`}
        >
          <FlavourIcon item={it} />
          <span className="flavour-name">{it.name}</span>
        </a>
      ))}
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
        </div>
        <div className="pick-grid reveal">
          <button className="pick-card" onClick={() => onPick("cakes")}>
            <span className="pick-title">Cake &amp; Extras</span>
            <span className="pick-sub">Custom cakes made to order · crunchies · cookies</span>
            <span className="pick-arrow">→</span>
          </button>
          <button className="pick-card" onClick={() => onPick("tubs")}>
            <span className="pick-title">Dessert Tubs</span>
            <span className="pick-sub">Signature tubs · 250 ml &amp; 500 ml</span>
            <span className="pick-arrow">→</span>
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
  const offset = (idx) => {
    let d = (idx - i) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };
  return (
    <div className="reveal">
      <div className="carousel">
        {CAKE_PHOTOS.map((f, idx) => {
          const d = offset(idx);
          const hidden = Math.abs(d) > 1;
          return (
            <button
              key={f}
              className={`cake-card ${d === 0 ? "center" : "side"}`}
              style={{
                transform: `translateX(calc(-50% + ${d * 190}px)) scale(${d === 0 ? 1.04 : 0.82})`,
                opacity: hidden ? 0 : d === 0 ? 1 : 0.6,
                zIndex: 10 - Math.abs(d),
                pointerEvents: hidden ? "none" : "auto",
              }}
              onClick={() => setI(idx)}
              aria-label={`Show custom cake ${idx + 1}`}
              tabIndex={hidden ? -1 : 0}
            >
              <img src={`/hero/${f}`} alt={`Custom cake ${idx + 1}`} loading="lazy" />
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

function CakesView({ menu, onHome }) {
  const extras = (menu?.categories || []).find((c) => c.id === "extras");
  return (
    <section className="section" id="cakes">
      <div className="container">
        <div className="head reveal">
          <p className="eyebrow">Baked to order · 24 hr prior</p>
          <h2>Cake &amp; Extras</h2>
          <p className="lead center">We take custom cake orders only — DM us your design in any of the 14 flavours from the Dessert Tubs section. Cookies bake fresh in limited rotating varieties.</p>
        </div>
        <div className="cat reveal" id="cake-gallery">
          <div className="cat-head">
            <h3>Custom cake gallery</h3>
            <p>Tap a cake to bring it front and center</p>
          </div>
        </div>
        <CakeCarousel />
        {extras && (
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

function TubsView({ menu, onHome }) {
  const tubs = (menu?.categories || []).find((c) => c.id === "signature-tubs");
  const flavours = (menu?.categories || []).find((c) => c.id === "flavours");
  return (
    <section className="section" id="tubs">
      <div className="container">
        <div className="head reveal">
          <p className="eyebrow">250 ml (1 serving) · 500 ml (sharing)</p>
          <h2>Dessert Tubs</h2>
          <p className="lead center">Signature tubs, made fresh to order with love.</p>
        </div>
        {tubs && (
          <div className="reveal" id="tub-list">
            <TubCards items={tubs.items} catId={tubs.id} />
          </div>
        )}
        {flavours && (
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

const NEWS = [
  { t: "Pure quality, always", d: "Every Layerss bake starts with pure, hand-picked quality ingredients — no shortcuts, ever.", tag: "Quality", img: "/news/news-1.png" },
  { t: "New flavours just dropped", d: "Fresh additions to our flavour family — 14 and counting, from Rasamalai to Biscoff.", tag: "New", img: "/news/news-2.jpeg" },
  { t: "The premium Layerss mark", d: "A brand built on love, layers and respect — premium bakes for your finest moments.", tag: "Premium", img: "/news/news-3.png" },
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
          <a className="btn pill" href={INSTAGRAM} target="_blank" rel="noreferrer">
            Follow on Instagram
          </a>
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
            layerss<span>_thebakehouse</span>
          </a>
          <p className="muted">Made fresh to order, with love.</p>
          <a
            className="btn pill light"
            href={waLink("Hi Layerss! I'd like to place an order.")}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp +91 73787 77740
          </a>
        </div>
        <div>
          <h5>Hours</h5>
          <p className="muted">Open all days</p>
          <p className="muted">Order 24 hr prior</p>
        </div>
        <div>
          <h5>Find us</h5>
          <p className="muted">Sambhajinagar,<br />Maharashtra, India</p>
          <a className="muted link" href={INSTAGRAM} target="_blank" rel="noreferrer">
            Instagram
          </a>
        </div>
        <div className="map">
          <iframe
            title="map"
            src="https://maps.google.com/maps?q=Sambhajinagar%2C%20Maharashtra&output=embed"
            loading="lazy"
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
  const menu = useApi("/api/menu");
  const show = (v) => {
    setView(v);
    setTimeout(() => window.scrollTo(0, 0), 30);
  };
  const section = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (view !== "home") {
      setView("home");
      setTimeout(
        () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    }
  };
  const dots =
    view === "cakes"
      ? [["cake-gallery", "Gallery"], ["cake-extras", "Extras"]]
      : view === "tubs"
        ? [["tub-list", "Tubs"], ["tubs-flavours", "Flavours"]]
        : [["top", "Home"], ["news", "News"], ["about", "About"], ["contact", "Contact"]];
  return (
    <>
      <Nav
        theme={theme}
        onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
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
        </>
      )}
      {view === "cakes" && <CakesView menu={menu} onHome={() => show("home")} />}
      {view === "tubs" && <TubsView menu={menu} onHome={() => show("home")} />}
      <Footer onHome={() => show("home")} />
    </>
  );
}
