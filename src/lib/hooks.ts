import { useEffect, useState, useSyncExternalStore } from 'react';
import { getSettings, SPEECH_RATE } from './settings.ts';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsDesktop = () => useMediaQuery('(min-width: 900px)');

export function useOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('online', onChange);
      window.addEventListener('offline', onChange);
      return () => {
        window.removeEventListener('online', onChange);
        window.removeEventListener('offline', onChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

/**
 * The best Hindi voice the device has, or null. Voices load asynchronously in Chrome, so this
 * listens for `voiceschanged`. With no Hindi voice the Listen button is hidden (PLAN.md C7).
 */
export function useHindiVoice(): SpeechSynthesisVoice | null {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const pick = () => {
      const voices = synth.getVoices();
      // Android reports "hi_IN"; some engines report just "hi".
      const lang = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace('_', '-');
      const found = voices.find((v) => lang(v) === 'hi-in') ?? voices.find((v) => lang(v).startsWith('hi')) ?? null;
      setVoice((current) => found ?? current);
    };
    pick();
    // Voices load late on Chrome and Android, and not every browser fires (or even supports
    // listening for) `voiceschanged`, so listen where possible and also look again a few times.
    synth.addEventListener?.('voiceschanged', pick);
    const retries = [250, 1000, 3000].map((ms) => window.setTimeout(pick, ms));
    return () => {
      synth.removeEventListener?.('voiceschanged', pick);
      retries.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);
  return voice;
}

/** Held until it ends: Chrome can garbage-collect an utterance mid-word and cut the speech off. */
let speaking: SpeechSynthesisUtterance | null = null;

export function speakHindi(text: string, voice: SpeechSynthesisVoice): void {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN';
  utterance.voice = voice;
  utterance.rate = SPEECH_RATE[getSettings().speechRate]; // Settings → Listen speed
  utterance.onend = utterance.onerror = () => {
    if (speaking === utterance) speaking = null;
  };
  speaking = utterance;
  const start = () => {
    if (speaking !== utterance) return; // a newer tap has replaced this one
    if (synth.paused) synth.resume(); // Chrome can be left paused, which silences every later word
    synth.speak(utterance);
  };
  // cancel() followed at once by speak() can drop the new word in Chrome and Safari, so cancel
  // only when something is playing or queued, and then start a moment later.
  if (synth.speaking || synth.pending) {
    synth.cancel();
    window.setTimeout(start, 80);
  } else {
    start();
  }
}
