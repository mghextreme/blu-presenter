import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WindowProviderContext } from './window.context';

type WindowProviderProps = {
  id: string;
  onClose?: () => void;
  children: React.ReactNode;
};

export function WindowProvider({ id, onClose, children, ...props }: Readonly<WindowProviderProps>) {
  const [externalWind, setExternalWind] = useState<Window | undefined>(undefined);
  const [externalEl, setExternalEl] = useState<HTMLElement | undefined>(undefined);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // The user can close the popped-out window directly, so watch for it and
  // notify the controller to keep the tracked windows in sync.
  useEffect(() => {
    if (!externalWind) return;

    const interval = setInterval(() => {
      if (externalWind.closed) {
        clearInterval(interval);
        onCloseRef.current?.();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [externalWind]);

  const copyStyles = (sourceDoc: Document, targetDoc: Document) => {
    Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {
      if (styleSheet.href) {
        // for <link> elements loading CSS from a URL
        const newLinkEl = sourceDoc.createElement('link');

        newLinkEl.rel = 'stylesheet';
        newLinkEl.href = styleSheet.href;
        targetDoc.head.appendChild(newLinkEl);
      } else if (styleSheet.cssRules) {
        // for <style> elements
        const newStyleEl = sourceDoc.createElement('style');

        Array.from(styleSheet.cssRules).forEach((cssRule) => {
          // write the text of each rule into the body of the style element
          newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
        });

        targetDoc.head.appendChild(newStyleEl);
      }
    });
  };

  useEffect(() => {
    const externalDocument = window.open('', id, 'width=600,height=400,left=300,top=300');
    if (externalDocument) {
      setExternalWind(externalDocument);
      copyStyles(document, externalDocument?.document);
    }

    const el = document.createElement('div');
    externalDocument?.document.body.appendChild(el);
    setExternalEl(el);

    return () => {
      externalDocument?.close();
    };
  }, [id]);

  const initialValue = {
    childWindow: externalWind,
  };

  return (
    <WindowProviderContext.Provider {...props} value={initialValue}>
      {externalWind &&
        externalEl &&
        createPortal(<div className="min-h-screen w-full">{children}</div>, externalEl)}
    </WindowProviderContext.Provider>
  );
}
