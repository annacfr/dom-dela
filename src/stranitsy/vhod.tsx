import { useState } from 'react';
import { Link } from 'react-router-dom';
import { vhod, vhodDemo } from '../api/uchetnyeZapisi';
import { useData } from '../api/khranilishche';
import { serverConfigured } from '../api/server';
export function Vhod() {
  const d = useData(), [name, setName] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState('');
  return <div className="auth-layout"><div className="auth-art"><div className="auth-logo">⌂</div><h1>Дом дела</h1><p>Маленький общий мир для больших и маленьких домашних дел.</p></div><div className="auth-card"><p className="eyebrow">Рады видеть вас дома</p><h2>Войти</h2><form onSubmit={async e => { e.preventDefault(); setError(await vhod(name, password)); }}><label>Имя<input value={name} onChange={e => setName(e.target.value)} required autoComplete="username" /></label><label>Пароль<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>{error && <p className="error" role="alert">{error}</p>}<button className="button full">Войти</button></form><p>Нет аккаунта? <Link to="/registratsiya">Зарегистрироваться</Link></p>{!serverConfigured && <div className="demo-box"><strong>Попробовать демо</strong><p>Выберите участника семьи Соколовых. Данные сохранятся в этом браузере.</p><div className="demo-users">{d.users.filter(u => u.familyId === 'dom' && !u.hash).map(u => <button key={u.id} onClick={() => vhodDemo(u.id)} className="demo-person"><span className="avatar small">{u.avatar}</span><span>{u.name}</span><small>{u.role === 'adult' ? 'Взрослый' : 'Ребёнок'}</small></button>)}</div></div>}{serverConfigured && <small className="muted">Аккаунты и семейные данные хранятся на сервере.</small>}</div></div>;
}
