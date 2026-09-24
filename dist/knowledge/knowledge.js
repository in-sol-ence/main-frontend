import { c as W, j as K, r as T, K as J } from "./KnowledgeScene-DmcaLnKC.js";
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
}, N = C.goal, G = C.background, V = C.statement, v = "skatebored:spatial", Y = 8e3;
function X(r) {
  const s = (e) => Number.isFinite(e) ? Math.max(0, Math.min(1, e)) : 0.5;
  return { x: s(r?.x), y: s(r?.y) };
}
function Z() {
  const r = document.querySelector("#spatial-stage"), s = document.querySelector("#spatial-frame"), e = document.querySelector("#pages");
  let t, b = !1;
  const f = [], g = () => s.contentWindow?.postMessage({ type: `${v}:begin` }, location.origin);
  return {
    // Called while the concept sequence is still running, so the study's own
    // scene is already built and drawn by the time it is shown.
    preload() {
      if (t) return t;
      t = new Promise((p) => {
        const d = (o) => {
          if (!(o.origin !== location.origin || o.source !== s.contentWindow)) {
            if (o.data?.type === `${v}:finale` && b) {
              const m = X(o.data.point);
              for (const i of f) i(m);
              f.length = 0;
              return;
            }
            o.data?.type === `${v}:ready` && (clearTimeout(n), p(!0), b && g());
          }
        }, n = setTimeout(() => p(!1), Y);
        addEventListener("message", d);
      });
      const h = `goal=${encodeURIComponent(N)}&background=${encodeURIComponent(G)}&statement=${encodeURIComponent(V)}&learner=${encodeURIComponent(C.learner)}&topicLine=${encodeURIComponent(C.topicLine)}&rationale=${encodeURIComponent(C.rationale)}&conceptsLabel=${encodeURIComponent(C.conceptsLabel)}&repeats=${encodeURIComponent(C.repeats)}`;
      return s.src = `./spatial/index.html?${h}`, t;
    },
    async enter() {
      await this.preload(), r.removeAttribute("inert"), r.removeAttribute("aria-hidden"), r.classList.add("is-entering"), e.inert = !0, b = !0, g(), s.focus({ preventScroll: !0 });
    },
    // Called with where the path vanishes, as fractions of the view. The
    // journey stays on screen; the page's layer rises over it.
    onFinale(h) {
      f.push(h);
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
  closingEmphasis: "learning path",
  // After the journey, over John Doe's knowledge volume as it grows.
  finale: "This is John Doe's knowledge state after learning with Skatebored.",
  finaleEmphasis: "knowledge state"
}, ee = [
  ["Q1"],
  ["Q2"],
  ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"],
  // Development sample: Python Random(20260922).sample(range(1, 25), 9), sorted; never randomized on render or visit.
  ["Q1", "Q2", "Q3", "Q4", "Q12", "Q17", "Q20", "Q22", "Q24"]
], L = ee.map((r, s) => ({
  phrase: y.stages[s],
  ids: r,
  mastery: Array.from({ length: 24 }, (e, t) => Number(r.includes(`Q${t + 1}`)))
})), B = y.closing, te = ((r) => ({ ids: r, mastery: Array.from({ length: 24 }, (s, e) => Number(r.includes(`Q${e + 1}`))) }))(
  ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14", "Q17", "Q20", "Q22", "Q24"]
);
function ne(r, s = Z()) {
  const e = document.querySelector("#demo"), t = document.querySelector("#demo-typed"), [b, f] = y.conceptSentence.split("{phrase}"), g = (a) => a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), h = `${g(b)}<span id="concept-phrase"></span>${g(f)}`, p = B.replace(y.closingEmphasis, `<span class="text-accent">${g(y.closingEmphasis)}</span>`), d = y.finale.replace(y.finaleEmphasis, `<span class="text-accent">${g(y.finaleEmphasis)}</span>`);
  let n, o;
  const m = e.querySelector("[data-page-heading]"), i = matchMedia("(prefers-reduced-motion: reduce)");
  let w = !1, c = "idle", x = 0, u, S, l = !1, I;
  function Q() {
    if (!n || l || n.textContent !== L[x].phrase) return;
    l = !0, c = "settling";
    const a = L[x];
    m.setAttribute("aria-label", `${b}${a.phrase}${f}`), r.update(a.mastery).then(() => {
      S = setTimeout(() => {
        if (x === L.length - 1) {
          P();
          return;
        }
        x++, q();
      }, 2e3);
    });
  }
  function q() {
    l = !1, c = "stage";
    const a = n.textContent;
    if (u?.destroy(), n.textContent = a, i.matches) {
      n.textContent = L[x].phrase, Q();
      return;
    }
    u = new window.Typed(n, {
      strings: [L[x].phrase],
      typeSpeed: 65,
      backSpeed: 28,
      startDelay: 0,
      smartBackspace: !1,
      loop: !1,
      showCursor: !1,
      autoInsertCss: !1,
      contentType: "null",
      onComplete: Q
    });
  }
  function D(a) {
    if (c = "erasing", i.matches) {
      t.textContent = "", a();
      return;
    }
    const z = t.textContent;
    u?.destroy(), t.textContent = z, u = new window.Typed(t, {
      strings: [""],
      backSpeed: 28,
      startDelay: 0,
      smartBackspace: !1,
      loop: !1,
      showCursor: !1,
      autoInsertCss: !1,
      contentType: "null",
      onComplete: a
    });
  }
  function $() {
    c = "holding", S = setTimeout(F, 2e3);
  }
  function P() {
    R.disconnect(), D(() => {
      if (c = "closing", m.setAttribute("aria-label", B), i.matches) {
        t.innerHTML = p, $();
        return;
      }
      u?.destroy(), u = new window.Typed(t, {
        strings: [p],
        typeSpeed: 65,
        startDelay: 0,
        smartBackspace: !1,
        loop: !1,
        showCursor: !1,
        autoInsertCss: !1,
        contentType: "html",
        onComplete: $
      });
    });
  }
  function F() {
    D(() => {
      c = "handed-off", m.removeAttribute("aria-label"), s.onFinale?.(j), s.enter();
    });
  }
  function j(a = { x: 0.5, y: 0.5 }) {
    c = "finale-wait", r.anchor?.(a), m.setAttribute("aria-label", y.finale), S = setTimeout(() => {
      if (c = "finale", r.update(te.mastery), i.matches) {
        t.innerHTML = d, M();
        return;
      }
      u?.destroy(), u = new window.Typed(t, {
        strings: [d],
        typeSpeed: 65,
        startDelay: 0,
        smartBackspace: !1,
        loop: !1,
        showCursor: !1,
        autoInsertCss: !1,
        contentType: "html",
        onComplete: M
      });
    }, 1200);
  }
  function M() {
    c = "done";
    const a = document.querySelector("#finale-learn");
    a && (a.hidden = !1);
  }
  const R = new MutationObserver(Q);
  function A() {
    c = "waiting-stage", n = t.querySelector("#concept-phrase"), R.observe(n, { childList: !0, characterData: !0, subtree: !0 }), I.then(() => {
      S = setTimeout(q, 700);
    });
  }
  i.addEventListener("change", () => {
    if (!(!i.matches || !w || l)) {
      if (clearTimeout(S), !n) {
        o?.destroy(), t.innerHTML = h, A();
        return;
      }
      u?.destroy(), n.textContent = L[x].phrase, Q();
    }
  });
  function H() {
    if (!w || e.inert && !document.body.classList.contains("is-finale")) return !1;
    if (c === "shell")
      o?.destroy(), t.innerHTML = h, A();
    else if (c === "stage")
      u?.destroy(), n.textContent = L[x].phrase, Q();
    else if (c === "closing")
      u?.destroy(), t.innerHTML = p, $();
    else if (c === "finale")
      u?.destroy(), t.innerHTML = d, M();
    else return !1;
    return !0;
  }
  return e.addEventListener("click", (a) => {
    a.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || H() && a.stopImmediatePropagation();
  }), document.addEventListener("keydown", (a) => {
    a.code !== "Space" || a.repeat || a.metaKey || a.ctrlKey || a.altKey || a.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || H() && (a.preventDefault(), a.stopImmediatePropagation());
  }), function() {
    if (!w) {
      if (w = !0, c = "shell", s.preload(), I = r.update(Array(24).fill(0)), m.setAttribute("aria-label", `${b.trimEnd()} ${f.trimStart()}`), i.matches) {
        t.innerHTML = h, A();
        return;
      }
      o = new window.Typed(t, {
        strings: [h],
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
function se(r) {
  const s = document.querySelector("#demo"), e = document.querySelector("#demo-typed"), t = s.querySelector("[data-page-heading]"), b = document.querySelector("#knowledge-volume"), f = document.querySelector("#demo-next"), g = y.intro, h = g.replace(y.revealAfter, `<span class="text-accent">${y.revealAfter}</span>`);
  t.setAttribute("aria-label", g), f.textContent = y.nextButton;
  const p = g.indexOf(y.revealAfter) + y.revealAfter.length, d = matchMedia("(prefers-reduced-motion: reduce)");
  let n = "waiting", o;
  function m() {
    b.classList.add("is-visible"), b.inert = !1, b.removeAttribute("aria-hidden");
  }
  const i = new MutationObserver(() => {
    n === "typing" && e.textContent.length >= p && (m(), i.disconnect());
  });
  i.observe(e, { childList: !0, characterData: !0, subtree: !0 });
  function w() {
    m(), n = "ready", f.hidden = !1, i.disconnect();
  }
  function c() {
    if (!(s.inert && !s.dataset.entering || n !== "waiting")) {
      if (n = "typing", x.disconnect(), d.matches) {
        e.innerHTML = h, w();
        return;
      }
      o = new window.Typed(e, {
        strings: [h],
        typeSpeed: 65,
        backSpeed: 28,
        startDelay: 0,
        smartBackspace: !1,
        loop: !1,
        showCursor: !1,
        autoInsertCss: !1,
        contentType: "html",
        onComplete: w
      });
    }
  }
  const x = new MutationObserver(c);
  x.observe(s, { attributes: !0, attributeFilter: ["inert", "data-entering"] }), c(), s.dataset.ready = "true";
  function u() {
    n = "empty", r();
  }
  f.addEventListener("click", () => {
    if (n !== "ready") return;
    if (n = "erasing", f.hidden = !0, t.removeAttribute("aria-label"), t.focus({ preventScroll: !0 }), t.dataset.sizingText = g, d.matches) {
      e.textContent = "", u();
      return;
    }
    const l = e.textContent;
    o?.destroy(), e.textContent = l, o = new window.Typed(e, {
      strings: [""],
      backSpeed: 28,
      startDelay: 0,
      smartBackspace: !1,
      loop: !1,
      showCursor: !1,
      autoInsertCss: !1,
      contentType: "null",
      onComplete: u
    });
  }), d.addEventListener("change", () => {
    !d.matches || n === "waiting" || n === "empty" || (o?.destroy(), n === "erasing" ? (e.textContent = "", u()) : (e.innerHTML = h, w()));
  });
  function S() {
    return s.inert ? !1 : n === "typing" ? (o?.destroy(), e.innerHTML = h, w(), !0) : n === "erasing" ? (o?.destroy(), e.textContent = "", u(), !0) : !1;
  }
  s.addEventListener("click", (l) => {
    l.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || S() && l.stopImmediatePropagation();
  }), document.addEventListener("keydown", (l) => {
    l.code !== "Space" || l.repeat || l.metaKey || l.ctrlKey || l.altKey || l.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]') || S() && (l.preventDefault(), l.stopImmediatePropagation());
  });
}
const k = document.querySelector("#knowledge-volume"), O = document.querySelector("#knowledge-slot"), _ = document.querySelector("#pages"), U = () => {
  if (k.dataset.anchored) return;
  const r = O.getBoundingClientRect(), s = _.getBoundingClientRect();
  Object.assign(k.style, {
    left: `${r.left - s.left}px`,
    top: `${r.top - s.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`
  });
}, E = new ResizeObserver(U);
E.observe(O);
E.observe(document.querySelector(".demo-intro"));
E.observe(_);
document.querySelector("#demo").addEventListener("scroll", U, { passive: !0 });
function ae() {
  const [r, s] = T.useState([1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), e = T.useRef(null), [t, b] = T.useState("#000000"), f = T.useCallback((p) => {
    b(null), k.dataset.anchored = "true", k.classList.remove("is-visible");
    const d = () => {
      const n = document.querySelector("#demo .demo-heading").getBoundingClientRect();
      let o = Math.min(innerWidth * 0.42, innerHeight * 0.62), m = p.x * innerWidth - o / 2, i = p.y * innerHeight - o / 2;
      if (innerWidth > 760) {
        const w = n.right + 24;
        m < w && (m = w, o = Math.min(o, innerWidth - w - 16));
      } else i = Math.max(i, n.bottom + 16);
      m = Math.max(0, Math.min(innerWidth - o, m)), i = Math.max(0, Math.min(innerHeight - o, i)), Object.assign(k.style, { left: `${m}px`, top: `${i}px`, width: `${o}px`, height: `${o}px` });
    };
    d(), window.addEventListener("resize", d), _.inert = !1, document.body.classList.add("is-finale"), requestAnimationFrame(() => requestAnimationFrame(() => k.classList.add("is-visible")));
  }, []), g = T.useCallback((p) => new Promise((d) => {
    e.current = { vector: p, resolve: d }, s(p);
  }), []), h = T.useCallback((p) => {
    if (e.current?.vector !== p) return;
    const { resolve: d } = e.current;
    e.current = null, d();
  }, []);
  return T.useEffect(() => {
    se(ne({ update: g, anchor: f }));
  }, [g, f]), /* @__PURE__ */ K.jsx(
    J,
    {
      mastery: r,
      onMasterySettled: h,
      radius: 8,
      isolation: 45,
      surface: { color: "#FF1414", roughness: 0.42, metalness: 0.25 },
      autoRotate: !1,
      background: t
    }
  );
}
W.createRoot(k).render(/* @__PURE__ */ K.jsx(ae, {}));
