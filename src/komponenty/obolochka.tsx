import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useData } from '../api/khranilishche';
import { proveritBroni } from '../api/srokBroni';
import { proveritSroki } from '../api/sroki';
import { Menyu } from './menyu';
import { Ikonka } from './ikonka';
export function Obolochka() {
  const d = useData(), location = useLocation(), me = d.users.find(u => u.id === d.currentUserId);
  const unread = d.notifications.filter(n => !n.read && (!n.userId || n.userId === me?.id)).length;
  useEffect(() => { const check = () => { proveritBroni(); proveritSroki(); }; check(); const timer = window.setInterval(check, 30_000); return () => window.clearInterval(timer); }, []);
  return <div className="app-shell"><Menyu /><div className="main-wrap"><header className="topbar"><Link to="/" className="top-brand">Дом дела <span>· {d.families.find(f => f.id === me?.familyId)?.name}</span></Link><div className="top-actions"><Link to="/uvedomleniya" className="icon-button" aria-label={`Уведомления: ${unread}`}><Ikonka name="bell" />{unread > 0 && <i className="dot" />}</Link><Link to="/profil" className="avatar small" aria-label="Профиль">{me?.avatar}</Link></div></header><main key={location.pathname} className="page-enter"><Outlet /></main></div></div>;
}
