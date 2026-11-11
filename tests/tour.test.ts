import { describe, expect, it } from 'vitest';
import { nextStepIndex, shouldAutoStartTour, TOUR_STEPS } from '../src/lib/tour.ts';

describe('guided tour', () => {
  it('starts by itself on a first visit to the home page', () => {
    expect(shouldAutoStartTour('/', '', false)).toBe(true);
  });

  it('does not auto-start once it has been seen', () => {
    expect(shouldAutoStartTour('/', '', true)).toBe(false);
  });

  it.each([['/w/dharm', ''], ['/search', '?q=dharam'], ['/saved', ''], ['/letter/%E0%A4%95', ''], ['/nope', '']])(
    'never starts on %s%s, even on a first visit',
    (path, search) => {
      expect(shouldAutoStartTour(path, search, false)).toBe(false);
    },
  );

  it('walks the steps in the order the brief gives', () => {
    expect(TOUR_STEPS.map((step) => step.id)).toEqual(['welcome', 'search', 'preview', 'chip', 'entry-actions', 'akshara', 'saved-tab', 'theme']);
    expect(TOUR_STEPS[0]?.target).toBeNull();
    expect(TOUR_STEPS.at(-1)?.text).toContain('Tap ?');
  });

  it('stops at both ends', () => {
    expect(nextStepIndex(0, -1)).toBe(-1);
    expect(nextStepIndex(0, 1)).toBe(1);
    expect(nextStepIndex(TOUR_STEPS.length - 1, 1)).toBe(-1);
  });
});
