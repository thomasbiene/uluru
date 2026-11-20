/* ============================================================
   ULURU — motion layer
   Loader, word reveals, sticky media, horizontal deep-time,
   scroll progress, counters, cursor.
   ============================================================ */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------- Loader ---------- */

const loader = document.getElementById("loader");
document.body.classList.add("is-loading");

const dismissLoader = () => {
  const wait = reduced.matches ? 0 : 1150;
  setTimeout(() => {
    loader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    setTimeout(() => loader.remove(), 1200);
  }, wait);
};

if (document.readyState === "complete") dismissLoader();
else window.addEventListener("load", dismissLoader);

// Safety net: never trap the page behind the intro curtain.
setTimeout(() => {
  if (!loader.classList.contains("is-done")) dismissLoader();
}, 4000);

/* ---------- Split the statement into words ---------- */

document.querySelectorAll("[data-split]").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach((word, i) => {
    const outer = document.createElement("span");
    outer.className = "word";
    const inner = document.createElement("span");
    inner.textContent = word;
    inner.style.transitionDelay = `${Math.min(i * 28, 700)}ms`;
    outer.appendChild(inner);
    el.appendChild(outer);
    el.appendChild(document.createTextNode(" "));
  });
});

/* ---------- Reveal on scroll ---------- */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);

document.querySelectorAll("[data-reveal], .statement").forEach((el) => revealObserver.observe(el));

/* Counters */

const counters = document.querySelectorAll("[data-count]");
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const duration = 1500;
      const start = performance.now();

      const tick = (now) => {
        const p = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimals);
      };

      if (reduced.matches) el.textContent = target.toFixed(decimals);
      else requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.6 }
);
counters.forEach((el) => countObserver.observe(el));

/* ---------- Anatomy: sticky frames follow the steps ---------- */

const frames = [...document.querySelectorAll(".frame")];
const steps = [...document.querySelectorAll(".step")];
const stageIndex = document.getElementById("stageIndex");

const stepObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = Number(entry.target.dataset.step);
      steps.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.step) === index));
      frames.forEach((f) => f.classList.toggle("is-active", Number(f.dataset.frame) === index));
      if (stageIndex) stageIndex.textContent = String(index + 1).padStart(2, "0");
    });
  },
  { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
);
steps.forEach((s) => stepObserver.observe(s));

/* ---------- Deep time: horizontal scroll ---------- */

const timeline = document.getElementById("deep-time");
const track = document.getElementById("timelineTrack");
const timelineBar = document.getElementById("timelineBar");
const progressBar = document.getElementById("progressBar");
const heroImg = document.getElementById("heroImg");

let ticking = false;

const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${clamp(y / docHeight, 0, 1)})`;

    // hero parallax
    if (heroImg && !reduced.matches && y < window.innerHeight * 1.2) {
      heroImg.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
    }

    // horizontal timeline
    if (timeline && track && window.innerWidth > 860) {
      const rect = timeline.getBoundingClientRect();
      const total = timeline.offsetHeight - window.innerHeight;
      const p = clamp(-rect.top / total, 0, 1);
      const max = Math.max(0, track.scrollWidth - window.innerWidth + 8);
      track.style.transform = `translate3d(${-p * max}px, 0, 0)`;
      if (timelineBar) timelineBar.style.transform = `scaleX(${p})`;
    }

    ticking = false;
  });
};

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

/* ---------- Nav behaviour ---------- */

const nav = document.getElementById("nav");
let lastY = window.scrollY;

window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 60);
    if (y > 520 && y > lastY + 4) nav.classList.add("is-hidden");
    else if (y < lastY - 4 || y < 520) nav.classList.remove("is-hidden");
    lastY = y;
  },
  { passive: true }
);

/* ---------- Cursor ---------- */

const cursor = document.getElementById("cursor");
if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  let cx = window.innerWidth / 2;
  let cy = window.innerHeight / 2;
  let tx = cx;
  let ty = cy;

  window.addEventListener("pointermove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    cursor.classList.add("is-on");
  });

  document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));

  const hot = document.querySelectorAll("a, button, [data-cursor]");
  hot.forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hot"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hot"));
  });

  const loop = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* ---------- Gallery: clone the rail for a seamless loop ---------- */

const rail = document.querySelector(".rail__track");
if (rail) {
  const clone = rail.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  [...clone.querySelectorAll("img")].forEach((img) => img.setAttribute("alt", ""));
  [...clone.children].forEach((child) => rail.appendChild(child));
}
