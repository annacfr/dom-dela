import { Link } from 'react-router-dom';
export function Zagolovok({ title, subtitle, action, to }: { title: string; subtitle?: string; action?: string; to?: string }) { return <div className="page-heading"><div><p className="eyebrow">Дом дела</p><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div>{action && to && <Link className="button" to={to}>{action}</Link>}</div>; }
