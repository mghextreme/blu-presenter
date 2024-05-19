import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type WindowProviderProps = {
  id: string
  children: React.ReactNode
}

type WindowProviderState = {
  childWindow?: Window,
}

const initialState: WindowProviderState = {
  childWindow: undefined,
}

const WindowProviderContext = createContext<WindowProviderState>(initialState);

export default function WindowProvider({
  id,
  children,
  ...props
}: WindowProviderProps) {

  const [externalWind, setExternalWind] = useState<Window | undefined>(undefined);
  const [externalEl, setExternalEl] = useState<HTMLElement | undefined>(undefined);

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
  }, []);

  const initialValue = {
    childWindow: externalWind,
  }

  return (
    <WindowProviderContext.Provider {...props} value={initialValue}>
      {externalWind && externalEl && createPortal((
        <div className="min-h-screen w-full">
          {children}
        </div>
      ), externalEl)}
    </WindowProviderContext.Provider>
  );
}

export const useWindow = () => {
  const context = useContext(WindowProviderContext)

  if (context === undefined)
    throw new Error("useWindow must be used within a WindowProvider")

  return context
}
