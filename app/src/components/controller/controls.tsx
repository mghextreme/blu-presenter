import { useController } from "@/hooks/useController";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import StopSolidIcon from "@heroicons/react/24/solid/StopIcon";
import FingerPrintSolidIcon from "@heroicons/react/24/solid/FingerPrintIcon";
import { cn } from "@/lib/utils";

interface ControlsProps {
  showBlank?: boolean;
  showLogo?: boolean;
  className?: string
}

export function Controls({
  showBlank = true,
  showLogo = false,
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
  } = useController();

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
    <div id="controls" className={cn('p-3 flex gap-2 flex-0 justify-between items-center', className)}>
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
  );
}
