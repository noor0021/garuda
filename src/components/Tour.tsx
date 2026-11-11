import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motionDisabled } from "../lib/settings.ts";
import {
  nextStepIndex,
  TOUR_QUERY,
  TOUR_STEPS,
  type TourScene,
} from "../lib/tour.ts";
import { GarudaMark } from "./GarudaMark.tsx";

/**
 * The guided tour: a TypeScript port of the spotlight tour in Noor's MediCord project
 * (src/components/TutorialOverlay.jsx). The mechanics are the same: an SVG-mask spotlight with a
 * pulsing ring, a caption card that travels with the spotlight on one easing, flips above or below
 * its target by its measured height and carries a tail, tap-anywhere to advance, a HUD with pips
 * and Skip, steps that set the scene first, auto-skip of missing targets and scroll-into-view.
 *
 * What changed for this app:
 * - It is a native <dialog> opened with showModal(), like the entry sheet, so it sits in the top
 *   layer. The entry sheet is also a modal dialog, so after a step opens it the tour re-opens
 *   itself to get back on top of it (`restack`).
 * - Steps name a scene (home, search, entry) instead of a one-way action, so Back works too.
 * - It is rendered once in App, outside the router's screens, so it survives route changes.
 * - Square corners and a shirorekha on the card; the Garuda-wing mark instead of a mascot.
 */

type Rect = { top: number; left: number; width: number; height: number };

export type TourActions = {
  /** Puts `query` in the search box and shows its results (closing an open entry). */
  search: (query: string) => void;
  /** Opens the entry for the tour's word. */
  openEntry: () => void;
  /** Ends the demo: closes the entry, clears the search and focuses the search box. */
  restore: () => void;
};

type Props = {
  open: boolean;
  /** What the app is showing now, so a step only changes the scene when it has to. */
  scene: TourScene;
  query: string;
  actions: TourActions;
  onClose: () => void;
};

const PAD = 8;
const TAIL = 10;
const GAP = PAD + TAIL;
const HUD_SPACE = 132;
/** One easing for the spotlight and the card, so they arrive together. */
const MOVE = "0.42s cubic-bezier(0.22, 1, 0.36, 1)";

const clamp = (value: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(value, Math.max(lo, hi)));

function findTarget(target: string): HTMLElement | null {
  // Only a rendered element can be pointed at: a hidden match has an all-zero rectangle.
  const all = [
    ...document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`),
  ];
  return (
    all.find(
      (element) => element.offsetWidth > 0 && element.offsetHeight > 0,
    ) ?? null
  );
}

const rectOf = (element: HTMLElement): Rect => {
  const r = element.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

export function Tour({ open, scene, query, actions, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const restacking = useRef(false);
  const direction = useRef<1 | -1>(1);
  // The latest app state and callbacks, read inside timers without re-running the step effect.
  const live = useRef({ scene, query, actions, onClose });
  useLayoutEffect(() => {
    live.current = { scene, query, actions, onClose };
  });

  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [placed, setPlaced] = useState(false);
  const [captionVisible, setCaptionVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState(120);
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined"
      ? { width: 375, height: 700 }
      : { width: window.innerWidth, height: window.innerHeight },
  );
  const still = open && motionDisabled();

  const step = TOUR_STEPS[index] ?? TOUR_STEPS[0]!;

  // The card is placed by its top edge, so a card above its target needs its own height first.
  useLayoutEffect(() => {
    const height = card.current?.offsetHeight;
    if (height && Math.abs(height - cardHeight) > 1) setCardHeight(height);
  }, [index, viewport.width, cardHeight]);

  const finish = useCallback(() => {
    // Reset here, in the handler, so the next run starts from the welcome card.
    setIndex(0);
    setRect(null);
    setPlaced(false);
    setCaptionVisible(false);
    direction.current = 1;
    live.current.actions.restore();
    live.current.onClose();
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      direction.current = dir;
      setCaptionVisible(false);
      setIndex((current) => {
        const target = nextStepIndex(current, dir);
        if (target === -1 && dir === 1) window.setTimeout(finish, 0);
        return target === -1 ? current : target;
      });
    },
    [finish],
  );

  // Open and close the dialog with the tour.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open) {
      if (!element.open) element.showModal();
    } else if (element.open) {
      element.close();
    }
  }, [open]);

  // One step: set the scene, wait for it, then find, scroll to and measure the target.
  useEffect(() => {
    if (!open) return;
    const current = TOUR_STEPS[index];
    if (!current) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) =>
        timers.push(window.setTimeout(resolve, ms)),
      );
    const reduced = motionDisabled();

    const setScene = async (): Promise<number> => {
      const now = live.current;
      if (current.scene === "home") return 80;
      if (current.scene === "entry") {
        if (now.scene === "entry") return 80;
        if (now.query.trim() !== TOUR_QUERY) now.actions.search(TOUR_QUERY);
        now.actions.openEntry();
        return reduced ? 200 : 650; // the sheet has to mount and slide in before it can be measured
      }
      if (now.scene === "entry") {
        now.actions.search(TOUR_QUERY);
        return 300;
      }
      if (now.query.trim() === TOUR_QUERY) return 80;
      if (reduced) {
        now.actions.search(TOUR_QUERY);
        return 120;
      }
      // Typed for real, a letter at a time, so the results arrive the way they will for the reader.
      for (let i = 1; i <= TOUR_QUERY.length; i++) {
        if (cancelled) return 0;
        live.current.actions.search(TOUR_QUERY.slice(0, i));
        await wait(70);
      }
      return 160;
    };

    const measure = () => {
      if (!current.target) return setRect(null);
      const element = findTarget(current.target);
      if (element) setRect(rectOf(element));
    };

    void (async () => {
      await wait(await setScene());
      if (cancelled) return;
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      // The entry sheet is a modal dialog too; whichever opened last is on top. Re-open on top.
      const element = dialog.current;
      if (element) {
        restacking.current = true;
        if (element.open) element.close();
        element.showModal();
        restacking.current = false;
        next.current?.focus({ preventScroll: true });
      }
      if (current.target) {
        const target = findTarget(current.target);
        if (!target) {
          // Nothing on screen matches this step (for example a feature that is not shipped):
          // skipping beats a spotlight over empty space.
          go(direction.current);
          return;
        }
        const box = target.getBoundingClientRect();
        if (box.top < 64 || box.bottom > window.innerHeight - 64) {
          target.scrollIntoView({
            block: "center",
            behavior: reduced ? "auto" : "smooth",
          });
          await wait(reduced ? 60 : 460);
          if (cancelled) return;
        }
      }
      measure();
      setPlaced(true);
      await wait(reduced ? 0 : 160);
      if (!cancelled) setCaptionVisible(true);
    })();

    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      measure();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, index, go]);

  // ── Geometry (as in the MediCord original, without the "stand beside" case) ──
  const { width: vw, height: vh } = viewport;
  const shown = step.target ? rect : null;
  const cardWidth = Math.min(step.target ? 360 : 340, vw - 24);
  let side = step.side;
  if (shown) {
    const need = cardHeight + GAP + 12;
    const above = shown.top;
    const below = vh - (shown.top + shown.height) - HUD_SPACE;
    if (side === "below" && below < need && above >= need) side = "above";
    else if (side === "above" && above < need) side = "below";
  }
  const cx = shown ? shown.left + shown.width / 2 : vw / 2;
  const cardLeft = clamp(cx - cardWidth / 2, 12, vw - cardWidth - 12);
  const cardTop = !shown
    ? clamp(vh * 0.24, 16, vh - cardHeight - HUD_SPACE)
    : side === "above"
      ? clamp(shown.top - GAP - cardHeight, 12, vh - cardHeight - HUD_SPACE)
      : clamp(shown.top + shown.height + GAP, 12, vh - cardHeight - HUD_SPACE);
  // A tail is only honest when the card is outside the light.
  const overlaps =
    shown !== null &&
    cardTop < shown.top + shown.height + PAD &&
    cardTop + cardHeight > shown.top - PAD;
  const tailAt =
    shown && !overlaps ? clamp(cx - cardLeft, 20, cardWidth - 20) : null;

  const spot = shown
    ? {
        x: shown.left - PAD,
        y: shown.top - PAD,
        width: shown.width + PAD * 2,
        height: shown.height + PAD * 2,
      }
    : { x: vw / 2, y: vh / 2, width: 0, height: 0 };
  const moving = placed && !still;
  const last = index === TOUR_STEPS.length - 1;

  return (
    <dialog
      ref={dialog}
      className={`tour${placed ? " tour-placed" : ""}${still ? " tour-still" : ""}`}
      aria-label="Guided tour"
      onCancel={(event) => {
        // Esc ends the tour and puts the app back as it was.
        event.preventDefault();
        finish();
      }}
    >
      {open && (
        <div
          className="tour-stage"
          role="presentation"
          onClick={() => go(1)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") go(1);
            else if (event.key === "ArrowLeft") go(-1);
          }}
        >
          <svg className="tour-scrim" aria-hidden="true">
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  {...spot}
                  fill="black"
                  style={{
                    transition: moving
                      ? `x ${MOVE}, y ${MOVE}, width ${MOVE}, height ${MOVE}`
                      : "none",
                  }}
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" mask="url(#tour-mask)" />
          </svg>

          <div
            className="tour-ring"
            aria-hidden="true"
            style={{
              left: spot.x,
              top: spot.y,
              width: spot.width,
              height: spot.height,
              opacity: placed && shown ? 1 : 0,
              transition: moving
                ? `left ${MOVE}, top ${MOVE}, width ${MOVE}, height ${MOVE}, opacity 0.25s ease`
                : "none",
            }}
          />

          <div
            ref={card}
            className={`tour-card${captionVisible ? " tour-card-in" : ""}`}
            style={{
              left: cardLeft,
              top: cardTop,
              width: cardWidth,
              transition: moving
                ? `left ${MOVE}, top ${MOVE}, opacity 0.28s ease, transform 0.28s ease`
                : "none",
            }}
          >
            {tailAt !== null && (
              <span
                className={`tour-tail tour-tail-${side}`}
                style={{ left: tailAt - TAIL }}
                aria-hidden="true"
              />
            )}
            <GarudaMark size={step.target ? 28 : 40} />
            <div className="tour-text" aria-live="polite">
              {step.title && <p className="tour-title">{step.title}</p>}
              <p>{step.text}</p>
            </div>
          </div>

          <div className="tour-hud">
            <p className="tour-hint">Tap anywhere to continue</p>
            <ol
              className="tour-pips"
              aria-label={`Step ${index + 1} of ${TOUR_STEPS.length}`}
            >
              {TOUR_STEPS.map((item, i) => (
                <li
                  key={item.id}
                  className={
                    i === index
                      ? "is-current"
                      : i < index
                        ? "is-done"
                        : undefined
                  }
                />
              ))}
            </ol>
            <div className="tour-buttons">
              <button
                type="button"
                className="tour-button"
                onClick={(event) => {
                  event.stopPropagation();
                  finish();
                }}
              >
                Skip
              </button>
              <button
                ref={next}
                type="button"
                className="tour-button tour-button-next"
                onClick={(event) => {
                  event.stopPropagation();
                  go(1);
                }}
              >
                {last ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
