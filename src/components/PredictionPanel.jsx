import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { generatePrediction, formatPredictionReport } from '../lib/predictionEngine';

const PRED_TIMEFRAMES = [
  { value: '15m', label: '15分' },
  { value: '1h', label: '1小時' },
  { value: '4h', label: '4小時' },
  { value: '1d', label: '1天' },
  { value: '1w', label: '1週' },
];

export default function PredictionPanel({ candles, indicators, signals, oi, fundingRate, symbolLabel }) {
  const [predTF, setPredTF] = useState('1h');
  const [report, setReport] = useState('');
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(false);

  function runPrediction() {
    if (!indicators || !candles?.length) return;
    setLoading(true);
    setTimeout(() => {
      const result = generatePrediction(candles, indicators, signals, oi, fundingRate, predTF);
      setPred(result);
      setReport(formatPredictionReport(result, symbolLabel));
      setLoading(false);
    }, 400);
  }

  const dirColor = pred ? (pred.direction === '看多' || pred.direction === '偏多' ? '#48BB78' : pred.direction === '看空' || pred.direction === '偏空' ? '#FC8181' : '#F0B429') : '#64748B';

  return (
    <div className="pred-panel">
      <div className="pred-tf-row">
        {PRED_TIMEFRAMES.map(tf => (
          <button key={tf.value} className={`pred-tf-btn ${predTF === tf.value ? 'active' : ''}`} onClick={() => setPredTF(tf.value)}>
            {tf.label}
          </button>
        ))}
      </div>

      {pred && (
        <div className="pred-summary" style={{ borderColor: dirColor }}>
          <span className="pred-emoji">{pred.emoji}</span>
          <div className="pred-info">
            <span className="pred-dir" style={{ color: dirColor }}>{pred.direction}</span>
            <span className="pred-conf">信心：{'★'.repeat(pred.confidence === '高' ? 3 : pred.confidence === '中' ? 2 : 1)} {pred.confidence}</span>
          </div>
          <span className="pred-score" style={{ color: dirColor }}>{pred.score > 0 ? '+' : ''}{pred.score}</span>
        </div>
      )}

      <button className="analyze-btn" onClick={runPrediction} disabled={loading || !indicators}>
        {loading ? <><RefreshCw size={15} className="spin" /> 預測中...</> : <><TrendingUp size={15} /> 預測{PRED_TIMEFRAMES.find(t=>t.value===predTF)?.label}趨勢</>}
      </button>

      {report && (
        <div className="ai-output" style={{ marginTop: 8 }}>
          <pre className="ai-text">{report}</pre>
        </div>
      )}
      {!report && (
        <div className="ai-output" style={{ marginTop: 8 }}>
          <span className="placeholder-text">選擇時間框架後點擊預測，系統將基於技術指標、K線形態、OI、資金費率進行多維度趨勢推演。</span>
        </div>
      )}
    </div>
  );
}
