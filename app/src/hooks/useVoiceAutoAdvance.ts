import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { matchSlide, normalizeText, scoreLine } from "@/lib/fuzzy";

/* -------------------------------------------------------------------------- */
/* Minimal Web Speech API typings                                             */
/* The standard TS DOM lib does not ship SpeechRecognition types, so we       */
/* declare just enough of the surface we use here.                            */
/* -------------------------------------------------------------------------- */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/* -------------------------------------------------------------------------- */
/* Tunable thresholds (all scores are in the [0, 1] range)                    */
/* -------------------------------------------------------------------------- */

/** Last-line score (final result) needed to advance one slide. */
const FINAL_ADVANCE_THRESHOLD = 0.6;
/** Same, but stricter for interim (non-final) results. */
const INTERIM_ADVANCE_THRESHOLD = 0.7;
/**
 * Fallback when the recognizer mishears the final word (e.g. "Prevaleceu" heard
 * as "por favor"): advance if the WHOLE slide has been covered — the analyzed
 * speech matches the entire slide text this well AND spans at least as many
 * words as the slide. Stricter than the last-line trigger so it can't fire
 * mid-slide.
 */
const WHOLE_SLIDE_FINAL_THRESHOLD = 0.7;
/** Same, but stricter for interim (non-final) results. */
const WHOLE_SLIDE_INTERIM_THRESHOLD = 0.8;
/** How much better another slide must score to trigger an error-correction jump. */
const CORRECTION_MARGIN = 0.2;
/**
 * Jumping *backward* is riskier (repeated choruses look alike), so it also
 * requires a near-identical line on the target slide. Forward jumps keep the
 * looser margin-only behavior.
 */
const BACKWARD_LINE_THRESHOLD = 0.9;
/** How often the error-correction pass runs. */
const CORRECTION_INTERVAL_MS = 3000;
/** Only the last N recognized words are compared against the slides. */
const WINDOW_WORDS = 24;
/** Minimum gap between two automatic transitions. */
const ADVANCE_COOLDOWN_MS = 1000;

/**
 * - `normal`: advance as soon as the slide is recognized — tolerant of the
 *   recognizer mishearing the final word (whole-slide fallback enabled).
 * - `slow`: only advance once the actual LAST line/word of the slide is heard
 *   (no whole-slide fallback). Safer against advancing early.
 */
export type VoiceAdvanceMode = "normal" | "slow";

export interface UseVoiceAutoAdvanceOptions {
  /** Lines of the slide currently being shown. */
  currentSlide: string[];
  /** All slides (each an array of lines), used for error-correction jumps. */
  slides: string[][];
  /** Index of the current slide within `slides`. */
  currentIndex: number;
  /** Called with the slide index the presentation should jump to. */
  onAdvance: (slideIndex: number) => void;
  /** Detection strictness; defaults to `normal`. */
  mode?: VoiceAdvanceMode;
  /** Recognition language; defaults to Brazilian Portuguese. */
  lang?: string;
}

export interface UseVoiceAutoAdvanceResult {
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  lastTranscript: string;
  confidence: number;
}

/**
 * Encapsulates browser speech recognition and the logic that auto-advances
 * slides when the spoken words match the current (or another) slide.
 */
export function useVoiceAutoAdvance({
  currentSlide,
  slides,
  currentIndex,
  onAdvance,
  mode = "normal",
  lang = "pt-BR",
}: UseVoiceAutoAdvanceOptions): UseVoiceAutoAdvanceResult {
  const isSupported = useMemo(() => getSpeechRecognition() !== null, []);

  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);

  // Long-lived refs so the recognition callbacks always read fresh values
  // without us tearing down and recreating the recognizer on every render.
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  // Recognized speech is split into a committed buffer (finalized results, which
  // only ever grow) and a replaceable interim tail (the in-progress phrase).
  const committedRef = useRef("");
  const interimRef = useRef("");
  // Number of words (over committed + interim) already accounted for at the last
  // advance. Detection only analyzes words BEYOND this count, so the previous
  // slide's line can't keep re-triggering — even across run-on singing with no
  // pauses, and even when an interim result later finalizes (the word count is
  // preserved when interim → committed, so the boundary stays aligned).
  const consumedWordsRef = useRef(0);
  const lastAdvanceRef = useRef(0);

  const propsRef = useRef({ currentSlide, slides, currentIndex, onAdvance, mode });
  useEffect(() => {
    propsRef.current = { currentSlide, slides, currentIndex, onAdvance, mode };
  }, [currentSlide, slides, currentIndex, onAdvance, mode]);

  /** All recognized words so far (committed + in-progress interim). */
  const allWords = useCallback((): string[] => {
    return `${committedRef.current} ${interimRef.current}`
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }, []);

  /** Speech to analyze for the current slide: everything not yet consumed. */
  const analysisWindow = useCallback((): string => {
    return allWords().slice(consumedWordsRef.current).slice(-WINDOW_WORDS).join(" ");
  }, [allWords]);

  const advanceTo = useCallback((slideIndex: number) => {
    const now = Date.now();
    if (now - lastAdvanceRef.current < ADVANCE_COOLDOWN_MS) return;
    lastAdvanceRef.current = now;
    // Consume everything heard so far so the next slide starts from new speech.
    consumedWordsRef.current = allWords().length;
    propsRef.current.onAdvance(slideIndex);
  }, [allWords]);

  /**
   * Score of `line` against just the trailing end of `transcript` (line length
   * plus a couple of words of slack), so we measure whether the line is being
   * sung *right now* rather than merely present somewhere earlier in the buffer.
   */
  const tailScore = useCallback((transcript: string, line: string): number => {
    const words = transcript.split(" ").filter(Boolean);
    if (words.length === 0) return 0;
    const lineWords = normalizeText(line).split(" ").length;
    const tail = words.slice(-(lineWords + 2)).join(" ");
    return scoreLine(tail, line);
  }, []);

  const runDetection = useCallback(
    (isFinal: boolean) => {
      const { currentSlide, slides, currentIndex, mode } = propsRef.current;
      if (currentSlide.length === 0 || currentIndex >= slides.length - 1) return;

      // The cooldown both rate-limits transitions and absorbs a sustained final
      // word (it keeps scoring high but can't fire again within the window).
      if (Date.now() - lastAdvanceRef.current < ADVANCE_COOLDOWN_MS) return;

      const transcript = analysisWindow();
      if (!transcript) return;

      const threshold = isFinal ? FINAL_ADVANCE_THRESHOLD : INTERIM_ADVANCE_THRESHOLD;
      const lastLine = currentSlide[currentSlide.length - 1];
      const lastScore = lastLine ? tailScore(transcript, lastLine) : 0;
      const slideWordCount = normalizeText(currentSlide.join(" ")).split(" ").filter(Boolean).length;

      // `slow` mode requires the actual last line to be heard AND that roughly
      // the whole slide has been sung since we entered it. The word-count gate is
      // what stops slides made of identical repeated lines (e.g. a 3× bridge)
      // from advancing on the first line — there the "last line" matches
      // immediately, so only the count tells them apart. Uses the uncapped
      // words-since-advance (not the windowed transcript, which is capped).
      if (mode === "slow") {
        const wordsSinceAdvance = allWords().length - consumedWordsRef.current;
        if (lastScore < threshold) return;
        if (wordsSinceAdvance < slideWordCount - 1) return;
        advanceTo(currentIndex + 1);
        return;
      }

      // `normal` mode adds a fallback for when the recognizer mishears the final
      // word: advance if the analyzed speech has covered the WHOLE slide (matches
      // the full slide text and spans at least as many words as the slide).
      // Stricter than the last-line trigger so it can't fire mid-slide.
      const wholeText = currentSlide.join(" ");
      const wholeWords = normalizeText(wholeText).split(" ").filter(Boolean).length;
      const windowWords = transcript.split(" ").filter(Boolean).length;
      const wholeScore = scoreLine(transcript, wholeText);
      const wholeThreshold = isFinal ? WHOLE_SLIDE_FINAL_THRESHOLD : WHOLE_SLIDE_INTERIM_THRESHOLD;
      const wholeCovered = wholeScore >= wholeThreshold && windowWords >= wholeWords;

      if (lastScore < threshold && !wholeCovered) return;

      advanceTo(currentIndex + 1);
    },
    [advanceTo, analysisWindow, tailScore, allWords],
  );

  const handleResult = useCallback(
    (event: SpeechRecognitionEventLike) => {
      let finalText = "";
      let interimText = "";
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];
        if (!alternative) continue;
        if (result.isFinal) {
          finalText += alternative.transcript + " ";
          maxConfidence = Math.max(maxConfidence, alternative.confidence || 0);
        } else {
          interimText += alternative.transcript + " ";
        }
      }

      if (finalText) {
        // Finalizing interim text: same words, just promoted to committed. The
        // total word count is preserved, so consumedWordsRef stays aligned.
        committedRef.current = `${committedRef.current} ${finalText}`.trim();
        interimRef.current = "";
      } else {
        interimRef.current = interimText.trim();
      }

      const combined = `${committedRef.current} ${interimRef.current}`.trim();
      setLastTranscript(combined);
      if (maxConfidence > 0) setConfidence(maxConfidence);

      runDetection(finalText.length > 0);
    },
    [runDetection],
  );

  const startInternal = useCallback(() => {
    const SpeechRecognitionImpl = getSpeechRecognition();
    if (!SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = handleResult;
    recognition.onerror = (event) => {
      // "no-speech"/"aborted" are routine; surface anything else.
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("[useVoiceAutoAdvance] recognition error:", event.error);
      }
    };
    recognition.onend = () => {
      // Browsers stop recognition on silence even when `continuous`; restart it
      // ourselves while the user still wants to listen.
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          // start() throws if it is already starting; safe to ignore.
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Ignore InvalidStateError when start() is called too quickly.
    }
  }, [handleResult, lang]);

  const resetBuffers = useCallback(() => {
    committedRef.current = "";
    interimRef.current = "";
    consumedWordsRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (!isSupported || shouldListenRef.current) return;
    shouldListenRef.current = true;
    resetBuffers();
    setLastTranscript("");
    setConfidence(0);
    setIsListening(true);
    startInternal();
  }, [isSupported, startInternal, resetBuffers]);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Ignore if it was not running.
      }
    }
  }, []);

  // When the slide changes by MANUAL control (clicking next/previous), consume
  // whatever has been heard so far so the new slide matches only fresh speech.
  // (Automatic advances already consume inside advanceTo.)
  useEffect(() => {
    consumedWordsRef.current = allWords().length;
  }, [currentIndex, allWords]);

  // Periodic error-correction: if some other slide matches noticeably better
  // than the current one, jump straight to it.
  useEffect(() => {
    if (!isListening) return;

    const id = window.setInterval(() => {
      const { slides, currentIndex, currentSlide, mode } = propsRef.current;

      // `slow` mode is strict: only the last-line trigger may advance. The
      // periodic error-correction would otherwise jump on its own (advancing
      // mid-slide / "by itself"), so it is disabled here.
      if (mode === "slow") return;

      const transcript = analysisWindow();
      if (!transcript || slides.length === 0) return;

      const best = matchSlide(transcript, slides);
      if (best.slideIndex < 0 || best.slideIndex === currentIndex) return;

      const currentScore = matchSlide(transcript, [currentSlide]).score;
      if (best.score <= currentScore + CORRECTION_MARGIN) return;

      // Backward jumps are riskier than forward ones, so they require a
      // near-identical line on the target slide. And if that near-identical
      // phrase appears on more than one slide (e.g. a chorus that repeats
      // verbatim), there is no way to know which one is meant — so we ignore
      // the jump entirely. Forward jumps stay loose (margin only).
      if (best.slideIndex < currentIndex) {
        if (best.score < BACKWARD_LINE_THRESHOLD) return;

        const nearIdenticalCount = slides.filter(
          (slide) => matchSlide(transcript, [slide]).score >= BACKWARD_LINE_THRESHOLD,
        ).length;
        if (nearIdenticalCount > 1) return;
      }

      advanceTo(best.slideIndex);
    }, CORRECTION_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [isListening, advanceTo, analysisWindow]);

  // Tear everything down on unmount.
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          // Ignore.
        }
      }
    };
  }, []);

  return { isListening, isSupported, start, stop, lastTranscript, confidence };
}
