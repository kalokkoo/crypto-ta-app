# CryptoTA Pro — 幣圈技術分析系統

即時加密貨幣技術分析系統，串接 Binance 公開行情 API，整合多項技術指標並提供 AI 深度分析。

## 功能特色

- **即時行情**：透過 Binance WebSocket 串接 K 線與成交價格，無需 API 金鑰
- **多幣種 / 多週期**：BTC、ETH、SOL、BNB、XRP、DOGE，支援 15分 / 1H / 4H / 日線 / 週線
- **技術指標**：MA20/MA50、RSI(14)、MACD(12,26,9)、布林帶、KDJ、ATR(14)
- **自動訊號判讀**：根據指標自動產生多空訊號與力道評分
- **支撐壓力位估算**：基於布林帶與近期高低點
- **AI 深度分析**：呼叫 Claude API，產生完整技術分析報告（趨勢、支撐壓力、動能、操作建議）
- **金鑰安全**：AI 金鑰存放在後端（Vercel Serverless Function），不會暴露給瀏覽器

---

## 上線教學（從零到有一個網址，約 15 分鐘）

### 你需要準備

- 一個 GitHub 帳號
- 一個 Vercel 帳號（用 GitHub 登入即可，免費）
- 一組 Anthropic API 金鑰（至 console.anthropic.com/settings/keys 申請）

### 步驟 1：把專案放上 GitHub

1. 到 [github.com](https://github.com)，右上角 `+` → `New repository`
2. 取個名字，例如 `crypto-ta-app`，設定 Public 或 Private 都可以，按 `Create repository`
3. 在你電腦上打開終端機，進入解壓縮後的 `crypto-ta-app` 資料夾，依序執行：

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的帳號/crypto-ta-app.git
git push -u origin main
```

（把 `你的帳號` 換成你自己的 GitHub 帳號名稱）

### 步驟 2：在 Vercel 匯入專案

1. 到 [vercel.com](https://vercel.com)，用 GitHub 帳號登入
2. 點 `Add New` → `Project`
3. 找到剛剛建立的 `crypto-ta-app` repository，點 `Import`
4. Framework Preset 會自動偵測為 `Vite`，不用改任何設定

### 步驟 3：設定 API 金鑰（重要）

在匯入畫面（或之後 Project Settings → Environment Variables）中：

1. 找到 `Environment Variables` 區塊
2. Name 填：`ANTHROPIC_API_KEY`
3. Value 填：你的 Anthropic API 金鑰（`sk-ant-...` 開頭）
4. 按 `Add`，然後繼續 `Deploy`

### 步驟 4：等待部署完成

大約 1 分鐘後，Vercel 會給你一個網址，例如：
`https://crypto-ta-app-xxxx.vercel.app`

打開它，整個系統就上線了，任何人都可以透過這個網址使用，AI 分析功能也會正常運作，而且金鑰完全不會外洩。

### 之後要更新內容怎麼辦？

只要在本機修改程式碼後，執行：

```bash
git add .
git commit -m "說明這次改了什麼"
git push
```

Vercel 會自動偵測並重新部署，幾十秒後新版本就上線了。

---

## 本機開發（測試用）

```bash
npm install
npm run dev
```

開啟 http://localhost:5173

> 注意：本機開發環境下 `npm run dev` **不會**啟動 `/api/analyze` 這個後端函式（那是 Vercel 的功能），所以本機測試 AI 分析功能會失敗。如果想在本機也測試，需要安裝 Vercel CLI：`npm i -g vercel`，然後用 `vercel dev` 啟動，並在專案根目錄建立 `.env` 檔案填入 `ANTHROPIC_API_KEY=你的金鑰`。

## 技術棧

- React 19 + Vite
- [lightweight-charts](https://github.com/tradingview/lightweight-charts)（TradingView 開源圖表庫）
- Binance 公開 REST API + WebSocket Streams
- Vercel Serverless Function（保護 AI 金鑰）

## 免責聲明

本系統僅供技術面參考，不構成投資建議。加密貨幣市場波動劇烈，請謹慎評估風險，自行承擔投資決策。
