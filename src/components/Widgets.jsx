// IndicatorGrid
export function IndicatorGrid({ indicators }) {
  if (!indicators) return <div className="indicator-grid">{Array.from({length:6}).map((_,i)=><div key={i} className="ind-card"><div className="ind-name">—</div><div className="ind-val">—</div></div>)}</div>;
  const { price, rsi14, macd, macdSignal, sma20, sma50, bbUpper, bbLower, kdjK, kdjD } = indicators;
  const pct = (v,ref) => ref ? `${((v-ref)/ref*100).toFixed(2)}%` : '—';
  const cards = [
    { name: 'RSI(14)', val: rsi14?.toFixed(1) ?? '—', cls: rsi14>70?'bear-text':rsi14<30?'bull-text':'neu-text' },
    { name: 'MACD 偏差', val: (macd&&macdSignal) ? (macd-macdSignal).toFixed(2) : '—', cls: (macd&&macdSignal)?(macd>macdSignal?'bull-text':'bear-text'):'neu-text' },
    { name: 'vs MA20', val: sma20 ? (price>sma20?'+':'')+pct(price,sma20) : '—', cls: sma20?(price>sma20?'bull-text':'bear-text'):'neu-text' },
    { name: 'vs MA50', val: sma50 ? (price>sma50?'+':'')+pct(price,sma50) : '—', cls: sma50?(price>sma50?'bull-text':'bear-text'):'neu-text' },
    { name: 'KDJ K/D', val: (kdjK&&kdjD) ? `${kdjK.toFixed(1)}/${kdjD.toFixed(1)}` : '—', cls: (kdjK&&kdjD)?(kdjK>kdjD?'bull-text':'bear-text'):'neu-text' },
    { name: '布林位置', val: (bbUpper&&bbLower) ? `${((price-bbLower)/(bbUpper-bbLower)*100).toFixed(0)}%` : '—', cls: 'neu-text' },
  ];
  return (
    <div className="indicator-grid">
      {cards.map(c => <div key={c.name} className="ind-card"><div className="ind-name">{c.name}</div><div className={`ind-val ${c.cls}`}>{c.val}</div></div>)}
    </div>
  );
}

// SignalList
export function SignalList({ signals }) {
  if (!signals?.length) return <div className="placeholder-text">指標計算中...</div>;
  return (
    <div className="signal-list">
      {signals.map(s => (
        <div key={s.name} className="signal-row">
          <span className="signal-name">{s.name}</span>
          <span className={`signal-tag tag-${s.type}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// SentimentGauge
export function SentimentGauge({ bullCount=0, bearCount=0, neuCount=0 }) {
  const total = bullCount + bearCount + neuCount || 1;
  const bPct = Math.round(bullCount/total*100);
  const nPct = Math.round(neuCount/total*100);
  const bePct = 100 - bPct - nPct;
  return (
    <div className="gauge-section">
      {[['做多', bPct, '#48BB78'], ['中性', nPct, '#F0B429'], ['做空', bePct, '#FC8181']].map(([label, pct, color]) => (
        <div className="gauge-row" key={label}>
          <span className="gauge-label">{label}</span>
          <div className="gauge-bar"><div className="gauge-fill" style={{ width: `${pct}%`, background: color }} /></div>
          <span className="gauge-pct">{pct}%</span>
        </div>
      ))}
    </div>
  );
}

// OverallSignal
export function OverallSignal({ bullCount=0, bearCount=0, neuCount=0 }) {
  const total = bullCount + bearCount + neuCount;
  let cls = 'neutral', text = '等待資料', emoji = '🧠';
  if (total > 0) {
    if (bullCount > bearCount && bullCount > neuCount) { cls='bullish'; text='偏多 — 關注做多機會'; emoji='📈'; }
    else if (bearCount > bullCount && bearCount > neuCount) { cls='bearish'; text='偏空 — 注意下跌風險'; emoji='📉'; }
    else { cls='neutral'; text='中性 — 等待方向確認'; emoji='➡️'; }
  }
  return (
    <div className={`overall-signal ${cls}`}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span className="overall-text">{text}</span>
    </div>
  );
}

// AiAnalysisPanel
import { useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { generateAnalysisReport } from '../lib/analysisEngine';

export function AiAnalysisPanel({ symbolLabel, interval, indicators, supportResistance, signals, oi, fundingRate, fearGreed }) {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  function run() {
    if (loading || !indicators) return;
    setLoading(true);
    setTimeout(() => {
      setOutput(generateAnalysisReport(symbolLabel, interval, indicators, supportResistance, signals, oi, fundingRate, fearGreed));
      setLoading(false);
    }, 500);
  }

  return (
    <div className="ai-area">
      <button className="analyze-btn" onClick={run} disabled={loading || !indicators}>
        {loading ? <><RefreshCw size={15} className="spin" /> 分析中...</> : <><FileText size={15} /> {output ? '重新分析' : '產生技術分析報告'}</>}
      </button>
      <div className="ai-output">
        {output ? <pre className="ai-text">{output}</pre> : <span className="placeholder-text">點擊上方按鈕產生完整技術分析報告，整合恐懼貪婪指數、OI、資金費率、CVD 等多維度數據。</span>}
      </div>
    </div>
  );
}
