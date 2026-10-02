import { getData, setData } from './khranilishche';
import { id } from '../util/daty';
import { history } from './zapisi';
const user = () => getData().users.find(u => u.id === getData().currentUserId);
export const sozdatSemyu = (name: string) => {
  const me = user(); if (!me || me.role !== 'adult' || me.familyId || name.trim().length < 2) return false;
  const familyId = id(), code = `DOM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  setData(d => ({ ...d, families: [...d.families, { id: familyId, name: name.trim(), code, mood: 'Спокойно' }], users: d.users.map(u => u.id === me.id ? { ...u, familyId } : u) })); return true;
};
export const prisoyedinitsya = (code: string) => {
  const me = user(), family = getData().families.find(f => f.code.toUpperCase() === code.trim().toUpperCase());
  if (!me || me.familyId || !family) return 'Код не найден.';
  if (me.role === 'child') { setData(d => ({ ...d, users: d.users.map(u => u.id === me.id ? { ...u, familyId: family.id } : u) })); return '' ; }
  if (getData().requests.some(r => r.userId === me.id && r.familyId === family.id)) return 'Запрос уже отправлен.';
  setData(d => ({ ...d, requests: [...d.requests, { id: id(), userId: me.id, familyId: family.id, at: new Date().toISOString() }] })); return 'Запрос отправлен. Дождитесь подтверждения взрослого.';
};
export const reshitZapros = (requestId: string, accept: boolean) => {
  const me = user(), request = getData().requests.find(r => r.id === requestId);
  if (!me || me.role !== 'adult' || !request || me.familyId !== request.familyId) return;
  setData(d => ({ ...d, requests: d.requests.filter(r => r.id !== requestId), users: accept ? d.users.map(u => u.id === request.userId ? { ...u, familyId: request.familyId } : u) : d.users, history: history(d, accept ? 'joined' : 'rejected', accept ? 'Запрос на вступление подтверждён' : 'Запрос на вступление отклонён', me.id) }));
};
export const izmenitSemyu = (name: string, mood: string) => {
  const me = user(); if (me?.role !== 'adult' || !me.familyId || name.trim().length < 2) return;
  const old = getData().families.find(f => f.id === me.familyId);
  setData(d => ({ ...d, families: d.families.map(f => f.id === me.familyId ? { ...f, name: name.trim(), mood } : f), history: old?.mood !== mood ? history(d, 'mood', `Состояние семьи: ${mood}`, me.id) : d.history }));
};
export const sostoyanieSemyi = (mood: string) => {
  const me = user(); if (!me?.familyId) return;
  setData(d => ({ ...d, families: d.families.map(f => f.id === me.familyId ? { ...f, mood } : f), history: history(d, 'mood', `${me.name} выбрал(а) состояние: ${mood}`, me.id) }));
};
