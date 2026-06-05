import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useVoiceAutoAdvance } from "../useVoiceAutoAdvance";

/* ------------------------------------------------------------------ */
/* Mock the Web Speech API                                            */
/* ------------------------------------------------------------------ */

interface ResultArg {
  transcript: string;
  isFinal: boolean;
}

class MockSpeechRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  static instances: MockSpeechRecognition[] = [];

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }
  start() {
    this.onstart?.();
  }
  stop() {
    this.onend?.();
  }
  abort() {}

  /** Helper: push a recognition result into the hook. */
  emit({ transcript, isFinal }: ResultArg) {
    this.onresult?.({
      resultIndex: 0,
      results: {
        length: 1,
        0: { length: 1, isFinal, 0: { transcript, confidence: 0.9 } },
      },
    });
  }
}

function latestRecognition(): MockSpeechRecognition {
  const list = MockSpeechRecognition.instances;
  return list[list.length - 1];
}

describe("useVoiceAutoAdvance", () => {
  beforeEach(() => {
    MockSpeechRecognition.instances = [];
    vi.useFakeTimers();
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      MockSpeechRecognition;
    (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition =
      MockSpeechRecognition;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as unknown as { webkitSpeechRecognition?: unknown })
      .webkitSpeechRecognition;
  });

  // Two identical choruses back to back (the real "Leão de Judá" case).
  const chorus = ["Leão de Judá", "Leão de Judá", "Leão de Judá", "Prevaleceu"];
  const verse = ["E os povos verão e virão", "Pois a Sua justiça", "Governará"];
  const slides = [chorus, chorus, verse];

  it("reports support and exposes controls", () => {
    const { result } = renderHook(() =>
      useVoiceAutoAdvance({
        currentSlide: slides[0],
        slides,
        currentIndex: 0,
        onAdvance: () => {},
      }),
    );
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isListening).toBe(false);
  });

  it("advances when the whole slide is covered even if the final word is misheard", () => {
    // Real-world case: "Prevaleceu" gets recognized as "por favor". The last
    // line never matches, but the slide as a whole does, so it must advance.
    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useVoiceAutoAdvance({
        currentSlide: slides[0],
        slides,
        currentIndex: 0,
        onAdvance,
      }),
    );
    act(() => result.current.start());
    const rec = latestRecognition();

    act(() => rec.emit({ transcript: "leão de judá leão de judá leão de judá", isFinal: false }));
    expect(onAdvance).not.toHaveBeenCalled(); // body only -> not yet
    act(() => rec.emit({ transcript: "leão de judas leão de judá leão de judá por favor", isFinal: true }));

    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(onAdvance).toHaveBeenCalledWith(1);
  });

  it("slow mode does NOT use the whole-slide fallback (requires the last line)", () => {
    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useVoiceAutoAdvance({
        currentSlide: slides[0],
        slides,
        currentIndex: 0,
        mode: "slow",
        onAdvance,
      }),
    );
    act(() => result.current.start());
    const rec = latestRecognition();

    // Whole slide covered but final word misheard -> in slow mode this must NOT advance.
    act(() => rec.emit({ transcript: "leão de judas leão de judá leão de judá por favor", isFinal: true }));
    expect(onAdvance).not.toHaveBeenCalled();

    // Actually hearing the last line advances.
    act(() => rec.emit({ transcript: "leão de judá leão de judá leão de judá prevaleceu", isFinal: true }));
    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(onAdvance).toHaveBeenCalledWith(1);
  });

  it("slow mode does NOT auto-advance via the periodic error-correction", () => {
    // Distinct slides so a different slide would score better and tempt the
    // error-correction pass to jump on its own.
    const distinct = [
      ["Primeira parte aqui", "Termina assim"],
      ["Segunda parte distinta", "Conclui diferente"],
      ["Terceira e final", "Amém"],
    ];
    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useVoiceAutoAdvance({
        currentSlide: distinct[0],
        slides: distinct,
        currentIndex: 0,
        mode: "slow",
        onAdvance,
      }),
    );
    act(() => result.current.start());
    const rec = latestRecognition();

    // Speak words that match a DIFFERENT slide (slide 1), without hitting slide 0's
    // last line. In slow mode the periodic correction must NOT jump.
    act(() => rec.emit({ transcript: "segunda parte distinta conclui diferente", isFinal: true }));
    // Let several error-correction intervals (3s each) elapse.
    act(() => vi.advanceTimersByTime(7000));

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it("advances exactly ONE slide when the final word is sustained across identical choruses", () => {
    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useVoiceAutoAdvance({
        currentSlide: slides[0],
        slides,
        currentIndex: 0,
        onAdvance,
      }),
    );

    act(() => result.current.start());
    const rec = latestRecognition();

    // Sing the chorus, then hold "prevaleceu" over several interim results.
    act(() => rec.emit({ transcript: "leão de judá leão de judá leão de judá prevaleceu", isFinal: false }));
    act(() => rec.emit({ transcript: "leão de judá leão de judá leão de judá prevaleceu", isFinal: false }));
    act(() => rec.emit({ transcript: "leão de judá leão de judá leão de judá prevaleceu prevaleceu", isFinal: false }));
    act(() => rec.emit({ transcript: "prevaleceu prevaleceu prevaleceu", isFinal: false }));
    act(() => rec.emit({ transcript: "prevaleceu prevaleceu prevaleceu prevaleceu", isFinal: true }));

    // Sustained word must NOT walk through the second identical chorus.
    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(onAdvance).toHaveBeenCalledWith(1);
  });

  it("re-arms and advances again when the next (identical) chorus is sung from the top", () => {
    const onAdvance = vi.fn();
    const { result, rerender } = renderHook(
      ({ currentIndex }) =>
        useVoiceAutoAdvance({
          currentSlide: slides[currentIndex],
          slides,
          currentIndex,
          onAdvance,
        }),
      { initialProps: { currentIndex: 0 } },
    );

    act(() => result.current.start());
    const rec = latestRecognition();

    // Advance 0 -> 1 by reaching the last line.
    act(() => rec.emit({ transcript: "leão de judá leão de judá leão de judá prevaleceu", isFinal: true }));
    expect(onAdvance).toHaveBeenLastCalledWith(1);
    rerender({ currentIndex: 1 });

    act(() => vi.advanceTimersByTime(1100)); // past the cooldown

    // Singing the next identical chorus commits new speech after the consume
    // point, so reaching its end advances 1 -> 2.
    act(() => rec.emit({ transcript: "leão de judá leão de judá leão de judá prevaleceu", isFinal: true }));

    expect(onAdvance).toHaveBeenCalledTimes(2);
    expect(onAdvance).toHaveBeenLastCalledWith(2);
  });

  it("advances promptly when a verse is sung to its end (not late)", () => {
    const verses = [
      ["E os povos verão e virão", "A Sião aprender Sua lei", "Pois a Sua justiça", "Governará"],
      ["Outro verso aqui", "Final"],
    ];
    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useVoiceAutoAdvance({
        currentSlide: verses[0],
        slides: verses,
        currentIndex: 0,
        onAdvance,
      }),
    );
    act(() => result.current.start());
    const rec = latestRecognition();

    act(() => rec.emit({ transcript: "e os povos verão e virão", isFinal: false }));
    act(() => rec.emit({ transcript: "e os povos verão e virão a sião aprender sua lei", isFinal: false }));
    act(() => rec.emit({ transcript: "e os povos verão e virão a sião aprender sua lei pois a sua justiça", isFinal: false }));
    expect(onAdvance).not.toHaveBeenCalled(); // not on the penultimate line

    // The moment the last line is sung, it advances.
    act(() => rec.emit({ transcript: "a sião aprender sua lei pois a sua justiça governará", isFinal: true }));
    expect(onAdvance).toHaveBeenCalledWith(1);
  });

  it("keeps advancing during run-on singing with no pause between slides", () => {
    const verses = [
      ["Ouve-se em todos os povos", "Que um novo Rei surgiu", "Impérios reconhecem", "Que Sua destra reinará"],
      ["Leão de Judá", "Leão de Judá", "Leão de Judá", "Prevaleceu"],
      ["Fim", "Amém"],
    ];
    const onAdvance = vi.fn();
    const { result, rerender } = renderHook(
      ({ currentIndex }) =>
        useVoiceAutoAdvance({
          currentSlide: verses[currentIndex],
          slides: verses,
          currentIndex,
          onAdvance,
        }),
      { initialProps: { currentIndex: 0 } },
    );
    act(() => result.current.start());
    const rec = latestRecognition();

    // Whole first verse arrives as one growing interim, then finalizes -> advance to 1.
    act(() => rec.emit({ transcript: "ouve-se em todos os povos que um novo rei surgiu impérios reconhecem que sua destra reinará", isFinal: true }));
    expect(onAdvance).toHaveBeenLastCalledWith(1);
    rerender({ currentIndex: 1 });

    act(() => vi.advanceTimersByTime(1100));

    // Singing straight into the chorus (no pause) must still advance to 2,
    // because the consumed prefix excludes the previous verse's last line.
    act(() => rec.emit({ transcript: "leão de judá leão de judá leão de judá prevaleceu", isFinal: true }));
    expect(onAdvance).toHaveBeenCalledTimes(2);
    expect(onAdvance).toHaveBeenLastCalledWith(2);
  });
});
