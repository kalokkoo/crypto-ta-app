export default function IndicatorGrid({ indicators }) {
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
