const REST_BASE = 'https://api.binance.com/api/v3';
const WS_BASE = 'wss://stream.binance.com:9443/ws';

export const SYMBOLS = [
  // 主流大幣
  { value: 'BTCUSDT', label: 'BTC/USDT', name: 'Bitcoin', category: '主流' },
  { value: 'ETHUSDT', label: 'ETH/USDT', name: 'Ethereum', category: '主流' },
  { value: 'BNBUSDT', label: 'BNB/USDT', name: 'BNB', category: '主流' },
  { value: 'SOLUSDT', label: 'SOL/USDT', name: 'Solana', category: '主流' },
  { value: 'XRPUSDT', label: 'XRP/USDT', name: 'XRP', category: '主流' },
  // 熱門 Layer1/Layer2
  { value: 'ADAUSDT', label: 'ADA/USDT', name: 'Cardano', category: 'L1/L2' },
  { value: 'AVAXUSDT', label: 'AVAX/USDT', name: 'Avalanche', category: 'L1/L2' },
  { value: 'DOTUSDT', label: 'DOT/USDT', name: 'Polkadot', category: 'L1/L2' },
  { value: 'MATICUSDT', label: 'MATIC/USDT', name: 'Polygon', category: 'L1/L2' },
  { value: 'LINKUSDT', label: 'LINK/USDT', name: 'Chainlink', category: 'L1/L2' },
  { value: 'SUIUSDT', label: 'SUI/USDT', name: 'Sui', category: 'L1/L2' },
  { value: 'APTUSDT', label: 'APT/USDT', name: 'Aptos', category: 'L1/L2' },
  // Meme 幣
  { value: 'DOGEUSDT', label: 'DOGE/USDT', name: 'Dogecoin', category: 'Meme' },
  { value: 'SHIBUSDT', label: 'SHIB/USDT', name: 'Shiba Inu', category: 'Meme' },
  { value: 'PEPEUSDT', label: 'PEPE/USDT', name: 'Pepe', category: 'Meme' },
  // DeFi / 其他
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

export async function fetchKlines(symbol, interval, limit = 200) {
  const url = `${REST_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API 錯誤: ${res.status}`);
  const raw = await res.json();
  return raw.map((k) => ({
    time: Math.floor(k[0] / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

export async function fetch24hrStats(symbol) {
  const url = `${REST_BASE}/ticker/24hr?symbol=${symbol}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API 錯誤: ${res.status}`);
  const data = await res.json();
  return {
    lastPrice: parseFloat(data.lastPrice),
    priceChangePercent: parseFloat(data.priceChangePercent),
    highPrice: parseFloat(data.highPrice),
    lowPrice: parseFloat(data.lowPrice),
    volume: parseFloat(data.volume),
    quoteVolume: parseFloat(data.quoteVolume),
  };
}

export function subscribeKlineStream(symbol, interval, onUpdate) {
  const ws = new WebSocket(`${WS_BASE}/${symbol.toLowerCase()}@kline_${interval}`);
  ws.onmessage = (event) => {
    try {
      const k = JSON.parse(event.data).k;
      onUpdate({ time: Math.floor(k.t / 1000), open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c), volume: parseFloat(k.v), isFinal: k.x });
    } catch (e) { console.error(e); }
  };
  return ws;
}

export function subscribeTickerStream(symbol, onUpdate) {
  const ws = new WebSocket(`${WS_BASE}/${symbol.toLowerCase()}@ticker`);
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onUpdate({ lastPrice: parseFloat(msg.c), priceChangePercent: parseFloat(msg.P), highPrice: parseFloat(msg.h), lowPrice: parseFloat(msg.l), volume: parseFloat(msg.v) });
    } catch (e) { console.error(e); }
  };
  return ws;
}
