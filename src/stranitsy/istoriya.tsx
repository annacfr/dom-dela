import { useData } from '../api/khranilishche';
import { arhivIstorii } from '../api/obshchieApi';
import { Zagolovok } from '../komponenty/zagolovok';
import { PustoySpisok } from '../komponenty/pustoySpisok';
export function Istoriya() {
  const d = useData(), me = d.users.find(u => u.id === d.currentUserId)!, records = d.history.filter(h => h.familyId === me.familyId && !h.archived);
  return <><Zagolovok title="История дел" subtitle="Записи сохраняются. Старые события можно убрать в архив." /><div className="activity-list">{records.length ? records.map(h => <article className="activity" key={h.id}><span className="activity-mark">◷</span><div><p>{h.text}</p><small>{new Date(h.at).toLocaleString('ru-RU')}</small></div><button className="text-button" onClick={() => arhivIstorii(h.id)}>В архив</button></article>) : <PustoySpisok text="Пока событий нет." />}</div></>;
}
