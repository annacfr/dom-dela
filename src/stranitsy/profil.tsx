import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../api/khranilishche';
import { nastroika } from '../api/obshchieApi';
import { profilObnovit, vyhod } from '../api/uchetnyeZapisi';
import { balliUchastnika } from '../util/balli';
import { dostizheniya } from '../util/dostizheniya';
import { Zagolovok } from '../komponenty/zagolovok';
export function Profil() {
  const d = useData(), me = d.users.find(u => u.id === d.currentUserId)!, family = d.families.find(f => f.id === me.familyId);
  const [name, setName] = useState(me.name), [avatar, setAvatar] = useState(me.avatar), [message, setMessage] = useState('');
  const done = d.tasks.filter(t => t.familyId === me.familyId && t.status === 'done' && t.completedBy === me.id), badges = dostizheniya(d.tasks.filter(t => t.familyId === me.familyId), me.id);
  return <><Zagolovok title="Мой профиль" subtitle="Ваше место в семейном доме." /><div className="profile-grid"><section className="panel profile-card"><div className="avatar large">{me.avatar}</div><h2>{me.name}</h2><p className="muted">{me.role === 'adult' ? 'Взрослый' : 'Ребёнок'} · {family?.name}</p><div className="metrics"><div><strong>{balliUchastnika(d.tasks, me.id)}</strong><span>баллов</span></div><div><strong>{done.length}</strong><span>дел выполнено</span></div></div><div className="profile-links"><Link to="/semya">Моя семья →</Link><Link to="/statistika">Статистика →</Link><Link to="/istoriya">История дел →</Link></div></section><div className="profile-side"><section className="panel"><h2>Достижения</h2><div className="badges">{badges.map(b => <div key={b.title} className={`badge ${b.active ? 'earned' : ''}`}><span>✦</span><small>{b.title}</small></div>)}</div></section><section className="panel"><h2>Мои данные</h2><form onSubmit={async e => { e.preventDefault(); setMessage(await profilObnovit(name, avatar) ? 'Данные сохранены.' : 'Не удалось сохранить имя.'); }}><label>Имя<input value={name} onChange={e => setName(e.target.value)} required minLength={2} /></label><label>Аватар (1–2 символа)<input value={avatar} onChange={e => setAvatar(e.target.value)} maxLength={2} required /></label><button className="button">Сохранить</button>{message && <p className="notice" role="status">{message}</p>}</form></section><section className="panel"><h2>Настройки</h2><label className="check-label"><input type="checkbox" checked={d.settings.reminders} onChange={e => nastroika(e.target.checked)} /> Показывать внутренние напоминания</label><button className="text-button" onClick={vyhod}>Выйти из профиля</button></section></div></div></>;
}
