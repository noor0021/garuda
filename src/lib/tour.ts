/**
 * The guided tour's steps and start rule. The overlay itself is src/components/Tour.tsx, a
 * TypeScript port of the spotlight tour in Noor's MediCord project (TutorialOverlay.jsx).
 */
import { parseRoute } from './routes.ts';
import { STORAGE_KEYS } from './storage.ts';

/** What the app must be showing before a step can point at its target. */
export type TourScene = 'home' | 'search' | 'entry';

export type TourStep = {
  id: string;
  /** Matches [data-tour="…"]; null is the welcome card, which points at nothing on purpose. */
  target: string | null;
  scene: TourScene;
  /** Preferred side of the target for the caption; it flips when the measured card does not fit. */
  side: 'above' | 'below';
  title?: string;
  text: string;
};

/** The word the tour searches for, typed in Roman letters the way a learner would. */
export const TOUR_QUERY = 'dharam';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    scene: 'home',
    side: 'below',
    title: 'शब्द · Garuda Shabd',
    text: 'A Hindi–English dictionary that forgives spelling. Type a word in Hindi, in Roman letters or in English and it finds the entry. Here is a one-minute tour.',
  },
  { id: 'search', target: 'search', scene: 'search', side: 'below', text: 'Type the way you would say it. “dharam” is not a standard spelling, and it does not need to be.' },
  { id: 'preview', target: 'preview', scene: 'search', side: 'below', text: 'As you type, this line shows the Devanagari word your Roman letters point to.' },
  { id: 'chip', target: 'chip', scene: 'search', side: 'below', text: 'Every result says why it matched: an exact word, a spelling variant, the same sound, or a meaning.' },
  { id: 'entry-actions', target: 'entry-actions', scene: 'entry', side: 'below', text: 'Open a word to read it. Listen to it in a Hindi voice, or star it to keep it.' },
  { id: 'akshara', target: 'akshara', scene: 'entry', side: 'below', text: 'Read it letter by letter: each akshara hangs from the shirorekha with its sound beneath. Tap one to hear it.' },
  { id: 'saved-tab', target: 'saved-tab', scene: 'search', side: 'below', text: 'Starred words wait here. They stay on this device and work offline.' },
  { id: 'theme', target: 'theme', scene: 'search', side: 'below', text: 'Dark mode, text size and listening speed are in Settings. Tap ? to see this tour again.' },
];

export function tourSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.tourSeen) !== null;
  } catch {
    // Storage blocked (private mode): treat it as seen, or the tour would start on every visit.
    return true;
  }
}

export function markTourSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.tourSeen, '1');
  } catch {
    // Storage blocked: nothing to remember.
  }
}

/**
 * The tour starts by itself only on a first visit to the home page. A shared link to a word
 * (/w/:slug), a search or any other page opens as itself, with no tour over it.
 */
export function shouldAutoStartTour(pathname: string, search: string, seen: boolean): boolean {
  if (seen) return false;
  return parseRoute(pathname, search).name === 'home';
}

/** The index of the next step in `direction`, or -1 when the tour runs off either end. */
export function nextStepIndex(index: number, direction: 1 | -1, count = TOUR_STEPS.length): number {
  const next = index + direction;
  return next >= 0 && next < count ? next : -1;
}
