import { useEffect, useRef } from 'react';
import { loadMotion, type Gsap } from '../lib/motion.ts';
import { motionDisabled } from '../lib/settings.ts';
import { STORAGE_KEYS } from '../lib/storage.ts';

/** Searches the intro plays, to show in three seconds what the dictionary does. */
const DEMO = [
  ['dharam', 'धर्म'],
  ['vishvaas', 'विश्वास'],
  ['peace', 'शांति'],
] as const;

const DURATION = 3; // seconds before the intro hands over to the home page
export const REPLAY_INTRO_EVENT = 'shabd:intro';

/**
 * The landing intro (an overlay on the home page). Whether it shows is decided before first paint
 * by the inline script in index.html, which sets <html data-intro="show"> on the first visit of a
 * session to "/". Its markup is always rendered (also into the prerendered HTML), and CSS shows it
 * only while data-intro is "show" or "play", so hydration never mismatches.
 *
 * States: "show" = painted, secondary elements hidden by CSS until GSAP is ready (a CSS fallback
 * reveals them after 1.5 s and hides the whole intro after 6 s if JavaScript never runs);
 * "play" = this component runs the GSAP timeline (or a still card when motion is off);
 * "done" = hidden, home page in use.
 * The big शब्द is never animated: it is visible from the first paint (the page's LCP).
 */
export function Landing() {
  const landing = useRef<HTMLDivElement>(null);
  const finishRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const html = document.documentElement;
    let cleanup = () => undefined as void;

    const play = () => {
      const element = landing.current;
      if (!element) return;
      cleanup();
      // Stay in "show" (secondary elements hidden by CSS) until GSAP is ready, then switch to
      // "play" and start the timeline in the same task, so nothing flashes in between.
      html.dataset.intro = motionDisabled() ? 'play' : 'show';
      try {
        window.sessionStorage.setItem(STORAGE_KEYS.introSeen, '1');
      } catch {
        // Storage blocked: the inline script then treats the intro as already seen next time.
      }
      const app = document.querySelector('.app');
      app?.setAttribute('inert', '');
      // Keyboard-sized screens: focus "Start searching" so Enter continues. Phones: no focus ring.
      if (window.matchMedia('(min-width: 900px)').matches) element.querySelector<HTMLButtonElement>('.landing-cta')?.focus({ preventScroll: true });

      let done = false;
      let gsap: Gsap | null = null;
      let context: ReturnType<Gsap['context']> | null = null;
      let timer = 0;

      const end = () => {
        html.dataset.intro = 'done';
        element.style.animation = '';
        app?.removeAttribute('inert');
        context?.revert();
        // Hand over: on a keyboard device put the cursor in the search box; on a phone do not
        // focus it, which would pop up the keyboard over the home page.
        if (window.matchMedia('(min-width: 900px)').matches) document.getElementById('search-input')?.focus();
        else (document.activeElement as HTMLElement | null)?.blur();
      };

      const finish = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        window.removeEventListener('keydown', onKey);
        if (gsap && context && html.dataset.intro === 'play' && !motionDisabled()) {
          context.add(() => {
            gsap?.to(element, { opacity: 0, y: -20, duration: 0.45, ease: 'power2.in', onComplete: end });
          });
        } else end();
      };
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') finish();
      };
      window.addEventListener('keydown', onKey);
      finishRef.current = finish;

      if (motionDisabled()) {
        timer = window.setTimeout(finish, 1600); // no animation: a short, still title card
      } else {
        void loadMotion().then((g) => {
          if (done) return;
          if (!g) {
            html.dataset.intro = 'play'; // shown still, without animation
            timer = window.setTimeout(finish, 1600);
            return;
          }
          gsap = g;
          element.style.animation = 'none'; // JS is in charge now: cancel the CSS fallback timers
          html.dataset.intro = 'play';
          context = g.context(() => {
            const q = <T extends Element>(selector: string) => [...element.querySelectorAll<T>(selector)];
            const tl = g.timeline({ defaults: { ease: 'power3.out', lazy: false } });
            // The origin is fixed in SVG units (the middle of the bar's underside) while the paths are
            // still at full size. Setting it on paths already scaled to 0 made GSAP offset them to
            // compensate, which left the wing above the bar instead of hanging from it.
            g.set(q('.landing-feather'), { svgOrigin: '16 10' });
            tl.fromTo(q('.landing-feather'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'back.out(1.7)' }, 0)
              .fromTo(q('.landing-rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.7 }, 0.25)
              .fromTo(q('.landing-name, .landing-tagline'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, 0.35)
              .fromTo(q('.landing-cta, .landing-skip'), { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.7)
              .fromTo(q('.landing-progress span'), { scaleX: 0 }, { scaleX: 1, duration: DURATION, ease: 'none' }, 0);
            const items = q('.landing-demo-item');
            tl.set(q('.landing-demo'), { opacity: 1 }, 0);
            items.forEach((item, i) => {
              const at = 0.8 + i * 0.7;
              tl.fromTo(item, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, at);
              if (i < items.length - 1) tl.to(item, { y: -14, opacity: 0, duration: 0.3, ease: 'power2.in' }, at + 0.5);
            });
            tl.call(finish, [], DURATION);
          }, element);
        });
      }

      cleanup = () => {
        done = true;
        window.clearTimeout(timer);
        window.removeEventListener('keydown', onKey);
        context?.revert();
      };
    };

    if (html.dataset.intro === 'show') play();
    const onReplay = () => play();
    window.addEventListener(REPLAY_INTRO_EVENT, onReplay);
    return () => {
      cleanup();
      window.removeEventListener(REPLAY_INTRO_EVENT, onReplay);
    };
  }, []);

  return (
    <div ref={landing} className="landing" role="region" aria-label="Welcome to Garuda Shabd">
      <button type="button" className="landing-skip" data-anim onClick={() => finishRef.current()}>
        Skip
      </button>
      <div className="landing-center">
        <svg className="landing-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path className="landing-feather" fill="var(--ink)" d="M3 5h26v5H3z" />
          <path className="landing-feather" d="M16.5 10h5v7c0 8-7.5 11.5-17.5 11 7-1.5 12.5-5 12.5-11z" />
        </svg>
        <p className="landing-hero" lang="hi">शब्द</p>
        <span className="landing-rule" aria-hidden="true" />
        <p className="landing-name" data-anim>Garuda Shabd</p>
        <p className="landing-tagline" data-anim>Garuda Prakashan’s Hindi–English dictionary</p>
        <div className="landing-demo" aria-hidden="true">
          {DEMO.map(([typed, headword]) => (
            <p key={typed} className="landing-demo-item">
              <span className="landing-typed">{typed}</span>
              <span className="landing-arrow">→</span>
              <span lang="hi">{headword}</span>
            </p>
          ))}
        </div>
        <button type="button" className="button landing-cta" data-anim onClick={() => finishRef.current()}>
          Start searching
        </button>
      </div>
      <div className="landing-progress" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
