import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function OverallSignal({ bullCount, bearCount, neuCount }) {
  let cls = 'neutral';
  let text = '等待資料';
  let Icon = Brain;

  if (bullCount + bearCount + neuCount > 0) {
    if (bullCount > bearCount && bullCount > neuCount) {
      cls = 'bullish';
      text = '偏多 — 建議觀察做多機會';
      Icon = TrendingUp;
    } else if (bearCount > bullCount && bearCount > neuCount) {
      cls = 'bearish';
      text = '偏空 — 注意下跌風險';
      Icon = TrendingDown;
    } else {
      cls = 'neutral';
      text = '中性 — 等待方向確認';
      Icon = Minus;
    }
  }

  return (
    <div className={`overall-signal ${cls}`}>
      <Icon size={18} />
      <span className="overall-text">{text}</span>
    </div>
  );
}
