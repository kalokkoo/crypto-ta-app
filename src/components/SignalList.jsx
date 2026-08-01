export default function SignalList({ signals }) {
  if (!signals?.length) return <div className="placeholder-text">指標計算中...</div>;
  return (
    <div className="signal-list">
      {signals.map(s => (
        <div key={s.name} className="signal-row">
          <span className="signal-name">{s.name}</span>
          <span className={`signal-tag tag-${s.type}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
