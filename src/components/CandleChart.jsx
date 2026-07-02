import { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { sma, bollingerBands } from '../lib/indicators';

export default function CandleChart({ candles }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94A3B8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(30,45,69,0.4)' },
        horzLines: { color: 'rgba(30,45,69,0.4)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1E2D45' },
      timeScale: { borderColor: '#1E2D45', timeVisible: true, secondsVisible: false },
      autoSize: true,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#48BB78',
      downColor: '#FC8181',
      borderUpColor: '#48BB78',
      borderDownColor: '#FC8181',
      wickUpColor: '#48BB78',
      wickDownColor: '#FC8181',
    });

    const ma20Series = chart.addLineSeries({
      color: '#F0B429',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ma50Series = chart.addLineSeries({
      color: '#9F7AEA',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const bbUpperSeries = chart.addLineSeries({
      color: 'rgba(59,130,246,0.5)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const bbLowerSeries = chart.addLineSeries({
      color: 'rgba(59,130,246,0.5)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = { candleSeries, ma20Series, ma50Series, bbUpperSeries, bbLowerSeries };

    return () => {
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candles || candles.length === 0 || !seriesRef.current.candleSeries) return;

    const { candleSeries, ma20Series, ma50Series, bbUpperSeries, bbLowerSeries } = seriesRef.current;

    candleSeries.setData(candles.map((c) => ({
      time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
    })));

    const closes = candles.map((c) => c.close);
    const sma20Arr = sma(closes, 20);
    const sma50Arr = sma(closes, 50);
    const bb = bollingerBands(closes, 20);

    ma20Series.setData(
      candles.map((c, i) => ({ time: c.time, value: sma20Arr[i] })).filter((d) => d.value !== null)
    );
    ma50Series.setData(
      candles.map((c, i) => ({ time: c.time, value: sma50Arr[i] })).filter((d) => d.value !== null)
    );
    bbUpperSeries.setData(
      candles.map((c, i) => ({ time: c.time, value: bb.upper[i] })).filter((d) => d.value !== null)
    );
    bbLowerSeries.setData(
      candles.map((c, i) => ({ time: c.time, value: bb.lower[i] })).filter((d) => d.value !== null)
    );

    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
