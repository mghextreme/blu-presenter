import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import ThemeProvider from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

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
  const toggleFullscreen = () => {
    const doc = externalWind?.document;
    if (!doc) return;

    const elem = doc.documentElement;
    if (!fullScreen) {
      const requestMethod = elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullScreen;
      requestMethod.call(elem);
      setFullScreen(true);
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (doc.mozExitFullScreen) doc.mozExitFullScreen();
      else if (doc.msExitFullscreen) doc.msExitFullscreen();
      setFullScreen(false);
    }
  }

  useEffect(() => {
    const externalDocument = window.open('', '', 'width=600,height=400,left=200,top=200,fullscreen=yes');
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
        <div className="min-h-screen bg-background">
          {children}
          <br/>
          <Button onClick={toggleFullscreen}>Toggle FullScreen</Button>
        </div>
      ), externalEl)}
    </>
  );
}
