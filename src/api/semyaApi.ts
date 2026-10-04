import { getData, setData } from './khranilishche';
import { id } from '../util/daty';
import { history } from './zapisi';
import { api, familyMoodToApi, refreshServerData, reportServerError, serverConfigured } from './server';
const user = () => getData().users.find(u => u.id === getData().currentUserId);
export const sozdatSemyu = async (name: string) => {
  const me = user(); if (!me || me.role !== 'adult' || me.familyId || name.trim().length < 2) return false;
  if (serverConfigured) { try { await api('/api/family', { method: 'POST', body: { name: name.trim() } }); await refreshServerData(); return true; } catch (error) { reportServerError(error); return false; } }
  const familyId = id(), code = `DOM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  setData(d => ({ ...d, families: [...d.families, { id: familyId, name: name.trim(), code, mood: 'Спокойно' }], users: d.users.map(u => u.id === me.id ? { ...u, familyId } : u) })); return true;
};
export const prisoyedinitsya = async (code: string) => {
  const me = user(), family = getData().families.find(f => f.code.toUpperCase() === code.trim().toUpperCase());
  if (!me || me.familyId) return 'Вы уже состоите в семье.';
  if (serverConfigured) {
    try { const result = await api<{ joined?: boolean; pending?: boolean }>('/api/family/join', { method: 'POST', body: { code: code.trim() } }); await refreshServerData(); return result.pending ? 'Запрос отправлен. Дождитесь подтверждения взрослого.' : 'Вы присоединились к семье.'; }
    catch (error) { return error instanceof Error ? error.message : 'Не удалось присоединиться к семье.'; }
  }
  if (!family) return 'Код не найден.';
  if (me.role === 'child') { setData(d => ({ ...d, users: d.users.map(u => u.id === me.id ? { ...u, familyId: family.id } : u) })); return '' ; }
  if (getData().requests.some(r => r.userId === me.id && r.familyId === family.id)) return 'Запрос уже отправлен.';
  setData(d => ({ ...d, requests: [...d.requests, { id: id(), userId: me.id, familyId: family.id, at: new Date().toISOString() }] })); return 'Запрос отправлен. Дождитесь подтверждения взрослого.';
};
export const reshitZapros = async (requestId: string, accept: boolean) => {
  const me = user(), request = getData().requests.find(r => r.id === requestId);
  if (serverConfigured) { try { await api('/api/family/requests/' + encodeURIComponent(requestId) + '/' + (accept ? 'accept' : 'reject'), { method: 'POST', body: {} }); await refreshServerData(); } catch (error) { reportServerError(error); } return; }
  if (!me || me.role !== 'adult' || !request || me.familyId !== request.familyId) return;
  setData(d => ({ ...d, requests: d.requests.filter(r => r.id !== requestId), users: accept ? d.users.map(u => u.id === request.userId ? { ...u, familyId: request.familyId } : u) : d.users, history: history(d, accept ? 'joined' : 'rejected', accept ? 'Запрос на вступление подтверждён' : 'Запрос на вступление отклонён', me.id) }));
};
export const izmenitSemyu = async (name: string, mood: string) => {
  const me = user(); if (me?.role !== 'adult' || !me.familyId || name.trim().length < 2) return;
  if (serverConfigured) { try { await api('/api/family/name', { method: 'POST', body: { name: name.trim() } }); await api('/api/family/mood', { method: 'POST', body: { mood: familyMoodToApi(mood) } }); await refreshServerData(); } catch (error) { reportServerError(error); } return; }
  const old = getData().families.find(f => f.id === me.familyId);
  setData(d => ({ ...d, families: d.families.map(f => f.id === me.familyId ? { ...f, name: name.trim(), mood } : f), history: old?.mood !== mood ? history(d, 'mood', `Состояние семьи: ${mood}`, me.id) : d.history }));
};
export const sostoyanieSemyi = async (mood: string) => {
  const me = user(); if (!me?.familyId) return;
  if (serverConfigured) { try { await api('/api/family/mood', { method: 'POST', body: { mood: familyMoodToApi(mood) } }); await refreshServerData(); } catch (error) { reportServerError(error); } return; }
  setData(d => ({ ...d, families: d.families.map(f => f.id === me.familyId ? { ...f, mood } : f), history: history(d, 'mood', `${me.name} выбрал(а) состояние: ${mood}`, me.id) }));
};
