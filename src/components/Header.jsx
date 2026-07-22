import { useState } from 'react';
import { ChartCandlestick, Wifi, WifiOff } from 'lucide-react';
import { SYMBOLS, TIMEFRAMES, CATEGORIES } from '../lib/binanceApi';

export default function Header({ symbol, setSymbol, interval, setInterval, stats, connected }) {
  const [activeCategory, setActiveCategory] = useState('主流');
  const isUp = stats && stats.priceChangePercent >= 0;
  const filtered = SYMBOLS.filter(s => s.category === activeCategory);

  return (
    <div className="app-header">
      <div className="header-top">
        <div className="logo-row">
          <ChartCandlestick size={20} color="#F0B429" />
          <span className="logo-text">CryptoTA Pro</span>
          <span className={`conn-badge ${connected ? 'conn-on' : 'conn-off'}`}>
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? '即時' : '離線'}
          </span>
        </div>
        {stats && (
          <div className="price-summary">
            <span className="price-now">{stats.lastPrice?.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
            <span className={isUp ? 'price-change-up' : 'price-change-down'}>
              {isUp ? '▲' : '▼'} {Math.abs(stats.priceChangePercent || 0).toFixed(2)}%
            </span>
            <span className="price-range">
              H {stats.highPrice?.toLocaleString(undefined, { maximumFractionDigits: 4 })} · L {stats.lowPrice?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
        )}
        <div className="tf-row">
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} className={`tf-btn ${interval === tf.value ? 'active' : ''}`} onClick={() => setInterval(tf.value)}>
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      <div className="header-controls">
        <div className="category-row">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
        <div className="symbol-row">
          {filtered.map(s => (
            <button key={s.value} className={`sym-btn ${symbol === s.value ? 'active' : ''}`} onClick={() => setSymbol(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
