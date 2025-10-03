import { ISlideContent, ISlideImageContent, ISlideTextContent, ISlideTitleContent, ITheme, LyricsTheme } from "@/types";
import { useController } from "@/hooks/useController";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useWindow } from "@/hooks/window.provider";
import { cn } from "@/lib/utils";
import { buildFontStyle } from "@/lib/style";

type SingleSlideVisualizerProps = {
  theme?: ITheme
}

export const SingleSlideVisualizer = forwardRef((
  {
    theme = LyricsTheme,
  }: SingleSlideVisualizerProps,
  ref,
) => {

  if (theme.extends === 'teleprompter') {
    return <></>; // Teleprompter theme is not supported in single slide visualizer
  }

  const {
    selectedSlide,
    overrideSlide,
    selection,
  } = useController();

  const {childWindow} = useWindow();

  const wrapperDiv = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<string>('8vh');
  const updateFontSize = () => {
    const w = wrapperDiv?.current?.clientWidth ?? 1280;
    const h = wrapperDiv?.current?.clientHeight ?? 720;

    const relW = w / 16;
    const relH = h / 9;
    const minRel = Math.min(relW, relH);

    setFontSize((minRel / 1.5).toFixed(2) + 'px');
  }

  useEffect(() => {
    updateFontSize();

    const targetWindow = childWindow ?? window;
    targetWindow.addEventListener("resize", updateFontSize);

    return () => {
      targetWindow.removeEventListener("resize", updateFontSize);
    }
  }, [childWindow]);

  const [toShow, setToShow] = useState<ISlideContent[]>([]);
  const updateContent = () => {
    let content: ISlideContent[] = [];
    if (overrideSlide !== undefined) {
      setToShow(overrideSlide.content ?? []);
      return
    }

    content = selectedSlide?.content ?? [];

    if (theme.extends === 'subtitles') {
      setToShow(content.length > 0 ? [content[selection.part ?? 0]] : []);
    } else {
      setToShow(content);
    }
  }
  useEffect(updateContent, [selectedSlide, overrideSlide, selection]);

  const getTitleContent = (content: ISlideTitleContent) => {
    return (
      <div className={theme.extends == 'lyrics' ? 'py-[1em]' : ''}>
        <h1 className={theme.config?.title?.fontFamily} style={buildFontStyle(theme.config?.title, {
          fontSize: 125,
          fontWeight: 700,
        })}>{content.title.replace(/\s+/g, ' ')}</h1>
        {content?.subtitle && <h2 className={cn('mt-[.25em]', theme.config?.artist?.fontFamily)} style={buildFontStyle(theme.config?.artist, {
          fontSize: 75,
          fontWeight: 500,
        })}>{content.subtitle.replace(/\s+/g, ' ')}</h2>}
      </div>
    )
  }

  const getTextContent = (content: ISlideTextContent) => {
    return (
      <div className={cn('whitespace-pre-wrap', theme.config?.lyrics?.fontFamily)} style={buildFontStyle(theme.config?.lyrics, {
        fontSize: 100,
        fontWeight: 400,
      })}>
        {content.text.replace(/[^\S\r\n]+/g, ' ')}
      </div>
    )
  }

  const getImageContent = (content: ISlideImageContent) => {
    if (theme.extends === "subtitles") {
      return <></>;
    }

    return (
      <div className="flex justify-center">
        <img src={content.url} alt={content.alt} />
      </div>
    )
  }

  const update = () => {
    updateFontSize();
    updateContent();
  }

  useImperativeHandle(ref, () => ({
    update,
  }));

  return (
    <div
      ref={wrapperDiv as React.Ref<HTMLDivElement>}
      className={cn(
        'w-full h-full leading-[1.15em] p-[.5em] flex flex-col items-stretch pointer-events-none',
        theme.config?.position == 'top' && 'justify-start',
        theme.config?.position == 'middle' && 'justify-center',
        theme.config?.position == 'bottom' && 'justify-end',
        theme.config?.alignment == 'left' && 'text-start',
        theme.config?.alignment == 'center' && 'text-center',
        theme.config?.alignment == 'right' && 'text-end',
      )}
      style={{
        fontSize: fontSize,
        backgroundColor: selectedSlide?.isEmpty === true && theme.config?.invisibleOnEmptyItems === true ? 'transparent' : theme.config?.backgroundColor,
        color: theme.config?.foregroundColor,
      }}>
      {toShow.length > 0 && toShow.map((c, ix) => !!c ? (
        <div key={ix}>
          {c.type == "title" && getTitleContent(c as ISlideTitleContent)}
          {c.type == "lyrics" && getTextContent(c as ISlideTextContent)}
          {c.type == "image" && getImageContent(c as ISlideImageContent)}
        </div>
        ) : <></>
      )}
    </div>
  );
});
