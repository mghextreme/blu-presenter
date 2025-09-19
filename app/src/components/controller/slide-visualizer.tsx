import { useEffect, useRef } from "react";
import { ITheme, LyricsTheme } from "@/types";
import { useController } from "@/hooks/controller.provider";
import { SingleSlideVisualizer } from "./single-slide-visualizer";
import { ScrollingSongVisualizer } from "./scrolling-song-visualizer";

type SlideVisualizerProps = {
  theme?: ITheme
}

export default function SlideVisualizer({
  theme = LyricsTheme,
}: SlideVisualizerProps) {

  const {
    setSelection,
  } = useController();

  const componentRef = useRef<typeof ScrollingSongVisualizer | typeof SingleSlideVisualizer>(null);
  useEffect(() => {
    if (theme.extends !== 'subtitles') {
      setSelection({
        part: 0,
      });
    }

    if (componentRef.current) {
      (componentRef.current as any)?.update();
    }
  }, [theme]);

  return theme.extends === 'teleprompter' ? (
    <ScrollingSongVisualizer ref={componentRef} theme={theme}></ScrollingSongVisualizer>
  ) : (
    <SingleSlideVisualizer ref={componentRef} theme={theme}></SingleSlideVisualizer>
  );
}
