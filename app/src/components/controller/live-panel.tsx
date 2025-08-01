import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useController } from "@/hooks/controller.provider";
import { IPositionableElement } from "@/types/browser";
import SlideSelector from "./slide-selector";
import PreviewWindow from "./preview-window";
import Controls from "./controls";

export default function LivePanel() {

  const { t } = useTranslation('controller');

  const {
    mode,
    scheduleItem,
    selection,
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

  return (
    <div id="live" className="w-1/3 bg-background rounded flex flex-col items-stretch overflow-hidden">
      <div id="preview" className="relative m-3 mb-0 flex justify-stretch flex-0">
        {!previewOpen && <Button onClick={() => setPreviewOpen(true)} title={t('preview.openTitle')} className="flex-1">
          {t('preview.open')}
        </Button>}
        {previewOpen && <PreviewWindow closeWindow={closePreview}></PreviewWindow>}
      </div>
      <Controls></Controls>
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
