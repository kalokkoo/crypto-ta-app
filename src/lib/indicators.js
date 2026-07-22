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
  let prev = null, sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { sum += values[i]; continue; }
    if (i === period - 1) { sum += values[i]; prev = sum / period; out[i] = prev; continue; }
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
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let ag = gains / period, al = losses / period;
  out[period] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

export function macd(closes, fast = 12, slow = 26, sig = 9) {
  const ef = ema(closes, fast), es = ema(closes, slow);
  const macdLine = closes.map((_, i) => ef[i] !== null && es[i] !== null ? ef[i] - es[i] : null);
  const valid = macdLine.filter(v => v !== null);
  const sigRaw = ema(valid, sig);
  const signalLine = new Array(closes.length).fill(null);
  let vi = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) { signalLine[i] = sigRaw[vi] ?? null; vi++; }
  }
  const histogram = closes.map((_, i) => macdLine[i] !== null && signalLine[i] !== null ? macdLine[i] - signalLine[i] : null);
  return { macdLine, signalLine, histogram };
}

export function bollingerBands(closes, period = 20, mult = 2) {
  const mid = sma(closes, period);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    if (mid[i] === null) continue;
    const slice = closes.slice(i - period + 1, i + 1);
    const std = Math.sqrt(slice.reduce((s, v) => s + (v - mid[i]) ** 2, 0) / period);
    upper[i] = mid[i] + mult * std;
    lower[i] = mid[i] - mult * std;
  }
  return { upper, mid, lower };
}

export function kdj(candles, period = 9) {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const rsv = new Array(candles.length).fill(null);
  for (let i = period - 1; i < candles.length; i++) {
    const hs = highs.slice(i - period + 1, i + 1), ls = lows.slice(i - period + 1, i + 1);
    const hi = Math.max(...hs), lo = Math.min(...ls);
    rsv[i] = hi === lo ? 50 : ((closes[i] - lo) / (hi - lo)) * 100;
  }
  const k = new Array(candles.length).fill(null);
  const d = new Array(candles.length).fill(null);
  let pk = 50, pd = 50;
  for (let i = 0; i < candles.length; i++) {
    if (rsv[i] === null) continue;
    pk = (pk * 2 + rsv[i]) / 3;
    pd = (pd * 2 + pk) / 3;
    k[i] = pk; d[i] = pd;
  }
  const j = k.map((v, i) => v !== null && d[i] !== null ? 3 * v - 2 * d[i] : null);
  return { k, d, j };
}

export function atr(candles, period = 14) {
  const tr = candles.map((c, i) => i === 0 ? c.high - c.low : Math.max(c.high - c.low, Math.abs(c.high - candles[i-1].close), Math.abs(c.low - candles[i-1].close)));
  return ema(tr, period);
}

// CVD（累積成交量差值）— 用 takerBuy 近似
export function cvd(candles) {
  let cum = 0;
  return candles.map(c => {
    const buy = c.takerBuy ?? c.volume * 0.5;
    const sell = c.volume - buy;
    cum += buy - sell;
    return cum;
  });
}

export function lastValid(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined && !isNaN(arr[i])) return arr[i];
  }
  return null;
}

export function computeAllIndicators(candles) {
  if (!candles || candles.length < 30) return null;
  const closes = candles.map(c => c.close);
  const sma20 = sma(closes, 20), sma50 = sma(closes, 50);
  const ema12 = ema(closes, 12), ema26 = ema(closes, 26);
  const rsi14 = rsi(closes, 14);
  const { macdLine, signalLine, histogram } = macd(closes);
  const bb = bollingerBands(closes, 20);
  const kdjVal = kdj(candles);
  const atr14 = atr(candles, 14);
  const cvdArr = cvd(candles);
  const sma20Vol = sma(candles.map(c => c.volume), 20);
  const price = closes[closes.length - 1];

  return {
    price,
    sma20: lastValid(sma20), sma50: lastValid(sma50),
    ema12: lastValid(ema12), ema26: lastValid(ema26),
    rsi14: lastValid(rsi14),
    macd: lastValid(macdLine), macdSignal: lastValid(signalLine), macdHistogram: lastValid(histogram),
    bbUpper: lastValid(bb.upper), bbMid: lastValid(bb.mid), bbLower: lastValid(bb.lower),
    kdjK: lastValid(kdjVal.k), kdjD: lastValid(kdjVal.d), kdjJ: lastValid(kdjVal.j),
    atr14: lastValid(atr14),
    cvd: lastValid(cvdArr),
    cvdPrev: cvdArr.length >= 5 ? cvdArr[cvdArr.length - 5] : null,
    currentVolume: candles[candles.length - 1].volume,
    volSma20: lastValid(sma20Vol),
    series: { sma20, sma50, rsi14, macdLine, signalLine, histogram, bb, kdjVal, cvdArr },
  };
}

export function generateSignals(ind) {
  if (!ind) return { signals: [], bullCount: 0, bearCount: 0, neuCount: 0 };
  const signals = [];
  let bullCount = 0, bearCount = 0, neuCount = 0;

  // MA
  if (ind.sma20 && ind.sma50) {
    if (ind.sma20 > ind.sma50 && ind.price > ind.sma20) { signals.push({ name: 'MA 排列', type: 'bull', label: '多頭排列' }); bullCount++; }
    else if (ind.sma20 < ind.sma50 && ind.price < ind.sma20) { signals.push({ name: 'MA 排列', type: 'bear', label: '空頭排列' }); bearCount++; }
    else { signals.push({ name: 'MA 排列', type: 'neutral', label: '糾結整理' }); neuCount++; }
  }
  // RSI
  if (ind.rsi14 !== null) {
    if (ind.rsi14 > 70) { signals.push({ name: 'RSI(14)', type: 'bear', label: `超買 ${ind.rsi14.toFixed(1)}` }); bearCount++; }
    else if (ind.rsi14 < 30) { signals.push({ name: 'RSI(14)', type: 'bull', label: `超賣 ${ind.rsi14.toFixed(1)}` }); bullCount++; }
    else if (ind.rsi14 > 55) { signals.push({ name: 'RSI(14)', type: 'bull', label: `偏多 ${ind.rsi14.toFixed(1)}` }); bullCount++; }
    else if (ind.rsi14 < 45) { signals.push({ name: 'RSI(14)', type: 'bear', label: `偏空 ${ind.rsi14.toFixed(1)}` }); bearCount++; }
    else { signals.push({ name: 'RSI(14)', type: 'neutral', label: `中性 ${ind.rsi14.toFixed(1)}` }); neuCount++; }
  }
  // MACD
  if (ind.macd !== null && ind.macdSignal !== null) {
    if (ind.macd > ind.macdSignal && ind.macdHistogram > 0) { signals.push({ name: 'MACD', type: 'bull', label: '黃金交叉' }); bullCount++; }
    else if (ind.macd < ind.macdSignal && ind.macdHistogram < 0) { signals.push({ name: 'MACD', type: 'bear', label: '死亡交叉' }); bearCount++; }
    else { signals.push({ name: 'MACD', type: 'neutral', label: '動能轉換' }); neuCount++; }
  }
  // BB
  if (ind.bbUpper && ind.bbLower) {
    const pos = (ind.price - ind.bbLower) / (ind.bbUpper - ind.bbLower);
    if (pos > 0.85) { signals.push({ name: '布林帶', type: 'bear', label: '觸上軌' }); bearCount++; }
    else if (pos < 0.15) { signals.push({ name: '布林帶', type: 'bull', label: '觸下軌' }); bullCount++; }
    else { signals.push({ name: '布林帶', type: 'neutral', label: '帶內整理' }); neuCount++; }
  }
  // KDJ
  if (ind.kdjK !== null && ind.kdjD !== null) {
    if (ind.kdjK > ind.kdjD && ind.kdjK < 80) { signals.push({ name: 'KDJ', type: 'bull', label: 'K上穿D' }); bullCount++; }
    else if (ind.kdjK < ind.kdjD && ind.kdjK > 20) { signals.push({ name: 'KDJ', type: 'bear', label: 'K下穿D' }); bearCount++; }
    else if (ind.kdjK >= 80) { signals.push({ name: 'KDJ', type: 'bear', label: '超買' }); bearCount++; }
    else if (ind.kdjK <= 20) { signals.push({ name: 'KDJ', type: 'bull', label: '超賣' }); bullCount++; }
    else { signals.push({ name: 'KDJ', type: 'neutral', label: '中性' }); neuCount++; }
  }
  // CVD
  if (ind.cvd !== null && ind.cvdPrev !== null) {
    const cvdDelta = ind.cvd - ind.cvdPrev;
    if (cvdDelta > 0 && ind.price > (ind.sma20 || ind.price)) { signals.push({ name: 'CVD', type: 'bull', label: '買盤主導' }); bullCount++; }
    else if (cvdDelta < 0 && ind.price < (ind.sma20 || ind.price)) { signals.push({ name: 'CVD', type: 'bear', label: '賣盤主導' }); bearCount++; }
    else { signals.push({ name: 'CVD', type: 'neutral', label: '量能中性' }); neuCount++; }
  }
  // Volume
  if (ind.currentVolume && ind.volSma20) {
    if (ind.currentVolume > ind.volSma20 * 1.5) { signals.push({ name: '成交量', type: 'neutral', label: '放量' }); neuCount++; }
    else if (ind.currentVolume < ind.volSma20 * 0.6) { signals.push({ name: '成交量', type: 'neutral', label: '縮量' }); neuCount++; }
    else { signals.push({ name: '成交量', type: 'neutral', label: '正常量' }); neuCount++; }
  }

  return { signals, bullCount, bearCount, neuCount };
}

export function estimateSupportResistance(candles, ind) {
  if (!candles || candles.length < 20 || !ind) return null;
  const recent = candles.slice(-30);
  const highs = recent.map(c => c.high).sort((a, b) => b - a);
  const lows = recent.map(c => c.low).sort((a, b) => a - b);
  return {
    resistance: [ind.bbUpper ?? highs[0], highs[Math.min(2, highs.length - 1)]].sort((a, b) => a - b),
    support: [ind.bbLower ?? lows[0], lows[Math.min(2, lows.length - 1)]].sort((a, b) => b - a),
  };
}
