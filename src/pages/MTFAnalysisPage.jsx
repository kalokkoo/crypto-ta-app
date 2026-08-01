import { useMTFData } from '../hooks/useMTFData';
import { RefreshCw } from 'lucide-react';

export default function MTFAnalysisPage({ symbol, symbolLabel }) {
  const { mtfData, loading, error, refresh } = useMTFData(symbol);

  if (loading && !mtfData) {
    return <div className="full-page"><div className="chart-loading">載入多級別數據中...</div></div>;
  }
  
  if (error) {
    return <div className="full-page"><div className="error-banner">載入失敗：{error}</div></div>;
  }
  
  if (!mtfData) return null;

  // Compute Resonance
  let totalBull = 0, totalBear = 0;
  const tfs = ['15m', '1h', '4h', '1d'];
  tfs.forEach(tf => {
    if (mtfData[tf]?.signals) {
      totalBull += mtfData[tf].signals.bullCount;
      totalBear += mtfData[tf].signals.bearCount;
    }
  });
  
  // Decide overall status
  let resStatus = '';
  let resClass = '';
  if (totalBull > totalBear * 2 && totalBull > 8) { resStatus = '🔥 強烈共振看多'; resClass = 'bull-text'; }
  else if (totalBear > totalBull * 2 && totalBear > 8) { resStatus = '🧊 強烈共振看空'; resClass = 'bear-text'; }
  else if (totalBull > totalBear) { resStatus = '📈 偏多震盪'; resClass = 'bull-text'; }
  else if (totalBear > totalBull) { resStatus = '📉 偏空震盪'; resClass = 'bear-text'; }
  else { resStatus = '➡️ 多空分歧 (無共振)'; resClass = 'neu-text'; }

  return (
    <div className="full-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">📊 多級別共振 (MTF)｜{symbolLabel}</div>
          <div className="page-desc">掃描 15m, 1H, 4H, 1D 四個時間級別，尋找多空趨勢的高度共振點。每 3 分鐘自動更新。</div>
        </div>
        <button className="analyze-btn" onClick={() => refresh(false)} disabled={loading} style={{ width: 'auto', padding: '8px 16px', marginTop: 10 }}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> {loading ? '重整中...' : '手動重整'}
        </button>
      </div>
      
      <div className="mtf-summary" style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 12, marginBottom: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: 16, color: '#A0AEC0' }}>全局共振訊號</h3>
        <div style={{ fontSize: 24, fontWeight: 'bold' }} className={resClass}>{resStatus}</div>
        <div style={{ marginTop: 8, fontSize: 14, color: '#718096' }}>
          多方訊號總數: {totalBull} | 空方訊號總數: {totalBear}
        </div>
      </div>

      <div className="mtf-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {tfs.map(tf => {
          const data = mtfData[tf];
          if (!data || !data.indicators) return null;
          const { price, rsi14, sma20, sma50, macd, macdSignal } = data.indicators;
          const { bullCount, bearCount, neuCount } = data.signals;
          
          const trendClass = (price > sma20 && sma20 > sma50) ? 'bull-text' : (price < sma20 && sma20 < sma50) ? 'bear-text' : 'neu-text';
          const trendText = (price > sma20 && sma20 > sma50) ? '多頭排列' : (price < sma20 && sma20 < sma50) ? '空頭排列' : '震盪糾結';

          return (
            <div key={tf} className="side-section" style={{ marginBottom: 0 }}>
              <div className="side-title" style={{ fontSize: 18, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>
                級別：{tf.toUpperCase()}
                <span style={{ float: 'right', fontSize: 14, fontWeight: 'normal', color: '#fff' }}>${price?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              </div>
              
              <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>RSI (14)</div>
                  <div className={rsi14 > 60 ? 'bull-text' : rsi14 < 40 ? 'bear-text' : 'neu-text'}>{rsi14?.toFixed(1) || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>MACD</div>
                  <div className={macd !== null && macdSignal !== null ? (macd > macdSignal ? 'bull-text' : 'bear-text') : 'neu-text'}>
                    {macd !== null && macdSignal !== null ? (macd > macdSignal ? '黃金交叉' : '死亡交叉') : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>MA 趨勢</div>
                  <div className={trendClass}>{trendText}</div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, display: 'flex', justifyContent: 'space-around', fontSize: 14 }}>
                <span className="bull-text">多: {bullCount}</span>
                <span className="neu-text">平: {neuCount}</span>
                <span className="bear-text">空: {bearCount}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
