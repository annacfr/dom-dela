import type { Zadacha } from '../tipy/tipy';
import { getData, setData } from './khranilishche';
import { history, notify } from './zapisi';
import { id } from '../util/daty';
import { sleduyushchaya } from './povtory';
import { balliZaZadachu } from '../util/balli';
import { api, refreshServerData, reportServerError, serverConfigured, taskToApi } from './server';
const actor = () => getData().users.find(u => u.id === getData().currentUserId);
const allowed = (t: Zadacha, userId: string) => t.assignees === 'all' || t.assignees === 'open' || t.assignees.includes(userId) || t.reservedBy === userId;
const serverAction = async (path: string, method = 'POST', body?: unknown) => { try { await api(path, { method, body }); await refreshServerData(); return true; } catch (error) { reportServerError(error); return false; } };
export const sozdatZadachu = async (task: Omit<Zadacha, 'id' | 'status' | 'familyId'>) => {
  const user = actor(); if (!user || user.role !== 'adult' || !user.familyId) return false;
  if (serverConfigured) return serverAction('/api/tasks', 'POST', taskToApi(task));
  const made: Zadacha = { ...task, id: id(), familyId: user.familyId, status: 'active' };
  setData(d => ({ ...d, tasks: [made, ...d.tasks], history: history({ ...d, history: history(d, 'created', `Создана задача «${made.title}»`, user.id) }, 'assigned', `Назначена задача «${made.title}»`, user.id), notifications: notify(d, 'assigned', `Новая задача: ${made.title}`) })); return true;
};
export const izmenitZadachu = async (task: Zadacha) => {
  const user = actor(), old = getData().tasks.find(t => t.id === task.id); if (user?.role !== 'adult' || user.familyId !== task.familyId || old?.status !== 'active') return;
  if (serverConfigured) return serverAction('/api/tasks/' + encodeURIComponent(task.id), 'PATCH', taskToApi(task));
  setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? task : t), history: history(d, 'edited', `Задача «${task.title}» изменена`, user.id), notifications: notify(d, 'changed', `Изменена задача: ${task.title}`) }));
};
export const bronirovat = async (taskId: string) => {
  const user = actor(), task = getData().tasks.find(t => t.id === taskId);
  if (!user || !task || user.familyId !== task.familyId || task.assignees !== 'open' || task.status !== 'active') return;
  if (serverConfigured) return serverAction('/api/tasks/' + encodeURIComponent(taskId) + '/reserve');
  const until = new Date(Date.now() + 60 * 60_000).toISOString();
  setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === taskId ? { ...t, status: 'reserved', reservedBy: user.id, reservedUntil: until } : t), history: history(d, 'reserved', `${user.name} взял(а) задачу «${task.title}»`, user.id) }));
};
export const nachat = async (taskId: string) => {
  const user = actor(), task = getData().tasks.find(t => t.id === taskId);
  if (!user || !task || user.familyId !== task.familyId || !allowed(task, user.id) || !['active', 'reserved'].includes(task.status) || (task.status === 'reserved' && task.reservedBy !== user.id) || (task.assignees === 'open' && !task.reservedBy)) return;
  if (serverConfigured) return serverAction('/api/tasks/' + encodeURIComponent(taskId) + '/start');
  setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === taskId ? { ...t, status: 'doing', startedAt: new Date().toISOString(), reservedBy: user.id } : t), history: history(d, 'started', `${user.name} начал(а) «${task.title}»`, user.id) }));
};
export const zavershit = async (taskId: string) => {
  const user = actor(), task = getData().tasks.find(t => t.id === taskId);
  if (!user || !task || user.familyId !== task.familyId || task.status !== 'doing' || task.reservedBy !== user.id) return;
  if (serverConfigured) return serverAction('/api/tasks/' + encodeURIComponent(taskId) + '/complete');
  const now = new Date().toISOString(), points = balliZaZadachu(task), next = sleduyushchaya(task, getData().users);
  setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === taskId ? { ...t, status: 'done' as const, completedAt: now, completedBy: user.id, duration: Math.max(1, Math.round((Date.now() - new Date(t.startedAt || now).getTime()) / 60_000)) } : t).concat(next ? [next] : []), history: [{ id: id(), familyId: task.familyId, type: 'points', text: `${user.name}: +${points} баллов`, at: now, userId: user.id }, ...history(d, 'done', `Задача «${task.title}» выполнена: ${user.name}`, user.id)], messages: [...d.messages, { id: id(), familyId: task.familyId, text: `Задача «${task.title}» выполнена: ${user.name}`, at: now, taskId }] }));
};
export const arhivirovat = async (taskId: string) => {
  const user = actor(), task = getData().tasks.find(t => t.id === taskId); if (user?.role !== 'adult' || !task || user.familyId !== task.familyId || task.status !== 'active') return;
  if (serverConfigured) return serverAction('/api/tasks/' + encodeURIComponent(taskId), 'DELETE');
  setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === taskId ? { ...t, status: 'archived' } : t), history: history(d, 'cancelled', `Задача «${task.title}» архивирована`, user.id), notifications: notify(d, 'cancelled', `Задача «${task.title}» отменена`) }));
};
