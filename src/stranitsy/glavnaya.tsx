import { Link } from 'react-router-dom';
import { useData } from '../api/khranilishche';
import { sostoyanieSemyi } from '../api/semyaApi';
import { balliUchastnika } from '../util/balli';
import { segodnya, formatVremeni } from '../util/daty';
import { SemeyniyDom } from '../dom/semeyniyDom';
import { KartochkaZadachi } from '../komponenty/kartochkaZadachi';
import { PustoySpisok } from '../komponenty/pustoySpisok';
const moods = ['Хорошо', 'Спокойно', 'Напряжённо', 'Конфликт', 'Тяжело', 'Восстановление'];
export function Glavnaya() {
  const d = useData(), me = d.users.find(u => u.id === d.currentUserId)!, family = d.families.find(f => f.id === me.familyId)!;
  const familyTasks = d.tasks.filter(t => t.familyId === me.familyId), today = familyTasks.filter(t => t.date === segodnya() && t.status !== 'archived');
  const done = familyTasks.filter(t => t.status === 'done');
  const nearest = familyTasks.filter(t => !['done', 'archived'].includes(t.status)).sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  return <><div className="home-intro"><div><p className="eyebrow">Хорошего дня в вашем доме</p><h1>Привет, {me.name} <span className="wave">✳</span></h1><p className="muted">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>{me.role === 'adult' && <Link className="button" to="/zadachi/novaya">+ Добавить задачу</Link>}</div><div className="home-grid"><section className="house-panel"><SemeyniyDom mood={family.mood} progress={done.length} /></section><div className="home-side"><section className="panel summary"><div className="section-title"><h2>Сегодня</h2><Link to="/zadachi">Все дела →</Link></div><div className="metrics"><div><strong>{today.length}</strong><span>задачи</span></div><div><strong>{done.length}</strong><span>выполнено</span></div><div><strong>{balliUchastnika(familyTasks, me.id)}</strong><span>моих баллов</span></div></div>{nearest && <p className="deadline">Ближайший срок: <b>{nearest.title}</b> · {formatVremeni(nearest.deadline)}</p>}</section><section className="panel mood-panel"><div className="section-title"><h2>Состояние семьи</h2><span>по вашему выбору</span></div><p className="muted">Влияет только на вид семейного мира.</p><select aria-label="Состояние семьи" value={family.mood} onChange={e => sostoyanieSemyi(e.target.value)}>{moods.map(m => <option key={m}>{m}</option>)}</select></section><Link className="panel stats-link" to="/statistika"><span>Посмотреть статистику</span><strong>→</strong></Link></div></div><section className="today-section"><div className="section-title"><h2>Дела на сегодня</h2><Link to="/zadachi">Открыть задачи →</Link></div><div className="tasks-grid">{today.length ? today.slice(0, 3).map(t => <KartochkaZadachi key={t.id} task={t} users={d.users} me={me} compact />) : <PustoySpisok text="На сегодня дел нет. Можно отдохнуть." />}</div></section></>;
}
