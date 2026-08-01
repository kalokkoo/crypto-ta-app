export default function SentimentGauge({ bullCount=0, bearCount=0, neuCount=0 }) {
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
