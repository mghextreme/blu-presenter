import { useEffect, useRef, useState } from "react";

import SlideVisualizer from "@/components/controller/slide-visualizer";
import SlideSelector from "@/components/controller/slide-selector";
import { useController } from "@/components/controller/controller-provider";
import { Button } from "@/components/ui/button";

import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import StopSolidIcon from "@heroicons/react/24/solid/StopIcon";
import FingerPrintSolidIcon from "@heroicons/react/24/solid/FingerPrintIcon";
import { IWindow } from "@/types";
import { v4 } from "uuid";

export default function Controller() {
  const {
    mode,
    slideIndex,
    selectedItem,
    next,
    previous,
    setBlank,
    setLogo,
  } = useController();

  const contentWrapper = useRef();
  const slideRefs = useRef([]);

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, (selectedItem?.slides?.length ?? 0));
 }, [selectedItem]);

 useEffect(() => {
  const wrapper: Element = contentWrapper.current;
  const slide: Element = slideRefs.current[slideIndex];

  if (!wrapper || !slide) return;

  const slideTo = slide.offsetTop - wrapper.offsetTop - 50;
  wrapper?.scrollTo({
    top: slideTo,
    behavior: "smooth"
  });
}, [slideIndex]);

  const [preview, setPreview] = useState<IWindow | undefined>(undefined);
  const openPreview = () => {
    setPreview({id: v4(), theme: 'black', mode: 'slide'} as IWindow);
  }

  return (
    <>
      <div id="controller" className="p-3 flex flex-1 gap-3 overflow-hidden">
        <div id="plan" className="w-1/3 p-3 bg-background rounded">
          <div>Search songs</div>
          <div>Add song to schedule</div>
        </div>
        <div id="schedule" className="w-1/3 p-3 bg-background rounded flex flex-col items-stretch">
          <div className="flex-1 overflow-y-auto">
            <h3>{selectedItem?.title}</h3>
            <h4>{selectedItem?.artist}</h4>
            <ul className="overflow-y-auto">
              {selectedItem?.slides.map((s, ix) => (
                <li key={ix} className="whitespace-pre-wrap mt-4">{s?.content?.join('\n')}</li>
              ))}
            </ul>
          </div>
        </div>
        <div id="live" className="w-1/3 bg-background rounded flex flex-col items-stretch overflow-hidden">
          <div id="preview" className="p-3 pb-0 flex justify-stretch flex-0">
            {!preview && <Button onClick={openPreview} title="Open Preview" className="flex-1">
              Open preview
            </Button>}
            {preview && <div className="flex-1 aspect-[16/9] rounded">
              <SlideVisualizer theme={preview.theme} fontSize={'2.2vh'} mode={preview.mode}></SlideVisualizer>
            </div>}
          </div>
          <div id="controls" className="p-3 grid grid-cols-4 gap-2 flex-0">
            <Button onClick={previous} title="Previous">
              <ArrowLeftIcon className="size-4"></ArrowLeftIcon>
            </Button>
            <Button onClick={setBlank} title="Blank">
              <StopSolidIcon className="size-4"></StopSolidIcon>
            </Button>
            <Button onClick={setLogo} title="Visual identity">
              <FingerPrintSolidIcon className="size-4"></FingerPrintSolidIcon>
            </Button>
            <Button onClick={next} title="Next">
              <ArrowRightIcon className="size-4"></ArrowRightIcon>
            </Button>
          </div>
          <div id="content" className="px-3 flex-1 overflow-y-auto" ref={contentWrapper}>
          {selectedItem?.slides.map((s, ix) => (
            <div key={`${mode}-${ix}`} ref={el => slideRefs.current[ix] = el}>
              <SlideSelector
                slide={s}
                index={ix}
                selected={slideIndex == ix}></SlideSelector>
            </div>
          ))}
          </div>
        </div>
      </div>
    </>
  );
}
