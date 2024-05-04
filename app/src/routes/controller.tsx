import SlideVisualizer from "@/components/controller/slide-visualizer";
import SlideSelector from "@/components/controller/slide-selector";
import { useController } from "@/components/controller/controller-provider";
import { Button } from "@/components/ui/button";

import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import StopSolidIcon from "@heroicons/react/24/solid/StopIcon";
import FingerPrintSolidIcon from "@heroicons/react/24/solid/FingerPrintIcon";

export default function Controller() {
  const {
    mode,
    slideIndex,
    selectedItem,
    nextSlide,
    previousSlide,
    nextPart,
    previousPart,
    windows,
  } = useController();

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
                <li key={ix} className="whitespace-pre-wrap mt-4">{s?.parts?.join('\n')}</li>
              ))}
            </ul>
          </div>
        </div>
        <div id="live" className="w-1/3 bg-background rounded flex flex-col items-stretch overflow-hidden">
          <div id="controls" className="p-3 grid grid-cols-4 gap-2 flex-0">
            <Button onClick={mode == 'part' ? previousPart : previousSlide} title="Previous">
              <ArrowLeftIcon className="size-4"></ArrowLeftIcon>
            </Button>
            <Button title="Blank">
              <StopSolidIcon className="size-4"></StopSolidIcon>
            </Button>
            <Button title="Visual identity">
              <FingerPrintSolidIcon className="size-4"></FingerPrintSolidIcon>
            </Button>
            <Button onClick={mode == 'part' ? nextPart : nextSlide} title="Next">
              <ArrowRightIcon className="size-4"></ArrowRightIcon>
            </Button>
          </div>
          <div id="content" className="px-3 flex-1 overflow-y-auto">
          {selectedItem?.slides.map((s, ix) => (
            <SlideSelector key={ix} slide={s} index={ix} selected={slideIndex == ix}></SlideSelector>
          ))}
          </div>
          {windows.length > 0 && <div id="preview" className="flex-0 aspect-[16/9]">
            <SlideVisualizer theme={windows[0].theme} fontSize={'2.2vh'} mode={windows[0].mode}></SlideVisualizer>
          </div>}
        </div>
      </div>
    </>
  );
}
