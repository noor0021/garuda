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
      setVoice(voices.find((v) => v.lang === 'hi-IN') ?? voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ?? null);
    };
    pick();
    synth.addEventListener('voiceschanged', pick);
    return () => synth.removeEventListener('voiceschanged', pick);
  }, []);
  return voice;
}

export function speakHindi(text: string, voice: SpeechSynthesisVoice): void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN';
  utterance.voice = voice;
  utterance.rate = SPEECH_RATE[getSettings().speechRate]; // Settings → Listen speed
  synth.speak(utterance);
}
