/* Hero background motion — decorative cursor parallax + ambient sparkle + interactive ripple.
   Purpose: delight (marketing hero, first-time tier). transform/opacity only.
   Reduced-motion and coarse/touch pointers collapse to static. */

const PARTICLES = 9;
const MAX_SHIFT = 74; // px at parallax factor 1
const LERP = 0.085; // 1 = instant, lower = softer/springier
const BURST_INTERVAL = 200; // ms between cursor-triggered ripples

function makeParticles(hero) {
  const colors = ["var(--primary)", "var(--amber)", "var(--primary)", "var(--amber)"];
  for (let i = 0; i < PARTICLES; i++) {
    const wrap = document.createElement("span");
    wrap.className = "hero-float";
    wrap.style.left = `${(3 + Math.random() * 94).toFixed(1)}%`;
    wrap.style.top = `${(6 + Math.random() * 80).toFixed(1)}%`;
    wrap.dataset.parallax = (0.1 + Math.random() * 0.4).toFixed(2);

    const dot = document.createElement("span");
    dot.className = "hero-float-dot";
    const size = 4 + Math.round(Math.random() * 5);
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.background = colors[i % colors.length];
    dot.style.opacity = (0.35 + Math.random() * 0.45).toFixed(2);
    dot.style.animationDuration = `${(11 + Math.random() * 7).toFixed(1)}s`;
    dot.style.animationDelay = `${(-Math.random() * 12).toFixed(1)}s`;

    wrap.appendChild(dot);
    hero.appendChild(wrap);
  }
}

/* Interactive ripple — bursts spawn at the cursor and rings pulse faster while hovering */
function initRippleInteraction(hero) {
  const scene = hero.querySelector(".ripple-scene");
  if (!scene) return;

  const spawnBurst = (clientX, clientY) => {
    const r = scene.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - r.left, 16), r.width - 16);
    const y = Math.min(Math.max(clientY - r.top, 16), r.height - 16);
    const burst = document.createElement("span");
    burst.className = "ripple-burst";
    burst.style.left = `${x.toFixed(1)}px`;
    burst.style.top = `${y.toFixed(1)}px`;
    burst.addEventListener("animationend", () => burst.remove());
    scene.appendChild(burst);
  };

  let lastBurst = 0;
  scene.addEventListener("pointerenter", () => scene.classList.add("interactive"), { passive: true });
  scene.addEventListener(
    "pointermove",
    (e) => {
      const now = performance.now();
      if (now - lastBurst < BURST_INTERVAL) return;
      lastBurst = now;
      spawnBurst(e.clientX, e.clientY);
    },
    { passive: true }
  );
  scene.addEventListener(
    "pointerleave",
    () => {
      scene.classList.remove("interactive");
      scene.querySelectorAll(".ripple-burst").forEach((b) => b.remove());
    },
    { passive: true }
  );
}

export function initHeroMotion() {
  const hero = document.getElementById("top");
  if (!hero) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  initRippleInteraction(hero);

  const layers = [...hero.querySelectorAll("[data-parallax]")];
  if (!layers.length) return;
  makeParticles(hero);

  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = 0;
  let visible = !document.hidden;
  let heroRect = hero.getBoundingClientRect();

  const apply = () => {
    if (!visible) return;
    for (const el of layers) {
      const f = Number(el.dataset.parallax) || 0;
      el.style.transform = `translate3d(${(-tx * f * MAX_SHIFT).toFixed(2)}px, ${(-ty * f * MAX_SHIFT).toFixed(2)}px, 0)`;
    }
  };

  const tick = () => {
    if (!visible) {
      raf = 0;
      return;
    }
    tx += (cx - tx) * LERP;
    ty += (cy - ty) * LERP;
    if (Math.abs(tx) < 0.01 && Math.abs(ty) < 0.01 && cx === 0 && cy === 0) {
      tx = 0;
      ty = 0;
      apply();
      raf = 0;
      return;
    }
    apply();
    raf = requestAnimationFrame(tick);
  };

  const ensure = () => {
    if (!raf) tick();
  };

  const onMove = (e) => {
    cx = ((e.clientX - heroRect.left) / heroRect.width - 0.5) * 2;
    cy = ((e.clientY - heroRect.top) / heroRect.height - 0.5) * 2;
    ensure();
  };

  const updateRect = () => { heroRect = hero.getBoundingClientRect(); };
  const onVisibilityChange = () => {
    visible = !document.hidden;
    hero.classList.toggle("hero-paused", !visible);
    if (visible) {
      updateRect();
      if (raf === 0) ensure();
    }
  };

  hero.addEventListener("pointermove", onMove, { passive: true });
  hero.addEventListener(
    "pointerleave",
    () => {
      cx = 0;
      cy = 0;
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("resize", updateRect, { passive: true });
}
