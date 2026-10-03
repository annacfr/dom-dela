import type { Rol } from '../tipy/tipy';
import { getData, setData } from './khranilishche';
import { id } from '../util/daty';
import { api, refreshServerData, reportServerError, serverConfigured } from './server';
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(n => n.toString(16).padStart(2, '0')).join('');
export const vhodDemo = (userId: string) => { if (serverConfigured) return; setData(d => ({ ...d, currentUserId: d.users.some(u => u.id === userId && !u.hash && u.familyId === 'dom') ? userId : d.currentUserId })); };
export const vyhod = () => {
  if (serverConfigured) { void api('/api/logout', { method: 'POST' }).catch(reportServerError).finally(() => setData(() => ({ users: [], families: [], tasks: [], events: [], messages: [], history: [], notifications: [], requests: [], settings: { reminders: true } }))); return; }
  setData(d => ({ ...d, currentUserId: undefined }));
};
export const registratsiya = async (name: string, password: string, role: Rol) => {
  if (name.trim().length < 2 || password.length < 8) return 'Имя — от 2 символов, пароль — от 8.';
  if (serverConfigured) {
    try { await api('/api/register', { method: 'POST', body: { name: name.trim(), password, role } }); await refreshServerData(); return ''; }
    catch (error) { return error instanceof Error ? error.message : 'Не удалось создать аккаунт.'; }
  }
  if (getData().users.some(u => u.name.toLowerCase() === name.trim().toLowerCase())) return 'Такое имя уже занято.';
  const user = { id: id(), name: name.trim(), role, avatar: name.trim()[0].toUpperCase(), hash: await hash(password) };
  setData(d => ({ ...d, users: [...d.users, user], currentUserId: user.id })); return '';
};
export const vhod = async (name: string, password: string) => {
  if (serverConfigured) {
    try { await api('/api/login', { method: 'POST', body: { name: name.trim(), password } }); await refreshServerData(); return ''; }
    catch (error) { return error instanceof Error ? error.message : 'Не удалось войти.'; }
  }
  const user = getData().users.find(u => u.name.toLowerCase() === name.trim().toLowerCase());
  if (!user?.hash || user.hash !== await hash(password)) return 'Неверное имя или пароль.';
  setData(d => ({ ...d, currentUserId: user.id })); return '';
};
export const profilObnovit = async (name: string, avatar: string) => {
  const userId = getData().currentUserId; if (!userId || name.trim().length < 2) return false;
  if (serverConfigured) {
    try { await api('/api/profile', { method: 'PATCH', body: { name: name.trim(), avatar: avatar.trim().slice(0, 2) || name.trim()[0] } }); await refreshServerData(); return true; }
    catch (error) { reportServerError(error); return false; }
  }
  setData(d => ({ ...d, users: d.users.map(u => u.id === userId ? { ...u, name: name.trim(), avatar: avatar.trim().slice(0, 2) || name.trim()[0] } : u) })); return true;
};
