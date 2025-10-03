import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IScheduleSong, ITeleprompterThemeConfig, ITheme, TeleprompterTheme } from "@/types";
import { useController } from "@/hooks/controller.provider";
import { useWindow } from "@/hooks/window.provider";
import { IPositionableElement } from "@/types/browser";
import { Clock } from "./clock";
import { alternateLyricsAndChords } from "@/lib/songs";
import { buildFontStyle } from "@/lib/style";
import { cn } from "@/lib/utils";

interface ScrollingSongVisualizerProps {
  theme?: ITheme
}

export const ScrollingSongVisualizer = forwardRef(({
  theme = TeleprompterTheme,
}: ScrollingSongVisualizerProps, ref) => {

  const { t } = useTranslation('controller');

  const {
    mode,
    schedule,
    scheduleItem,
    selection,
    selectedSlide,
  } = useController();

  const {childWindow} = useWindow();

  const containerDiv = useRef<HTMLDivElement>(null);
  const wrapperDiv = useRef<HTMLDivElement>(null);

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
    if (!scheduleItemAsSong) return;

    setScheduleSong(scheduleItemAsSong);
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
  const [yPartsPxOffset, setYPartsPxOffset] = useState<number>(0);
  const [selectedBlock, setSelectedBlock] = useState<number>(0);
  const updatePosition = () => {
    const wrapper: IPositionableElement | undefined = wrapperDiv.current as IPositionableElement;

    const blocksLength = scheduleSong?.blocks?.length ?? -1;
    if (blocksLength < 0) return;

    let blockNumber = 0;
    if (selection.slide) {
      blockNumber = selection.slide;
      if (blockNumber < 0) {
        blockNumber = 0;
      } else if (blockNumber > blocksLength + 2) {
        blockNumber = blocksLength + 2;
      }
    }

    setSelectedBlock(blockNumber);
    const blockDiv = wrapperDiv.current?.children.item(blockNumber) as HTMLDivElement;
    const block: IPositionableElement | undefined = blockDiv as IPositionableElement;

    if (!wrapper || !block) return;

    const deltaFromWrapper = block.offsetTop - wrapper.offsetTop;
    setYPxOffset(deltaFromWrapper);

    let selectedPart = 0;
    if (mode === 'part') {
      selectedPart = selection.part ?? 0;
      if (selection.slide === 1 && selectedPart > 0) {
        selectedPart -= 1; // Adjust for title part
      }
    }

    if (selectedPart === 0) {
      setYPartsPxOffset(0);
      return;
    }

    let lyricsCounter = 0;
    for (const child of blockDiv.children.item(1)?.children ?? []) {
      if (child.classList.contains('lyrics')) {
        lyricsCounter += 1;
        if (lyricsCounter === 2 * selectedPart) {
          const pChild = child as HTMLParagraphElement;
          setYPartsPxOffset(pChild.offsetTop + pChild.offsetHeight);
          return;
        }
      }
    }
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

  const config = theme.config as ITeleprompterThemeConfig;
  const isInvisible = useMemo(() => {
    return selectedSlide?.isEmpty === true && theme.config?.invisibleOnEmptyItems === true;
  }, [selectedSlide, theme.config?.invisibleOnEmptyItems]);

  const [nextUpTitle, setNextUpTitle] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!schedule || !scheduleItem || scheduleItem.index === undefined || scheduleItem.index >= schedule.length - 1) {
      setNextUpTitle(undefined);
      return;
    }

    setNextUpTitle(schedule[scheduleItem.index + 1]?.title);
  }, [scheduleSong]);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      ref={containerDiv as React.Ref<HTMLDivElement>}
      style={{
        fontSize: fontSize,
        backgroundColor: isInvisible ? 'transparent' : config?.backgroundColor,
      }}>
      {!isInvisible && <div
        ref={wrapperDiv as React.Ref<HTMLDivElement>}
        className="w-full leading-[1.15em] px-[.5em] flex flex-col items-start text-left pointer-events-none transition-transform duration-150 ease-out"
        style={{
          transform: `translateY(calc(1em - ${yPxOffset}px - ${yPartsPxOffset}px))`,
        }}>
        <div className="mb-[.6em]" key="title">
          <pre className={cn(config?.title?.fontFamily ?? 'font-source-code-pro')} style={
            buildFontStyle(config?.title, {
              fontSize: 110,
              fontWeight: 700,
              color: config?.foregroundColor,
            })
          }>{scheduleSong?.title}</pre>
          <pre className={cn('pt-[.2em]', config?.title?.fontFamily ?? 'font-source-code-pro')} style={
            buildFontStyle(config?.artist, {
              fontSize: 110,
              fontWeight: 700,
              color: config?.foregroundColor,
            })
          }>{scheduleSong?.artist}</pre>
        </div>
        {scheduleSong && scheduleSong.blocks?.map((block, blockIndex) => (
          <div
            key={`block-${blockIndex}`}
            className={'relative flex mb-[.6em]' + (blockIndex === selectedBlock - 1 ? '' : ' opacity-75 transform-[scale(0.95)]')}>
            <div className="w-[3em] flex flex-col justify-start items-center pr-[.5em] border-r-1 mr-[.5em]">
              <span className={cn(
                'font-bold',
                blockIndex === selectedBlock - 1 && 'text-yellow-500',
              )}>{blockIndex + 1}</span>
              <span className="w-full pb-[.2em] border-b-1 mb-[.2em]"></span>
              <span className="text-[0.85em] text-muted">{scheduleSong.blocks?.length}</span>
            </div>
            <div className="px-[.5em] leading-[1.6em] whitespace-pre">
              {alternateLyricsAndChords(block.text, block.chords, {
                chordsClassName: config?.chords?.fontFamily ?? 'font-source-code-pro',
                chordsStyle: buildFontStyle(config?.chords, {
                  fontSize: 100,
                  fontWeight: 700,
                  color: config?.chords?.color,
                }),
                lyricsClassName: config?.lyrics?.fontFamily ?? 'font-source-code-pro',
                lyricsStyle: buildFontStyle(config?.lyrics, {
                  fontSize: 100,
                  fontWeight: 400,
                  color: config?.foregroundColor,
                }),
              })}
            </div>
          </div>
        ))}
        {nextUpTitle && (
          <div
            className={cn(
              'flex mb-[.6em] mt-[2em]',
              (scheduleSong?.blocks?.length ?? 0) + 1 !== selectedBlock && 'opacity-75 transform-[scale(0.95)]',
            )}
            key="nextUp"
          >
            <div className="w-[3em] flex flex-col justify-start items-center pr-[.5em] border-r-1 mr-[.5em]"></div>
            <div className="px-[.5em] leading-[1.3em]">
              <div style={
                buildFontStyle(config?.artist, {
                  fontSize: 110,
                  fontWeight: 700,
                  color: config?.foregroundColor,
                })
              }>{t('nextUp')}</div>
              <div style={
                buildFontStyle(config?.title, {
                  fontSize: 110,
                  fontWeight: 700,
                  color: config?.foregroundColor,
                })
              }>{nextUpTitle}</div>
            </div>
          </div>
        )}
      </div>}
      {config?.clock && config.clock.enabled && (
        <div className="absolute bottom-0 right-0 py-[.2em] px-[.5em] z-50" style={{
          ...buildFontStyle(config?.clock, {
            fontSize: 100,
            fontWeight: 400,
            color: config?.clock?.color ?? config?.foregroundColor,
          }),
          backgroundColor: config?.backgroundColor,
        }}>
          <Clock format={config?.clock?.format} />
        </div>
      )}
    </div>
  );
});
