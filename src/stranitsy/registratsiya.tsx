import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registratsiya } from '../api/uchetnyeZapisi';
import type { Rol } from '../tipy/tipy';
import { cloudReady } from '../api/supabase';
export function Registratsiya() {
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [role, setRole] = useState<Rol>('adult'), [message, setMessage] = useState('');
  return <div className="auth-layout"><div className="auth-art"><div className="auth-logo">⌂</div><h1>Начнём вместе</h1><p>Семейные дела становятся легче, когда всё на виду.</p></div><div className="auth-card"><p className="eyebrow">Новый участник</p><h2>Регистрация</h2><form onSubmit={async e => { e.preventDefault(); setMessage(await registratsiya(name, password, role, email)); }}><label>Имя<input value={name} onChange={e => setName(e.target.value)} minLength={2} required autoComplete="name" /></label>{cloudReady && <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>}<label>Пароль<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" /></label><label>Роль<select value={role} onChange={e => setRole(e.target.value as Rol)}><option value="adult">Взрослый</option><option value="child">Ребёнок</option></select></label>{message && <p className="notice" role="status">{message}</p>}<button className="button full">Создать аккаунт</button></form><p>Уже есть аккаунт? <Link to="/vhod">Войти</Link></p><small className="muted">{cloudReady ? 'Облачный аккаунт: после регистрации может потребоваться подтвердить email.' : 'Локальный демо-режим.'}</small></div></div>;
}
