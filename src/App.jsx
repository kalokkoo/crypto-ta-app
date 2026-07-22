import { useState } from 'react';
import Header from './components/Header';
import CandleChart from './components/CandleChart';
import RsiChart from './components/RsiChart';
import MacdChart from './components/MacdChart';
import MarketOverview from './components/MarketOverview';
import CVDQuadrant from './components/CVDQuadrant';
import PredictionPanel from './components/PredictionPanel';
import { IndicatorGrid, SignalList, SentimentGauge, OverallSignal, AiAnalysisPanel } from './components/Widgets';
import { useMarketData } from './hooks/useMarketData';
import { useMarketOverview } from './hooks/useMarketOverview';
import { SYMBOLS } from './lib/binanceApi';
import './App.css';

const TABS = ['圖表分析', '市場總覽', '趨勢預測', 'CVD 四象限'];

export default function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('4h');
  const [activeTab, setActiveTab] = useState('圖表分析');

  const { candles, stats, indicators, signals, supportResistance, oi, fundingRate, loading, error, connected } = useMarketData(symbol, interval);
  const { fearGreed, marketRSI, allFunding, loading: ovLoading } = useMarketOverview();

  const symbolLabel = SYMBOLS.find(s => s.value === symbol)?.label || symbol;
  const price = indicators?.price;

  return (
    <div className="ta-root">
      <Header symbol={symbol} setSymbol={setSymbol} interval={interval} setInterval={setInterval} stats={stats} connected={connected} />

      <div className="tab-bar">
        {TABS.map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {error && <div className="error-banner">資料載入失敗：{error}</div>}

      {activeTab === '圖表分析' && (
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
              <div className="side-title">合約市場</div>
              {oi ? (
                <div className="oi-box">
                  <div className={`oi-change ${oi.change >= 0 ? 'bull-text' : 'bear-text'}`}>
                    {oi.change >= 0 ? '📥 +' : '📤 '}{oi.change.toFixed(2)}%
                  </div>
                  <div className="oi-label">{oi.change >= 0 ? '資金流入，倉位增加' : '資金離場，倉位減少'}</div>
                </div>
              ) : (
                <div className="placeholder-text" style={{ marginBottom: 6 }}>OI 數據不支援此幣種</div>
              )}
              {fundingRate !== null && fundingRate !== undefined && (
                <div className="fr-row">
                  <span className="fr-label">資金費率</span>
                  <span className={`fr-val ${fundingRate > 0 ? 'bull-text' : 'bear-text'}`}>
                    {(fundingRate * 100).toFixed(4)}%
                  </span>
                  <span className="fr-hint">{fundingRate > 0.0005 ? '多頭偏熱' : fundingRate < -0.0001 ? '空頭偏冷' : '費率中性'}</span>
                </div>
              )}
            </div>

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
                      <span className="sr-dist">{type === 'bear' ? `+${((val-price)/price*100).toFixed(2)}%` : `-${((price-val)/price*100).toFixed(2)}%`}</span>
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
              <AiAnalysisPanel
                symbolLabel={symbolLabel} interval={interval}
                indicators={indicators} supportResistance={supportResistance}
                signals={signals} oi={oi} fundingRate={fundingRate} fearGreed={fearGreed}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === '市場總覽' && (
        <div className="full-page">
          <MarketOverview fearGreed={fearGreed} marketRSI={marketRSI} allFunding={allFunding} loading={ovLoading} />
        </div>
      )}

      {activeTab === '趨勢預測' && (
        <div className="full-page pred-page">
          <div className="page-header">
            <div className="page-title">🔮 趨勢預測｜{symbolLabel}</div>
            <div className="page-desc">基於技術指標、K 線形態識別、OI 動向、資金費率進行多維度推演，選擇時間框架後點擊預測。</div>
          </div>
          <PredictionPanel candles={candles} indicators={indicators} signals={signals} oi={oi} fundingRate={fundingRate} symbolLabel={symbolLabel} />
        </div>
      )}

      {activeTab === 'CVD 四象限' && (
        <div className="full-page">
          <div className="page-header">
            <div className="page-title">📊 CVD 四象限篩選器</div>
            <div className="page-desc">X 軸為 CVD 能量差變化，Y 軸為價格變化。Q1（右上）多頭建倉，Q3（左下）空頭建倉，每分鐘自動更新。</div>
          </div>
          <CVDQuadrant />
        </div>
      )}

      <div className="disclaimer">
        資料來源：Binance 公開 API · Alternative.me Fear &amp; Greed · 本系統僅供技術面參考，不構成投資建議
      </div>
    </div>
  );
}
