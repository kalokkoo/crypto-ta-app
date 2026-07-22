// 趨勢預測引擎
// 基於技術指標、動能、歷史形態進行多維度評分預測

function fmtP(v, d = 2) {
  if (v === null || v === undefined) return 'N/A';
  if (Math.abs(v) < 0.001) return v.toFixed(6);
  return v.toFixed(d);
}

// 計算動能得分（-100 到 +100）
function momentumScore(ind, signals) {
  const { bullCount, bearCount, neuCount } = signals;
  const total = bullCount + bearCount + neuCount || 1;
  let score = ((bullCount - bearCount) / total) * 60;

  // RSI 加權
  if (ind.rsi14 !== null) {
    if (ind.rsi14 > 60) score += 15;
    else if (ind.rsi14 > 50) score += 7;
    else if (ind.rsi14 < 40) score -= 15;
    else if (ind.rsi14 < 50) score -= 7;
  }
  // MACD 動能
  if (ind.macdHistogram !== null) {
    const histScore = Math.min(Math.abs(ind.macdHistogram / (ind.price * 0.001)) * 10, 15);
    score += ind.macdHistogram > 0 ? histScore : -histScore;
  }
  // CVD 能量
  if (ind.cvd !== null && ind.cvdPrev !== null) {
    const cvdDelta = ind.cvd - ind.cvdPrev;
    if (cvdDelta > 0) score += 5;
    else if (cvdDelta < 0) score -= 5;
  }

  return Math.max(-100, Math.min(100, score));
}

// ATR 換算目標價距離
function calcTargets(price, atr14, multiplier = 1.5) {
  const move = atr14 * multiplier;
  return { up: price + move, down: price - move };
}

// 形態識別（基於最近 K 線）
function detectPattern(candles) {
  if (!candles || candles.length < 3) return null;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  const body = Math.abs(last.close - last.open);
  const range = last.high - last.low;
  const upperWick = last.high - Math.max(last.close, last.open);
  const lowerWick = Math.min(last.close, last.open) - last.low;

  // 錘子線
  if (lowerWick > body * 2 && upperWick < body * 0.5 && body < range * 0.4) return { name: '錘子線 🔨', bias: 'bull', desc: '下影線長，顯示買盤強力承接' };
  // 流星線
  if (upperWick > body * 2 && lowerWick < body * 0.5 && body < range * 0.4) return { name: '流星線 ⭐', bias: 'bear', desc: '上影線長，顯示賣盤強力壓制' };
  // 多頭吞噬
  if (prev.close < prev.open && last.close > last.open && last.open < prev.close && last.close > prev.open) return { name: '多頭吞噬 🟢', bias: 'bull', desc: '大陽線吞噬前一根陰線，買方反轉' };
  // 空頭吞噬
  if (prev.close > prev.open && last.close < last.open && last.open > prev.close && last.close < prev.open) return { name: '空頭吞噬 🔴', bias: 'bear', desc: '大陰線吞噬前一根陽線，賣方反轉' };
  // 十字星
  if (body < range * 0.1) return { name: '十字星 ✚', bias: 'neutral', desc: '多空力道相當，方向待定' };

  return null;
}

// 主預測函式
export function generatePrediction(candles, ind, signals, oi, fundingRate, interval) {
  if (!ind || !candles || candles.length < 30) return null;

  const score = momentumScore(ind, signals);
  const targets = ind.atr14 ? calcTargets(ind.price, ind.atr14, getATRMultiplier(interval)) : null;
  const pattern = detectPattern(candles);

  // 方向判斷
  let direction, confidence, emoji;
  const absScore = Math.abs(score);
  if (score >= 40) { direction = '看多'; emoji = '📈'; }
  else if (score >= 15) { direction = '偏多'; emoji = '🔼'; }
  else if (score <= -40) { direction = '看空'; emoji = '📉'; }
  else if (score <= -15) { direction = '偏空'; emoji = '🔽'; }
  else { direction = '盤整'; emoji = '➡️'; }

  if (absScore >= 50) confidence = '高';
  else if (absScore >= 25) confidence = '中';
  else confidence = '低';

  // OI 信號
  let oiSignal = '';
  if (oi) {
    if (oi.change > 5) oiSignal = `OI 增加 ${fmtP(oi.change, 1)}%，資金持續流入`;
    else if (oi.change < -5) oiSignal = `OI 減少 ${fmtP(Math.abs(oi.change), 1)}%，倉位正在平倉`;
    else oiSignal = `OI 變化 ${fmtP(oi.change, 1)}%，倉位相對穩定`;
  }

  // 資金費率信號
  let frSignal = '';
  if (fundingRate !== null && fundingRate !== undefined) {
    const frPct = fundingRate * 100;
    if (frPct > 0.1) frSignal = `資金費率 +${fmtP(frPct, 4)}%，多頭付費，市場偏多但需防爆倉`;
    else if (frPct < -0.05) frSignal = `資金費率 ${fmtP(frPct, 4)}%，空頭付費，市場偏空但需防軋空`;
    else frSignal = `資金費率 ${fmtP(frPct, 4)}%，資金費率中性`;
  }

  // 預測時間描述
  const timeDesc = getTimeDesc(interval);

  // 價格預測區間
  const upPct = targets ? ((targets.up - ind.price) / ind.price * 100) : null;
  const downPct = targets ? ((ind.price - targets.down) / ind.price * 100) : null;

  return {
    direction, emoji, confidence, score: Math.round(score),
    targets, upPct, downPct,
    pattern, oiSignal, frSignal, timeDesc, interval,
    bullCount: signals.bullCount, bearCount: signals.bearCount, neuCount: signals.neuCount,
  };
}

function getATRMultiplier(interval) {
  const map = { '15m': 1.0, '1h': 1.2, '4h': 1.5, '1d': 2.0, '1w': 2.5 };
  return map[interval] || 1.5;
}

function getTimeDesc(interval) {
  const map = { '15m': '未來 15 分鐘', '1h': '未來 1 小時', '4h': '未來 4 小時', '1d': '未來 1 天', '1w': '未來 1 週' };
  return map[interval] || interval;
}

// 格式化預測報告
export function formatPredictionReport(pred, symbolLabel) {
  if (!pred) return '資料載入中...';
  const lines = [];

  lines.push(`╔══════════════════════════════════════════╗`);
  lines.push(`  ${pred.emoji} 趨勢預測｜${symbolLabel}｜${pred.timeDesc}`);
  lines.push(`╚══════════════════════════════════════════╝`);
  lines.push(``);

  lines.push(`▌ 預測方向：${pred.emoji} ${pred.direction}`);
  lines.push(`▌ 信心程度：${'★'.repeat(pred.confidence === '高' ? 3 : pred.confidence === '中' ? 2 : 1)}${'☆'.repeat(pred.confidence === '高' ? 0 : pred.confidence === '中' ? 1 : 2)} ${pred.confidence}`);
  lines.push(`▌ 動能得分：${pred.score > 0 ? '+' : ''}${pred.score} / 100`);
  lines.push(``);

  if (pred.targets) {
    lines.push(`━━━ 預測價格區間 ━━━━━━━━━━━━━━━━━━`);
    lines.push(`🔺 上行目標：${fmtP(pred.targets.up, 4)} USDT（+${fmtP(pred.upPct, 2)}%）`);
    lines.push(`⚡ 當前價格：${fmtP(pred.targets.up / (1 + pred.upPct / 100), 4)} USDT`);
    lines.push(`🔻 下行目標：${fmtP(pred.targets.down, 4)} USDT（-${fmtP(pred.downPct, 2)}%）`);
    lines.push(`（目標基於 ATR × 波動倍數，${pred.timeDesc}內有效）`);
    lines.push(``);
  }

  lines.push(`━━━ 訊號匯總 ━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`多頭訊號：${pred.bullCount} 項　空頭訊號：${pred.bearCount} 項　中性：${pred.neuCount} 項`);

  if (pred.pattern) {
    lines.push(``);
    lines.push(`━━━ K 線形態識別 ━━━━━━━━━━━━━━━━`);
    lines.push(`偵測到：${pred.pattern.name}`);
    lines.push(`說明：${pred.pattern.desc}`);
    lines.push(`形態偏向：${pred.pattern.bias === 'bull' ? '📈 偏多' : pred.pattern.bias === 'bear' ? '📉 偏空' : '➡️ 中性'}`);
  }

  if (pred.oiSignal) {
    lines.push(``);
    lines.push(`━━━ 合約市場訊號 ━━━━━━━━━━━━━━━`);
    lines.push(`📊 ${pred.oiSignal}`);
    if (pred.frSignal) lines.push(`💰 ${pred.frSignal}`);
  }

  lines.push(``);
  lines.push(`━━━ 操作建議 ━━━━━━━━━━━━━━━━━━━`);
  if (pred.direction === '看多' || pred.direction === '偏多') {
    lines.push(`✅ ${pred.timeDesc}傾向上行，可考慮：`);
    lines.push(`   • 在回踩支撐時分批做多`);
    lines.push(`   • 止損設於近期低點下方`);
    lines.push(`   • 目標看 ${pred.targets ? fmtP(pred.targets.up, 4) : 'N/A'}`);
  } else if (pred.direction === '看空' || pred.direction === '偏空') {
    lines.push(`⚠️ ${pred.timeDesc}傾向下行，建議：`);
    lines.push(`   • 避免追多，等待反彈再評估`);
    lines.push(`   • 持多單者考慮減倉或設緊止損`);
    lines.push(`   • 關注 ${pred.targets ? fmtP(pred.targets.down, 4) : 'N/A'} 支撐是否守住`);
  } else {
    lines.push(`➡️ ${pred.timeDesc}方向不明確，建議：`);
    lines.push(`   • 觀望等待突破，不宜重倉進場`);
    lines.push(`   • 等突破上方 ${pred.targets ? fmtP(pred.targets.up, 4) : 'N/A'} 再追多`);
    lines.push(`   • 等跌破下方 ${pred.targets ? fmtP(pred.targets.down, 4) : 'N/A'} 再做空`);
  }

  lines.push(``);
  lines.push(`⚠️ 預測僅供參考，不構成投資建議。市場`);
  lines.push(`   受消息面影響可能偏離技術預測。`);
  lines.push(`────────────────────────────────────────`);

  return lines.join('\n');
}
