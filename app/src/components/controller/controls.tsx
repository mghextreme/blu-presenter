import { useController } from "@/hooks/controller.provider";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import StopSolidIcon from "@heroicons/react/24/solid/StopIcon";
import FingerPrintSolidIcon from "@heroicons/react/24/solid/FingerPrintIcon";

interface ControlsProps {
  showBlank?: boolean;
  showLogo?: boolean;
}

export function Controls({
  showBlank = true,
  showLogo = false,
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
    <div id="controls" className="p-3 flex gap-2 flex-0 justify-between items-center">
      <Button onClick={previous} title={t('controls.previous')} className="flex-1">
        <ArrowLeftIcon className="size-4"></ArrowLeftIcon>
      </Button>
      {showBlank && (
        <Button onClick={toggleBlank} title={t('controls.blank')} className="flex-1"
                variant={overrideSlide?.id == 'blank' ? 'muted' : 'default'}>
          <StopSolidIcon className="size-4"></StopSolidIcon>
        </Button>
      )}
      {showLogo && (
        <Button onClick={toggleLogo} title={t('controls.logo')} className="flex-1"
                variant={overrideSlide?.id == 'logo' ? 'muted' : 'default'}>
          <FingerPrintSolidIcon className="size-4"></FingerPrintSolidIcon>
        </Button>
      )}
      <Button onClick={next} title={t('controls.next')} className="flex-1">
        <ArrowRightIcon className="size-4"></ArrowRightIcon>
      </Button>
    </div>
  );
}
