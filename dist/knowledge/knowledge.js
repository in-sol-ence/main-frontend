import { c as F, j as R, r as v, K as z } from "./KnowledgeScene-DmcaLnKC.js";
const C = {
  // Used in the small per-concept notes, e.g. "John Doe already knows this."
  learner: "John Doe",
  // Typed into the space before the path is built.
  statement: "Let’s say John Doe wants to learn calculus.",
  // Typed beside the topic the system selects. {topic} becomes its name.
  topicLine: "John Doe wants to learn {topic}.",
  // Typed beside that topic's knowledge concepts.
  rationale: "Our RL model targets knowledge concepts based on John Doe’s knowledge state.",
  // Small caps line above the rationale: "Limits → Knowledge concepts".
  conceptsLabel: "Knowledge concepts",
  // Typed as the rest of that branch goes by, after its lecture segment.
  repeats: "The process repeats.",
  // Not shown as written, but they decide the route. The goal must match one of
  // the spatial study's example maps, or it silently falls back to
  // reinforcement learning. The background decides which topics count as known.
  goal: "Learn calculus from the beginning",
  background: "I know algebra"
}, J = C.goal, N = C.background, G = C.statement, _ = "skatebored:spatial", W = 8e3;
function V(a) {
  const n = (e) => Number.isFinite(e) ? Math.max(0, Math.min(1, e)) : 0.5;
  return { x: n(a?.x), y: n(a?.y) };
}
function Y() {
  const a = document.querySelector("#spatial-stage"), n = document.querySelector("#spatial-frame"), e = document.querySelector("#pages");
  let t, p = !1;
  const l = [], d = () => n.contentWindow?.postMessage({ type: `${_}:begin` }, location.origin);
  return {
    // Called while the concept sequence is still running, so the study's own
    // scene is already built and drawn by the time it is shown.
    preload() {
      if (t) return t;
      t = new Promise((w) => {
        const o = (u) => {
          if (!(u.origin !== location.origin || u.source !== n.contentWindow)) {
            if (u.data?.type === `${_}:finale` && p) {
              const m = V(u.data.point);
              for (const h of l) h(m);
              l.length = 0;
              return;
            }
            u.data?.type === `${_}:ready` && (clearTimeout(i), w(!0), p && d());
          }
        }, i = setTimeout(() => w(!1), W);
        addEventListener("message", o);
      });
      const g = `goal=${encodeURIComponent(J)}&background=${encodeURIComponent(N)}&statement=${encodeURIComponent(G)}&learner=${encodeURIComponent(C.learner)}&topicLine=${encodeURIComponent(C.topicLine)}&rationale=${encodeURIComponent(C.rationale)}&conceptsLabel=${encodeURIComponent(C.conceptsLabel)}&repeats=${encodeURIComponent(C.repeats)}&travelSpeed=2`;
      return n.src = `./spatial/index.html?${g}`, t;
    },
    async enter() {
      await this.preload(), a.removeAttribute("inert"), a.removeAttribute("aria-hidden"), a.classList.add("is-entering"), e.inert = !0, p = !0, d(), n.focus({ preventScroll: !0 });
    },
    // Called with where the path vanishes, as fractions of the view. The
    // journey stays on screen; the page's layer rises over it.
    onFinale(g) {
      l.push(g);
    }
  };
}
const b = {
  intro: "Skatebored places mathematical ideas in an embedding space. This view shows three dimensions so you can see how they connect.",
  // The 3D space fades in the moment this part of the intro has been typed.
  // It must appear word for word in the intro above.
  revealAfter: "three dimensions",
  nextButton: "Next",
  // Typed after Next. {phrase} is replaced by each stage below, in order.
  conceptSentence: "This is {phrase} in the embedding space.",
  // One phrase per stage. Which questions each stage lights up is set in
  // src/concept-sequence.js, in the same order, so keep exactly four.
  stages: [
    "Integration by parts",
    "U-substitution",
    "Integration methods",
    "John Doe's knowledge"
  ],
  // The last screen before the spatial journey.
  closing: "Skatebored turns a complex syllabus into a learning path through this space.",
  closingEmphasis: "learning path"
}, X = [
  ["Q1"],
  ["Q2"],
  ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"],
  // Development sample: Python Random(20260922).sample(range(1, 25), 9), sorted; never randomized on render or visit.
  ["Q1", "Q2", "Q3", "Q4", "Q12", "Q17", "Q20", "Q22", "Q24"]
], T = X.map((a, n) => ({
  phrase: b.stages[n],
  ids: a,
  mastery: Array.from({ length: 24 }, (e, t) => Number(a.includes(`Q${t + 1}`)))
})), M = b.closing;
function Z(a, n = Y()) {
  const e = document.querySelector("#demo"), t = document.querySelector("#demo-typed"), [p, l] = b.conceptSentence.split("{phrase}"), d = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), g = `${d(p)}<span id="concept-phrase"></span>${d(l)}`, w = M.replace(b.closingEmphasis, `<span class="text-accent">${d(b.closingEmphasis)}</span>`);
  let o, i;
  const u = e.querySelector("[data-page-heading]"), m = matchMedia("(prefers-reduced-motion: reduce)");
  let h = !1, r = "idle", y = 0, f, x, S = !1, c, L;
  function k() {
    if (!o || S || o.textContent !== T[y].phrase) return;
    S = !0, r = "settling";
    const s = T[y];
    u.setAttribute("aria-label", `${p}${s.phrase}${l}`), a.update(s.mastery).then(() => {
      x = setTimeout(() => {
        if (y === T.length - 1) {
          P();
          return;
        }
        y++, $();
      }, 2e3);
    });
  }
  function $() {
    S = !1, r = "stage", t.dataset.fullText = "";
    const s = o.textContent;
    if (s && (r = "erasing-stage"), f?.destroy(), o.textContent = s, m.matches) {
      o.textContent = T[y].phrase, k();
      return;
    }
    f = new window.Typed(o, {
      strings: [T[y].phrase],
      typeSpeed: 65,
      backSpeed: 28,
      startDelay: 0,
      smartBackspace: !1,
      loop: !1,
      showCursor: !1,
      autoInsertCss: !1,
      contentType: "null",
      onComplete: k,
      preStringTyped() {
        r = "stage";
      }
    });
  }
  function q(s) {
    if (r = "erasing", L = () => {
      L = null, s();
    }, t.dataset.fullText = t.textContent, m.matches) {
      t.textContent = "", L();
      return;
    }
    const j = t.textContent;
    f?.destroy(), t.textContent = j, f = new window.Typed(t, {
      strings: [""],
      backSpeed: 28,
      startDelay: 0,
      smartBackspace: !1,
      loop: !1,
      showCursor: !1,
      autoInsertCss: !1,
      contentType: "null",
      onComplete: L
    });
  }
  function E() {
    r = "holding", x = setTimeout(H, 2e3);
  }
  function P() {
    D.disconnect(), q(() => {
      if (r = "closing", t.dataset.fullText = M, u.setAttribute("aria-label", M), m.matches) {
        t.innerHTML = w, E();
        return;
      }
      f?.destroy(), f = new window.Typed(t, {
        strings: [w],
        typeSpeed: 65,
        startDelay: 0,
        smartBackspace: !1,
        loop: !1,
        showCursor: !1,
        autoInsertCss: !1,
        contentType: "html",
        onComplete: E
      });
    });
  }
  function H() {
    q(() => {
      r = "handed-off", u.removeAttribute("aria-label"), n.enter();
    });
  }
  const D = new MutationObserver(k);
  function A() {
    r = "waiting-stage", o = t.querySelector("#concept-phrase"), D.observe(o, { childList: !0, characterData: !0, subtree: !0 }), c.then(() => {
      x = setTimeout($, 700);
    });
  }
  m.addEventListener("change", () => {
    if (m.matches && h && r === "erasing") {
      I();
      return;
    }
    if (!(!m.matches || !h || S)) {
      if (clearTimeout(x), !o) {
        i?.destroy(), t.innerHTML = g, A();
        return;
      }
      f?.destroy(), o.textContent = T[y].phrase, k();
    }
  });
  function I() {
    if (!h || e.inert) return !1;
    if (r === "erasing")
      f?.destroy(), t.textContent = "", L();
    else if (r === "erasing-stage")
      f?.destroy(), o.textContent = "", $();
    else if (r === "shell")
      i?.destroy(), t.innerHTML = g, A();
    else if (r === "stage")
      f?.destroy(), o.textContent = T[y].phrase, k();
    else if (r === "closing")
      f?.destroy(), t.innerHTML = w, E();
    else return !1;
    return !0;
  }
  return e.parentElement.addEventListener("click", (s) => {
    r !== "erasing" && r !== "erasing-stage" || s.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || I() && s.stopImmediatePropagation();
  }), document.addEventListener("keydown", (s) => {
    s.code !== "Space" || s.repeat || s.metaKey || s.ctrlKey || s.altKey || s.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || I() && (s.preventDefault(), s.stopImmediatePropagation());
  }), function() {
    if (!h) {
      if (h = !0, r = "shell", t.dataset.fullText = `${p}${l}`, n.preload(), c = a.update(Array(24).fill(0)), u.setAttribute("aria-label", `${p.trimEnd()} ${l.trimStart()}`), m.matches) {
        t.innerHTML = g, A();
        return;
      }
      i = new window.Typed(t, {
        strings: [g],
        typeSpeed: 65,
        startDelay: 0,
        loop: !1,
        showCursor: !1,
        autoInsertCss: !1,
        contentType: "html",
        onComplete: A
      });
    }
  };
}
function ee(a) {
  const n = document.querySelector("#demo"), e = document.querySelector("#demo-typed"), t = n.querySelector("[data-page-heading]"), p = document.querySelector("#knowledge-volume"), l = document.querySelector("#demo-next"), d = b.intro, g = d.replace(b.revealAfter, `<span class="text-accent">${b.revealAfter}</span>`);
  t.setAttribute("aria-label", d), e.dataset.fullText = d, new MutationObserver(() => {
    const c = e.dataset.fullText || "";
    e.dataset.rest = c.startsWith(e.textContent) ? c.slice(e.textContent.length) : "";
  }).observe(e, {
    childList: !0,
    characterData: !0,
    subtree: !0,
    attributes: !0,
    attributeFilter: ["data-full-text"]
  }), l.textContent = b.nextButton;
  const w = d.indexOf(b.revealAfter) + b.revealAfter.length, o = matchMedia("(prefers-reduced-motion: reduce)");
  let i = "waiting", u;
  function m() {
    p.classList.add("is-visible"), p.inert = !1, p.removeAttribute("aria-hidden");
  }
  const h = new MutationObserver(() => {
    i === "typing" && e.textContent.length >= w && (m(), h.disconnect());
  });
  h.observe(e, { childList: !0, characterData: !0, subtree: !0 });
  function r() {
    m(), i = "ready", l.hidden = !1, h.disconnect();
  }
  function y() {
    if (!(n.inert && !n.dataset.entering || i !== "waiting")) {
      if (i = "typing", f.disconnect(), o.matches) {
        e.innerHTML = g, r();
        return;
      }
      u = new window.Typed(e, {
        strings: [g],
        typeSpeed: 65,
        backSpeed: 28,
        startDelay: 0,
        smartBackspace: !1,
        loop: !1,
        showCursor: !1,
        autoInsertCss: !1,
        contentType: "html",
        onComplete: r
      });
    }
  }
  const f = new MutationObserver(y);
  f.observe(n, { attributes: !0, attributeFilter: ["inert", "data-entering"] }), y(), n.dataset.ready = "true";
  function x() {
    i = "empty", a();
  }
  l.addEventListener("click", () => {
    if (i !== "ready") return;
    if (i = "erasing", l.hidden = !0, t.removeAttribute("aria-label"), t.focus({ preventScroll: !0 }), t.dataset.sizingText = d, o.matches) {
      e.textContent = "", x();
      return;
    }
    const c = e.textContent;
    u?.destroy(), e.textContent = c, u = new window.Typed(e, {
      strings: [""],
      backSpeed: 28,
      startDelay: 0,
      smartBackspace: !1,
      loop: !1,
      showCursor: !1,
      autoInsertCss: !1,
      contentType: "null",
      onComplete: x
    });
  }), o.addEventListener("change", () => {
    !o.matches || i === "waiting" || i === "empty" || (u?.destroy(), i === "erasing" ? (e.textContent = "", x()) : (e.innerHTML = g, r()));
  });
  function S() {
    return n.inert ? !1 : i === "typing" ? (u?.destroy(), e.innerHTML = g, r(), !0) : i === "erasing" ? (u?.destroy(), e.textContent = "", x(), !0) : !1;
  }
  n.parentElement.addEventListener("click", (c) => {
    i === "erasing" && (c.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || S() && c.stopImmediatePropagation());
  }), document.addEventListener("keydown", (c) => {
    c.code !== "Space" || c.repeat || c.metaKey || c.ctrlKey || c.altKey || c.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || S() && (c.preventDefault(), c.stopImmediatePropagation());
  });
}
const K = document.querySelector("#knowledge-volume"), O = document.querySelector("#knowledge-slot"), U = document.querySelector("#pages"), B = () => {
  const a = O.getBoundingClientRect(), n = U.getBoundingClientRect();
  Object.assign(K.style, {
    left: `${a.left - n.left}px`,
    top: `${a.top - n.top}px`,
    width: `${a.width}px`,
    height: `${a.height}px`
  });
}, Q = new ResizeObserver(B);
Q.observe(O);
Q.observe(document.querySelector(".demo-intro"));
Q.observe(U);
document.querySelector("#demo").addEventListener("scroll", B, { passive: !0 });
function te() {
  const [a, n] = v.useState([1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), e = v.useRef(null), t = v.useCallback((l) => new Promise((d) => {
    e.current = { vector: l, resolve: d }, n(l);
  }), []), p = v.useCallback((l) => {
    if (e.current?.vector !== l) return;
    const { resolve: d } = e.current;
    e.current = null, d();
  }, []);
  return v.useEffect(() => {
    ee(Z({ update: t }));
  }, [t]), /* @__PURE__ */ R.jsx(
    z,
    {
      mastery: a,
      onMasterySettled: p,
      radius: 8,
      isolation: 45,
      surface: { color: "#FF1414", roughness: 0.42, metalness: 0.25 },
      autoRotate: !1,
      background: "#000000"
    }
  );
}
F.createRoot(K).render(/* @__PURE__ */ R.jsx(te, {}));
