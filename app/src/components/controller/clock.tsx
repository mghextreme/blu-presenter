import { useEffect, useState } from 'react';

interface ClockProps {
  format?: '24withSeconds' | '24' | '12withSeconds' | '12';
}

type ClockFormat = NonNullable<ClockProps['format']>;

function toTimeFormatOptions(format: ClockFormat): Intl.DateTimeFormatOptions {
  return {
    hour12: format.startsWith('12'),
    hour: format.startsWith('24') ? '2-digit' : 'numeric',
    minute: '2-digit',
    second: format.endsWith('withSeconds') ? '2-digit' : undefined,
  };
}

export function Clock({ format = '24withSeconds' }: Readonly<ClockProps>) {
  const [time, setTime] = useState<string>('00:00:00');

  useEffect(() => {
    const formatOptions = toTimeFormatOptions(format);
    const tickInterval = setInterval(() => {
      setTime(new Date().toLocaleTimeString(undefined, formatOptions));
    }, 500);

    return () => clearInterval(tickInterval);
  }, [format]);

  return <span className="font-source-code-pro">{time}</span>;
}
