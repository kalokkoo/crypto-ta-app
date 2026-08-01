import PredictionPanel from '../components/PredictionPanel';

export default function TrendPredictionPage({ symbolLabel, candles, indicators, signals, oi, fundingRate }) {
  return (
    <div className="full-page pred-page">
      <div className="page-header">
        <div className="page-title">🔮 趨勢預測｜{symbolLabel}</div>
        <div className="page-desc">基於技術指標、K 線形態識別、OI 動向、資金費率進行多維度推演，選擇時間框架後點擊預測。</div>
      </div>
      <PredictionPanel candles={candles} indicators={indicators} signals={signals} oi={oi} fundingRate={fundingRate} symbolLabel={symbolLabel} />
    </div>
  );
}
