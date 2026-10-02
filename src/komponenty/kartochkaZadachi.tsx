import { Link } from 'react-router-dom';
import type { Zadacha, Chelovek } from '../tipy/tipy';
import { balliZaZadachu } from '../util/balli';
import { formatDaty } from '../util/daty';
import { bronirovat, nachat, zavershit } from '../api/zadachiApi';
import { OtschetBroni } from './otschetBroni';
const znak: Record<string, string> = { Уборка: '✦', Дом: '⌂', Растения: '❀', Кухня: '◒', Другое: '·' };
export function KartochkaZadachi({ task, users, me, compact = false }: { task: Zadacha; users: Chelovek[]; me: Chelovek; compact?: boolean }) {
  const names = task.assignees === 'open' ? 'Кто первый' : task.assignees === 'all' ? 'Вся семья' : task.assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ');
  const mine = task.assignees === 'all' || task.assignees === 'open' || task.assignees.includes(me.id) || task.reservedBy === me.id;
  return <article className={`task-card ${task.status === 'done' ? 'completed' : ''}`}><div className="task-icon" aria-hidden="true">{znak[task.category] || '✦'}</div><div className="task-body"><div className="task-top"><h3>{task.title}</h3><strong>+{balliZaZadachu(task)}</strong></div><p>{task.category} · {names}</p>{!compact && <div className="task-meta"><span>{formatDaty(task.date)} · {task.time}</span><span>{task.priority}</span>{task.urgent && <span>Срочно</span>}<span>{task.status === 'done' ? 'Выполнено' : task.status === 'doing' ? 'В работе' : task.status === 'reserved' && task.reservedUntil ? <OtschetBroni until={task.reservedUntil} /> : 'Ожидает'}</span></div>}{!compact && <div className="task-actions"><Link to={`/zadachi/${task.id}/pravka`} className="text-button">Подробнее</Link>{mine && task.status === 'active' && task.assignees === 'open' && <button className="small-button" onClick={() => bronirovat(task.id)}>Я сделаю</button>}{mine && (task.status === 'active' && task.assignees !== 'open' || task.status === 'reserved' && task.reservedBy === me.id) && <button className="small-button" onClick={() => nachat(task.id)}>Начать</button>}{task.status === 'doing' && task.reservedBy === me.id && <button className="small-button" onClick={() => zavershit(task.id)}>Завершить</button>}</div>}</div></article>;
}
