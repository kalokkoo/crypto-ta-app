const REST = 'https://api.binance.com/api/v3';
const FAPI = 'https://fapi.binance.com/fapi/v1';
const WS = 'wss://stream.binance.com:9443/ws';

export const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT', name: 'Bitcoin', category: '主流' },
  { value: 'ETHUSDT', label: 'ETH/USDT', name: 'Ethereum', category: '主流' },
  { value: 'BNBUSDT', label: 'BNB/USDT', name: 'BNB', category: '主流' },
  { value: 'SOLUSDT', label: 'SOL/USDT', name: 'Solana', category: '主流' },
  { value: 'XRPUSDT', label: 'XRP/USDT', name: 'XRP', category: '主流' },
  { value: 'ADAUSDT', label: 'ADA/USDT', name: 'Cardano', category: 'L1/L2' },
  { value: 'AVAXUSDT', label: 'AVAX/USDT', name: 'Avalanche', category: 'L1/L2' },
  { value: 'DOTUSDT', label: 'DOT/USDT', name: 'Polkadot', category: 'L1/L2' },
  { value: 'MATICUSDT', label: 'MATIC/USDT', name: 'Polygon', category: 'L1/L2' },
  { value: 'LINKUSDT', label: 'LINK/USDT', name: 'Chainlink', category: 'L1/L2' },
  { value: 'SUIUSDT', label: 'SUI/USDT', name: 'Sui', category: 'L1/L2' },
  { value: 'APTUSDT', label: 'APT/USDT', name: 'Aptos', category: 'L1/L2' },
  { value: 'DOGEUSDT', label: 'DOGE/USDT', name: 'Dogecoin', category: 'Meme' },
  { value: 'SHIBUSDT', label: 'SHIB/USDT', name: 'Shiba Inu', category: 'Meme' },
  { value: 'PEPEUSDT', label: 'PEPE/USDT', name: 'Pepe', category: 'Meme' },
  { value: 'UNIUSDT', label: 'UNI/USDT', name: 'Uniswap', category: 'DeFi' },
  { value: 'AAVEUSDT', label: 'AAVE/USDT', name: 'Aave', category: 'DeFi' },
  { value: 'TRXUSDT', label: 'TRX/USDT', name: 'TRON', category: 'DeFi' },
];

export const CATEGORIES = ['主流', 'L1/L2', 'Meme', 'DeFi'];

export const TIMEFRAMES = [
  { value: '15m', label: '15分' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '日線' },
  { value: '1w', label: '週線' },
];

// K 線
export async function fetchKlines(symbol, interval, limit = 200) {
  const res = await fetch(`${REST}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  if (!res.ok) throw new Error(`Klines error ${res.status}`);
  return (await res.json()).map(k => ({
    time: Math.floor(k[0] / 1000),
    open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5],
    takerBuy: +k[9], takerSell: +k[5] - +k[9],
  }));
}

// 24h 統計
export async function fetch24hr(symbol) {
  const res = await fetch(`${REST}/ticker/24hr?symbol=${symbol}`);
  const d = await res.json();
  return { lastPrice: +d.lastPrice, priceChangePercent: +d.priceChangePercent, highPrice: +d.highPrice, lowPrice: +d.lowPrice, volume: +d.volume, quoteVolume: +d.quoteVolume };
}

// OI 未平倉量（合約）
export async function fetchOpenInterest(symbol) {
  try {
    const res = await fetch(`${FAPI}/openInterest?symbol=${symbol}`);
    if (!res.ok) return null;
    const d = await res.json();
    return { oi: +d.openInterest, oiValue: +d.openInterest * (await fetchLastPrice(symbol)) };
  } catch { return null; }
}

// OI 歷史（用於計算變化率）
export async function fetchOIHistory(symbol, period = '1h', limit = 48) {
  try {
    const res = await fetch(`${FAPI}/openInterestHist?symbol=${symbol}&period=${period}&limit=${limit}`);
    if (!res.ok) return [];
    return (await res.json()).map(d => ({ time: Math.floor(d.timestamp / 1000), oi: +d.sumOpenInterest, oiValue: +d.sumOpenInterestValue }));
  } catch { return []; }
}

// 資金費率
export async function fetchFundingRate(symbol) {
  try {
    const res = await fetch(`${FAPI}/fundingRate?symbol=${symbol}&limit=1`);
    if (!res.ok) return null;
    const d = await res.json();
    return d[0] ? { rate: +d[0].fundingRate, time: +d[0].fundingTime } : null;
  } catch { return null; }
}

// 多幣資金費率（用於市場概覽）
export async function fetchAllFundingRates() {
  try {
    const res = await fetch(`${FAPI}/premiumIndex`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.filter(d => d.symbol.endsWith('USDT')).map(d => ({
      symbol: d.symbol, markPrice: +d.markPrice, fundingRate: +d.lastFundingRate,
    }));
  } catch { return []; }
}

// 最新價格
async function fetchLastPrice(symbol) {
  const res = await fetch(`${REST}/ticker/price?symbol=${symbol}`);
  const d = await res.json();
  return +d.price;
}

// 恐懼貪婪指數（Alternative.me 公開 API）
export async function fetchFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=2');
    if (!res.ok) return null;
    const d = await res.json();
    const cur = d.data[0];
    const prev = d.data[1];
    return { value: +cur.value, label: cur.value_classification, prevValue: +prev.value, change: +cur.value - +prev.value };
  } catch { return null; }
}

// 多幣 RSI 用於計算市場平均 RSI 與山寨季
export async function fetchMarketRSI() {
  const alts = ['ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT','AVAXUSDT','DOTUSDT','LINKUSDT','MATICUSDT','UNIUSDT'];
  try {
    const results = await Promise.all(
      [{ sym: 'BTCUSDT', label: 'BTC' }, ...alts.map(s => ({ sym: s, label: s.replace('USDT', '') }))].map(async ({ sym, label }) => {
        const res = await fetch(`${REST}/klines?symbol=${sym}&interval=1d&limit=16`);
        if (!res.ok) return null;
        const candles = await res.json();
        const closes = candles.map(c => +c[4]);
        const rsiVal = calcRSISimple(closes, 14);
        const change30d = closes.length >= 2 ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 : 0;
        return { symbol: label, rsi: rsiVal, change30d };
      })
    );
    const valid = results.filter(Boolean);
    const avgRSI = valid.reduce((s, v) => s + v.rsi, 0) / valid.length;
    const btc = valid.find(v => v.symbol === 'BTC');
    const altsData = valid.filter(v => v.symbol !== 'BTC');
    const altsSeason = btc ? altsData.filter(a => a.change30d > btc.change30d).length / altsData.length * 100 : 50;
    return { avgRSI, altsSeason, coins: valid, btcRSI: btc?.rsi };
  } catch { return null; }
}

function calcRSISimple(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let ag = gains / period, al = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

// WebSocket
export function subscribeKlineStream(symbol, interval, onUpdate) {
  const ws = new WebSocket(`${WS}/${symbol.toLowerCase()}@kline_${interval}`);
  ws.onmessage = e => {
    try {
      const k = JSON.parse(e.data).k;
      onUpdate({ time: Math.floor(k.t / 1000), open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v, takerBuy: +k.Q, isFinal: k.x });
    } catch {}
  };
  return ws;
}

export function subscribeTickerStream(symbol, onUpdate) {
  const ws = new WebSocket(`${WS}/${symbol.toLowerCase()}@ticker`);
  ws.onmessage = e => {
    try {
      const d = JSON.parse(e.data);
      onUpdate({ lastPrice: +d.c, priceChangePercent: +d.P, highPrice: +d.h, lowPrice: +d.l, volume: +d.v });
    } catch {}
  };
  return ws;
}
