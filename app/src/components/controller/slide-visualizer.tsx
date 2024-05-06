import { ControllerMode, ISlideContent, ISlideImageContent, ISlideTextContent, ISlideTitleContent } from "@/types";
import { useController } from "./controller-provider";
import { useEffect, useState } from "react";

type SlideVisualizerProps = {
  mode: ControllerMode
  theme?: string
  fontSize?: string
}

export default function SlideVisualizer({
  mode,
  theme = 'black',
  fontSize = '8vh'
}: SlideVisualizerProps) {
  const {
    selectedSlide,
    overrideSlide,
    partIndex,
  } = useController();

  const [toShow, setToShow] = useState<ISlideContent[]>([]);
  useEffect(() => {
    let content: ISlideContent[] = [];
    if (overrideSlide !== undefined) {
      setToShow(overrideSlide.content ?? []);
      return
    }

    content = selectedSlide?.content ?? [];

    if (mode == 'part') {
      setToShow(content.length > 0 ? [content[partIndex]] : []);
    } else {
      setToShow(content);
    }
  }, [mode, selectedSlide, overrideSlide, partIndex]);

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
        <h1 className="text-[1.25em]">{content.title}</h1>
        {content?.subtitle && <h2 className="text-[.75em]">{content.subtitle}</h2>}
      </div>
    )
  }

  const getTextContent = (content: ISlideTextContent) => {
    return (
      <div className="text-[1em] whitespace-pre-wrap">
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
    <div className={'w-full h-full leading-[1.15em] p-[.5em] flex flex-col items-stretch text-white text-center ' + themeClass} style={{fontSize: fontSize}}>
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
