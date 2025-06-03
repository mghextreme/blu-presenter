import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import StopSolidIcon from "@heroicons/react/24/solid/StopIcon";
import FingerPrintSolidIcon from "@heroicons/react/24/solid/FingerPrintIcon";
import { useController } from "@/hooks/controller.provider";
import { IPositionableElement } from "@/types/browser";
import SlideSelector from "./slide-selector";
import PreviewWindow from "./preview-window";

export default function LivePanel() {

  const { t } = useTranslation('controller');

  const {
    mode,
    scheduleItem,
    next,
    previous,
    selection,
    setBlank,
    setLogo,
    overrideSlide,
    clearOverrideSlide,
  } = useController();

  const contentWrapper = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, (scheduleItem?.slides?.length ?? 0));
  }, [scheduleItem]);

  useEffect(() => {
    const wrapper: IPositionableElement | undefined = contentWrapper.current as IPositionableElement;
    const slide: IPositionableElement | undefined = slideRefs.current[selection.slide ?? 0] as IPositionableElement;

    if (!wrapper || !slide) return;

    const slideTo = slide.offsetTop - wrapper.offsetTop - 50;
    wrapper?.scrollTo({
      top: slideTo,
      behavior: "smooth"
    });
  }, [selection]);

  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const closePreview = () => { setPreviewOpen(false); }

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
    <div id="live" className="w-1/3 bg-background rounded flex flex-col items-stretch overflow-hidden">
      <div id="preview" className="relative p-3 pb-0 flex justify-stretch flex-0">
        {!previewOpen && <Button onClick={() => setPreviewOpen(true)} title={t('preview.openTitle')} className="flex-1">
          {t('preview.open')}
        </Button>}
        {previewOpen && <PreviewWindow closeWindow={closePreview}></PreviewWindow>}
      </div>
      <div id="controls" className="p-3 grid grid-cols-4 gap-2 flex-0">
        <Button onClick={previous} title={t('controls.previous')}>
          <ArrowLeftIcon className="size-4"></ArrowLeftIcon>
        </Button>
        <Button onClick={toggleBlank} title={t('controls.blank')}
                variant={overrideSlide?.id == 'blank' ? 'muted' : 'default'}>
          <StopSolidIcon className="size-4"></StopSolidIcon>
        </Button>
        <Button onClick={toggleLogo} title={t('controls.logo')}
                variant={overrideSlide?.id == 'logo' ? 'muted' : 'default'}>
          <FingerPrintSolidIcon className="size-4"></FingerPrintSolidIcon>
        </Button>
        <Button onClick={next} title={t('controls.next')}>
          <ArrowRightIcon className="size-4"></ArrowRightIcon>
        </Button>
      </div>
      <div id="content" className="p-3 pt-0 flex-1 overflow-y-auto" ref={contentWrapper}>
        {scheduleItem?.slides.map((s, ix) => (
          //@ts-expect-error // TODO look into ref usage here
          <div key={`${mode}-${ix}`} ref={(el: HTMLDivElement) => slideRefs.current[ix] = el}>
            <SlideSelector
              slide={s}
              index={ix}
              selected={selection.slide == ix}></SlideSelector>
          </div>
        ))}
      </div>
    </div>
  );
}
