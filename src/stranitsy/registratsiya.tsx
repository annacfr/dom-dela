import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registratsiya } from '../api/uchetnyeZapisi';
import { cloudReady } from '../api/supabase';
import { ProbaZnak } from '../komponenty/probaZnak';
import type { Rol } from '../tipy/tipy';
export function Registratsiya() {
  const [name, setName] = useState(''), [email, setEmail] = useState('');
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<Rol>('adult'), [message, setMessage] = useState(''), [pending, setPending] = useState(false);
  return <div className="pv-page"><div className="pv-scenery" aria-hidden="true" />
    <main className="pv-shell pv-register-shell"><div className="pv-brand"><span className="pv-kicker">Начнём вместе</span>
      <ProbaZnak /><h1>Дом дела</h1><p>Место, где каждый вклад важен.</p></div>
      <section className="pv-panel pv-register-panel"><span className="pv-overline">Новый участник</span>
        <h2>Создать аккаунт</h2><p className="pv-intro">Пара шагов — и вы дома.</p>
        <form className="pv-form" onSubmit={async event => {
          event.preventDefault(); if (password !== confirm) { setMessage('Пароли не совпадают.'); return; }
          setPending(true); setMessage(await registratsiya(name, password, role, email)); setPending(false);
        }}>
          <label htmlFor="rg-name">Имя</label><input id="rg-name" value={name} onChange={e => setName(e.target.value)} minLength={2} autoComplete="name" required />
          {cloudReady && <><label htmlFor="rg-email">Электронная почта</label><input id="rg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></>}
          <label htmlFor="rg-password">Пароль</label><input id="rg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
          <label htmlFor="rg-confirm">Подтвердить пароль</label><input id="rg-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={8} autoComplete="new-password" required />
          <fieldset className="pv-role"><legend>Роль в семье</legend>{(['adult', 'child'] as Rol[]).map(value => <label key={value} className={role === value ? 'active' : ''}>
            <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} />{value === 'adult' ? 'Взрослый' : 'Ребёнок'}
          </label>)}</fieldset>
          {message && <p className="pv-error" role="status">{message}</p>}
          <button className="pv-submit" disabled={pending}>{pending ? 'Создаём…' : 'Зарегистрироваться'} <span aria-hidden="true">→</span></button>
        </form><p className="pv-register">Уже есть аккаунт? <Link to="/vhod">Войти</Link></p>
      </section></main>
  </div>;
}
