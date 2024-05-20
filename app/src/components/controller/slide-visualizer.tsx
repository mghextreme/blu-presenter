import { ControllerMode, ISlideContent, ISlideImageContent, ISlideTextContent, ISlideTitleContent } from "@/types";
import { useController } from "@/hooks/controller.provider";
import { useEffect, useRef, useState } from "react";
import { useWindow } from "@/hooks/window.provider";

type SlideVisualizerProps = {
  mode: ControllerMode
  theme?: string
  fontSize?: string
}

export default function SlideVisualizer({
  mode,
  theme = 'black',
}: SlideVisualizerProps) {
  const {
    selectedSlide,
    overrideSlide,
    selection,
  } = useController();
  
  const {childWindow} = useWindow();

  const wrapperDiv = useRef();
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
  useEffect(() => {
    let content: ISlideContent[] = [];
    if (overrideSlide !== undefined) {
      setToShow(overrideSlide.content ?? []);
      return
    }

    content = selectedSlide?.content ?? [];

    if (mode == 'part') {
      setToShow(content.length > 0 ? [content[selection.part ?? 0]] : []);
    } else {
      setToShow(content);
    }
  }, [mode, selectedSlide, overrideSlide, selection]);

  const [themeClass, setThemeClass] = useState<string>('');
  useEffect(() => {
    if (theme == 'black') {
      setThemeClass('justify-center bg-black');
    } else {
      setThemeClass('justify-end bg-chroma-green text-shadow-solid');
    }
  }, [theme]);

  const getTitleContent = (content: ISlideTitleContent) => {
    return (
      <div className={theme == 'black' ? 'py-[1em]' : ''}>
        <h1 className="text-[1.25em] font-bold">{content.title}</h1>
        {content?.subtitle && <h2 className="text-[.75em] font-medium">{content.subtitle}</h2>}
      </div>
    )
  }

  const getTextContent = (content: ISlideTextContent) => {
    return (
      <div className="text-[1em] whitespace-pre-wrap uppercase font-medium">
        {content.text}
      </div>
    )
  }

  const getImageContent = (content: ISlideImageContent) => {
    if (mode == "part") {
      return <></>;
    }

    return (
      <div className="flex justify-center">
        <img src={content.url} alt={content.alt} />
      </div>
    )
  }

  return (
    <div
      ref={wrapperDiv}
      className={'w-full h-full leading-[1.15em] p-[.5em] flex flex-col items-stretch text-white text-center ' + themeClass}
      style={{fontSize: fontSize}}>
      {toShow.map((c, ix) => (
        <div key={ix}>
          {c.type == "title" && getTitleContent(c as ISlideTitleContent)}
          {c.type == "lyrics" && getTextContent(c as ISlideTextContent)}
          {c.type == "image" && getImageContent(c as ISlideImageContent)}
        </div>
      ))}
    </div>
  );
}
