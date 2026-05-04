import { useState, useEffect, useRef } from 'react';

export const useEChartsReady = () => {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (!readyRef.current) {
            readyRef.current = true;
            setIsReady(true);
          }
          if (chartRef.current) {
            chartRef.current.getEchartsInstance?.()?.resize();
          }
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { isReady, containerRef, chartRef };
};
