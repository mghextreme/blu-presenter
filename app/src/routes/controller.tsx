import { useState } from "react";
import WindowVisualizer from "@/components/controller/window-visualizer";
import { Button } from "@/components/ui/button";

import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import StopSolidIcon from "@heroicons/react/24/solid/StopIcon";
import FingerPrintSolidIcon from "@heroicons/react/24/solid/FingerPrintIcon";

export default function Controller() {
  const slides = [
    '',
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
    '',
    'Prosseguindo para o alvo eu vou\n\
A coroa conquistar\n\
Vou lutando, nada pode me impedir\n\
Eu vou Te seguir\n\
Conhecer-Te eu quero mais',
    'Senhor, Te quero\n\
Quero ouvir Tua voz\n\
Senhor, Te quero mais\n\
Quero tocar-Te\n\
Tua face eu quero ver\n\
Senhor, Te quero mais',
    'Senhor, Te quero\n\
Quero ouvir Tua voz\n\
Senhor, Te quero mais\n\
Quero tocar-Te\n\
Tua face eu quero ver\n\
Senhor, Te quero mais',
    '',
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
      <div id="controller" className="p-3 flex flex-1 gap-3 overflow-hidden">
        <div id="plan" className="w-1/3 p-3 bg-background rounded">
          <div>Search songs</div>
          <div>Add song to schedule</div>
        </div>
        <div id="schedule" className="w-1/3 p-3 bg-background rounded flex flex-col items-stretch">
          <Button onClick={toggleWindow}>
            Toggle window
          </Button>
          <div className="flex-1 overflow-y-auto">
            <h3>Song name</h3>
            <ul className="overflow-y-auto">
              {slides.map((s, ix) => (
                <li key={ix} className="whitespace-pre-wrap mt-4">{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div id="live" className="w-1/3 p-3 bg-background rounded flex flex-col items-stretch">
          <div id="controls" className="mb-3 grid grid-cols-4 gap-2 flex-0">
            <Button onClick={prevSlide} title="Previous">
              <ArrowLeftIcon className="size-4"></ArrowLeftIcon>
            </Button>
            <Button title="Blank">
              <StopSolidIcon className="size-4"></StopSolidIcon>
            </Button>
            <Button title="Visual identity">
              <FingerPrintSolidIcon className="size-4"></FingerPrintSolidIcon>
            </Button>
            <Button onClick={nextSlide} title="Next">
              <ArrowRightIcon className="size-4"></ArrowRightIcon>
            </Button>
          </div>
          <div id="content" className="flex-1 overflow-y-auto">
            <ul>
              {slides.map((s, ix) => (
                <li key={ix} className={'py-3 px-4 whitespace-pre-wrap rounded ' + (ix == slideIx ? 'bg-card' : '')}>{s}</li>
              ))}
            </ul>
          </div>
          <div id="preview flex-0">
            Preview
          </div>
        </div>
      </div>
      {windows.map((w) => (
        <WindowVisualizer key={w.name}>
          <div className="whitespace-pre-wrap">
            {slides[slideIx]}
          </div>
          <Button type="button" onClick={toggleWindow}>
            Close window
          </Button>
        </WindowVisualizer>
      ))}
    </>
  );
}
