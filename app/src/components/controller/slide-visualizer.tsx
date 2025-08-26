import { useEffect, useRef } from "react";
import { ControllerMode, WindowTheme } from "@/types";
import { SingleSlideVisualizer } from "./single-slide-visualizer";
import { ScrollingSongVisualizer } from "./scrolling-song-visualizer";
import { useController } from "@/hooks/controller.provider";

type SlideVisualizerProps = {
  mode: ControllerMode
  theme?: WindowTheme
}

export default function SlideVisualizer({
  mode,
  theme = 'black',
}: SlideVisualizerProps) {

  const {
    setSelection,
  } = useController();

  const componentRef = useRef(null);
  useEffect(() => {
    if (theme !== 'chromaKey') {
      setSelection({
        part: 0,
      });
    }

    if (componentRef.current) {
      (componentRef.current as any).update();
    }
  }, [mode, theme]);

  return theme === 'chords' ? (
    <ScrollingSongVisualizer ref={componentRef}></ScrollingSongVisualizer>
  ) : (
    <SingleSlideVisualizer ref={componentRef} mode={mode} theme={theme}></SingleSlideVisualizer>
  );
}
