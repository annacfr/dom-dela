import { useData } from '../api/khranilishche';
import { prochitat } from '../api/obshchieApi';
import { Zagolovok } from '../komponenty/zagolovok';
import { PustoySpisok } from '../komponenty/pustoySpisok';
export function Uvedomleniya() {
  const d = useData(), me = d.users.find(u => u.id === d.currentUserId)!, notes = d.notifications.filter(n => n.familyId === me.familyId && (!n.userId || n.userId === me.id) && (d.settings.reminders || n.type !== 'deadline'));
  return <><Zagolovok title="Уведомления" subtitle="Важное внутри семейного дома." /><div className="list-heading"><h2>{notes.filter(n => !n.read).length} новых</h2>{notes.some(n => !n.read) && <button className="text-button" onClick={prochitat}>Отметить прочитанными</button>}</div><div className="activity-list">{notes.length ? notes.map(n => <article className={`activity ${!n.read ? 'unread' : ''}`} key={n.id}><span className="activity-mark">✦</span><div><p>{n.text}</p><small>{new Date(n.at).toLocaleString('ru-RU')}</small></div></article>) : <PustoySpisok text="Пока уведомлений нет." />}</div></>;
}
