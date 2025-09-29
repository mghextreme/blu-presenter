import { useEffect, useRef, useState } from "react";

interface ClockProps {
  format?: "24withSeconds" | "24" | "12withSeconds" | "12";
}

export function Clock({
  format = "24withSeconds"
}: ClockProps) {

  const [time, setTime] = useState<string>("00:00:00");

  const formatRef = useRef<Intl.DateTimeFormatOptions>({});
  const [formatConfig, setFormatConfig] = useState<Intl.DateTimeFormatOptions>({});

  useEffect(() => {
    formatRef.current = formatConfig;
  }, [formatConfig]);

  useEffect(() => {
    setFormatConfig({
      hour12: format.startsWith("12"),
      hour: format.startsWith("24") ? '2-digit' : 'numeric',
      minute: '2-digit',
      second: format.endsWith("withSeconds") ? '2-digit' : undefined,
    });
  }, [format]);

  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTime(new Date().toLocaleTimeString(undefined, formatRef.current));
    }, 500);

    return () => {
      if (tickInterval) {
        clearInterval(tickInterval);
      }
    }
  }, []);

  return (
    <span className="font-source-code-pro">{time}</span>
  );
}
