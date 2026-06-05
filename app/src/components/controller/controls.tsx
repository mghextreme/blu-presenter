import { useMemo, useState } from "react";
import { useController } from "@/hooks/useController";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, Rabbit, Turtle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import StopSolidIcon from "@heroicons/react/24/solid/StopIcon";
import FingerPrintSolidIcon from "@heroicons/react/24/solid/FingerPrintIcon";
import { cn } from "@/lib/utils";
import { useVoiceAutoAdvance, VoiceAdvanceMode } from "@/hooks/useVoiceAutoAdvance";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { ISlide, ISlideTextContent } from "@/types";

interface ControlsProps {
  showBlank?: boolean;
  showLogo?: boolean;
  showVoice?: boolean;
  className?: string
}

/** Extracts the plain lyrics lines from a slide for voice matching. */
function slideToLines(slide: ISlide): string[] {
  return (slide.content ?? [])
    .filter((part): part is ISlideTextContent => part.type === 'lyrics')
    .flatMap((part) => part.text.split('\n'))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function Controls({
  showBlank = true,
  showLogo = false,
  showVoice = false,
  className,
}: ControlsProps) {

  const { t } = useTranslation('controller');

  const {
    next,
    previous,
    setBlank,
    setLogo,
    overrideSlide,
    clearOverrideSlide,
    scheduleItem,
    selection,
    setSelection,
  } = useController();

  const slides = useMemo<string[][]>(
    () => (scheduleItem?.slides ?? []).map(slideToLines),
    [scheduleItem],
  );
  const currentIndex = selection.slide ?? 0;
  const currentSlide = slides[currentIndex] ?? [];

  const [voiceMode, setVoiceMode] = useState<VoiceAdvanceMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.voiceAdvanceMode);
    return saved === "slow" ? "slow" : "normal";
  });
  const toggleVoiceMode = () => {
    setVoiceMode((prev) => {
      const next: VoiceAdvanceMode = prev === "normal" ? "slow" : "normal";
      localStorage.setItem(STORAGE_KEYS.voiceAdvanceMode, next);
      return next;
    });
  };

  const { isListening, isSupported, start, stop, lastTranscript } = useVoiceAutoAdvance({
    currentSlide,
    slides,
    currentIndex,
    mode: voiceMode,
    onAdvance: (slideIndex) => setSelection({ slide: slideIndex, part: 0 }),
  });
  const voiceEnabled = showVoice && isSupported;

  const toggleBlank = () => {
    if (overrideSlide?.id == 'blank') {
      clearOverrideSlide();
    } else {
      setBlank();
    }
  }
  const toggleLogo = () => {
    if (overrideSlide?.id == 'logo') {
      clearOverrideSlide();
    } else {
      setLogo();
    }
  }

  return (
    <div className="flex flex-col flex-0">
      <div id="controls" className={cn('p-3 flex gap-2 justify-between items-center', className)}>
        {voiceEnabled && (
          <Button
            onClick={isListening ? stop : start}
            title={isListening ? t('controls.voiceStop') : t('controls.voiceStart')}
            aria-pressed={isListening}
            type="button"
            size="icon"
            variant={isListening ? 'destructive' : 'outline'}
            className={cn('relative shrink-0', isListening && 'animate-pulse ring-2 ring-red-500 ring-offset-2')}>
            {isListening ? <Mic className="size-4" /> : <MicOff className="size-4" />}
          </Button>
        )}
        {voiceEnabled && (
          <Button
            onClick={toggleVoiceMode}
            title={voiceMode === 'slow' ? t('controls.voiceModeSlow') : t('controls.voiceModeNormal')}
            aria-label={voiceMode === 'slow' ? t('controls.voiceModeSlow') : t('controls.voiceModeNormal')}
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0">
            {voiceMode === 'slow' ? <Turtle className="size-4" /> : <Rabbit className="size-4" />}
          </Button>
        )}
        <Button onClick={previous} title={t('controls.previous')} className="flex-1" type="button">
          <ArrowLeftIcon className="size-4" />
        </Button>
        {showBlank && (
          <Button onClick={toggleBlank} title={t('controls.blank')} className="flex-1" type="button"
                  variant={overrideSlide?.id == 'blank' ? 'muted' : 'default'}>
            <StopSolidIcon className="size-4" />
          </Button>
        )}
        {showLogo && (
          <Button onClick={toggleLogo} title={t('controls.logo')} className="flex-1" type="button"
                  variant={overrideSlide?.id == 'logo' ? 'muted' : 'default'}>
            <FingerPrintSolidIcon className="size-4" />
          </Button>
        )}
        <Button onClick={next} title={t('controls.next')} className="flex-1" type="button">
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>
      {voiceEnabled && isListening && (
        <div className="px-3 pb-3 -mt-1">
          <div className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
            <span className="truncate italic">
              {lastTranscript || t('controls.voiceListening')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
