export function Polosy({ rows }: { rows: { name: string; value: number; detail?: string }[] }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return <div className="bars">{rows.map(r => <div className="bar-row" key={r.name}><div className="bar-label"><span>{r.name}</span><span>{r.detail || r.value}</span></div><div className="bar-track"><div style={{ width: `${r.value / max * 100}%` }} /></div></div>)}</div>;
}
