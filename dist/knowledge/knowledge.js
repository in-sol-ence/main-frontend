import { c as F, j as D, r as k, K as z } from "./KnowledgeScene-DmcaLnKC.js";
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
}, J = C.goal, N = C.background, G = C.statement, I = "skatebored:spatial", W = 8e3;
function V(o) {
  const n = (e) => Number.isFinite(e) ? Math.max(0, Math.min(1, e)) : 0.5;
  return { x: n(o?.x), y: n(o?.y) };
}
function Y() {
  const o = document.querySelector("#spatial-stage"), n = document.querySelector("#spatial-frame"), e = document.querySelector("#pages");
  let t, p = !1;
  const i = [], d = () => n.contentWindow?.postMessage({ type: `${I}:begin` }, location.origin);
  return {
    // Called while the concept sequence is still running, so the study's own
    // scene is already built and drawn by the time it is shown.
    preload() {
      if (t) return t;
      t = new Promise((S) => {
        const s = (c) => {
          if (!(c.origin !== location.origin || c.source !== n.contentWindow)) {
            if (c.data?.type === `${I}:finale` && p) {
              const g = V(c.data.point);
              for (const b of i) b(g);
              i.length = 0;
              return;
            }
            c.data?.type === `${I}:ready` && (clearTimeout(a), S(!0), p && d());
          }
        }, a = setTimeout(() => S(!1), W);
        addEventListener("message", s);
      });
      const m = `goal=${encodeURIComponent(J)}&background=${encodeURIComponent(N)}&statement=${encodeURIComponent(G)}&learner=${encodeURIComponent(C.learner)}&topicLine=${encodeURIComponent(C.topicLine)}&rationale=${encodeURIComponent(C.rationale)}&conceptsLabel=${encodeURIComponent(C.conceptsLabel)}&repeats=${encodeURIComponent(C.repeats)}&travelSpeed=2`;
      return n.src = `./spatial/index.html?${m}`, t;
    },
    async enter() {
      await this.preload(), o.removeAttribute("inert"), o.removeAttribute("aria-hidden"), o.classList.add("is-entering"), e.inert = !0, p = !0, d(), n.focus({ preventScroll: !0 });
    },
    // Called with where the path vanishes, as fractions of the view. The
    // journey stays on screen; the page's layer rises over it.
    onFinale(m) {
      i.push(m);
    }
  };
}
const y = {
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
], T = X.map((o, n) => ({
  phrase: y.stages[n],
  ids: o,
  mastery: Array.from({ length: 24 }, (e, t) => Number(o.includes(`Q${t + 1}`)))
})), Q = y.closing;
function Z(o, n = Y()) {
  const e = document.querySelector("#demo"), t = document.querySelector("#demo-typed"), [p, i] = y.conceptSentence.split("{phrase}"), d = (r) => r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), m = `${d(p)}<span id="concept-phrase"></span>${d(i)}`, S = Q.replace(y.closingEmphasis, `<span class="text-accent">${d(y.closingEmphasis)}</span>`);
  let s, a;
  const c = e.querySelector("[data-page-heading]"), g = matchMedia("(prefers-reduced-motion: reduce)");
  let b = !1, l = "idle", h = 0, f, w, x = !1, u;
  function L() {
    if (!s || x || s.textContent !== T[h].phrase) return;
    x = !0, l = "settling";
    const r = T[h];
    c.setAttribute("aria-label", `${p}${r.phrase}${i}`), o.update(r.mastery).then(() => {
      w = setTimeout(() => {
        if (h === T.length - 1) {
          O();
          return;
        }
        h++, $();
      }, 2e3);
    });
  }
  function $() {
    x = !1, l = "stage";
    const r = s.textContent;
    if (f?.destroy(), s.textContent = r, g.matches) {
      s.textContent = T[h].phrase, L();
      return;
    }
    f = new window.Typed(s, {
      strings: [T[h].phrase],
      typeSpeed: 65,
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
  function E(r) {
    if (l = "erasing", g.matches) {
      t.textContent = "", r();
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
      onComplete: r
    });
  }
  function v() {
    l = "holding", w = setTimeout(P, 2e3);
  }
  function O() {
    M.disconnect(), E(() => {
      if (l = "closing", c.setAttribute("aria-label", Q), g.matches) {
        t.innerHTML = S, v();
        return;
      }
      f?.destroy(), f = new window.Typed(t, {
        strings: [S],
        typeSpeed: 65,
        startDelay: 0,
        smartBackspace: !1,
        loop: !1,
        showCursor: !1,
        autoInsertCss: !1,
        contentType: "html",
        onComplete: v
      });
    });
  }
  function P() {
    E(() => {
      l = "handed-off", c.removeAttribute("aria-label"), n.onFinale?.(H), n.enter();
    });
  }
  function H() {
    l = "done";
    const r = document.querySelector("#finale-learn");
    r && (r.hidden = !1);
  }
  const M = new MutationObserver(L);
  function A() {
    l = "waiting-stage", s = t.querySelector("#concept-phrase"), M.observe(s, { childList: !0, characterData: !0, subtree: !0 }), u.then(() => {
      w = setTimeout($, 700);
    });
  }
  g.addEventListener("change", () => {
    if (!(!g.matches || !b || x)) {
      if (clearTimeout(w), !s) {
        a?.destroy(), t.innerHTML = m, A();
        return;
      }
      f?.destroy(), s.textContent = T[h].phrase, L();
    }
  });
  function q() {
    if (!b || e.inert) return !1;
    if (l === "shell")
      a?.destroy(), t.innerHTML = m, A();
    else if (l === "stage")
      f?.destroy(), s.textContent = T[h].phrase, L();
    else if (l === "closing")
      f?.destroy(), t.innerHTML = S, v();
    else return !1;
    return !0;
  }
  return e.addEventListener("click", (r) => {
    r.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || q() && r.stopImmediatePropagation();
  }), document.addEventListener("keydown", (r) => {
    r.code !== "Space" || r.repeat || r.metaKey || r.ctrlKey || r.altKey || r.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || q() && (r.preventDefault(), r.stopImmediatePropagation());
  }), function() {
    if (!b) {
      if (b = !0, l = "shell", n.preload(), u = o.update(Array(24).fill(0)), c.setAttribute("aria-label", `${p.trimEnd()} ${i.trimStart()}`), g.matches) {
        t.innerHTML = m, A();
        return;
      }
      a = new window.Typed(t, {
        strings: [m],
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
function ee(o) {
  const n = document.querySelector("#demo"), e = document.querySelector("#demo-typed"), t = n.querySelector("[data-page-heading]"), p = document.querySelector("#knowledge-volume"), i = document.querySelector("#demo-next"), d = y.intro, m = d.replace(y.revealAfter, `<span class="text-accent">${y.revealAfter}</span>`);
  t.setAttribute("aria-label", d), i.textContent = y.nextButton;
  const S = d.indexOf(y.revealAfter) + y.revealAfter.length, s = matchMedia("(prefers-reduced-motion: reduce)");
  let a = "waiting", c;
  function g() {
    p.classList.add("is-visible"), p.inert = !1, p.removeAttribute("aria-hidden");
  }
  const b = new MutationObserver(() => {
    a === "typing" && e.textContent.length >= S && (g(), b.disconnect());
  });
  b.observe(e, { childList: !0, characterData: !0, subtree: !0 });
  function l() {
    g(), a = "ready", i.hidden = !1, b.disconnect();
  }
  function h() {
    if (!(n.inert && !n.dataset.entering || a !== "waiting")) {
      if (a = "typing", f.disconnect(), s.matches) {
        e.innerHTML = m, l();
        return;
      }
      c = new window.Typed(e, {
        strings: [m],
        typeSpeed: 65,
        backSpeed: 28,
        startDelay: 0,
        smartBackspace: !1,
        loop: !1,
        showCursor: !1,
        autoInsertCss: !1,
        contentType: "html",
        onComplete: l
      });
    }
  }
  const f = new MutationObserver(h);
  f.observe(n, { attributes: !0, attributeFilter: ["inert", "data-entering"] }), h(), n.dataset.ready = "true";
  function w() {
    a = "empty", o();
  }
  i.addEventListener("click", () => {
    if (a !== "ready") return;
    if (a = "erasing", i.hidden = !0, t.removeAttribute("aria-label"), t.focus({ preventScroll: !0 }), t.dataset.sizingText = d, s.matches) {
      e.textContent = "", w();
      return;
    }
    const u = e.textContent;
    c?.destroy(), e.textContent = u, c = new window.Typed(e, {
      strings: [""],
      backSpeed: 28,
      startDelay: 0,
      smartBackspace: !1,
      loop: !1,
      showCursor: !1,
      autoInsertCss: !1,
      contentType: "null",
      onComplete: w
    });
  }), s.addEventListener("change", () => {
    !s.matches || a === "waiting" || a === "empty" || (c?.destroy(), a === "erasing" ? (e.textContent = "", w()) : (e.innerHTML = m, l()));
  });
  function x() {
    return n.inert ? !1 : a === "typing" ? (c?.destroy(), e.innerHTML = m, l(), !0) : a === "erasing" ? (c?.destroy(), e.textContent = "", w(), !0) : !1;
  }
  n.addEventListener("click", (u) => {
    u.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || x() && u.stopImmediatePropagation();
  }), document.addEventListener("keydown", (u) => {
    u.code !== "Space" || u.repeat || u.metaKey || u.ctrlKey || u.altKey || u.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || x() && (u.preventDefault(), u.stopImmediatePropagation());
  });
}
const R = document.querySelector("#knowledge-volume"), K = document.querySelector("#knowledge-slot"), U = document.querySelector("#pages"), B = () => {
  const o = K.getBoundingClientRect(), n = U.getBoundingClientRect();
  Object.assign(R.style, {
    left: `${o.left - n.left}px`,
    top: `${o.top - n.top}px`,
    width: `${o.width}px`,
    height: `${o.height}px`
  });
}, _ = new ResizeObserver(B);
_.observe(K);
_.observe(document.querySelector(".demo-intro"));
_.observe(U);
document.querySelector("#demo").addEventListener("scroll", B, { passive: !0 });
function te() {
  const [o, n] = k.useState([1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), e = k.useRef(null), t = k.useCallback((i) => new Promise((d) => {
    e.current = { vector: i, resolve: d }, n(i);
  }), []), p = k.useCallback((i) => {
    if (e.current?.vector !== i) return;
    const { resolve: d } = e.current;
    e.current = null, d();
  }, []);
  return k.useEffect(() => {
    ee(Z({ update: t }));
  }, [t]), /* @__PURE__ */ D.jsx(
    z,
    {
      mastery: o,
      onMasterySettled: p,
      radius: 8,
      isolation: 45,
      surface: { color: "#FF1414", roughness: 0.42, metalness: 0.25 },
      autoRotate: !1,
      background: "#000000"
    }
  );
}
F.createRoot(R).render(/* @__PURE__ */ D.jsx(te, {}));
