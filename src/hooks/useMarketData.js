import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchKlines, fetch24hr, fetchOpenInterest, fetchOIHistory, fetchFundingRate, subscribeKlineStream, subscribeTickerStream } from '../lib/binanceApi';
import { computeAllIndicators, generateSignals, estimateSupportResistance } from '../lib/indicators';

export function useMarketData(symbol, interval) {
  const [candles, setCandles] = useState([]);
  const [stats, setStats] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [signals, setSignals] = useState({ signals: [], bullCount: 0, bearCount: 0, neuCount: 0 });
  const [supportResistance, setSupportResistance] = useState(null);
  const [oi, setOi] = useState(null);
  const [fundingRate, setFundingRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const candlesRef = useRef([]);
  const klineWs = useRef(null);
  const tickerWs = useRef(null);

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
    if (klineWs.current) klineWs.current.close();
    if (tickerWs.current) tickerWs.current.close();

    async function init() {
      try {
        const [klines, stat] = await Promise.all([fetchKlines(symbol, interval, 200), fetch24hr(symbol)]);
        if (cancelled) return;
        candlesRef.current = klines;
        setCandles(klines);
        setStats(stat);
        recompute(klines);
        setLoading(false);

        // OI & Funding Rate（合約，可能不支援所有幣種）
        fetchOpenInterest(symbol).then(oiData => {
          if (!cancelled && oiData) {
            fetchOIHistory(symbol, '1h', 2).then(hist => {
              if (!cancelled && hist.length >= 2) {
                const change = ((hist[hist.length-1].oi - hist[0].oi) / hist[0].oi) * 100;
                setOi({ ...oiData, change });
              } else if (!cancelled && oiData) {
                setOi({ ...oiData, change: 0 });
              }
            });
          }
        });
        fetchFundingRate(symbol).then(fr => { if (!cancelled && fr) setFundingRate(fr.rate); });

        // WebSocket K線
        klineWs.current = subscribeKlineStream(symbol, interval, update => {
          if (cancelled) return;
          const arr = candlesRef.current;
          const last = arr[arr.length - 1];
          let newArr;
          if (last && last.time === update.time) { newArr = [...arr]; newArr[arr.length - 1] = update; }
          else { newArr = [...arr, update]; if (newArr.length > 250) newArr.shift(); }
          candlesRef.current = newArr;
          setCandles(newArr);
          recompute(newArr);
        });
        klineWs.current.onopen = () => !cancelled && setConnected(true);
        klineWs.current.onclose = () => !cancelled && setConnected(false);

        // WebSocket Ticker
        tickerWs.current = subscribeTickerStream(symbol, update => { if (!cancelled) setStats(update); });
      } catch (e) {
        if (!cancelled) { setError(e.message); setLoading(false); }
      }
    }
    init();
    return () => {
      cancelled = true;
      if (klineWs.current) klineWs.current.close();
      if (tickerWs.current) tickerWs.current.close();
    };
  }, [symbol, interval, recompute]);

  return { candles, stats, indicators, signals, supportResistance, oi, fundingRate, loading, error, connected };
}
