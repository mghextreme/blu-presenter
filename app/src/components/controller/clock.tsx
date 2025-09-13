import { useEffect, useState } from "react";


export default function Clock() {

  const [time, setTime] = useState<string>("00:00:00");

  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTime(new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    }, 500);

    return () => {
      clearInterval(tickInterval);
    }
  }, []);

  return (
    <span className="font-source-code-pro">{time}</span>
  );
}
