import { readFileSync } from 'node:fs';
import type { Dataset } from '../src/lib/types.ts';

/** The real dataset: tests run against the words Garuda will ship, not a toy list. */
export const dataset = JSON.parse(readFileSync('public/data/entries.json', 'utf8')) as Dataset;

/** 20 mixed queries for timing: Devanagari, romanised, misspelt, English, prefixes, misses. */
export const MIXED_QUERIES = [
  'धर्म', 'dharam', 'shaanti', 'gyan', 'vishvas', 'prakesh', 'vruksh', 'peace', 'Shanti ', 'sh',
  'श', 'शान्ति', 'water', 'pehad', 'kitaab', 'to eat', 'sanskruti', 'xyzq', 'mahatvapurn', 'प्रकास',
];
