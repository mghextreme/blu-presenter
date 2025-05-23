/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useWindow } from "@/hooks/window.provider";
import { useTranslation } from "react-i18next";
import { IBrowserWindow, IScreenDetails } from "@/types/browser";

export default function ScreenSelector({ children }: { children: ReactNode }) {

  const { t } = useTranslation("controller");

  const [selected, setSelected] = useState(false);
  const [displayOptions, setDisplayOptions] = useState<IScreenDetails[]>([]);
  const {childWindow} = useWindow();

  const setFullScreen = (ix: number) => {
    if (ix < 0 || ix >= displayOptions.length) return;

    const doc = childWindow?.document;
    if (!doc) return;

    const selectedDisplay = displayOptions[ix];
    const options = {
      navigationUI: "hide",
      screen: selectedDisplay,
    };

    const elem = doc.documentElement as any;
    const requestMethod = elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullScreen;
    if (requestMethod) {
      requestMethod.call(elem, options);
    }
    setSelected(true);
  }

  useEffect(() => {
    const browserWindow = childWindow?.screen as Screen & {isExtended: boolean}
    if (browserWindow?.isExtended == true) {
      const browserWindow = childWindow as unknown as IBrowserWindow;
      const screenDetailsPromise = browserWindow.getScreenDetails();
      if (screenDetailsPromise) {
        screenDetailsPromise.then((details: {screens: IScreenDetails[]}) => {
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
          <h3 className="mb-4">{t('screenSelector.title')}</h3>
          <Button size={'lg'} onClick={() => setSelected(true)} className="text-xl">{t('screenSelector.windowed')}</Button>
          {displayOptions.map((m, ix) => (
            <Button key={ix} size={'lg'} onClick={() => setFullScreen(ix)} className="text-xl mt-2">
              {t('screenSelector.fullScreen')} - {t('screenSelector.display')} {ix}{m.label && (
                <span className="ms-2">({m.label})</span>
              )}</Button>
          ))}
        </div>
      )}
    </>
  );
}
