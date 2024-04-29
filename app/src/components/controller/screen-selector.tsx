import { ReactNode, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useWindow } from "./window-provider";

export default function ScreenSelector({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState(false);
  const [displayOptions, setDisplayOptions] = useState([]);
  const {childWindow} = useWindow();

  const setFullScreen = (ix: number) => {
    if (ix < 0 || ix >= displayOptions.length) return;

    const doc = childWindow?.document;
    if (!doc) return;

    const selectedDisplay = displayOptions[ix];
    const elem = doc.documentElement;
    const options = {
      navigationUI: "hide",
      screen: selectedDisplay,
    };

    const requestMethod = elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullScreen;
    requestMethod.call(elem, options);
    setSelected(true);
  }

  useEffect(() => {
    if (childWindow?.screen.isExtended == true) {
      const screenDetailsPromise = childWindow.getScreenDetails();
      if (screenDetailsPromise) {
        screenDetailsPromise.then((details) => {
          setDisplayOptions(details.screens);
        })
      }
    } else {
      setSelected(true);
    }
  }, []);

  return (
    <>
      {selected ? (
        <>
          {children}
        </>
      ) : (
        <div className="min-h-screen w-full p-4 flex flex-col justify-center items-stretch text-center bg-black text-white text-[8vh]">
          <h3 className="mb-4">Select screen</h3>
          <Button size={'lg'} onClick={() => setSelected(true)} className="text-xl">This window</Button>
          {displayOptions.map((m, ix) => (
            <Button key={ix} size={'lg'} onClick={() => setFullScreen(ix)} className="text-xl mt-2">
              Display {ix}{m.label && (
                <span className="ms-2">({m.label})</span>
              )}</Button>
          ))}
        </div>
      )}
    </>
  );
}
