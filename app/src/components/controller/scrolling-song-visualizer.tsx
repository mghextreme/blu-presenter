import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IScheduleSong } from "@/types";
import { useController } from "@/hooks/controller.provider";
import { useWindow } from "@/hooks/window.provider";
import { IPositionableElement } from "@/types/browser";
import Clock from "./clock";

export const ScrollingSongVisualizer = forwardRef(({}, ref) => {

  const { t } = useTranslation('controller');

  const {
    mode,
    schedule,
    scheduleItem,
    selection,
  } = useController();

  const {childWindow} = useWindow();

  const containerDiv = useRef<HTMLDivElement>(null);
  const wrapperDiv = useRef<HTMLDivElement>(null);
  const blocksDivs = useRef<HTMLDivElement[]>([]);

  const [fontSize, setFontSize] = useState<string>('8vh');
  const updateFontSize = () => {
    const w = containerDiv?.current?.clientWidth ?? 1280;
    const h = containerDiv?.current?.clientHeight ?? 720;

    const relW = w / 16;
    const relH = h / 9;
    const minRel = Math.min(relW, relH);

    setFontSize((minRel / 3).toFixed(2) + 'px');
  }

  const [scheduleSong, setScheduleSong] = useState<IScheduleSong | undefined>(undefined);
  const updateSong = () => {
    const scheduleItemAsSong = scheduleItem as IScheduleSong;
    setScheduleSong(scheduleItemAsSong);
    blocksDivs.current = blocksDivs.current.slice(0, (scheduleItemAsSong?.blocks?.length ?? 0) + 1);
    updatePosition();
  }
  useEffect(updateSong, [scheduleItem]);

  useEffect(() => {
    updateFontSize();

    const targetWindow = childWindow ?? window;
    targetWindow.addEventListener("resize", updateFontSize);

    return () => {
      targetWindow.removeEventListener("resize", updateFontSize);
    }
  }, [childWindow]);

  const [yPxOffset, setYPxOffset] = useState<number>(0);
  const [yPartsOffset, setYPartsOffset] = useState<number>(0);
  const [selectedSlide, setSelectedSlide] = useState<number>(0);
  const updatePosition = () => {
    const wrapper: IPositionableElement | undefined = wrapperDiv.current as IPositionableElement;

    const blocksLength = scheduleSong?.blocks?.length ?? -1;
    if (blocksLength < 0) return;

    let slideNumber = 0;
    if (selection.slide) {
      slideNumber = selection.slide - 1;
      if (slideNumber < 0) {
        slideNumber = 0;
      } else if (slideNumber > blocksLength + 1) {
        slideNumber = blocksLength + 1;
      }
    }
    setSelectedSlide(slideNumber);
    const block: IPositionableElement | undefined = blocksDivs.current[slideNumber] as IPositionableElement;

    if (!wrapper || !block) return;

    setYPxOffset(block.offsetTop - wrapper.offsetTop);

    let selectedPart = 0;
    if (mode === 'part') {
      selectedPart = selection.part ?? 0;
      if (selection.slide === 1 && selectedPart > 0) {
        selectedPart -= 1; // Adjust for title part
      }
    }
    setYPartsOffset(selectedPart);
  }
  useEffect(updatePosition, [selection, scheduleSong]);

  const update = () => {
    updateFontSize();
    updateSong();
    setTimeout(updatePosition, 100);
  }

  useImperativeHandle(ref, () => {
    return {
      update,
    };
  });

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden"
      ref={containerDiv as React.Ref<HTMLDivElement>}
      style={{fontSize: fontSize}}>
      <div
        ref={wrapperDiv as React.Ref<HTMLDivElement>}
        className="w-full leading-[1.15em] px-[.5em] flex flex-col items-start text-white text-left pointer-events-none transition-transform duration-150 ease-out"
        style={{
          transform: `translateY(calc(.5em - ${yPxOffset}px - ${yPartsOffset * 6}em))`,
        }}>
        {scheduleSong && scheduleSong.blocks?.map((block, blockIndex) => (
          <div
            //@ts-expect-error // TODO look into ref usage here
            ref={(el: HTMLDivElement) => blocksDivs.current[blockIndex] = el}
            key={blockIndex}
            className={'flex mb-[.6em]' + (blockIndex === selectedSlide ? '' : ' opacity-75 transform-[scale(0.95)]')}>
            <div className="w-[3em] flex flex-col justify-start items-center pr-[.5em] border-r-1 mr-[.5em]">
              <span className={'font-bold' + (blockIndex === selectedSlide ? ' text-yellow-500' : '')}>{blockIndex + 1}</span>
              <span className="w-full pb-[.2em] border-b-1 mb-[.2em]"></span>
              <span className="text-[0.85em] text-muted">{scheduleSong.blocks?.length}</span>
            </div>
            <div className="grid grid-cols-1 grid-rows-1 px-[.5em] -mt-[.7em]">
              <pre className="col-start-1 row-start-1 pb-[.4em] font-mono leading-[3em] font-bold text-yellow-300">{block.chords}</pre>
              <pre className="col-start-1 row-start-1 pt-[1.4em] font-mono leading-[3em]">{block.text}</pre>
            </div>
          </div>
        ))}
        {(schedule && scheduleItem && scheduleItem.index != undefined && scheduleItem.index < schedule.length - 1) && (
          <div
            //@ts-expect-error // TODO look into ref usage here
            ref={(el: HTMLDivElement) => blocksDivs.current[-1] = el}
            className={'flex mb-[.6em]' + ((scheduleSong?.blocks?.length ?? 0) === selectedSlide ? '' : ' opacity-75 transform-[scale(0.95)]')}>
            <div className="w-[3em] flex flex-col justify-start items-center pr-[.5em] border-r-1 mr-[.5em]"></div>
            <div className="px-[.5em] leading-[1.3em]">
              {t('nextUp')}<br />
              <span className="font-bold">
                {schedule[scheduleItem.index + 1]?.title}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 right-0 py-[.2em] px-[.5em] bg-black text-white z-50">
        <Clock />
      </div>
    </div>
  );
});
