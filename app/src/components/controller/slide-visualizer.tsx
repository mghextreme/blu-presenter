import { ControllerMode, WindowTheme } from "@/types";
import SingleSlideVisualizer from "./single-slide-visualizer";
import ScrollingSongVisualizer from "./scrolling-song-visualizer";

type SlideVisualizerProps = {
  mode: ControllerMode
  theme?: WindowTheme
}

export default function SlideVisualizer({
  mode,
  theme = 'black',
}: SlideVisualizerProps) {
  return theme === 'chords' ? (
    <ScrollingSongVisualizer></ScrollingSongVisualizer>
  ) : (
    <SingleSlideVisualizer mode={mode} theme={theme}></SingleSlideVisualizer>
  );
}
