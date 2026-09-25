/* ================================================
   AGISEO 2026 — Interactions
   ================================================ */

(() => {
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Custom cursor ---------- */
  const cursor = $(".cursor");
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  let mx = 0, my = 0, dx = 0, dy = 0, rx = 0, ry = 0;

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
  });

  function tickCursor() {
    dx = lerp(dx, mx, 0.6);
    dy = lerp(dy, my, 0.6);
    rx = lerp(rx, mx, 0.16);
    ry = lerp(ry, my, 0.16);
    if (dot) { dot.style.left = dx + "px"; dot.style.top = dy + "px"; }
    if (ring) { ring.style.left = rx + "px"; ring.style.top = ry + "px"; }
    requestAnimationFrame(tickCursor);
  }
  if (window.matchMedia("(pointer: fine)").matches) tickCursor();

  $$("[data-hover]").forEach(el => {
    el.addEventListener("mouseenter", () => cursor?.classList.add("hover"));
    el.addEventListener("mouseleave", () => cursor?.classList.remove("hover"));
  });

  /* ---------- Magnetic buttons ---------- */
  $$("[data-magnetic]").forEach(el => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.3}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });

  /* ---------- Nav scroll state + progress bar ---------- */
  const nav = $("#nav");
  const bar = $(".progress-bar");

  function onScroll() {
    const y = window.scrollY;
    nav?.classList.toggle("scrolled", y > 20);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = ((y / h) * 100) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = $("#navToggle");
  const mobile = $("#mobileMenu");
  toggle?.addEventListener("click", () => {
    toggle.classList.toggle("open");
    mobile?.classList.toggle("open");
  });
  $$("#mobileMenu a").forEach(a => a.addEventListener("click", () => {
    toggle?.classList.remove("open");
    mobile?.classList.remove("open");
  }));

  /* ---------- Reveal on scroll (words + fade + up) ---------- */
  const words = $$(".reveal-word");
  const fades = $$(".reveal-fade");
  const ups = $$(".reveal-up");

  const wordObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const parent = entry.target;
        const items = $$(".reveal-word", parent);
        items.forEach((w, i) => {
          setTimeout(() => w.classList.add("in"), i * 80);
        });
        wordObs.unobserve(parent);
      }
    });
  }, { threshold: 0.2 });
  const manifesteText = $(".manifeste-text");
  if (manifesteText) wordObs.observe(manifesteText);

  const genericObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        genericObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  [...fades, ...ups].forEach(el => genericObs.observe(el));

  /* ---------- Card spotlight hover ---------- */
  $$(".card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Counter animation ---------- */
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const counters = $$(".stat-num");
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      const dur = 1800;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const val = Math.round(target * easeOut(p));
        el.textContent = val.toLocaleString("fr-FR") + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObs.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => countObs.observe(c));

  /* ---------- Parallax orbs ---------- */
  const orbs = $$(".orb");
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    orbs.forEach((o, i) => {
      o.style.transform = `translate(0, ${y * (0.05 + i * 0.03)}px)`;
    });
  }, { passive: true });

  /* ---------- Contact form (Netlify Forms, AJAX) ---------- */
  const cform = $("#contactForm");
  if (cform) {
    const statusEl = $("#cformStatus");
    cform.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = $("button[type=submit]", cform);
      const body = new URLSearchParams(new FormData(cform)).toString();
      statusEl.textContent = "Envoi…";
      statusEl.className = "cform-status";
      if (btn) btn.disabled = true;
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      })
        .then((r) => {
          if (!r.ok) throw new Error(r.status);
          cform.classList.add("sent");
          statusEl.textContent = "Merci — votre message est bien parti. Nous revenons vers vous sous 48 h.";
          statusEl.className = "cform-status ok";
          cform.reset();
        })
        .catch(() => {
          if (btn) btn.disabled = false;
          statusEl.textContent = "Un souci est survenu. Écrivez-nous directement à preparons@agiseo.com.";
          statusEl.className = "cform-status err";
        });
    });
  }

  /* ---------- Smooth anchor with offset ---------- */
  $$("a[href^=\"#\"]").forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

})();
