import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  resize: 'auto' | 'none' | 'manual';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, resize = 'manual', onChange, ...props }, ref) => {

    const resizeClass = resize == 'manual' ? 'resize-y' : 'resize-none';
    const localRef = React.useRef(ref);

    const updateHeight = (target) => {
      if (resize == 'auto' && localRef) {
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
      }
    }
    React.useEffect(() => {
      updateHeight(localRef.current);
    });

    const updateValue = (event) => {
      if (onChange) {
        onChange(event);
      }

      updateHeight(event.target);
    };

    return (
      <textarea
        className={cn(
          resizeClass +
          " overflow-hidden flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={localRef}
        value={value}
        onChange={updateValue}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
