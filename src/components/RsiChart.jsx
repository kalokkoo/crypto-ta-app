import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import { rsi } from '../lib/indicators';

export default function RsiChart({ candles }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94A3B8', fontSize: 10 },
      grid: { vertLines: { color: 'rgba(30,45,69,0.3)' }, horzLines: { color: 'rgba(30,45,69,0.3)' } },
      rightPriceScale: { borderColor: '#1E2D45' },
      timeScale: { borderColor: '#1E2D45', visible: false },
      autoSize: true, handleScroll: false, handleScale: false,
    });
    lineRef.current = chart.addSeries(LineSeries, { color: '#9F7AEA', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: true });
    chartRef.current = chart;
    return () => chart.remove();
  }, []);

  useEffect(() => {
    if (!candles?.length || !lineRef.current) return;
    const rsiArr = rsi(candles.map(c => c.close), 14);
    lineRef.current.setData(candles.map((c,i) => ({ time: c.time, value: rsiArr[i] })).filter(d => d.value !== null));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
