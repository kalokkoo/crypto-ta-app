export default function OverallSignal({ bullCount=0, bearCount=0, neuCount=0 }) {
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
