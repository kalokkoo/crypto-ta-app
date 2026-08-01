import CVDQuadrant from '../components/CVDQuadrant';

export default function CVDQuadrantPage() {
  return (
    <div className="full-page">
      <div className="page-header">
        <div className="page-title">📊 CVD 四象限篩選器</div>
        <div className="page-desc">X 軸為 CVD 能量差變化，Y 軸為價格變化。Q1（右上）多頭建倉，Q3（左下）空頭建倉，每分鐘自動更新。</div>
      </div>
      <CVDQuadrant />
    </div>
  );
}
