import { useEffect, useState } from 'react';
export function OtschetBroni({ until }: { until: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  return <>Резерв {Math.max(0, Math.ceil((new Date(until).getTime() - now) / 60_000))} мин</>;
}
