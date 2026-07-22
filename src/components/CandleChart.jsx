import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { sma, bollingerBands } from '../lib/indicators';

export default function CandleChart({ candles }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94A3B8', fontSize: 11 },
      grid: { vertLines: { color: 'rgba(30,45,69,0.4)' }, horzLines: { color: 'rgba(30,45,69,0.4)' } },
      rightPriceScale: { borderColor: '#1E2D45' },
      timeScale: { borderColor: '#1E2D45', timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    const candleSeries = chart.addSeries(CandlestickSeries, { upColor: '#48BB78', downColor: '#FC8181', borderUpColor: '#48BB78', borderDownColor: '#FC8181', wickUpColor: '#48BB78', wickDownColor: '#FC8181' });
    const ma20 = chart.addSeries(LineSeries, { color: '#F0B429', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const ma50 = chart.addSeries(LineSeries, { color: '#9F7AEA', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const bbU = chart.addSeries(LineSeries, { color: 'rgba(59,130,246,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const bbL = chart.addSeries(LineSeries, { color: 'rgba(59,130,246,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    chartRef.current = chart;
    seriesRef.current = { candleSeries, ma20, ma50, bbU, bbL };
    return () => chart.remove();
  }, []);

  useEffect(() => {
    if (!candles?.length || !seriesRef.current.candleSeries) return;
    const { candleSeries, ma20, ma50, bbU, bbL } = seriesRef.current;
    candleSeries.setData(candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
    const closes = candles.map(c => c.close);
    const s20 = sma(closes, 20), s50 = sma(closes, 50);
    const bb = bollingerBands(closes, 20);
    ma20.setData(candles.map((c,i) => ({ time: c.time, value: s20[i] })).filter(d => d.value !== null));
    ma50.setData(candles.map((c,i) => ({ time: c.time, value: s50[i] })).filter(d => d.value !== null));
    bbU.setData(candles.map((c,i) => ({ time: c.time, value: bb.upper[i] })).filter(d => d.value !== null));
    bbL.setData(candles.map((c,i) => ({ time: c.time, value: bb.lower[i] })).filter(d => d.value !== null));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
