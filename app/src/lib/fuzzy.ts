/**
 * Fuzzy text-matching utilities used by the voice-driven slide auto-advance.
 *
 * Everything here is dependency-free and deterministic so it can be unit-tested
 * in isolation and run cheaply on every speech-recognition result.
 */

export interface SlideMatch {
  slideIndex: number;
  lineIndex: number;
  score: number;
}

/**
 * Normalizes a piece of text for comparison:
 * - removes diacritics/accents (á → a, ç → c)
 * - lowercases
 * - strips punctuation (anything that is not a letter, digit or whitespace)
 * - collapses runs of whitespace and trims
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/** Builds the multiset of character bigrams of a string. */
function bigrams(value: string): Map<string, number> {
  const grams = new Map<string, number>();
  for (let i = 0; i < value.length - 1; i++) {
    const gram = value.slice(i, i + 2);
    grams.set(gram, (grams.get(gram) ?? 0) + 1);
  }
  return grams;
}

/**
 * Similarity between two strings in the [0, 1] range using the Sørensen–Dice
 * coefficient over character bigrams (an n-gram approach). The inputs are
 * normalized first, so case, accents and punctuation are ignored.
 *
 * - identical (non-empty) strings → 1
 * - strings with nothing in common → 0
 * - partial overlap → a value strictly between 0 and 1
 */
export function similarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);

  if (na.length === 0 || nb.length === 0) return 0;
  if (na === nb) return 1;
  // Single-character strings have no bigrams; fall back to equality.
  if (na.length < 2 || nb.length < 2) return na === nb ? 1 : 0;

  const aGrams = bigrams(na);
  const bGrams = bigrams(nb);

  let aTotal = 0;
  for (const count of aGrams.values()) aTotal += count;

  let bTotal = 0;
  let intersection = 0;
  for (const [gram, count] of bGrams) {
    bTotal += count;
    const inA = aGrams.get(gram);
    if (inA) intersection += Math.min(inA, count);
  }

  return (2 * intersection) / (aTotal + bTotal);
}

/**
 * Best similarity between a single `line` and the most relevant slice of a
 * (possibly long, accumulated) `transcript`.
 *
 * Speech recognition produces a growing buffer, so comparing the whole buffer
 * against a short line would unfairly dilute the score. We therefore slide a
 * word-window roughly the size of the line across the transcript and keep the
 * best match.
 */
export function scoreLine(transcript: string, line: string): number {
  const normLine = normalizeText(line);
  const normTranscript = normalizeText(transcript);
  if (!normLine || !normTranscript) return 0;

  // Whole-buffer comparison as a baseline.
  let best = similarity(normTranscript, normLine);
  if (best === 1) return 1;

  const transcriptWords = normTranscript.split(" ");
  const lineWordCount = normLine.split(" ").length;

  // Try window sizes around the line length to tolerate insertions/deletions
  // introduced by the recognizer.
  const sizes = new Set<number>();
  for (const size of [lineWordCount - 1, lineWordCount, lineWordCount + 1, lineWordCount + 2]) {
    if (size >= 1 && size <= transcriptWords.length) sizes.add(size);
  }

  for (const size of sizes) {
    for (let start = transcriptWords.length - size; start >= 0; start--) {
      const windowText = transcriptWords.slice(start, start + size).join(" ");
      const score = similarity(windowText, normLine);
      if (score > best) {
        best = score;
        if (best === 1) return 1;
      }
    }
  }

  return best;
}

/**
 * Finds the slide + line that best matches the given transcript.
 *
 * `slides` is an array of slides, each being an array of text lines. The
 * returned `score` is in [0, 1]; when no slide/line is available the indices
 * are -1 and the score is 0.
 */
export function matchSlide(transcript: string, slides: string[][]): SlideMatch {
  let best: SlideMatch = { slideIndex: -1, lineIndex: -1, score: 0 };

  for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
    const lines = slides[slideIndex];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const score = scoreLine(transcript, lines[lineIndex]);
      if (score > best.score) {
        best = { slideIndex, lineIndex, score };
      }
    }
  }

  return best;
}
