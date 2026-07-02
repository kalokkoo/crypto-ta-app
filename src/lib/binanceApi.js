// Binance 公開行情 API（無需 API 金鑰）
const REST_BASE = 'https://api.binance.com/api/v3';
const WS_BASE = 'wss://stream.binance.com:9443/ws';

export const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT', name: 'Bitcoin' },
  { value: 'ETHUSDT', label: 'ETH/USDT', name: 'Ethereum' },
  { value: 'SOLUSDT', label: 'SOL/USDT', name: 'Solana' },
  { value: 'BNBUSDT', label: 'BNB/USDT', name: 'BNB' },
  { value: 'XRPUSDT', label: 'XRP/USDT', name: 'XRP' },
  { value: 'DOGEUSDT', label: 'DOGE/USDT', name: 'Dogecoin' },
];

export const TIMEFRAMES = [
  { value: '15m', label: '15分' },
  { value: '1h', label: '1小時' },
  { value: '4h', label: '4小時' },
  { value: '1d', label: '日線' },
  { value: '1w', label: '週線' },
];

// 取得歷史 K 線資料
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

// 取得 24 小時統計資料（價格變動、漲跌幅等）
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

// 建立 WebSocket 連線以接收即時 K 線更新
export function subscribeKlineStream(symbol, interval, onUpdate) {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  const ws = new WebSocket(`${WS_BASE}/${stream}`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const k = msg.k;
      onUpdate({
        time: Math.floor(k.t / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
        isFinal: k.x,
      });
    } catch (e) {
      console.error('WebSocket 解析錯誤', e);
    }
  };

  return ws;
}

// 建立 WebSocket 連線以接收即時成交價格 (ticker)
export function subscribeTickerStream(symbol, onUpdate) {
  const stream = `${symbol.toLowerCase()}@ticker`;
  const ws = new WebSocket(`${WS_BASE}/${stream}`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onUpdate({
        lastPrice: parseFloat(msg.c),
        priceChangePercent: parseFloat(msg.P),
        highPrice: parseFloat(msg.h),
        lowPrice: parseFloat(msg.l),
        volume: parseFloat(msg.v),
      });
    } catch (e) {
      console.error('WebSocket 解析錯誤', e);
    }
  };

  return ws;
}
