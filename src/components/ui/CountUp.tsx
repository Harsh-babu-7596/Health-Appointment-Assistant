import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";

interface CountUpProps {
  to: number;
  suffix?: string;
  durationMs?: number;
}

export function CountUp({ to, suffix = "", durationMs = 1400 }: CountUpProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to, durationMs]);

  return (
    <b ref={ref}>
      {value}
      {suffix}
    </b>
  );
}
