// 技術指標計算函式庫
// 輸入皆為 K 線陣列：[{ time, open, high, low, close, volume }, ...]

export function sma(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values, period) {
  const out = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev = null;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) continue;
    if (i === period - 1) {
      for (let j = 0; j <= i; j++) sum += values[j];
      prev = sum / period;
      out[i] = prev;
      continue;
    }
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function rsi(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export function macd(closes, fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = closes.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i] - emaSlow[i] : null
  );
  const validMacd = macdLine.filter((v) => v !== null);
  const signalRaw = ema(validMacd, signalPeriod);
  const signalLine = new Array(closes.length).fill(null);
  let vi = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) continue;
    signalLine[i] = signalRaw[vi] ?? null;
    vi++;
  }
  const histogram = closes.map((_, i) =>
    macdLine[i] !== null && signalLine[i] !== null ? macdLine[i] - signalLine[i] : null
  );
  return { macdLine, signalLine, histogram };
}

export function bollingerBands(closes, period = 20, mult = 2) {
  const mid = sma(closes, period);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    if (mid[i] === null) continue;
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = mid[i];
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper[i] = mean + mult * std;
    lower[i] = mean - mult * std;
  }
  return { upper, mid, lower };
}

export function kdj(candles, period = 9, kSmooth = 3, dSmooth = 3) {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const rsv = new Array(candles.length).fill(null);

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) continue;
    const hSlice = highs.slice(i - period + 1, i + 1);
    const lSlice = lows.slice(i - period + 1, i + 1);
    const highest = Math.max(...hSlice);
    const lowest = Math.min(...lSlice);
    rsv[i] = highest === lowest ? 50 : ((closes[i] - lowest) / (highest - lowest)) * 100;
  }

  const k = new Array(candles.length).fill(null);
  const d = new Array(candles.length).fill(null);
  let prevK = 50, prevD = 50;
  for (let i = 0; i < candles.length; i++) {
    if (rsv[i] === null) continue;
    prevK = (prevK * (kSmooth - 1) + rsv[i]) / kSmooth;
    prevD = (prevD * (dSmooth - 1) + prevK) / dSmooth;
    k[i] = prevK;
    d[i] = prevD;
  }
  const j = k.map((v, i) => (v !== null && d[i] !== null ? 3 * v - 2 * d[i] : null));
  return { k, d, j };
}

export function atr(candles, period = 14) {
  const tr = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(
      c.high - c.low,
      Math.abs(c.high - prevClose),
      Math.abs(c.low - prevClose)
    );
  });
  return ema(tr, period);
}

export function volumeSma(candles, period = 20) {
  return sma(candles.map((c) => c.volume), period);
}

// 取每個指標的最後一個有效值
export function lastValid(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined && !Number.isNaN(arr[i])) return arr[i];
  }
  return null;
}

// 綜合計算所有指標，回傳當前最新狀態
export function computeAllIndicators(candles) {
  if (!candles || candles.length < 30) return null;
  const closes = candles.map((c) => c.close);

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const rsi14 = rsi(closes, 14);
  const { macdLine, signalLine, histogram } = macd(closes);
  const bb = bollingerBands(closes, 20);
  const kdjVal = kdj(candles);
  const atr14 = atr(candles, 14);
  const volSma = volumeSma(candles, 20);

  const lastClose = closes[closes.length - 1];

  return {
    price: lastClose,
    sma20: lastValid(sma20),
    sma50: lastValid(sma50),
    ema12: lastValid(ema12),
    ema26: lastValid(ema26),
    rsi14: lastValid(rsi14),
    macd: lastValid(macdLine),
    macdSignal: lastValid(signalLine),
    macdHistogram: lastValid(histogram),
    bbUpper: lastValid(bb.upper),
    bbMid: lastValid(bb.mid),
    bbLower: lastValid(bb.lower),
    kdjK: lastValid(kdjVal.k),
    kdjD: lastValid(kdjVal.d),
    kdjJ: lastValid(kdjVal.j),
    atr14: lastValid(atr14),
    volSma20: lastValid(volSma),
    currentVolume: candles[candles.length - 1].volume,
    series: { sma20, sma50, rsi14, macdLine, signalLine, histogram, bb, kdjVal },
  };
}

// 根據指標產生交易訊號清單與多空評分
export function generateSignals(ind) {
  if (!ind) return { signals: [], bullCount: 0, bearCount: 0, neuCount: 0 };
  const signals = [];
  let bullCount = 0, bearCount = 0, neuCount = 0;

  // MA 交叉
  if (ind.sma20 !== null && ind.sma50 !== null) {
    if (ind.sma20 > ind.sma50 && ind.price > ind.sma20) {
      signals.push({ name: 'MA 交叉', type: 'bull', label: '黃金交叉 / 多頭排列' });
      bullCount++;
    } else if (ind.sma20 < ind.sma50 && ind.price < ind.sma20) {
      signals.push({ name: 'MA 交叉', type: 'bear', label: '死亡交叉 / 空頭排列' });
      bearCount++;
    } else {
      signals.push({ name: 'MA 交叉', type: 'neutral', label: '糾結整理中' });
      neuCount++;
    }
  }

  // RSI
  if (ind.rsi14 !== null) {
    if (ind.rsi14 > 70) {
      signals.push({ name: 'RSI(14)', type: 'bear', label: `超買區 ${ind.rsi14.toFixed(1)}` });
      bearCount++;
    } else if (ind.rsi14 < 30) {
      signals.push({ name: 'RSI(14)', type: 'bull', label: `超賣區 ${ind.rsi14.toFixed(1)}` });
      bullCount++;
    } else if (ind.rsi14 > 55) {
      signals.push({ name: 'RSI(14)', type: 'bull', label: `偏多 ${ind.rsi14.toFixed(1)}` });
      bullCount++;
    } else if (ind.rsi14 < 45) {
      signals.push({ name: 'RSI(14)', type: 'bear', label: `偏空 ${ind.rsi14.toFixed(1)}` });
      bearCount++;
    } else {
      signals.push({ name: 'RSI(14)', type: 'neutral', label: `中性 ${ind.rsi14.toFixed(1)}` });
      neuCount++;
    }
  }

  // MACD
  if (ind.macd !== null && ind.macdSignal !== null) {
    if (ind.macd > ind.macdSignal && ind.macdHistogram > 0) {
      signals.push({ name: 'MACD', type: 'bull', label: '柱狀體翻紅 / 多頭動能' });
      bullCount++;
    } else if (ind.macd < ind.macdSignal && ind.macdHistogram < 0) {
      signals.push({ name: 'MACD', type: 'bear', label: '柱狀體翻綠 / 空頭動能' });
      bearCount++;
    } else {
      signals.push({ name: 'MACD', type: 'neutral', label: '動能轉換中' });
      neuCount++;
    }
  }

  // 布林帶
  if (ind.bbUpper !== null && ind.bbLower !== null) {
    const range = ind.bbUpper - ind.bbLower;
    const pos = range > 0 ? (ind.price - ind.bbLower) / range : 0.5;
    if (pos > 0.85) {
      signals.push({ name: '布林帶', type: 'bear', label: '觸及上軌，留意拉回' });
      bearCount++;
    } else if (pos < 0.15) {
      signals.push({ name: '布林帶', type: 'bull', label: '觸及下軌，留意反彈' });
      bullCount++;
    } else {
      signals.push({ name: '布林帶', type: 'neutral', label: '帶內區間整理' });
      neuCount++;
    }
  }

  // KDJ
  if (ind.kdjK !== null && ind.kdjD !== null) {
    if (ind.kdjK > ind.kdjD && ind.kdjK < 80) {
      signals.push({ name: 'KDJ', type: 'bull', label: 'K 上穿 D，動能轉強' });
      bullCount++;
    } else if (ind.kdjK < ind.kdjD && ind.kdjK > 20) {
      signals.push({ name: 'KDJ', type: 'bear', label: 'K 下穿 D，動能轉弱' });
      bearCount++;
    } else if (ind.kdjK >= 80) {
      signals.push({ name: 'KDJ', type: 'bear', label: '超買區間' });
      bearCount++;
    } else if (ind.kdjK <= 20) {
      signals.push({ name: 'KDJ', type: 'bull', label: '超賣區間' });
      bullCount++;
    } else {
      signals.push({ name: 'KDJ', type: 'neutral', label: '中性區間' });
      neuCount++;
    }
  }

  // 成交量
  if (ind.currentVolume !== null && ind.volSma20 !== null) {
    if (ind.currentVolume > ind.volSma20 * 1.5) {
      signals.push({ name: '成交量', type: 'neutral', label: '放量，趨勢確認中' });
      neuCount++;
    } else if (ind.currentVolume < ind.volSma20 * 0.6) {
      signals.push({ name: '成交量', type: 'neutral', label: '縮量，觀望氣氛濃' });
      neuCount++;
    } else {
      signals.push({ name: '成交量', type: 'neutral', label: '量能正常' });
      neuCount++;
    }
  }

  return { signals, bullCount, bearCount, neuCount };
}

// 支撐壓力位估算（基於近期高低點 + 布林帶 + ATR）
export function estimateSupportResistance(candles, ind) {
  if (!candles || candles.length < 20 || !ind) return null;
  const recent = candles.slice(-30);
  const highs = recent.map((c) => c.high).sort((a, b) => b - a);
  const lows = recent.map((c) => c.low).sort((a, b) => a - b);

  const resistance1 = ind.bbUpper ?? highs[0];
  const resistance2 = highs[Math.min(2, highs.length - 1)];
  const support1 = ind.bbLower ?? lows[0];
  const support2 = lows[Math.min(2, lows.length - 1)];

  return {
    resistance: [resistance1, resistance2].sort((a, b) => a - b),
    support: [support1, support2].sort((a, b) => b - a),
  };
}
