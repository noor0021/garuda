import { describe, expect, it } from 'vitest';
import { compareVarnamala, firstLetter, VARNAMALA } from '../src/lib/varnamala.ts';
import { dataset } from './fixtures.ts';

describe('वर्णमाला', () => {
  it('has the 47 letters of the plan, with क्ष त्र ज्ञ at the end', () => {
    expect(VARNAMALA).toHaveLength(47);
    expect(VARNAMALA.slice(-3)).toEqual(['क्ष', 'त्र', 'ज्ञ']);
  });

  it('files conjunct initials under their own letter', () => {
    expect(firstLetter('क्षमा')).toBe('क्ष');
    expect(firstLetter('त्रुटि')).toBe('त्र');
    expect(firstLetter('ज्ञान')).toBe('ज्ञ');
    expect(firstLetter('कर्म')).toBe('क');
    expect(firstLetter('श्रद्धा')).toBe('श');
  });

  it('sorts vowels before consonants, and conjunct letters after ह', () => {
    const words = ['ज्ञान', 'हवा', 'क्षमा', 'अग्नि', 'कर्म', 'आज', 'ऋषि', 'त्रुटि', 'शब्द', 'सत्य'];
    expect([...words].sort(compareVarnamala)).toEqual([
      'अग्नि', 'आज', 'ऋषि', 'कर्म', 'शब्द', 'सत्य', 'हवा', 'क्षमा', 'त्रुटि', 'ज्ञान',
    ]);
  });

  it('within a letter, sorts by matra the way a printed dictionary does', () => {
    const words = ['कहानी', 'किताब', 'काम', 'कपड़ा'];
    expect([...words].sort(compareVarnamala)).toEqual(['कपड़ा', 'कहानी', 'काम', 'किताब']);
  });

  it('can file every headword in the dataset', () => {
    for (const entry of dataset.entries) expect(firstLetter(entry.headword)).not.toBe('');
  });
});
