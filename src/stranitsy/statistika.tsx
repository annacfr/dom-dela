import { useState } from 'react';
import { useData } from '../api/khranilishche';
import { Zagolovok } from '../komponenty/zagolovok';
import { Polosy } from '../komponenty/polosy';
import { zaPeriod, itogi, categories } from '../util/statistika';
import { balliZaZadachu } from '../util/balli';
import { tekushchiySrok } from '../util/daty';
export function Statistika() {
  const d = useData(), me = d.users.find(u => u.id === d.currentUserId)!, members = d.users.filter(u => u.familyId === me.familyId), [period, setPeriod] = useState('Неделя');
  const tasks = zaPeriod(d.tasks.filter(t => t.familyId === me.familyId), period), history = d.history.filter(h => h.familyId === me.familyId && (period === 'Всё время' || Date.now() - new Date(h.at).getTime() < (period === 'Неделя' ? 7 : 30) * 86_400_000));
  const total = itogi(tasks, history), openOverdue = d.tasks.filter(t => t.familyId === me.familyId && !['done', 'archived'].includes(t.status) && t.deadline < tekushchiySrok()).length;
  return <><Zagolovok title="Статистика" subtitle="Только факты о делах. Без оценок людей." /><div className="tabs period-tabs">{['Неделя', 'Месяц', 'Всё время'].map(x => <button key={x} className={period === x ? 'selected' : ''} onClick={() => setPeriod(x)}>{x}</button>)}</div><div className="stat-grid"><div className="stat-tile"><strong>{total.count}</strong><span>выполнено дел</span></div><div className="stat-tile"><strong>{total.points}</strong><span>баллов набрано</span></div><div className="stat-tile"><strong>{total.minutes} мин</strong><span>среднее время</span></div><div className="stat-tile"><strong>{openOverdue + total.overdue}</strong><span>просроченных задач</span></div><div className="stat-tile"><strong>{total.failed}</strong><span>истёкших резервов</span></div></div><div className="stats-panels"><section className="panel"><h2>По категориям</h2>{tasks.length ? <Polosy rows={categories(tasks).map(([name, value]) => ({ name, value }))} /> : <p className="muted">Пока нет выполненных дел за период.</p>}</section><section className="panel"><h2>Баланс нагрузки</h2><p className="muted">Количество дел, баллы и категории по участникам.</p>{members.map(u => { const own = tasks.filter(t => t.completedBy === u.id); return <div className="member-load" key={u.id}><div className="person-line"><span className="avatar small">{u.avatar}</span><strong>{u.name}</strong><span>{own.length} дел · {own.reduce((n, t) => n + balliZaZadachu(t), 0)} баллов</span></div><Polosy rows={categories(own).map(([name, value]) => ({ name, value }))} /></div>; })}</section></div></>;
}
