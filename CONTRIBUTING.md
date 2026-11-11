# Adding or editing a word

This guide is for Garuda's editors. You need [Node 22+](https://nodejs.org) and a copy of this repository; run `npm install` once.

All words live in **`public/data/entries.json`**, one entry per line:

```json
{"id":130,"headword":"किसान","transliteration":"kisāna","romanised":["kisan","kisaan"],"pos":"noun (m.)","meanings":["farmer","cultivator"],"example":"किसान सुबह खेत जाता है।"},
```

## Steps

1. **Pick the next id:** one more than the highest id in the file. Never reuse or renumber ids: saved words on readers' phones refer to them.
2. **Headword:** the Devanagari word, one word, in standard Hindi spelling. Use the nukta only where Hindi writes it (ज़िंदगी, सफ़ेद).
3. **Transliteration:** don't type it. Run

   ```bash
   npm run iast -- किसान
   ```

   and paste what it prints. It is IAST with the inherent *a* kept (*kisāna*, *karanā*) and the anusvara written as the matching nasal (शांति → *śānti*).
4. **Romanised:** 2–4 spellings that people really type on WhatsApp or Google, in lowercase a–z only: `kisan`, `kisaan`. Do not invent unpronounceable spellings, and do not use a spelling that is a common English word (`man`, `din`, `rat`): readers typing those want the English word. The **first** spelling becomes the word's web address (`/w/kisan`), so make it the most common one, and don't change it later.
5. **pos:** one of `noun (m.)`, `noun (f.)`, `verb`, `adjective`, `adverb`, `pronoun`, `postposition`, `conjunction`, `interjection`, `numeral`. Nouns always take their gender **as Hindi uses it**, not Sanskrit (आत्मा and अग्नि are feminine).
6. **Meanings:** English, most common first. Verbs start with "to" (`to read`). Each meaning is searchable: a reader typing `farmer` will find किसान.
7. **Example:** a short, natural, everyday Hindi sentence that contains the headword **exactly as written** and ends with । ? or !. For verbs, use the infinitive in the sentence (मुझे पढ़ना पसंद है।).
8. **Check it:**

   ```bash
   npm run validate
   ```

   It prints a summary (counts by part of speech and by letter) and then either `✓ Dataset is valid` or a list of problems, each naming the entry:

   ```
   ✖ 2 problems:
     - id 130 किसान: transliteration is "kisan", expected "kisāna"
     - id 130 किसान: spelling "kisan" collides with id 87 किसन
   ```

   Fix every problem in the data and run it again. The build and CI refuse a file with problems, so a broken word can never reach readers.
9. Optionally run `npm run dev`, open http://localhost:5173 and search for the new word with each of its spellings.
10. Commit with a message such as `data: add किसान` and open a pull request. CI runs the same checks.

## What the validator checks

- Every field is present and well-formed; ids, headwords and spellings are unique.
- The transliteration matches `npm run iast`.
- Spellings are lowercase a–z, 2–4 per word, not common English words, and not equal to another word's transliteration.
- Searching each spelling brings up its own word first.
- The example contains the headword; the part of speech is from the list; nouns have a gender.

## Editing an existing word

Change the line in place and run `npm run validate`. Keep the `id` and the first romanised spelling as they are; both are used by readers' saved words and shared links. To retire a word, delete its line; saved copies on readers' phones quietly disappear rather than breaking.

## Publishing

When a change is merged into `main`, Vercel deploys it. Readers who have the app installed see "New version available · Refresh", and the new words then work offline too. When you change the dataset, increase `version` in the file (`1.0.0` → `1.1.0`); the home screen shows it, so readers and editors can tell which edition they have.
