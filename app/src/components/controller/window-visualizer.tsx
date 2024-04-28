import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function WindowVisualizer({ children }) {

  const [externalWind, setExternalWind] = useState<Window | null>(null);
  const [externalEl, setExternalEl] = useState<HTMLElement | null>(null);

  const copyStyles = (sourceDoc: Document, targetDoc: Document) => {
    Array.from(sourceDoc.styleSheets).forEach(styleSheet => {
      if (styleSheet.cssRules) { // for <style> elements
        const newStyleEl = sourceDoc.createElement('style');
  
        Array.from(styleSheet.cssRules).forEach(cssRule => {
          // write the text of each rule into the body of the style element
          newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
        });
  
        targetDoc.head.appendChild(newStyleEl);
      } else if (styleSheet.href) { // for <link> elements loading CSS from a URL
        const newLinkEl = sourceDoc.createElement('link');
  
        newLinkEl.rel = 'stylesheet';
        newLinkEl.href = styleSheet.href;
        targetDoc.head.appendChild(newLinkEl);
      }
    });
  };

  const [fullScreen, setFullScreen] = useState(false);
  const toggleFullscreen = async () => {
    const doc = externalWind?.document;
    if (!doc) return;

    const elem = doc.documentElement;
    if (!fullScreen) {
      const options = {
        navigationUI: "hide",
        screen: undefined,
      };
      if (window.screen.isExtended == true) {
        const screenDetails = (await window.getScreenDetails() ).screens;
        options.screen = screenDetails[1];
      }

      const requestMethod = elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullScreen;
      await requestMethod.call(elem, options);
      setFullScreen(true);
    } else {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      else if (doc.mozExitFullScreen) await doc.mozExitFullScreen();
      else if (doc.msExitFullscreen) await doc.msExitFullscreen();
      setFullScreen(false);
    }
  }

  useEffect(() => {
    const externalDocument = window.open('', '_new', 'width=600,height=400,left=200,top=200,fullscreen=yes');
    if (externalDocument) {
      setExternalWind(externalDocument);
      copyStyles(document, externalDocument?.document)
    }

    const el = document.createElement('div');
    externalDocument?.document.body.appendChild(el);
    setExternalEl(el);

    return () => {
      externalDocument?.close();
    };
  }, []);

  return (
    <>
      {externalWind && externalEl && createPortal((
        <div className="min-h-screen w-full bg-black">
          {children}
        </div>
      ), externalEl)}
    </>
  );
}
