import type { Rol } from '../tipy/tipy';
import { getData, setData, setStatus } from './khranilishche';
import { id } from '../util/daty';
import { supabase } from './supabase';
import { deystvie, vOblake } from './oblachnyeDeystviya';
import { leaveCloud } from './khranilishche';
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(n => n.toString(16).padStart(2, '0')).join('');
export const vhodDemo = async (userId: string) => { if (vOblake()) { const { error } = await supabase!.auth.signOut(); if (error) { setStatus({ error: error.message }); return; } leaveCloud(); } setData(d => ({ ...d, currentUserId: d.users.some(u => u.id === userId && !u.hash && u.familyId === 'dom') ? userId : d.currentUserId })); };
export const vyhod = async () => { if (vOblake()) { const { error } = await supabase!.auth.signOut(); if (error) setStatus({ error: error.message }); } else setData(d => ({ ...d, currentUserId: undefined })); };
export const registratsiya = async (name: string, password: string, role: Rol, email = '') => {
  if (name.trim().length < 2 || password.length < 8) return 'Имя — от 2 символов, пароль — от 8.';
  if (supabase) {
    if (!email.includes('@')) return 'Укажите электронную почту.';
    try { const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim(), role }, emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` } });
      return error?.message || (!data.session ? 'Проверьте почту и подтвердите регистрацию, затем войдите.' : ''); }
    catch { return 'Нет соединения с Supabase. Попробуйте позже.'; }
  }
  if (getData().users.some(u => u.name.toLowerCase() === name.trim().toLowerCase())) return 'Такое имя уже занято.';
  const user = { id: id(), name: name.trim(), role, avatar: name.trim()[0].toUpperCase(), hash: await hash(password) };
  setData(d => ({ ...d, users: [...d.users, user], currentUserId: user.id })); return '';
};
export const vhod = async (name: string, password: string) => {
  if (supabase && name.includes('@')) { try { const { error } = await supabase.auth.signInWithPassword({ email: name.trim(), password }); return error?.message || ''; } catch { return 'Нет соединения с Supabase. Попробуйте позже.'; } }
  const user = getData().users.find(u => u.name.toLowerCase() === name.trim().toLowerCase());
  if (!user?.hash || user.hash !== await hash(password)) return 'Неверное имя или пароль.';
  setData(d => ({ ...d, currentUserId: user.id })); return '';
};
export const profilObnovit = async (name: string, avatar: string) => {
  const userId = getData().currentUserId; if (!userId || name.trim().length < 2) return false;
  if (vOblake()) return deystvie('profile', { name: name.trim(), avatar: avatar.trim().slice(0, 2) || name.trim()[0] });
  setData(d => ({ ...d, users: d.users.map(u => u.id === userId ? { ...u, name: name.trim(), avatar: avatar.trim().slice(0, 2) || name.trim()[0] } : u) })); return true;
};
