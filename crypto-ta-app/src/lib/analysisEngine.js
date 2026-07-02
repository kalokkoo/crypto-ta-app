function fmt(v, d = 2) {
  if (v === null || v === undefined) return 'N/A';
  if (Math.abs(v) < 0.0001) return v.toFixed(8);
  if (Math.abs(v) < 0.01) return v.toFixed(6);
  return v.toFixed(d);
}

function pct(v, ref) {
  if (!v || !ref) return null;
  return ((v - ref) / ref) * 100;
}

function interpretRSI(rsi) {
  if (rsi === null) return null;
  if (rsi >= 80) return { level: '嚴重超買', color: '🔴', detail: `RSI ${fmt(rsi,1)} 超過 80，市場過熱明顯，歷史上此區間常伴隨急跌修正，強烈建議減倉或等待回調再介入。`, signal: 'bear' };
  if (rsi >= 70) return { level: '超買區', color: '🟠', detail: `RSI ${fmt(rsi,1)} 進入超買（70-80），多頭動能仍在但上漲空間有限，注意量能是否同步放大，無量上漲需謹慎。`, signal: 'bear' };
  if (rsi >= 60) return { level: '強勢多頭', color: '🟢', detail: `RSI ${fmt(rsi,1)} 落在 60-70 強勢區，趨勢健康，多頭動能充足，可持倉或逢低加碼。`, signal: 'bull' };
  if (rsi >= 50) return { level: '偏多', color: '🟡', detail: `RSI ${fmt(rsi,1)} 站上 50 中線，多空力道偏向買方，但力度尚未明顯，等待進一步確認。`, signal: 'bull' };
  if (rsi >= 40) return { level: '偏空', color: '🟡', detail: `RSI ${fmt(rsi,1)} 落在 40-50，空方略佔優勢，短線觀望為主，不宜追多。`, signal: 'bear' };
  if (rsi >= 30) return { level: '弱勢空頭', color: '🟠', detail: `RSI ${fmt(rsi,1)} 接近超賣邊緣（30-40），空頭持續施壓，可開始留意止跌訊號，但未確認前勿抄底。`, signal: 'bear' };
  if (rsi >= 20) return { level: '超賣區', color: '🔵', detail: `RSI ${fmt(rsi,1)} 進入超賣（20-30），市場悲觀情緒過重，短線反彈機率上升，可分批布局但需設好止損。`, signal: 'bull' };
  return { level: '嚴重超賣', color: '🔵', detail: `RSI ${fmt(rsi,1)} 低於 20，極度超賣，市場恐慌至頂，歷史上為中長線重要買點，但需等K線出現止跌訊號（如長下影線、吞噬K）再行動。`, signal: 'bull' };
}

function interpretMACD(macd, signal, hist) {
  if (macd === null || signal === null) return null;
  const diff = macd - signal;
  if (macd > 0 && signal > 0 && diff > 0) return { level: '強勢多頭', detail: `MACD（${fmt(macd)}）與訊號線（${fmt(signal)}）均在零軸上方，且 MACD 高於訊號線，柱狀體翻紅擴張，為標準強勢多頭格局，趨勢明確向上。` };
  if (macd > 0 && diff > 0) return { level: '多頭啟動', detail: `MACD（${fmt(macd)}）黃金交叉，位於零軸上方，多頭趨勢成形。柱狀體差值 ${fmt(diff)}，動能持續擴張中。` };
  if (diff > 0 && macd < 0) return { level: '底部反轉', detail: `MACD 黃金交叉（${fmt(macd)} 上穿 ${fmt(signal)}），但仍在零軸下方，為底部反轉早期訊號，需等待 MACD 突破零軸確認多頭。` };
  if (macd < 0 && signal < 0 && diff < 0) return { level: '強勢空頭', detail: `MACD（${fmt(macd)}）與訊號線（${fmt(signal)}）均在零軸下方，且 MACD 低於訊號線，柱狀體翻綠擴張，強勢空頭格局，趨勢明確向下。` };
  if (diff < 0 && macd > 0) return { level: '頭部反轉', detail: `MACD 死亡交叉（${fmt(macd)} 下穿 ${fmt(signal)}），仍在零軸上方，為頭部反轉早期警示，需警惕趨勢轉空可能。` };
  return { level: '空頭延續', detail: `MACD（${fmt(macd)}）低於訊號線（${fmt(signal)}），空頭動能持續，柱狀體差值 ${fmt(diff)}。` };
}

function interpretBB(price, upper, mid, lower) {
  if (!upper || !lower || !mid) return null;
  const range = upper - lower;
  const pos = (price - lower) / range;
  const bw = (range / mid) * 100;
  const bwDesc = bw < 2 ? `【極度收窄 ${fmt(bw,1)}%】大行情前兆，突破方向決定後市` :
    bw < 5 ? `【偏窄 ${fmt(bw,1)}%】醞釀突破，建議等待方向確認` :
    bw > 20 ? `【極度擴張 ${fmt(bw,1)}%】波動率極高，趨勢行情加速段` :
    bw > 12 ? `【擴張中 ${fmt(bw,1)}%】波動率高，趨勢強勁` : `【正常 ${fmt(bw,1)}%】市場波動適中`;
  
  const posDesc = pos > 0.9 ? `突破上軌（${fmt(upper)}），強勢但需防過熱回調` :
    pos > 0.7 ? `靠近上軌（${fmt(upper)}），偏強，上漲空間收窄` :
    pos > 0.5 ? `中軌（${fmt(mid)}）上方，偏多格局` :
    pos > 0.3 ? `中軌（${fmt(mid)}）下方，偏空格局` :
    pos > 0.1 ? `靠近下軌（${fmt(lower)}），超跌留意反彈` :
    `跌破下軌（${fmt(lower)}），強勢下跌但反彈機率升高`;

  return { bwDesc, posDesc, pos, bw };
}

function interpretKDJ(k, d, j) {
  if (k === null || d === null) return null;
  const cross = k > d ? 'K 上穿 D（偏多）' : 'K 下穿 D（偏空）';
  const zone = k > 80 ? '超買區（>80），短線拉回風險' : k < 20 ? '超賣區（<20），反彈機率高' : '中性區間（20-80）';
  const jWarn = j !== null ? (j > 100 ? `  ⚠️ J 值 ${fmt(j,1)} 超過 100，超買極值` : j < 0 ? `  ⚠️ J 值 ${fmt(j,1)} 低於 0，超賣極值` : '') : '';
  return `K:${fmt(k,1)}  D:${fmt(d,1)}  J:${j !== null ? fmt(j,1) : 'N/A'}\n  ${cross}，位於${zone}${jWarn}`;
}

function interpretMA(price, ma20, ma50) {
  if (!ma20 || !ma50) return null;
  const p20 = pct(price, ma20);
  const p50 = pct(price, ma50);
  if (price > ma20 && ma20 > ma50)
    return { trend: '多頭排列 ✅', detail: `價格 > MA20（${fmt(ma20)}）> MA50（${fmt(ma50)}），標準多頭排列。價格高於 MA20 ${fmt(Math.abs(p20),2)}%，高於 MA50 ${fmt(Math.abs(p50),2)}%，趨勢結構健康。` };
  if (price < ma20 && ma20 < ma50)
    return { trend: '空頭排列 ❌', detail: `價格 < MA20（${fmt(ma20)}）< MA50（${fmt(ma50)}），標準空頭排列。價格低於 MA20 ${fmt(Math.abs(p20),2)}%，低於 MA50 ${fmt(Math.abs(p50),2)}%，趨勢結構偏空。` };
  if (price > ma20 && ma20 < ma50)
    return { trend: '反彈確認中 ⚠️', detail: `價格回升至 MA20（${fmt(ma20)}）上方，但 MA20 仍低於 MA50（${fmt(ma50)}），尚未形成黃金交叉，需進一步確認是否真正反轉。` };
  return { trend: '回調整理中 ⚠️', detail: `價格跌至 MA20（${fmt(ma20)}）下方，但 MA20 仍高於 MA50（${fmt(ma50)}），MA 尚未死叉，可能是短期回調而非趨勢反轉。` };
}

export function generateAnalysisReport(symbolLabel, interval, indicators, supportResistance, signals) {
  if (!indicators) return '指標資料尚未載入，請稍候...';
  const { price, rsi14, macd, macdSignal, macdHistogram, sma20, sma50, bbUpper, bbMid, bbLower, kdjK, kdjD, kdjJ, atr14 } = indicators;
  const { bullCount, bearCount, neuCount } = signals;
  const total = bullCount + bearCount + neuCount || 1;
  const score = ((bullCount - bearCount) / total * 100).toFixed(0);
  const trendLabel = bullCount > bearCount + 1 ? '📈 多頭佔優' : bearCount > bullCount + 1 ? '📉 空頭佔優' : '➡️ 多空均衡';
  const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });

  const rsiR = interpretRSI(rsi14);
  const macdR = interpretMACD(macd, macdSignal, macdHistogram);
  const bbR = interpretBB(price, bbUpper, bbMid, bbLower);
  const kdjR = interpretKDJ(kdjK, kdjD, kdjJ);
  const maR = interpretMA(price, sma20, sma50);

  const upTarget = bbUpper ? fmt(bbUpper) : fmt(price * 1.05);
  const downTarget = bbLower ? fmt(bbLower) : fmt(price * 0.95);

  const lines = [];
  lines.push(`╔══════════════════════════════════════════╗`);
  lines.push(`  📊 技術分析報告｜${symbolLabel}｜${interval}`);
  lines.push(`  🕐 ${now}`);
  lines.push(`╚══════════════════════════════════════════╝`);
  lines.push(``);

  lines.push(`━━━ 一、市場概況 ━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`當前價格：${fmt(price, 4)} USDT`);
  lines.push(`綜合評分：${trendLabel}（多頭 ${bullCount} / 空頭 ${bearCount} / 中性 ${neuCount}）`);
  if (atr14) lines.push(`波動幅度：ATR(14) = ${fmt(atr14, 4)}（約為價格的 ${fmt(atr14/price*100, 2)}%）`);
  if (maR) {
    lines.push(`均線格局：${maR.trend}`);
    lines.push(`  ${maR.detail}`);
  }
  lines.push(``);

  lines.push(`━━━ 二、關鍵支撐與壓力位 ━━━━━━━━━━━━`);
  if (supportResistance) {
    const r1 = supportResistance.resistance[0];
    const r2 = supportResistance.resistance[1];
    const s1 = supportResistance.support[0];
    const s2 = supportResistance.support[1];
    lines.push(`🔴 壓力二（強壓）：${fmt(r2)}   距今 +${fmt((r2-price)/price*100,2)}%`);
    lines.push(`🟠 壓力一（近壓）：${fmt(r1)}   距今 +${fmt((r1-price)/price*100,2)}%`);
    lines.push(`─ ─ ─ 當前價格：${fmt(price, 4)} ─ ─ ─`);
    lines.push(`🟢 支撐一（近撐）：${fmt(s1)}   距今 -${fmt((price-s1)/price*100,2)}%`);
    lines.push(`🔵 支撐二（強撐）：${fmt(s2)}   距今 -${fmt((price-s2)/price*100,2)}%`);
    lines.push(``);
    lines.push(`  📌 近壓突破 → 目標看 ${upTarget}`);
    lines.push(`  📌 近撐跌破 → 目標看 ${downTarget}`);
  }
  lines.push(``);

  lines.push(`━━━ 三、動能指標詳解 ━━━━━━━━━━━━━━`);
  if (rsiR) {
    lines.push(`【RSI(14)】${rsiR.color} ${rsiR.level}`);
    lines.push(`  ${rsiR.detail}`);
  }
  lines.push(``);
  if (macdR) {
    lines.push(`【MACD(12,26,9)】${macdR.level}`);
    lines.push(`  ${macdR.detail}`);
    lines.push(`  MACD：${fmt(macd)}  訊號線：${fmt(macdSignal)}  柱狀體：${fmt(macdHistogram)}`);
  }
  lines.push(``);
  if (kdjR) {
    lines.push(`【KDJ(9,3,3)】`);
    lines.push(`  ${kdjR}`);
  }
  lines.push(``);

  lines.push(`━━━ 四、布林帶與波動率 ━━━━━━━━━━━━━`);
  if (bbR) {
    lines.push(`帶寬狀態：${bbR.bwDesc}`);
    lines.push(`價格位置：${bbR.posDesc}`);
    lines.push(`上軌：${fmt(bbUpper)}  中軌：${fmt(bbMid)}  下軌：${fmt(bbLower)}`);
  }
  lines.push(``);

  lines.push(`━━━ 五、情境推演 ━━━━━━━━━━━━━━━━━━`);
  const isBull = bullCount > bearCount;
  const isBear = bearCount > bullCount;
  lines.push(`📈 【看多情境】${isBull ? '⭐ 目前偏向此情境' : ''}`);
  lines.push(`  觸發：站穩 MA20（${fmt(sma20)}），MACD 柱狀體持續擴張，RSI 保持 50 以上`);
  lines.push(`  目標：${upTarget}（布林上軌）`);
  lines.push(`  止損：跌破 MA50（${fmt(sma50)}）視為失敗`);
  lines.push(``);
  lines.push(`📉 【看空情境】${isBear ? '⭐ 目前偏向此情境' : ''}`);
  lines.push(`  觸發：跌破 MA20（${fmt(sma20)}），MACD 死叉，RSI 跌破 45`);
  lines.push(`  目標：${downTarget}（布林下軌）`);
  lines.push(`  止損：收復 MA20 並站穩`);
  lines.push(``);
  lines.push(`➡️ 【盤整情境】${!isBull && !isBear ? '⭐ 目前偏向此情境' : ''}`);
  lines.push(`  特徵：布林帶收窄，成交量萎縮，RSI 在 45-55 間震盪`);
  lines.push(`  策略：等待突破方向確認後再進場，勿在區間中追高殺低`);
  lines.push(``);

  lines.push(`━━━ 六、操作建議與風險提示 ━━━━━━━━━`);
  if (isBull) {
    lines.push(`✅ 當前技術面偏多，可考慮：`);
    lines.push(`  • 在回測支撐位（${supportResistance ? fmt(supportResistance.support[0]) : 'MA20'}）附近分批建多`);
    lines.push(`  • 設置止損於 MA50（${fmt(sma50)}）下方`);
    lines.push(`  • 首要獲利目標：${upTarget}`);
  } else if (isBear) {
    lines.push(`⚠️ 當前技術面偏空，建議：`);
    lines.push(`  • 避免追多，等待止跌訊號`);
    lines.push(`  • 若持有多單，考慮在反彈至 MA20（${fmt(sma20)}）時減倉`);
    lines.push(`  • 跌破 ${supportResistance ? fmt(supportResistance.support[1]) : '布林下軌'} 可能加速下跌`);
  } else {
    lines.push(`➡️ 當前多空訊號分歧，建議：`);
    lines.push(`  • 觀望為主，等待明確突破再進場`);
    lines.push(`  • 設定突破警示：上方 ${upTarget}，下方 ${downTarget}`);
  }
  lines.push(``);
  lines.push(`⚠️  風險聲明：本報告為純技術面分析，不構成投資建議。`);
  lines.push(`    加密貨幣市場波動劇烈，請設定止損、控制倉位。`);
  lines.push(`────────────────────────────────────────`);

  return lines.join('\n');
}
