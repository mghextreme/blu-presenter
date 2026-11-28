import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ConnectionIndicatorProps {
  isConnected: boolean;
  reconnectAttempts: number;
}

export function ConnectionIndicator({
  isConnected,
  reconnectAttempts,
}: Readonly<ConnectionIndicatorProps>) {
  const [hasConnectedOnce, setHasConnectedOnce] = useState(isConnected);
  if (isConnected && !hasConnectedOnce) {
    setHasConnectedOnce(true);
  }

  const visible = !isConnected && hasConnectedOnce;
  if (!visible) return null;

  const isReconnecting = reconnectAttempts > 0;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'h-3 w-3 rounded-full animate-pulse',
        isReconnecting ? 'bg-orange-500' : 'bg-red-500',
      )}
    />
  );
}
