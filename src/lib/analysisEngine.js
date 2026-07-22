function fmt(v, d = 2) {
  if (v === null || v === undefined) return 'N/A';
  if (Math.abs(v) < 0.0001) return v.toFixed(8);
  if (Math.abs(v) < 0.01) return v.toFixed(6);
  return v.toFixed(d);
}

function interpretRSI(rsi) {
  if (rsi === null) return null;
  if (rsi >= 80) return { level: '嚴重超買 🔴', detail: `RSI ${fmt(rsi,1)} 超過 80，市場嚴重過熱，強烈建議減倉等待回調。` };
  if (rsi >= 70) return { level: '超買區 🟠', detail: `RSI ${fmt(rsi,1)} 進入超買（70-80），動能強但需留意拉回訊號。` };
  if (rsi >= 60) return { level: '強勢多頭 🟢', detail: `RSI ${fmt(rsi,1)} 落在 60-70 強勢區，趨勢健康，多頭動能充足。` };
  if (rsi >= 50) return { level: '偏多 🟡', detail: `RSI ${fmt(rsi,1)} 站上 50 中線，多空偏向買方，等待進一步確認。` };
  if (rsi >= 40) return { level: '偏空 🟡', detail: `RSI ${fmt(rsi,1)} 在 40-50，空方略佔優勢，短線觀望為主。` };
  if (rsi >= 30) return { level: '弱勢空頭 🟠', detail: `RSI ${fmt(rsi,1)} 接近超賣邊緣，可開始留意止跌訊號，未確認前勿抄底。` };
  return { level: '超賣區 🔵', detail: `RSI ${fmt(rsi,1)} 進入超賣，市場悲觀情緒過重，反彈機率上升。` };
}

function interpretMACD(macd, signal, hist) {
  if (macd === null || signal === null) return null;
  if (macd > 0 && signal > 0 && macd > signal) return { level: '強勢多頭', detail: `MACD（${fmt(macd)}）與訊號線均在零軸上方且黃金交叉，標準強勢多頭格局。` };
  if (macd > signal && macd < 0) return { level: '底部反轉', detail: `MACD 黃金交叉（${fmt(macd)}）但仍在零軸下方，底部反轉早期訊號，等待突破零軸確認。` };
  if (macd < 0 && signal < 0 && macd < signal) return { level: '強勢空頭', detail: `MACD（${fmt(macd)}）與訊號線均在零軸下方且死亡交叉，強勢空頭格局。` };
  if (macd < signal && macd > 0) return { level: '頭部警示', detail: `MACD 死亡交叉（${fmt(macd)}）但仍在零軸上方，頭部反轉警示，需防趨勢轉空。` };
  return { level: '動能轉換', detail: `MACD（${fmt(macd)}）訊號線（${fmt(signal)}），動能正在轉換中。` };
}

function interpretCVD(cvd, cvdPrev, price, sma20) {
  if (cvd === null || cvdPrev === null) return null;
  const delta = cvd - cvdPrev;
  const priceUp = sma20 ? price > sma20 : true;
  if (delta > 0 && priceUp) return '買盤主導，CVD 上升配合價格走強，多頭信心強 📈';
  if (delta > 0 && !priceUp) return '买盤增加但價格偏弱，可能是底部吸籌或假突破，需謹慎 ⚠️';
  if (delta < 0 && !priceUp) return '賣盤主導，CVD 下降配合價格走弱，空頭主控 📉';
  if (delta < 0 && priceUp) return 'CVD 下降但價格偏強，可能是拉貨出貨或空頭平倉推升，需留意 ⚠️';
  return 'CVD 能量中性，多空力道相當';
}

export function generateAnalysisReport(symbolLabel, interval, indicators, supportResistance, signals, oi, fundingRate, fearGreed) {
  if (!indicators) return '指標資料尚未載入，請稍候...';
  const { price, rsi14, macd, macdSignal, macdHistogram, sma20, sma50, bbUpper, bbMid, bbLower, kdjK, kdjD, kdjJ, atr14, cvd, cvdPrev } = indicators;
  const { bullCount, bearCount, neuCount } = signals;
  const total = bullCount + bearCount + neuCount || 1;
  const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
  const trendLabel = bullCount > bearCount + 1 ? '📈 多頭佔優' : bearCount > bullCount + 1 ? '📉 空頭佔優' : '➡️ 多空均衡';

  const rsiR = interpretRSI(rsi14);
  const macdR = interpretMACD(macd, macdSignal, macdHistogram);
  const cvdR = interpretCVD(cvd, cvdPrev, price, sma20);

  const lines = [];
  lines.push(`╔══════════════════════════════════════════╗`);
  lines.push(`  📊 技術分析報告｜${symbolLabel}｜${interval}`);
  lines.push(`  🕐 ${now}`);
  lines.push(`╚══════════════════════════════════════════╝`);
  lines.push(``);

  lines.push(`━━━ 一、市場概況 ━━━━━━━━━━━━━━━━━━━`);
  lines.push(`當前價格：${fmt(price, 4)} USDT`);
  lines.push(`綜合評分：${trendLabel}（多 ${bullCount} / 空 ${bearCount} / 中 ${neuCount}）`);
  if (atr14) lines.push(`當前波動：ATR(14) = ${fmt(atr14, 4)}（價格的 ${fmt(atr14/price*100, 2)}%）`);

  // 市場情緒附加資訊
  if (fearGreed) {
    const fgEmoji = fearGreed.value >= 75 ? '🟠' : fearGreed.value >= 55 ? '🟢' : fearGreed.value >= 45 ? '🟡' : fearGreed.value >= 25 ? '🟠' : '🔴';
    lines.push(`恐懼貪婪：${fgEmoji} ${fearGreed.value} - ${fearGreed.label}（${fearGreed.change >= 0 ? '+' : ''}${fearGreed.change} vs 昨日）`);
  }
  if (fundingRate !== null && fundingRate !== undefined) {
    const frPct = (fundingRate * 100).toFixed(4);
    lines.push(`資金費率：${+frPct > 0.05 ? '🟠' : +frPct < -0.01 ? '🔵' : '🟢'} ${frPct}%（${+frPct > 0.05 ? '多頭付費偏熱' : +frPct < -0.01 ? '空頭付費偏冷' : '費率中性'}）`);
  }
  if (oi) {
    lines.push(`未平倉量：${fmt(oi.change, 2)}% 變化（${oi.change > 0 ? '資金流入 📥' : '資金離場 📤'}）`);
  }
  lines.push(``);

  lines.push(`━━━ 二、均線與趨勢結構 ━━━━━━━━━━━━`);
  if (sma20 && sma50) {
    const trend = price > sma20 && sma20 > sma50 ? '多頭排列 ✅' : price < sma20 && sma20 < sma50 ? '空頭排列 ❌' : '均線糾結 ⚠️';
    lines.push(`均線格局：${trend}`);
    lines.push(`  MA20：${fmt(sma20)}（${price > sma20 ? '價格上方 ▲' : '價格下方 ▼'} ${fmt(Math.abs((price-sma20)/sma20*100), 2)}%）`);
    lines.push(`  MA50：${fmt(sma50)}（${price > sma50 ? '價格上方 ▲' : '價格下方 ▼'} ${fmt(Math.abs((price-sma50)/sma50*100), 2)}%）`);
  }
  lines.push(``);

  lines.push(`━━━ 三、關鍵支撐與壓力位 ━━━━━━━━━━`);
  if (supportResistance) {
    const { resistance, support } = supportResistance;
    lines.push(`🔴 壓力二：${fmt(resistance[1], 4)}   距今 +${fmt((resistance[1]-price)/price*100, 2)}%`);
    lines.push(`🟠 壓力一：${fmt(resistance[0], 4)}   距今 +${fmt((resistance[0]-price)/price*100, 2)}%`);
    lines.push(`── 現價 ${fmt(price, 4)} ──`);
    lines.push(`🟢 支撐一：${fmt(support[0], 4)}   距今 -${fmt((price-support[0])/price*100, 2)}%`);
    lines.push(`🔵 支撐二：${fmt(support[1], 4)}   距今 -${fmt((price-support[1])/price*100, 2)}%`);
  }
  lines.push(``);

  lines.push(`━━━ 四、動能指標分析 ━━━━━━━━━━━━━`);
  if (rsiR) { lines.push(`【RSI(14)】${rsiR.level}`); lines.push(`  ${rsiR.detail}`); lines.push(``); }
  if (macdR) {
    lines.push(`【MACD(12,26,9)】${macdR.level}`);
    lines.push(`  ${macdR.detail}`);
    lines.push(`  數值：MACD ${fmt(macd)} | 訊號 ${fmt(macdSignal)} | 柱 ${fmt(macdHistogram)}`);
    lines.push(``);
  }
  if (kdjK !== null) {
    lines.push(`【KDJ(9,3,3)】`);
    lines.push(`  K:${fmt(kdjK,1)}  D:${fmt(kdjD,1)}  J:${fmt(kdjJ,1)}`);
    lines.push(`  ${kdjK > kdjD ? 'K 上穿 D，偏多' : 'K 下穿 D，偏空'}，${kdjK > 80 ? '超買區' : kdjK < 20 ? '超賣區' : '中性區間'}`);
    lines.push(``);
  }

  lines.push(`━━━ 五、布林帶與能量分析 ━━━━━━━━━━`);
  if (bbUpper && bbLower && bbMid) {
    const bw = ((bbUpper - bbLower) / bbMid * 100).toFixed(1);
    const pos = ((price - bbLower) / (bbUpper - bbLower) * 100).toFixed(0);
    lines.push(`帶寬：${bw}%（${+bw < 3 ? '極度收窄，大行情前兆' : +bw < 6 ? '偏窄，醞釀突破' : +bw > 15 ? '極度擴張，趨勢加速' : '正常'}）`);
    lines.push(`位置：帶內 ${pos}%（${+pos > 80 ? '靠近上軌' : +pos < 20 ? '靠近下軌' : '中間區域'}）`);
    lines.push(`上軌 ${fmt(bbUpper)}｜中軌 ${fmt(bbMid)}｜下軌 ${fmt(bbLower)}`);
  }
  if (cvdR) { lines.push(``); lines.push(`【CVD 能量差】`); lines.push(`  ${cvdR}`); }
  lines.push(``);

  lines.push(`━━━ 六、情境推演與操作建議 ━━━━━━━`);
  const isBull = bullCount > bearCount;
  const isBear = bearCount > bullCount;
  lines.push(`📈 看多情境${isBull ? ' ⭐' : ''}：守住 MA20（${fmt(sma20)}），目標 ${fmt(bbUpper)}`);
  lines.push(`📉 看空情境${isBear ? ' ⭐' : ''}：跌破 MA20，目標 ${fmt(bbLower)}`);
  lines.push(`➡️ 盤整情境${!isBull && !isBear ? ' ⭐' : ''}：布林帶收窄，等方向`);
  lines.push(``);
  lines.push(`⚠️ 本報告為純技術分析，不構成投資建議。`);
  lines.push(`────────────────────────────────────────`);

  return lines.join('\n');
}
