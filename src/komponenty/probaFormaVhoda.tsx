import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vhod } from '../api/uchetnyeZapisi';
import { cloudReady } from '../api/supabase';
export function ProbaFormaVhoda() {
  const navigate = useNavigate();
  const [name, setName] = useState(''), [password, setPassword] = useState('');
  const [shown, setShown] = useState(false), [error, setError] = useState(''), [pending, setPending] = useState(false);
  return <form className="pv-form" onSubmit={async event => {
    event.preventDefault(); setPending(true);
    const result = await vhod(name, password); setError(result); setPending(false);
    if (!result) navigate('/');
  }}>
    <label htmlFor="pv-email">{cloudReady ? 'Электронная почта' : 'Имя'}</label>
    <input id="pv-email" type={cloudReady ? 'email' : 'text'} value={name} onChange={event => setName(event.target.value)}
      autoComplete="username" placeholder={cloudReady ? 'you@example.com' : 'Ваше имя'} required />
    <label htmlFor="pv-password">Пароль</label>
    <div className="pv-password"><input id="pv-password" type={shown ? 'text' : 'password'} value={password}
      onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Ваш пароль" required />
      <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? 'Скрыть пароль' : 'Показать пароль'}>
        {shown ? 'Скрыть' : 'Показать'}</button></div>
    {error && <p className="pv-error" role="alert">{error}</p>}
    <button className="pv-submit" disabled={pending}>{pending ? 'Входим…' : 'Войти'}<span aria-hidden="true">→</span></button>
    <p className="pv-register">Впервые здесь? <Link to="/registratsiya">Создать аккаунт</Link></p>
  </form>;
}
