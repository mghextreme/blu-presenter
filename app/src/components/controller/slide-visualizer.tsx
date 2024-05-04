import { ControllerMode, ISlide } from "@/types";
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
    partIndex,
  } = useController();

  const [toShow, setToShow] = useState<ISlide | undefined>();
  useEffect(() => {
    if (mode == 'part') {
      const parts = selectedSlide?.parts;
      setToShow({
        parts: parts ? [parts[partIndex]] : []
      } as ISlide);
    } else {
      setToShow(selectedSlide);
    }
  }, [mode, selectedSlide, partIndex]);

  const [themeClass, setThemeClass] = useState<string>('');
  useEffect(() => {
    if (theme == 'black') {
      setThemeClass('justify-center bg-black');
    } else {
      setThemeClass('justify-end bg-chroma-green text-shadow-solid');
    }
  }, [theme]);

  return (
    <div className={'w-full h-full leading-[1.15em] p-[.5em] flex flex-col items-stretch text-white text-center ' + themeClass} style={{fontSize: fontSize}}>
      {toShow?.title && <div className="mb-[.5em]">
        <h1 className="text-[1.25em]">{toShow.title}</h1>
        {toShow?.subtitle && <h2 className="text-[.75em]">{toShow.subtitle}</h2>}
      </div>}
      {toShow?.parts && <div className="text-[1em] whitespace-pre-wrap">
        {toShow?.parts?.join('\n')}
      </div>}
    </div>
  );
}
