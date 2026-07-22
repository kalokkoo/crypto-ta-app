import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries, HistogramSeries } from 'lightweight-charts';
import { macd } from '../lib/indicators';

export default function MacdChart({ candles }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94A3B8', fontSize: 10 },
      grid: { vertLines: { color: 'rgba(30,45,69,0.3)' }, horzLines: { color: 'rgba(30,45,69,0.3)' } },
      rightPriceScale: { borderColor: '#1E2D45' },
      timeScale: { borderColor: '#1E2D45', visible: false },
      autoSize: true, handleScroll: false, handleScale: false,
    });
    seriesRef.current = {
      hist: chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }),
      macdL: chart.addSeries(LineSeries, { color: '#3B82F6', lineWidth: 1.2, priceLineVisible: false, lastValueVisible: false }),
      sigL: chart.addSeries(LineSeries, { color: '#FC8181', lineWidth: 1.2, priceLineVisible: false, lastValueVisible: false }),
    };
    chartRef.current = chart;
    return () => chart.remove();
  }, []);

  useEffect(() => {
    if (!candles?.length || !seriesRef.current.hist) return;
    const { hist, macdL, sigL } = seriesRef.current;
    const { macdLine, signalLine, histogram } = macd(candles.map(c => c.close));
    hist.setData(candles.map((c,i) => ({ time: c.time, value: histogram[i], color: histogram[i] >= 0 ? 'rgba(72,187,120,0.7)' : 'rgba(252,129,129,0.7)' })).filter(d => d.value !== null));
    macdL.setData(candles.map((c,i) => ({ time: c.time, value: macdLine[i] })).filter(d => d.value !== null));
    sigL.setData(candles.map((c,i) => ({ time: c.time, value: signalLine[i] })).filter(d => d.value !== null));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
