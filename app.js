// Fernhill Roofing Co. concept site. No dependencies.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- roof picker ---------- */
  const ROOFS = {
    flat: {
      name: "Flat roof",
      where: "Rowhomes and twins all over the city. From the street you only see the cornice. Up top it's a low-slope membrane, usually painted silver.",
      fails: "The silver coat chalks and cracks, seams open at the parapet, and water ponds in low spots until it finds a way through.",
      fix: "Reseal the seams and flashing, recoat, or put on a new membrane when the old one is done. We tell you which, and why.",
    },
    mansard: {
      name: "Mansard front",
      where: "The steep slate or shingle face above the top-floor windows, common on older blocks.",
      fails: "Slates slip, the nailers behind them rot, and water gets behind the cornice and into the front wall.",
      fix: "Replace slipped slates or shingles, rebuild rotted nailers, and re-flash where the mansard meets the flat roof behind it.",
    },
    gutter: {
      name: "Box gutter",
      where: "A gutter built into the cornice at the front or back edge, instead of hanging off it.",
      fails: "The lining splits or the outlet clogs, and the overflow runs into the wall. You see it as a stain at the top of a front-room wall.",
      fix: "Clear the outlet, reline the trough with membrane or metal, and fix the downspout connection.",
    },
    slate: {
      name: "Slate roof",
      where: "Stone and brick houses in Germantown, Mt. Airy, Chestnut Hill, and East Falls.",
      fails: "Single slates crack or slide, and the flashing at valleys and chimneys wears through long before the slate does.",
      fix: "Slate-for-slate repairs and new valley and chimney flashing. No tearing off a good roof to fix a bad spot.",
    },
  };

  const tabs = $$(".picker__tab");
  const panel = $("#roof-panel");
  let current = "flat";

  function selectRoof(key, focus) {
    if (!ROOFS[key] || key === current) return;
    current = key;
    tabs.forEach((t) => {
      const on = t.dataset.roof === key;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) {
        panel.setAttribute("aria-labelledby", t.id);
        if (focus) t.focus();
      }
    });
    // Swap text under a quick fade so the change reads as a change.
    panel.classList.add("is-swapping");
    $$("[data-field]", panel).forEach((el) => { el.textContent = ROOFS[key][el.dataset.field]; });
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove("is-swapping")));
  }

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectRoof(t.dataset.roof, false));
    t.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let next = null;
      if (e.key in keys) next = (i + keys[e.key] + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      selectRoof(tabs[next].dataset.roof, true);
    });
  });

  const roofSelect = $("#f-roof");
  $("[data-use-roof]").addEventListener("click", () => {
    roofSelect.value = current;
    $("#request").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setTimeout(() => $("#f-problem").focus({ preventScroll: true }), 450);
  });

  /* ---------- request form + toast ---------- */
  const form = $("#request-form");
  const toast = $("#toast");
  const toastText = $("#toast-text");
  let toastTimer;

  function showToast(msg) {
    toastText.textContent = msg;
    toast.dataset.open = "true";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }
  function hideToast() { toast.dataset.open = "false"; }
  $(".toast__close").addEventListener("click", hideToast);
  toast.addEventListener("pointerenter", () => clearTimeout(toastTimer));
  toast.addEventListener("pointerleave", () => { toastTimer = setTimeout(hideToast, 2500); });

  const checks = [
    { el: $("#f-problem"), err: $("#e-problem"), ok: (v) => v !== "" },
    { el: $("#f-zip"), err: $("#e-zip"), ok: (v) => /^191\d{2}$/.test(v.trim()) },
    { el: $("#f-phone"), err: $("#e-phone"), ok: (v) => v.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "").length === 10 },
  ];

  function check(c) {
    const good = c.ok(c.el.value);
    c.err.hidden = good;
    if (good) { c.el.removeAttribute("aria-invalid"); c.el.removeAttribute("aria-describedby"); }
    else { c.el.setAttribute("aria-invalid", "true"); c.el.setAttribute("aria-describedby", c.err.id); }
    return good;
  }
  checks.forEach((c) => c.el.addEventListener("blur", () => { if (c.el.value) check(c); }));
  checks.forEach((c) => c.el.addEventListener("input", () => { if (c.el.hasAttribute("aria-invalid")) check(c); }));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = checks.filter((c) => !check(c));
    if (bad.length) { bad[0].el.focus(); return; }
    form.reset();
    showToast("Demo site: nothing was sent. On a live site this request goes straight to the roofer's phone.");
  });

  /* ---------- throw-up bar (desktop) ---------- */
  const throwup = $("#throwup");
  const top = $("#top");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      const show = !entry.isIntersecting;
      throwup.dataset.visible = String(show);
      throwup.inert = !show;
    }, { rootMargin: "-120px 0px 0px 0px" }).observe(top);
  }

  /* ---------- drawer (mobile), with drag to dismiss ---------- */
  const drawer = $("#drawer");
  const scrim = $("#scrim");
  const menuBtn = $(".dock__menu");
  const main = $("#main");

  function openDrawer() {
    hideToast(); // the toast sits above the drawer and would cover its links
    drawer.inert = false;
    drawer.style.transform = "";
    drawer.dataset.open = "true";
    scrim.dataset.open = "true";
    menuBtn.setAttribute("aria-expanded", "true");
    main.inert = true;
    setTimeout(() => $("nav a", drawer).focus({ preventScroll: true }), 60);
  }
  function closeDrawer(returnFocus = true) {
    drawer.style.transform = "";
    drawer.dataset.open = "false";
    scrim.dataset.open = "false";
    menuBtn.setAttribute("aria-expanded", "false");
    main.inert = false;
    drawer.inert = true;
    if (returnFocus) menuBtn.focus({ preventScroll: true });
  }
  menuBtn.addEventListener("click", openDrawer);
  scrim.addEventListener("click", () => closeDrawer());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.dataset.open === "true") closeDrawer(); });
  $$("a", drawer).forEach((a) => a.addEventListener("click", () => closeDrawer(false)));

  let drag = null;
  drawer.addEventListener("pointerdown", (e) => {
    if (drag || drawer.dataset.open !== "true" || e.target.closest("a")) return; // one pointer at a time; links stay clickable
    drag = { id: e.pointerId, y0: e.clientY, t0: performance.now(), dy: 0 };
    drawer.setPointerCapture(e.pointerId);
    drawer.classList.add("is-dragging");
  });
  drawer.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const raw = e.clientY - drag.y0;
    // Downward follows the finger; upward meets rising resistance.
    drag.dy = raw >= 0 ? raw : -Math.sqrt(-raw) * 2;
    drawer.style.transform = `translateY(${drag.dy}px)`;
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const velocity = Math.abs(drag.dy) / Math.max(1, performance.now() - drag.t0);
    const dismiss = drag.dy > 90 || (drag.dy > 12 && velocity > 0.11);
    drawer.classList.remove("is-dragging");
    drag = null;
    if (dismiss) closeDrawer();
    else drawer.style.transform = "";
  };
  drawer.addEventListener("pointerup", endDrag);
  drawer.addEventListener("pointercancel", endDrag);
})();
