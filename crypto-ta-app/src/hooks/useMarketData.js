import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchKlines, fetch24hrStats, subscribeKlineStream, subscribeTickerStream } from '../lib/binanceApi';
import { computeAllIndicators, generateSignals, estimateSupportResistance } from '../lib/indicators';

export function useMarketData(symbol, interval) {
  const [candles, setCandles] = useState([]);
  const [stats, setStats] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [signals, setSignals] = useState({ signals: [], bullCount: 0, bearCount: 0, neuCount: 0 });
  const [supportResistance, setSupportResistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const klineWsRef = useRef(null);
  const tickerWsRef = useRef(null);
  const candlesRef = useRef([]);

  const recompute = useCallback((data) => {
    const ind = computeAllIndicators(data);
    setIndicators(ind);
    setSignals(generateSignals(ind));
    setSupportResistance(estimateSupportResistance(data, ind));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setConnected(false);

    if (klineWsRef.current) klineWsRef.current.close();
    if (tickerWsRef.current) tickerWsRef.current.close();

    async function init() {
      try {
        const [klines, stat24h] = await Promise.all([
          fetchKlines(symbol, interval, 200),
          fetch24hrStats(symbol),
        ]);
        if (cancelled) return;

        candlesRef.current = klines;
        setCandles(klines);
        setStats(stat24h);
        recompute(klines);
        setLoading(false);

        klineWsRef.current = subscribeKlineStream(symbol, interval, (update) => {
          if (cancelled) return;
          const arr = candlesRef.current;
          const lastIdx = arr.length - 1;
          let newArr;
          if (lastIdx >= 0 && arr[lastIdx].time === update.time) {
            newArr = [...arr];
            newArr[lastIdx] = update;
          } else {
            newArr = [...arr, update];
            if (newArr.length > 250) newArr.shift();
          }
          candlesRef.current = newArr;
          setCandles(newArr);
          recompute(newArr);
        });

        klineWsRef.current.onopen = () => !cancelled && setConnected(true);
        klineWsRef.current.onerror = () => !cancelled && setConnected(false);
        klineWsRef.current.onclose = () => !cancelled && setConnected(false);

        tickerWsRef.current = subscribeTickerStream(symbol, (update) => {
          if (!cancelled) setStats(update);
        });
      } catch (e) {
        if (!cancelled) {
          setError(e.message || '資料載入失敗');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (klineWsRef.current) klineWsRef.current.close();
      if (tickerWsRef.current) tickerWsRef.current.close();
    };
  }, [symbol, interval, recompute]);

  return { candles, stats, indicators, signals, supportResistance, loading, error, connected };
}
