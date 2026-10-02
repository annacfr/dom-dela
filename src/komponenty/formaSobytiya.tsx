import { useState } from 'react';
import { dobavitSobytie } from '../api/obshchieApi';
import { segodnya } from '../util/daty';
import type { Chelovek } from '../tipy/tipy';
export function FormaSobytiya({ members, onClose }: { members: Chelovek[]; onClose: () => void }) {
  const [date, setDate] = useState(segodnya());
  return <form className="panel event-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); dobavitSobytie({ title: String(f.get('title')).trim(), date, time: String(f.get('time')), type: String(f.get('type')), memberId: String(f.get('memberId')) || undefined }); onClose(); }}><div className="section-title"><h2>Новое событие</h2><button type="button" className="text-button" onClick={onClose}>Закрыть</button></div><div className="form-grid"><label className="wide">Название<input name="title" required minLength={2} maxLength={100} /></label><label>Дата<input type="date" value={date} onChange={e => setDate(e.target.value)} required /></label><label>Время<input name="time" type="time" defaultValue="18:00" required /></label><label>Тип<select name="type">{['День рождения', 'Встреча', 'Прогулка', 'Поездка', 'Другое'].map(x => <option key={x}>{x}</option>)}</select></label><label>Участник<select name="memberId"><option value="">Вся семья</option>{members.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label></div><button className="button">Добавить в календарь</button></form>;
}
