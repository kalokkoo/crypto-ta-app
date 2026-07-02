export default function SentimentGauge({ bullCount, bearCount, neuCount }) {
  const total = bullCount + bearCount + neuCount || 1;
  const bullPct = Math.round((bullCount / total) * 100);
  const neuPct = Math.round((neuCount / total) * 100);
  const bearPct = 100 - bullPct - neuPct;

  const rows = [
    { label: '做多', pct: bullPct, color: '#48BB78' },
    { label: '中性', pct: neuPct, color: '#F0B429' },
    { label: '做空', pct: bearPct, color: '#FC8181' },
  ];

  return (
    <div className="gauge-section">
      {rows.map((r) => (
        <div className="gauge-row" key={r.label}>
          <span className="gauge-label">{r.label}</span>
          <div className="gauge-bar">
            <div className="gauge-fill" style={{ width: `${r.pct}%`, background: r.color }} />
          </div>
          <span className="gauge-pct">{r.pct}%</span>
        </div>
      ))}
    </div>
  );
}
