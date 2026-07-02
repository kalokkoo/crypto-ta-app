export default function IndicatorGrid({ indicators }) {
  if (!indicators) {
    return (
      <div className="indicator-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="ind-card">
            <div className="ind-name">—</div>
            <div className="ind-val">—</div>
          </div>
        ))}
      </div>
    );
  }

  const { price, rsi14, macd, macdSignal, sma20, sma50, bbUpper, bbLower } = indicators;

  const pct = (v, ref) => (((v - ref) / ref) * 100).toFixed(2);
  const trendClass = (v) => (v > 0 ? 'bull-text' : v < 0 ? 'bear-text' : 'neu-text');

  const cards = [
    {
      name: 'RSI(14)',
      val: rsi14 !== null ? rsi14.toFixed(1) : '—',
      cls: rsi14 > 70 ? 'bear-text' : rsi14 < 30 ? 'bull-text' : 'neu-text',
    },
    {
      name: 'MACD 偏差',
      val: macd !== null && macdSignal !== null ? (macd - macdSignal).toFixed(2) : '—',
      cls: macd !== null && macdSignal !== null ? trendClass(macd - macdSignal) : 'neu-text',
    },
    {
      name: 'vs MA20',
      val: sma20 !== null ? `${pct(price, sma20) > 0 ? '+' : ''}${pct(price, sma20)}%` : '—',
      cls: sma20 !== null ? trendClass(price - sma20) : 'neu-text',
    },
    {
      name: 'vs MA50',
      val: sma50 !== null ? `${pct(price, sma50) > 0 ? '+' : ''}${pct(price, sma50)}%` : '—',
      cls: sma50 !== null ? trendClass(price - sma50) : 'neu-text',
    },
    {
      name: '距布林上軌',
      val: bbUpper !== null ? `${((bbUpper / price - 1) * 100).toFixed(1)}%` : '—',
      cls: 'neu-text',
    },
    {
      name: '距布林下軌',
      val: bbLower !== null ? `${((1 - bbLower / price) * 100).toFixed(1)}%` : '—',
      cls: 'neu-text',
    },
  ];

  return (
    <div className="indicator-grid">
      {cards.map((c) => (
        <div key={c.name} className="ind-card">
          <div className="ind-name">{c.name}</div>
          <div className={`ind-val ${c.cls}`}>{c.val}</div>
        </div>
      ))}
    </div>
  );
}
