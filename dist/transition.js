// Both pages must be mounted and ready before navigate() is called.
// The viewer calls tick() in its render loop: geometry and clipping share a frame.
export function createSkateboardTransition({ pages, viewer, duration = 1400 }) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = pages.find(page => !page.inert);
  let flight = null;

  function _finish() {
    const { incoming, outgoing, resolve } = flight;
    outgoing.style.clipPath = 'inset(0 100% 0 0)';
    incoming.style.clipPath = 'inset(0)';
    incoming.inert = false;
    incoming.removeAttribute('aria-hidden');
    current = incoming;
    flight = null;
    viewer.finish(current.id);
    document.body.classList.remove('is-transitioning');
    current.querySelector('[data-page-heading]')?.focus({ preventScroll: true });
    resolve(true);
  }

  return {
    navigate(incoming) {
      if (flight || incoming === current || !pages.includes(incoming)) return Promise.resolve(false);
      return new Promise(resolve => {
        flight = { incoming, outgoing: current, start: performance.now(), resolve };
        current.inert = true;
        current.setAttribute('aria-hidden', 'true');
        incoming.style.clipPath = 'inset(0 100% 0 0)';
        document.body.classList.add('is-transitioning');
        viewer.begin();
        if (motion.matches) _finish();
      });
    },
    tick(time) {
      if (!flight) return false;
      const progress = Math.min(1, Math.max(0, (time - flight.start) / duration));
      const eased = progress * progress * (3 - 2 * progress);
      // The projected trailing edge returned by the viewer is the only boundary.
      const x = viewer.move(eased);
      const width = document.documentElement.clientWidth;
      flight.incoming.style.clipPath = `inset(0 ${Math.max(0, width - x)}px 0 0)`;
      flight.outgoing.style.clipPath = `inset(0 0 0 ${x}px)`;
      if (progress === 1 || motion.matches) _finish();
      return true;
    },
    get active() { return flight !== null; }
  };
}
