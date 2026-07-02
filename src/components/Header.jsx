import { ChartCandlestick, Wifi, WifiOff } from 'lucide-react';
import { SYMBOLS, TIMEFRAMES } from '../lib/binanceApi';

export default function Header({ symbol, setSymbol, interval, setInterval, stats, connected }) {
  const isUp = stats && stats.priceChangePercent >= 0;

  return (
    <div className="app-header">
      <div className="header-top">
        <div className="logo-row">
          <ChartCandlestick size={20} color="#F0B429" />
          <span className="logo-text">CryptoTA Pro</span>
          <span className={`conn-badge ${connected ? 'conn-on' : 'conn-off'}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? '即時連線中' : '連線中斷'}
          </span>
        </div>

        {stats && (
          <div className="price-summary">
            <span className="price-now">{stats.lastPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
            <span className={isUp ? 'price-change-up' : 'price-change-down'}>
              {isUp ? '+' : ''}{stats.priceChangePercent.toFixed(2)}%
            </span>
            <span className="price-range">
              24h 高 {stats.highPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })} · 低 {stats.lowPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
        )}
      </div>

      <div className="header-controls">
        <div className="symbol-row">
          {SYMBOLS.map((s) => (
            <button
              key={s.value}
              className={`sym-btn ${symbol === s.value ? 'active' : ''}`}
              onClick={() => setSymbol(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="tf-row">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              className={`tf-btn ${interval === tf.value ? 'active' : ''}`}
              onClick={() => setInterval(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
