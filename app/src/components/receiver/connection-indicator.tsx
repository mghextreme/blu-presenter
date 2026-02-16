import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ConnectionIndicatorProps {
  isConnected: boolean;
  reconnectAttempts: number;
}

export function ConnectionIndicator({ isConnected, reconnectAttempts }: ConnectionIndicatorProps) {
  const hasConnectedOnceRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isConnected) {
      hasConnectedOnceRef.current = true;
      setVisible(false);
    } else if (hasConnectedOnceRef.current) {
      setVisible(true);
    }
  }, [isConnected]);

  if (!visible) return null;

  const isReconnecting = reconnectAttempts > 0;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "h-3 w-3 rounded-full animate-pulse",
        isReconnecting ? "bg-orange-500" : "bg-red-500",
      )}
    />
  );
}
