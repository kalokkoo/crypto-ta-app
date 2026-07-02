// 純規則邏輯技術分析引擎（完全免費，無需 API）
// 根據各技術指標數值自動產生繁體中文分析報告

function fmt(v, d = 2) {
  return v !== null && v !== undefined ? v.toFixed(d) : 'N/A';
}

function pct(v, ref) {
  if (!v || !ref) return null;
  return ((v - ref) / ref) * 100;
}

// 趨勢強度描述
function trendStrength(bullCount, bearCount, total) {
  const score = (bullCount - bearCount) / total;
  if (score > 0.5) return '強勢多頭';
  if (score > 0.2) return '偏多';
  if (score < -0.5) return '強勢空頭';
  if (score < -0.2) return '偏空';
  return '盤整中性';
}

// RSI 解讀
function interpretRSI(rsi) {
  if (rsi === null) return null;
  if (rsi >= 80) return { text: `RSI 高達 ${fmt(rsi, 1)}，進入嚴重超買區，短期拉回風險高，建議避免追多。`, signal: 'bear' };
  if (rsi >= 70) return { text: `RSI ${fmt(rsi, 1)} 進入超買區間，動能仍強但需留意拉回訊號，可考慮縮減部位。`, signal: 'bear' };
  if (rsi >= 60) return { text: `RSI ${fmt(rsi, 1)} 位於強勢區間（60-70），多頭動能充足，趨勢健康。`, signal: 'bull' };
  if (rsi >= 50) return { text: `RSI ${fmt(rsi, 1)} 站穩 50 以上，多空分界偏多，但動能尚未明顯加速。`, signal: 'bull' };
  if (rsi >= 40) return { text: `RSI ${fmt(rsi, 1)} 位於 40-50 之間，偏空但尚未破底，觀望為主。`, signal: 'bear' };
  if (rsi >= 30) return { text: `RSI ${fmt(rsi, 1)} 接近超賣區，空頭動能持續，但可開始留意反彈機會。`, signal: 'bear' };
  if (rsi >= 20) return { text: `RSI ${fmt(rsi, 1)} 進入超賣區，賣壓沉重，短期有反彈可能，但趨勢仍偏空。`, signal: 'bull' };
  return { text: `RSI ${fmt(rsi, 1)} 嚴重超賣，市場恐慌情緒極高，歷史上這是中長期買點區域，但需等待止跌訊號確認。`, signal: 'bull' };
}

// MACD 解讀
function interpretMACD(macd, signal, histogram) {
  if (macd === null || signal === null) return null;
  const hist = histogram ?? (macd - signal);
  const crossType = macd > signal ? '多頭' : '空頭';
  const histDesc = hist > 0 ? '柱狀體翻紅、動能擴張' : '柱狀體翻綠、動能收縮';

  if (macd > signal && hist > 0) {
    return { text: `MACD 黃金交叉確立，${histDesc}，${crossType}趨勢延續中。MACD 值 ${fmt(macd)} 高於訊號線 ${fmt(signal)}，差距 ${fmt(Math.abs(hist))}，多頭動能強勁。`, signal: 'bull' };
  }
  if (macd > signal && hist <= 0) {
    return { text: `MACD 處於多頭格局但柱狀體開始收縮，動能出現疲態，留意可能的回檔整理。MACD ${fmt(macd)} 仍高於訊號線 ${fmt(signal)}。`, signal: 'neutral' };
  }
  if (macd <= signal && hist < 0) {
    return { text: `MACD 死亡交叉確立，${histDesc}，${crossType}趨勢延續中。MACD 值 ${fmt(macd)} 低於訊號線 ${fmt(signal)}，空頭動能持續施壓。`, signal: 'bear' };
  }
  return { text: `MACD 處於空頭格局但柱狀體開始收縮，空頭動能減弱，留意可能的反彈機會。MACD ${fmt(macd)}，訊號線 ${fmt(signal)}。`, signal: 'neutral' };
}

// 布林帶解讀
function interpretBB(price, upper, mid, lower) {
  if (!upper || !lower || !mid) return null;
  const range = upper - lower;
  const pos = (price - lower) / range;
  const bandwidth = (range / mid) * 100;

  let posDesc, signal;
  if (pos > 0.95) { posDesc = `突破上軌（${fmt(upper)}），強勢行情延續，但短線過熱需留意拉回`; signal = 'bear'; }
  else if (pos > 0.8) { posDesc = `貼近上軌（${fmt(upper)}），多頭強勢，但上方空間有限`; signal = 'neutral'; }
  else if (pos > 0.5) { posDesc = `位於中軌（${fmt(mid)}）上方，偏多格局`; signal = 'bull'; }
  else if (pos > 0.2) { posDesc = `位於中軌（${fmt(mid)}）下方，偏空格局`; signal = 'bear'; }
  else if (pos > 0.05) { posDesc = `貼近下軌（${fmt(lower)}），空頭弱勢，留意反彈`; signal = 'neutral'; }
  else { posDesc = `跌破下軌（${fmt(lower)}），空頭強勢但嚴重超跌，反彈機率高`; signal = 'bull'; }

  const bwDesc = bandwidth < 3 ? '布林帶極度收窄，大行情即將展開，方向待確認。' :
    bandwidth < 6 ? '布林帶偏窄，波動率低，醞釀突破。' :
    bandwidth > 15 ? '布林帶極度擴張，波動率極高，行情進入加速段。' :
    bandwidth > 10 ? '布林帶擴張，波動率高，趨勢行情中。' : '布林帶寬度正常。';

  return { text: `當前價格 ${posDesc}。${bwDesc}`, signal };
}

// KDJ 解讀
function interpretKDJ(k, d, j) {
  if (k === null || d === null) return null;
  let desc = '';
  if (k > 80 && d > 80) desc = `KDJ 處於超買區（K:${fmt(k, 1)} D:${fmt(d, 1)}），短線拉回風險高。`;
  else if (k < 20 && d < 20) desc = `KDJ 處於超賣區（K:${fmt(k, 1)} D:${fmt(d, 1)}），反彈機率較高。`;
  else if (k > d) desc = `KDJ 呈多頭排列（K:${fmt(k, 1)} > D:${fmt(d, 1)}），短線動能偏多。`;
  else desc = `KDJ 呈空頭排列（K:${fmt(k, 1)} < D:${fmt(d, 1)}），短線動能偏空。`;

  if (j !== null) {
    if (j > 100) desc += ` J 值 ${fmt(j, 1)} 超過 100，超買警示。`;
    else if (j < 0) desc += ` J 值 ${fmt(j, 1)} 低於 0，超賣警示。`;
  }

  const signal = k > d ? 'bull' : 'bear';
  return { text: desc, signal };
}

// 均線排列解讀
function interpretMA(price, ma20, ma50) {
  if (!ma20 || !ma50) return null;
  const p20 = pct(price, ma20);
  const p50 = pct(price, ma50);

  if (price > ma20 && ma20 > ma50) {
    return {
      text: `多頭排列確立：價格（${fmt(price)}）> MA20（${fmt(ma20)}）> MA50（${fmt(ma50)}），為標準多頭趨勢結構。價格高於 MA20 ${fmt(Math.abs(p20), 2)}%，高於 MA50 ${fmt(Math.abs(p50), 2)}%。`,
      signal: 'bull'
    };
  }
  if (price < ma20 && ma20 < ma50) {
    return {
      text: `空頭排列確立：價格（${fmt(price)}）< MA20（${fmt(ma20)}）< MA50（${fmt(ma50)}），為標準空頭趨勢結構。價格低於 MA20 ${fmt(Math.abs(p20), 2)}%，低於 MA50 ${fmt(Math.abs(p50), 2)}%。`,
      signal: 'bear'
    };
  }
  if (price > ma20 && ma20 < ma50) {
    return {
      text: `價格回升至 MA20（${fmt(ma20)}）上方，但 MA20 仍低於 MA50（${fmt(ma50)}），均線尚未形成黃金交叉，需進一步確認反轉。`,
      signal: 'neutral'
    };
  }
  return {
    text: `價格跌至 MA20（${fmt(ma20)}）下方，但 MA20 仍高於 MA50（${fmt(ma50)}），均線尚未死亡交叉，可能是短期回調。`,
    signal: 'neutral'
  };
}

// 支撐壓力位描述
function describeSR(price, sr, bb) {
  if (!sr) return '';
  const lines = [];

  lines.push(`【壓力位】`);
  lines.push(`  第一壓力：${fmt(sr.resistance[0])}（布林上軌附近）— 突破此位可能加速上攻`);
  lines.push(`  第二壓力：${fmt(sr.resistance[1])}（近期高點區域）— 強力壓力，需大量能配合`);

  lines.push(`【支撐位】`);
  lines.push(`  第一支撐：${fmt(sr.support[0])}（布林中軌 / MA20 附近）— 多頭防守關鍵`);
  lines.push(`  第二支撐：${fmt(sr.support[1])}（布林下軌附近）— 若跌破轉為強空`);

  const distToR1 = sr.resistance[0] ? ((sr.resistance[0] - price) / price * 100) : null;
  const distToS1 = sr.support[0] ? ((price - sr.support[0]) / price * 100) : null;

  if (distToR1 !== null) lines.push(`  距第一壓力：+${fmt(distToR1, 2)}%`);
  if (distToS1 !== null) lines.push(`  距第一支撐：-${fmt(distToS1, 2)}%`);

  return lines.join('\n');
}

// 情境推演
function buildScenarios(price, ind, signals) {
  const { bullCount, bearCount } = signals;
  const isBull = bullCount > bearCount;
  const isBear = bearCount > bullCount;

  const upTarget = ind.bbUpper ? fmt(ind.bbUpper) : fmt(price * 1.05);
  const downTarget = ind.bbLower ? fmt(ind.bbLower) : fmt(price * 0.95);
  const midTarget = ind.bbMid ? fmt(ind.bbMid) : fmt(price);

  return `【情境一：看多情境（${isBull ? '⭐ 目前較可能' : '需觀察'}）】
  觸發條件：價格守住 MA20 支撐，成交量放大，MACD 柱狀體持續擴張
  目標價位：${upTarget}（布林上軌）
  止損參考：跌破 MA50（${fmt(ind.sma50)}）視為多頭失守

【情境二：看空情境（${isBear ? '⭐ 目前較可能' : '需觀察'}）】
  觸發條件：跌破 MA20，成交量放大，RSI 續跌破 40
  目標價位：${downTarget}（布林下軌）
  止損參考：有效收復 MA20（${fmt(ind.sma20)}）視為空頭失敗

【情境三：盤整整理（${!isBull && !isBear ? '⭐ 目前較可能' : '需觀察'}）】
  觸發條件：布林帶收窄，成交量萎縮，RSI 在 45-55 之間震盪
  整理區間：${downTarget} ~ ${upTarget}
  等待方向：布林帶有效突破後再介入`;
}

// 主函式：產生完整分析報告
export function generateAnalysisReport(symbolLabel, interval, indicators, supportResistance, signals) {
  if (!indicators) return '指標資料尚未載入，請稍候...';

  const { price, rsi14, macd, macdSignal, macdHistogram, sma20, sma50, bbUpper, bbMid, bbLower, kdjK, kdjD, kdjJ } = indicators;
  const { bullCount, bearCount, neuCount } = signals;
  const total = bullCount + bearCount + neuCount || 1;
  const trend = trendStrength(bullCount, bearCount, total);
  const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

  const rsiResult = interpretRSI(rsi14);
  const macdResult = interpretMACD(macd, macdSignal, macdHistogram);
  const bbResult = interpretBB(price, bbUpper, bbMid, bbLower);
  const kdjResult = interpretKDJ(kdjK, kdjD, kdjJ);
  const maResult = interpretMA(price, sma20, sma50);
  const srDesc = describeSR(price, supportResistance, { bbUpper, bbLower });
  const scenarios = buildScenarios(price, indicators, signals);

  const lines = [];

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`  技術分析報告｜${symbolLabel}｜${interval}`);
  lines.push(`  分析時間：${now}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(``);

  lines.push(`▌ 一、當前趨勢判斷`);
  lines.push(`綜合 ${total} 項技術指標評估，當前市場格局：【${trend}】`);
  lines.push(`多頭訊號 ${bullCount} 項 / 空頭訊號 ${bearCount} 項 / 中性訊號 ${neuCount} 項`);
  if (maResult) lines.push(maResult.text);
  lines.push(``);

  lines.push(`▌ 二、支撐與壓力位`);
  lines.push(srDesc);
  lines.push(``);

  lines.push(`▌ 三、動能指標交叉驗證`);
  if (rsiResult) lines.push(`• RSI：${rsiResult.text}`);
  if (macdResult) lines.push(`• MACD：${macdResult.text}`);
  if (kdjResult) lines.push(`• KDJ：${kdjResult.text}`);
  lines.push(``);

  lines.push(`▌ 四、布林帶與波動率`);
  if (bbResult) lines.push(bbResult.text);
  lines.push(``);

  lines.push(`▌ 五、情境推演`);
  lines.push(scenarios);
  lines.push(``);

  lines.push(`▌ 六、風險提示`);
  lines.push(`• 本報告基於純技術面分析，不考慮基本面、消息面與市場情緒`);
  lines.push(`• 加密貨幣市場波動劇烈，技術分析僅供參考，不構成投資建議`);
  lines.push(`• 建議搭配成交量、市場情緒指數（Fear & Greed Index）綜合判斷`);
  lines.push(`• 任何交易請設定止損，嚴格控制倉位，不要全倉操作`);
  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  return lines.join('\n');
}
