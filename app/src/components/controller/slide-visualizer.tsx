import { ISlide } from "@/types";
import { useController } from "./controller-provider";
import { useEffect, useState } from "react";

export default function SlideVisualizer({ content, theme = 'black', fontSize = '8vh' }: { theme?: string, content?: ISlide, fontSize?: string }) {
  const { selectedSlide } = useController();

  const [toShow, setToShow] = useState<ISlide | undefined>();
  useEffect(() => {
    if (content) {
      setToShow(content);
    } else {
      setToShow(selectedSlide);
    }
  }, [content, selectedSlide]);

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
      {toShow?.text && <div className="text-[1em] whitespace-pre-wrap">
        {toShow?.text}
      </div>}
    </div>
  );
}
