import { useState } from 'react';
import Header from './components/Header';
import CandleChart from './components/CandleChart';
import RsiChart from './components/RsiChart';
import MacdChart from './components/MacdChart';
import IndicatorGrid from './components/IndicatorGrid';
import SignalList from './components/SignalList';
import SentimentGauge from './components/SentimentGauge';
import OverallSignal from './components/OverallSignal';
import AiAnalysisPanel from './components/AiAnalysisPanel';
import { useMarketData } from './hooks/useMarketData';
import { SYMBOLS } from './lib/binanceApi';
import './App.css';

export default function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('4h');
  const { candles, stats, indicators, signals, supportResistance, loading, error, connected } = useMarketData(symbol, interval);
  const symbolLabel = SYMBOLS.find((s) => s.value === symbol)?.label || symbol;
  const price = indicators?.price;

  return (
    <div className="ta-root">
      <Header symbol={symbol} setSymbol={setSymbol} interval={interval} setInterval={setInterval} stats={stats} connected={connected} />
      {error && <div className="error-banner">資料載入失敗：{error}</div>}
      <div className="main-layout">
        <div className="chart-area">
          <div className="chart-title">K 線圖 · {symbolLabel} · {interval}</div>
          <div className="candle-wrap">
            {loading ? <div className="chart-loading">載入即時行情中...</div> : <CandleChart candles={candles} />}
          </div>
          <div className="sub-chart-wrap">
            <span className="ind-label">RSI(14)</span>
            <RsiChart candles={candles} />
          </div>
          <div className="sub-chart-wrap">
            <span className="ind-label">MACD(12, 26, 9)</span>
            <MacdChart candles={candles} />
          </div>
          <div className="legend-row">
            <span className="legend-item"><span className="dot" style={{ background: '#F0B429' }} />MA20</span>
            <span className="legend-item"><span className="dot" style={{ background: '#9F7AEA' }} />MA50</span>
            <span className="legend-item"><span className="dot" style={{ background: 'rgba(59,130,246,0.7)' }} />布林帶</span>
          </div>
        </div>

        <div className="sidebar">
          <div className="side-section">
            <div className="side-title">指標數值</div>
            <IndicatorGrid indicators={indicators} />
          </div>
          <div className="side-section">
            <div className="side-title">技術訊號</div>
            <SignalList signals={signals.signals} />
          </div>
          {supportResistance && price && (
            <div className="side-section">
              <div className="side-title">支撐 / 壓力位</div>
              <div className="sr-list">
                {[
                  { label: '壓力二', val: supportResistance.resistance[1], type: 'bear' },
                  { label: '壓力一', val: supportResistance.resistance[0], type: 'bear' },
                  { label: '支撐一', val: supportResistance.support[0], type: 'bull' },
                  { label: '支撐二', val: supportResistance.support[1], type: 'bull' },
                ].map(({ label, val, type }) => val && (
                  <div className="sr-row" key={label}>
                    <span className={`sr-label ${type === 'bear' ? 'bear-text' : 'bull-text'}`}>{label}</span>
                    <span className="sr-val">{val.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                    <span className="sr-dist">
                      {type === 'bear' ? `+${((val - price) / price * 100).toFixed(2)}%` : `-${((price - val) / price * 100).toFixed(2)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="side-section">
            <div className="side-title">多空力道</div>
            <SentimentGauge {...signals} />
          </div>
          <div className="side-section ai-section">
            <OverallSignal {...signals} />
            <AiAnalysisPanel symbolLabel={symbolLabel} interval={interval} indicators={indicators} supportResistance={supportResistance} signals={signals} />
          </div>
        </div>
      </div>
      <div className="disclaimer">資料來源：Binance 公開行情 API｜本系統僅供技術面參考，不構成投資建議</div>
    </div>
  );
}
