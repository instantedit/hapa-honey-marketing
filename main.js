/* ============================================================
   Hapa Honey — Motion layer (Lenis smooth scroll + GSAP)
   ============================================================ */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 900px)").matches;

  /* Auto-update copyright year */
  document.querySelectorAll(".js-year").forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  /* ---------------- Custom cursor ---------------- */
  (function cursor() {
    if (isMobile) return;
    const dot = document.querySelector(".cursor");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; });
    function tick() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    tick();
    const hov = "a, button, .work-card, .svc-card, .tst-card";
    document.querySelectorAll(hov).forEach((el) => {
      el.addEventListener("mouseenter", () => {
        document.body.classList.add("cursor-hover");
        if (el.dataset.cursor) document.body.classList.add("cursor-view");
      });
      el.addEventListener("mouseleave", () => {
        document.body.classList.remove("cursor-hover", "cursor-view");
      });
    });
  })();

  /* ---------------- Loader (purely cosmetic, never gates the page) ---------------- */
  function runLoader() {
    const el = document.querySelector(".loader");
    const count = document.querySelector(".loader__count");
    const bar = document.querySelector(".loader__bar i");
    if (!el) return;
    let done = false;
    function dismiss() {
      if (done) return; done = true;
      el.classList.add("loader--done");
      setTimeout(() => { el.style.display = "none"; }, 900);
    }
    if (reduce) { el.style.display = "none"; return; }
    let n = 0;
    const iv = setInterval(() => {
      n = Math.min(100, n + Math.floor(9 + Math.random() * 17));
      if (count) count.textContent = String(n).padStart(3, "0");
      if (bar) bar.style.width = n + "%";
      if (n >= 100) { clearInterval(iv); setTimeout(dismiss, 250); }
    }, 110);
    // Hard safety: never let the loader trap the page
    setTimeout(() => { clearInterval(iv); dismiss(); }, 2400);
  }

  /* ---------------- Nav scroll state + mobile menu ---------------- */
  (function nav() {
    const nav = document.querySelector(".nav");
    const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll); onScroll();

    const burger = document.querySelector(".nav__burger");
    const menu = document.querySelector(".menu");
    if (burger && menu) {
      burger.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        burger.classList.toggle("is-open", open);
        document.body.style.overflow = open ? "hidden" : "";
      });
      menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
        menu.classList.remove("open"); burger.classList.remove("is-open"); document.body.style.overflow = "";
      }));
    }
  })();

  /* ---------------- Lenis ---------------- */
  let lenis = null;
  function initLenis() {
    if (reduce || typeof Lenis === "undefined") return;
    lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.gsap && gsap.ticker) {
      lenis.on("scroll", () => window.ScrollTrigger && ScrollTrigger.update());
    }
    // anchor links
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length > 1 && document.querySelector(id)) {
          e.preventDefault(); lenis.scrollTo(id, { offset: -60 });
        }
      });
    });
  }

  /* ---------------- GSAP scenes ---------------- */
  function initGSAP() {
    if (typeof gsap === "undefined") return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    /* Hero entrance */
    const heroLines = gsap.utils.toArray(".hero__title .line > span");
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero__eyebrow", { y: 20, opacity: 0, duration: 0.7 })
      .from(heroLines, { yPercent: 115, duration: 1.05, stagger: 0.12 }, "-=0.35")
      .from(".hero__lede", { y: 24, opacity: 0, duration: 0.8 }, "-=0.6")
      .from(".hero__scroll", { y: 16, opacity: 0, duration: 0.7 }, "-=0.6");

    if (!window.ScrollTrigger) return;

    /* Generic reveals — handled by IntersectionObserver (see initReveals) */

    /* Marquee drift on scroll + base loop */
    document.querySelectorAll(".marquee__track").forEach((track, idx) => {
      const dir = idx % 2 === 0 ? -1 : 1;
      gsap.to(track, { xPercent: dir * 50, repeat: -1, duration: 22, ease: "none" });
      gsap.to(track, {
        xPercent: `+=${dir * 12}`, ease: "none",
        scrollTrigger: { trigger: track, start: "top bottom", end: "bottom top", scrub: 1 },
      });
    });

    /* Mission word-by-word reveal */
    const words = gsap.utils.toArray(".mission__text .w");
    if (words.length) {
      ScrollTrigger.create({
        trigger: ".mission__text", start: "top 75%", end: "bottom 55%", scrub: true,
        onUpdate: (self) => {
          const idx = Math.floor(self.progress * words.length);
          words.forEach((w, i) => w.classList.toggle("is-on", i < idx));
        },
      });
    }

    /* Serve image parallax */
    gsap.utils.toArray(".serve__media img").forEach((img) => {
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: "none",
        scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    /* Work horizontal scroll */
    const track = document.querySelector(".work__track");
    const pin = document.querySelector(".work__pin");
    if (track && pin && !isMobile) {
      const getScroll = () => track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gutter")) * 2;
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth + 64),
        ease: "none",
        scrollTrigger: {
          trigger: ".work", pin: pin, scrub: 1, start: "top top",
          end: () => "+=" + (track.scrollWidth - window.innerWidth + 64),
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = document.querySelector(".work__progress i");
            if (p) p.style.width = (self.progress * 100) + "%";
          },
        },
      });
      // parallax on each card image inside the horizontal scroll
      gsap.utils.toArray(".work-card__media img").forEach((img) => {
        gsap.fromTo(img, { x: "-6%" }, {
          x: "6%", ease: "none",
          scrollTrigger: { trigger: img.closest(".work-card"), containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        });
      });
    }

    /* Stats counters */
    gsap.utils.toArray(".stat__num").forEach((el) => {
      const target = parseFloat(el.dataset.to || "0");
      const dec = (el.dataset.dec | 0);
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 85%", once: true,
        onEnter: () => gsap.to(obj, {
          v: target, duration: 1.8, ease: "power2.out",
          onUpdate: () => { el.querySelector(".val").textContent = obj.v.toFixed(dec); },
        }),
      });
    });

    /* Service cards subtle scale-in */
    gsap.utils.toArray(".svc-card").forEach((card) => {
      gsap.from(card, {
        scale: 0.96, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 88%" },
      });
    });

    /* CTA bg parallax */
    const ctaImg = document.querySelector(".cta__bg img, .cta__bg video");
    if (ctaImg) gsap.fromTo(ctaImg, { yPercent: -10 }, {
      yPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
    });

    ScrollTrigger.refresh();
  }

  /* ---------------- Reveals (IntersectionObserver — bulletproof) ---------------- */
  function showReveal(el) {
    el.classList.add("is-visible");
    el.style.opacity = "1";
    el.style.transform = "none";
  }
  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(showReveal);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { showReveal(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => io.observe(el));
    // Safety: anything still hidden after 3s gets shown
    setTimeout(() => els.forEach(showReveal), 3000);
  }

  /* ---------------- Magnetic buttons ---------------- */
  function initMagnetic() {
    if (reduce || isMobile) return;
    document.querySelectorAll(".nav__cta, .cta__btn").forEach((btn) => {
      const strength = 14;
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.transform = `translate(${x * strength}px, ${y * strength * 0.6}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------------- Boot ---------------- */
  let booted = false;
  function boot() {
    if (booted) return; booted = true;
    // Functionality is independent of the cosmetic loader.
    initReveals();
    initLenis();
    initGSAP();
    initMagnetic();
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 350);
  }
  // Kick the cosmetic loader as soon as the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runLoader);
  } else { runLoader(); }
  // Boot functionality on load, with a fast fallback for slow CDNs.
  window.addEventListener("load", boot);
  setTimeout(boot, 900);
})();
