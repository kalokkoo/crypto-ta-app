import { useState, useEffect } from 'react';
import { SYMBOLS } from '../lib/binanceApi';

// 用 Binance 1h K 線近似計算 OI 變化和價格變化
async function fetchQuadrantData() {
  const targets = SYMBOLS.filter(s => ['主流', 'L1/L2'].includes(s.category)).map(s => s.value);
  const results = await Promise.allSettled(targets.map(async sym => {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1h&limit=3`);
    if (!res.ok) return null;
    const d = await res.json();
    if (d.length < 2) return null;
    const prev = d[d.length - 2], cur = d[d.length - 1];
    const prevClose = +prev[4], curClose = +cur[4];
    const priceChange = ((curClose - prevClose) / prevClose) * 100;
    const prevVol = +prev[5], curVol = +cur[5];
    const prevBuy = +prev[9], curBuy = +cur[9];
    const cvdChange = ((curBuy - (curVol - curBuy)) - (prevBuy - (prevVol - prevBuy))) / prevVol * 100;
    return { symbol: sym.replace('USDT', ''), priceChange, cvdChange, price: curClose };
  }));
  return results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
}

export default function CVDQuadrant() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function load() {
    setLoading(true);
    const d = await fetchQuadrantData();
    setData(d);
    setLastUpdate(new Date().toLocaleTimeString('zh-TW'));
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const W = 300, H = 260, PAD = 30;
  const toX = v => PAD + (v + 15) / 30 * (W - PAD * 2);
  const toY = v => H - PAD - (v + 10) / 20 * (H - PAD * 2);

  return (
    <div className="quadrant-wrap">
      <div className="quadrant-header">
        <span className="side-title" style={{ marginBottom: 0 }}>CVD 四象限篩選器</span>
        <button className="refresh-btn" onClick={load} disabled={loading}>↻ {lastUpdate}</button>
      </div>
      <div className="quadrant-labels-row">
        <span className="ql q2">Q2 空頭平倉 ↖</span>
        <span className="ql q1">Q1 多頭建倉 ↗</span>
      </div>
      <div style={{ position: 'relative' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
          {/* 格線 */}
          <line x1={W/2} y1={PAD} x2={W/2} y2={H-PAD} stroke="#1E2D45" strokeWidth="1" />
          <line x1={PAD} y1={H/2} x2={W-PAD} y2={H/2} stroke="#1E2D45" strokeWidth="1" />
          {/* 象限背景 */}
          <rect x={W/2} y={PAD} width={(W-PAD*2)/2} height={(H-PAD*2)/2} fill="rgba(72,187,120,0.03)" />
          <rect x={PAD} y={PAD} width={(W-PAD*2)/2} height={(H-PAD*2)/2} fill="rgba(59,130,246,0.03)" />
          <rect x={PAD} y={H/2} width={(W-PAD*2)/2} height={(H-PAD*2)/2} fill="rgba(252,129,129,0.03)" />
          <rect x={W/2} y={H/2} width={(W-PAD*2)/2} height={(H-PAD*2)/2} fill="rgba(159,122,234,0.03)" />
          {/* 軸標籤 */}
          <text x={W-PAD+4} y={H/2+4} fontSize="9" fill="#475569">CVD+</text>
          <text x={PAD-24} y={H/2+4} fontSize="9" fill="#475569">CVD-</text>
          <text x={W/2-6} y={PAD-4} fontSize="9" fill="#475569">P+</text>
          <text x={W/2-6} y={H-PAD+12} fontSize="9" fill="#475569">P-</text>
          {/* 數據點 */}
          {!loading && data.map(d => {
            const x = Math.max(PAD+4, Math.min(W-PAD-4, toX(d.cvdChange)));
            const y = Math.max(PAD+4, Math.min(H-PAD-4, toY(d.priceChange)));
            const isQ1 = d.cvdChange > 0 && d.priceChange > 0;
            const isQ4 = d.cvdChange > 0 && d.priceChange < 0;
            const color = isQ1 ? '#48BB78' : isQ4 ? '#9F7AEA' : d.priceChange > 0 ? '#3B82F6' : '#FC8181';
            return (
              <g key={d.symbol}>
                <circle cx={x} cy={y} r="5" fill={color} opacity="0.85" />
                <text x={x} y={y-8} fontSize="8" fill={color} textAnchor="middle" fontWeight="600">{d.symbol}</text>
              </g>
            );
          })}
          {loading && <text x={W/2} y={H/2} fontSize="11" fill="#475569" textAnchor="middle">載入中...</text>}
        </svg>
      </div>
      <div className="quadrant-labels-row">
        <span className="ql q3">Q3 多頭平倉 ↙</span>
        <span className="ql q4">Q4 空頭建倉 ↘</span>
      </div>
      <div className="quadrant-legend">
        <span style={{ color: '#48BB78' }}>● Q1 多頭建倉</span>
        <span style={{ color: '#3B82F6' }}>● Q2 空頭平倉</span>
        <span style={{ color: '#FC8181' }}>● Q3 多頭平倉</span>
        <span style={{ color: '#9F7AEA' }}>● Q4 空頭建倉</span>
      </div>
    </div>
  );
}
