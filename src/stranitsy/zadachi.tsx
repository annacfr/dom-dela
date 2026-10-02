import { useState } from 'react';
import { useData } from '../api/khranilishche';
import { segodnya, tekushchiySrok } from '../util/daty';
import { Zagolovok } from '../komponenty/zagolovok';
import { KartochkaZadachi } from '../komponenty/kartochkaZadachi';
import { PustoySpisok } from '../komponenty/pustoySpisok';
const tabs = ['Все', 'Сегодня', 'Будущие', 'Открытые', 'Просроченные', 'Выполненные'];
export function Zadachi() {
  const d = useData(), me = d.users.find(u => u.id === d.currentUserId)!, [tab, setTab] = useState('Сегодня'), [member, setMember] = useState('all');
  const today = segodnya();
  const tasks = d.tasks.filter(t => t.familyId === me.familyId && t.status !== 'archived' && (member === 'all' || t.assignees === 'all' || t.assignees === 'open' || t.assignees.includes(member)) && (
    tab === 'Все' || tab === 'Сегодня' && t.date === today || tab === 'Будущие' && t.date > today && t.status !== 'done' || tab === 'Открытые' && t.assignees === 'open' && t.status !== 'done' || tab === 'Просроченные' && t.deadline < tekushchiySrok() && !['done', 'archived'].includes(t.status) || tab === 'Выполненные' && t.status === 'done'
  )).sort((a, b) => a.date.localeCompare(b.date));
  return <><Zagolovok title="Семейные задачи" subtitle="Кто что делает дома — спокойно и по делу." action={me.role === 'adult' ? '+ Новая задача' : undefined} to="/zadachi/novaya" /><div className="filter-row"><div className="tabs" role="group" aria-label="Фильтр задач">{tabs.map(x => <button key={x} className={tab === x ? 'selected' : ''} onClick={() => setTab(x)}>{x}</button>)}</div><select aria-label="Участник" value={member} onChange={e => setMember(e.target.value)}><option value="all">Все участники</option>{d.users.filter(u => u.familyId === me.familyId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div><div className="list-heading"><h2>{tab}</h2><span>{tasks.length} дел</span></div><div className="tasks-list">{tasks.length ? tasks.map(t => <KartochkaZadachi key={t.id} task={t} users={d.users} me={me} />) : <PustoySpisok text="Здесь пока нет задач." />}</div></>;
}
