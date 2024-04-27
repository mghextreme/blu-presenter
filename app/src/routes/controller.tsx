import { useState } from "react";
import WindowVisualizer from "../components/window-visualizer";
import { useTheme } from "@/components/theme-provider";

export default function Controller() {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    if (theme == 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }

  const slides = [
    'Eu Te busco\n\
Te procuro, oh Deus\n\
No silêncio Tu estás\n\
Eu Te busco\n\
Toda hora espero em Ti\n\
Revela-Te a mim\n\
Conhecer-Te eu quero mais',
    'Senhor, Te quero\n\
Quero ouvir Tua voz\n\
Senhor, Te quero mais\n\
Quero tocar-Te\n\
Tua face eu quero ver\n\
Senhor, Te quero mais',
    'Prosseguindo para o alvo eu vou\n\
A coroa conquistar\n\
Vou lutando, nada pode me impedir\n\
Eu vou Te seguir\n\
Conhecer-Te eu quero mais',
  ];
  const [slideIx, setSlideIx] = useState(0);

  const prevSlide = () => {
    let newSlideIx = slideIx - 1;
    if (newSlideIx < 0) {
      newSlideIx = slides.length - 1;
    }
    setSlideIx(newSlideIx);
  }
  const nextSlide = () => {
    const newSlideIx = (slideIx + 1) % slides.length;
    setSlideIx(newSlideIx);
  }

  const [windows, setWindows] = useState<{name: string}[]>([]);

  const toggleWindow = () => {
    if (windows.length == 0) {
      setWindows([{
        name: 'test'
      }]);
    } else {
      setWindows([]);
    }
  }

  return (
    <>
      <div id="controller">
        <button type="button" onClick={toggleTheme}>
          Toggle theme
        </button>
        <br/>
        <button type="button" onClick={toggleWindow}>
          Toggle window
        </button>
        <br/>
        <button type="button" onClick={prevSlide}>
          Prev
        </button>
        <br/>
        <button type="button" onClick={nextSlide}>
          Next
        </button>
        <br/>
        <br/>
        <div className="w-3/4 whitespace-pre-wrap">
          {slides[slideIx]}
        </div>
      </div>
      <br/>
      <br/>
      <br/>
      {windows.map((w) => (
        <>
          <WindowVisualizer key={w.name}>
            <div className="w-3/4 whitespace-pre-wrap">
              {slides[slideIx]}
            </div>
            <button type="button" onClick={toggleWindow}>
              Close window
            </button>
          </WindowVisualizer>
        </>
      ))}
    </>
  );
}
