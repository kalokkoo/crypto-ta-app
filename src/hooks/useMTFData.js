import { useState, useEffect, useCallback } from 'react';
import { fetchKlines } from '../lib/binanceApi';
import { computeAllIndicators, generateSignals } from '../lib/indicators';

const TIMEFRAMES = ['15m', '1h', '4h', '1d'];

export function useMTFData(symbol) {
  const [mtfData, setMtfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMTF = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    let cancelled = false;

    try {
      const results = {};
      
      for (const tf of TIMEFRAMES) {
        if (cancelled) break;
        // Fetch klines
        const klines = await fetchKlines(symbol, tf, 200);
        
        // Compute indicators and signals
        const indicators = computeAllIndicators(klines);
        const signals = generateSignals(indicators);
        
        results[tf] = {
          candles: klines,
          indicators,
          signals,
        };
        
        // 100ms delay to prevent rate limit
        await new Promise(r => setTimeout(r, 100));
      }

      if (!cancelled) {
        setMtfData(results);
      }
    } catch (err) {
      if (!cancelled) {
        setError(err.message);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
    
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    const cancel = fetchMTF();
    
    // Auto refresh every 3 minutes (180000 ms)
    const intervalId = setInterval(() => {
      fetchMTF(true);
    }, 180000);

    return () => {
      if (typeof cancel === 'function') cancel();
      clearInterval(intervalId);
    };
  }, [fetchMTF]);

  return { mtfData, loading, error, refresh: fetchMTF };
}
