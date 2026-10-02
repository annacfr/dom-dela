import { getData, setData } from './khranilishche';
import { history, notify } from './zapisi';
export const proveritBroni = () => {
  const d = getData(), familyId = d.users.find(u => u.id === d.currentUserId)?.familyId;
  const expired = d.tasks.filter(t => t.familyId === familyId && t.status === 'reserved' && t.reservedUntil && new Date(t.reservedUntil).getTime() <= Date.now());
  if (!expired.length) return;
  setData(d => ({ ...d, tasks: d.tasks.map(t => expired.some(e => e.id === t.id) ? { ...t, status: 'active', reservedBy: undefined, reservedUntil: undefined } : t), history: expired.reduce((all, t) => history({ ...d, history: all }, 'reservation_expired', `Резерв задачи «${t.title}» истёк`), d.history), notifications: expired.reduce((all, t) => notify({ ...d, notifications: all }, 'released', `Открыта задача: ${t.title}`), d.notifications) }));
};
