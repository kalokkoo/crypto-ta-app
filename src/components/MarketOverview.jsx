export default function MarketOverview({ fearGreed, marketRSI, allFunding, loading }) {
  if (loading) return <div className="overview-loading">市場數據載入中...</div>;

  const fgColor = fearGreed ? (fearGreed.value >= 75 ? '#FC8181' : fearGreed.value >= 55 ? '#48BB78' : fearGreed.value >= 45 ? '#F0B429' : fearGreed.value >= 25 ? '#FB923C' : '#FC8181') : '#64748B';
  const fgDeg = fearGreed ? (fearGreed.value / 100) * 180 : 90;

  const rsiColor = marketRSI ? (marketRSI.avgRSI > 70 ? '#FC8181' : marketRSI.avgRSI > 55 ? '#48BB78' : marketRSI.avgRSI < 30 ? '#3B82F6' : '#F0B429') : '#64748B';
  const altColor = marketRSI ? (marketRSI.altsSeason > 75 ? '#9F7AEA' : marketRSI.altsSeason > 50 ? '#3B82F6' : '#F0B429') : '#64748B';

  return (
    <div className="overview-grid">
      {/* 恐懼貪婪 */}
      <div className="overview-card">
        <div className="ov-title">恐懼貪婪指數</div>
        <div className="gauge-circle">
          <svg viewBox="0 0 100 60" style={{ width: '100%' }}>
            <path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke="#1E2D45" strokeWidth="8" strokeLinecap="round" />
            <path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke={fgColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(fearGreed?.value || 0) * 1.413} 141.3`} />
            <text x="50" y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill={fgColor}>
              {fearGreed?.value ?? '--'}
            </text>
          </svg>
        </div>
        <div className="ov-label" style={{ color: fgColor }}>{fearGreed?.label ?? '載入中'}</div>
        {fearGreed && <div className="ov-sub">{fearGreed.change >= 0 ? '+' : ''}{fearGreed.change} vs 昨日</div>}
      </div>

      {/* 市場平均 RSI */}
      <div className="overview-card">
        <div className="ov-title">市場平均 RSI</div>
        <div className="ov-big-num" style={{ color: rsiColor }}>
          {marketRSI ? marketRSI.avgRSI.toFixed(1) : '--'}
        </div>
        <div className="rsi-bar-wrap">
          <div className="rsi-bar-bg">
            <div className="rsi-bar-fill" style={{ left: `${marketRSI?.avgRSI ?? 50}%`, background: rsiColor }} />
          </div>
          <div className="rsi-bar-labels">
            <span>超賣 30</span><span>中性 50</span><span>超買 70</span>
          </div>
        </div>
        <div className="ov-label" style={{ color: rsiColor }}>
          {marketRSI ? (marketRSI.avgRSI > 70 ? '市場整體超買' : marketRSI.avgRSI > 55 ? '市場偏強' : marketRSI.avgRSI < 30 ? '市場整體超賣' : marketRSI.avgRSI < 45 ? '市場偏弱' : '市場中性') : '計算中'}
        </div>
      </div>

      {/* 山寨季指標 */}
      <div className="overview-card">
        <div className="ov-title">山寨季指標</div>
        <div className="ov-big-num" style={{ color: altColor }}>
          {marketRSI ? marketRSI.altsSeason.toFixed(0) : '--'}<span style={{ fontSize: 14 }}>%</span>
        </div>
        <div className="alt-bar-wrap">
          <div className="alt-bar-bg">
            <div className="alt-bar-fill" style={{ width: `${marketRSI?.altsSeason ?? 0}%`, background: altColor }} />
          </div>
        </div>
        <div className="ov-label" style={{ color: altColor }}>
          {marketRSI ? (marketRSI.altsSeason > 75 ? '🟣 山寨季' : marketRSI.altsSeason > 50 ? '🔵 偏山寨' : marketRSI.altsSeason > 25 ? '🟡 中性' : '🟠 BTC 主導') : '計算中'}
        </div>
        {marketRSI && <div className="ov-sub">BTC RSI: {marketRSI.btcRSI?.toFixed(1)}</div>}
      </div>

      {/* 資金費率異動 */}
      <div className="overview-card funding-card">
        <div className="ov-title">資金費率排行（極端幣種）</div>
        <div className="funding-list">
          {allFunding.length === 0 && <div className="ov-sub">資料載入中...</div>}
          {allFunding.slice(0, 6).map(f => {
            const frPct = (f.fundingRate * 100).toFixed(4);
            const isPos = f.fundingRate > 0;
            return (
              <div key={f.symbol} className="funding-row">
                <span className="funding-sym">{f.symbol.replace('USDT', '')}</span>
                <span className={`funding-rate ${isPos ? 'bull-text' : 'bear-text'}`}>
                  {isPos ? '+' : ''}{frPct}%
                </span>
                <span className="funding-hint">{isPos ? '多付費' : '空付費'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
