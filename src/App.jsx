import { useState } from 'react';
import Header from './components/Header';
import { useMarketData } from './hooks/useMarketData';
import { useMarketOverview } from './hooks/useMarketOverview';
import { SYMBOLS } from './lib/binanceApi';
import ChartAnalysisPage from './pages/ChartAnalysisPage';
import MarketOverviewPage from './pages/MarketOverviewPage';
import TrendPredictionPage from './pages/TrendPredictionPage';
import CVDQuadrantPage from './pages/CVDQuadrantPage';
import MTFAnalysisPage from './pages/MTFAnalysisPage';
import './App.css';

const TABS = ['圖表分析', '多級別共振', '市場總覽', '趨勢預測', 'CVD 四象限'];

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
        <ChartAnalysisPage
          symbolLabel={symbolLabel}
          interval={interval}
          candles={candles}
          indicators={indicators}
          signals={signals}
          supportResistance={supportResistance}
          oi={oi}
          fundingRate={fundingRate}
          fearGreed={fearGreed}
          loading={loading}
          price={price}
        />
      )}

      {activeTab === '市場總覽' && (
        <MarketOverviewPage
          fearGreed={fearGreed}
          marketRSI={marketRSI}
          allFunding={allFunding}
          loading={ovLoading}
        />
      )}

      {activeTab === '多級別共振' && (
        <MTFAnalysisPage symbol={symbol} symbolLabel={symbolLabel} />
      )}

      {activeTab === '趨勢預測' && (
        <TrendPredictionPage
          symbolLabel={symbolLabel}
          candles={candles}
          indicators={indicators}
          signals={signals}
          oi={oi}
          fundingRate={fundingRate}
        />
      )}

      {activeTab === 'CVD 四象限' && (
        <CVDQuadrantPage />
      )}

      <div className="disclaimer">
        資料來源：Binance 公開 API · Alternative.me Fear &amp; Greed · 本系統僅供技術面參考，不構成投資建議
      </div>
    </div>
  );
}
