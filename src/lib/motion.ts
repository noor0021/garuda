/**
 * Motion (PLAN.md C7). GSAP is loaded lazily, after the dictionary is ready, so it never sits on
 * the critical path. Every helper is a no-op when:
 *   - the user prefers reduced motion (checked at call time, so a settings change applies at once)
 *   - GSAP has not loaded yet: content then simply appears. Motion never delays content.
 */
type Gsap = typeof import('gsap').gsap;

let gsap: Gsap | null = null;
let loading: Promise<void> | null = null;

export function preloadMotion(): void {
  loading ??= import('gsap').then((module) => {
    gsap = module.gsap;
  }).catch(() => {
    // Offline before the chunk was cached, or blocked: the app works without motion.
  });
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Runs `animate` inside a gsap.context scoped to `scope`. Returns a cleanup that reverts it. */
export function animate(scope: Element | null, animateFn: (g: Gsap) => void): () => void {
  if (!gsap || !scope || reduced()) return () => undefined;
  const g = gsap;
  const context = g.context(() => animateFn(g), scope);
  return () => context.revert();
}

/** Result rows: fade + rise 8px, 30ms stagger, only rows that were not already showing. */
export function animateRows(scope: Element | null, rows: Element[]): () => void {
  if (rows.length === 0) return () => undefined;
  return animate(scope, (g) => {
    g.fromTo(
      rows.slice(0, 10),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out', clearProps: 'opacity,transform', lazy: false },
    );
  });
}

export function animateFadeIn(element: Element | null, duration = 0.15): () => void {
  return animate(element, (g) => {
    if (element) g.fromTo(element, { opacity: 0 }, { opacity: 1, duration, ease: 'power1.out', clearProps: 'opacity', lazy: false });
  });
}

/** Entry sheet: slides up with power3.out while the scrim fades in. Returns a cleanup. */
export function animateSheetIn(sheet: Element, scrim: Element): () => void {
  return animate(sheet.parentElement, (g) => {
    g.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'power3.out', clearProps: 'transform', lazy: false });
    g.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out', clearProps: 'opacity', lazy: false });
  });
}

/** Save star: a scale pop and a marigold ring that grows and fades. */
export function animateSaved(star: HTMLElement): void {
  const ring = star.querySelector('.star-ring');
  const cleanup = animate(star, (g) => {
    g.fromTo(star.querySelector('svg'), { scale: 0.55 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', clearProps: 'transform' });
    if (ring) g.fromTo(ring, { scale: 0.4, opacity: 0.9 }, { scale: 1.5, opacity: 0, duration: 0.3, ease: 'power2.out' });
  });
  window.setTimeout(cleanup, 400); // release the context once the 0.3s pop is over
}
