import type { Dannye, Rol, Semya, Zadacha } from '../tipy/tipy';
import { replaceData } from './khranilishche';

const apiRoot = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const serverConfigured = Boolean(apiRoot);
let csrf = '';

type ApiOptions = { method?: string; body?: unknown };
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && !['/api/login', '/api/register'].includes(path) && csrf) headers['X-CSRF-Token'] = csrf;
  let response: Response;
  try {
    response = await fetch(apiRoot + path, {
      method, headers, credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    const reason = error instanceof Error ? ` (${error.message})` : '';
    throw new Error(`Не удалось подключиться к API ${apiRoot}. Проверьте APP_ORIGIN на PHP-сервере, адрес VITE_API_URL и доступ телефона к локальной сети${reason}`);
  }
  const result = await response.json().catch(() => ({})) as { error?: string; csrf?: string };
  if (!response.ok) throw new Error(result.error || 'Ошибка сервера (' + response.status + ')');
  if (result.csrf) csrf = result.csrf;
  return result as T;
}

const asText = (value: unknown) => value == null ? '' : String(value);
const asId = (value: unknown) => value == null ? undefined : String(value);
const dateTime = (value: unknown) => asText(value).replace(' ', 'T').slice(0, 16);
const moodToUi: Record<string, string> = { good: 'Хорошо', calm: 'Спокойно', tense: 'Напряжённо', conflict: 'Конфликт', hard: 'Тяжело', recovery: 'Восстановление' };
const moodToApi: Record<string, string> = Object.fromEntries(Object.entries(moodToUi).map(([apiValue, uiValue]) => [uiValue, apiValue]));
const typeToUi: Record<string, string> = { birthday: 'День рождения', meeting: 'Встреча', walk: 'Прогулка', trip: 'Поездка', other: 'Другое' };
const typeToApi: Record<string, string> = Object.fromEntries(Object.entries(typeToUi).map(([apiValue, uiValue]) => [uiValue, apiValue]));
const priorityToUi: Record<string, string> = { low: 'Низкий', normal: 'Обычный', high: 'Высокий' };
const priorityToApi: Record<string, string> = Object.fromEntries(Object.entries(priorityToUi).map(([apiValue, uiValue]) => [uiValue, apiValue]));

function mapTask(row: Record<string, unknown>, familyId: string): Zadacha {
  const mode = asText(row.assignee_mode);
  const members = asText(row.assignees).split(',').filter(Boolean);
  return {
    id: asText(row.id), familyId, title: asText(row.title), description: asText(row.description),
    category: asText(row.category), date: asText(row.task_date), time: asText(row.task_time).slice(0, 5),
    deadline: dateTime(row.deadline), repeat: (asText(row.repeat_frequency) || 'none') as Zadacha['repeat'],
    days: asText(row.week_days).split(',').filter(Boolean).map(Number), rotate: Boolean(Number(row.rotate)),
    priority: priorityToUi[asText(row.priority)] || 'Обычный', urgent: Boolean(Number(row.urgent)),
    points: Number(row.base_points || 10), assignees: mode === 'all' || mode === 'open' ? mode : members,
    status: asText(row.status) as Zadacha['status'], reservedBy: asId(row.active_user_id) || asId(row.started_by),
    reservedUntil: row.reservation_expires ? dateTime(row.reservation_expires) : undefined,
    startedAt: row.started_at ? dateTime(row.started_at) : undefined,
    completedAt: row.completed_at ? dateTime(row.completed_at) : undefined,
    completedBy: asId(row.completed_by), duration: row.duration_minutes == null ? undefined : Number(row.duration_minutes),
    parentId: asId(row.parent_id),
  };
}

export async function refreshServerData(): Promise<void> {
  const auth = await api<{ user: { id: number; name: string; role: Rol; avatar: string; family_id: number | null }; csrf: string }>('/api/auth/me');
  csrf = auth.csrf;
  const user = { id: String(auth.user.id), name: auth.user.name, role: auth.user.role, avatar: auth.user.avatar, familyId: asId(auth.user.family_id) };
  const reminders = JSON.parse(localStorage.getItem('dom-dela-reminders-v1') || 'true') as boolean;
  const empty: Dannye = { users: [user], families: [], tasks: [], events: [], messages: [], history: [], notifications: [], requests: [], currentUserId: user.id, settings: { reminders } };
  if (!user.familyId) { replaceData(empty); return; }

  const [familyRow, taskRows, eventRows, messageRows, historyRows, notificationRows] = await Promise.all([
    api<Record<string, unknown> & { members: Record<string, unknown>[]; requests: Record<string, unknown>[] }>('/api/family'),
    api<Record<string, unknown>[]>('/api/tasks'),
    api<Record<string, unknown>[]>('/api/events'),
    api<Record<string, unknown>[]>('/api/messages'),
    api<Record<string, unknown>[]>('/api/history'),
    api<Record<string, unknown>[]>('/api/notifications'),
  ]);
  const members = (familyRow.members || []).map(member => ({
    id: asText(member.id), name: asText(member.name), role: asText(member.role) as Rol, avatar: asText(member.avatar), familyId: user.familyId,
  }));
  if (!members.some(member => member.id === user.id)) members.unshift(user);
  const family: Semya = { id: user.familyId, name: asText(familyRow.name), code: asText(familyRow.invite_code), mood: moodToUi[asText(familyRow.mood)] || 'Спокойно' };
  const requests = (familyRow.requests || []).map(request => ({ id: asText(request.id), userId: asText(request.user_id), familyId: user.familyId!, at: dateTime(request.created_at) }));
  const data: Dannye = {
    users: members, families: [family], tasks: taskRows.map(row => mapTask(row, user.familyId!)),
    events: eventRows.map(event => ({ id: asText(event.id), familyId: user.familyId!, title: asText(event.title), date: asText(event.event_date), time: asText(event.event_time).slice(0, 5), type: typeToUi[asText(event.event_type)] || asText(event.event_type), memberId: asId(event.member_id) })),
    messages: messageRows.map(message => ({ id: asText(message.id), familyId: user.familyId!, userId: asId(message.user_id), text: asText(message.body), at: dateTime(message.created_at), taskId: asId(message.task_id) })),
    history: historyRows.map(record => ({ id: asText(record.id), familyId: user.familyId, userId: asId(record.user_id), type: asText(record.event_type), text: asText(record.body), at: dateTime(record.created_at), archived: Boolean(Number(record.archived)) })),
    notifications: notificationRows.map(note => ({ id: asText(note.id), familyId: user.familyId, userId: asId(note.user_id), text: asText(note.body), at: dateTime(note.created_at), read: Boolean(Number(note.is_read)), type: asText(note.type), taskId: asId(note.task_id) })),
    requests, currentUserId: user.id, settings: { reminders },
  };
  replaceData(data);
}

export async function restoreServerSession(): Promise<void> {
  if (!serverConfigured) return;
  try { await refreshServerData(); }
  catch { replaceData({ users: [], families: [], tasks: [], events: [], messages: [], history: [], notifications: [], requests: [], settings: { reminders: true } }); }
}

export function reportServerError(error: unknown): void {
  window.alert(error instanceof Error ? error.message : 'Не удалось связаться с сервером.');
}

export function taskToApi(task: Omit<Zadacha, 'id' | 'status' | 'familyId'> | Zadacha) {
  const assignees = task.assignees;
  return {
    title: task.title, description: task.description, category: task.category, date: task.date, time: task.time,
    deadline: task.deadline, priority: priorityToApi[task.priority] || 'normal', urgent: task.urgent, points: task.points,
    assignee_mode: assignees === 'all' || assignees === 'open' ? assignees : 'members',
    assignees: Array.isArray(assignees) ? assignees.map(Number) : [],
    repeat: task.repeat || 'none', days: task.days || [], rotate: Boolean(task.rotate),
  };
}

export const familyMoodToApi = (mood: string) => moodToApi[mood] || mood;
export const eventTypeToApi = (type: string) => typeToApi[type] || type;
