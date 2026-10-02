import type { Sobytie } from '../tipy/tipy';
import { getData, setData } from './khranilishche';
import { id } from '../util/daty';
import { notify } from './zapisi';
export const dobavitSobytie = (event: Omit<Sobytie, 'id' | 'familyId'>) => { const familyId = getData().users.find(u => u.id === getData().currentUserId)?.familyId; if (!familyId) return; setData(d => ({ ...d, events: [...d.events, { ...event, id: id(), familyId }] })); };
export const otpravit = (text: string) => { const userId = getData().currentUserId, familyId = getData().users.find(u => u.id === userId)?.familyId; if (!userId || !familyId || !text.trim()) return; setData(d => ({ ...d, messages: [...d.messages, { id: id(), familyId, userId, text: text.trim(), at: new Date().toISOString() }], notifications: d.users.filter(u => u.familyId === familyId && u.id !== userId).reduce((all, u) => notify({ ...d, notifications: all }, 'chat', 'Новое сообщение в семейном чате', u.id), d.notifications) })); };
export const prochitat = () => setData(d => { const me = d.users.find(u => u.id === d.currentUserId); return { ...d, notifications: d.notifications.map(n => n.familyId === me?.familyId && (!n.userId || n.userId === me?.id) ? { ...n, read: true } : n) }; });
export const nastroika = (reminders: boolean) => setData(d => ({ ...d, settings: { ...d.settings, reminders } }));
export const arhivIstorii = (recordId: string) => setData(d => { const familyId = d.users.find(u => u.id === d.currentUserId)?.familyId; return { ...d, history: d.history.map(h => h.id === recordId && h.familyId === familyId ? { ...h, archived: true } : h) }; });
