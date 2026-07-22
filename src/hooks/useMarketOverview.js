import { useState, useEffect } from 'react';
import { fetchFearGreed, fetchMarketRSI, fetchAllFundingRates } from '../lib/binanceApi';

export function useMarketOverview() {
  const [fearGreed, setFearGreed] = useState(null);
  const [marketRSI, setMarketRSI] = useState(null);
  const [allFunding, setAllFunding] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [fg, mrsi, funding] = await Promise.all([
        fetchFearGreed(),
        fetchMarketRSI(),
        fetchAllFundingRates(),
      ]);
      if (!cancelled) {
        setFearGreed(fg);
        setMarketRSI(mrsi);
        setAllFunding(funding.filter(f => Math.abs(f.fundingRate) > 0.0001).sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate)).slice(0, 10));
        setLoading(false);
      }
    }
    load();
    const timer = setInterval(load, 5 * 60 * 1000); // 每 5 分鐘更新
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  return { fearGreed, marketRSI, allFunding, loading };
}
