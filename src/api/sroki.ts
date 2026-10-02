import { getData, setData } from './khranilishche';
import { id } from '../util/daty';
export const proveritSroki = () => {
  const d = getData(), familyId = d.users.find(u => u.id === d.currentUserId)?.familyId;
  if (!familyId || !d.settings.reminders) return;
  const soon = d.tasks.filter(t => t.familyId === familyId && !['done','archived'].includes(t.status) && new Date(t.deadline).getTime() > Date.now() && new Date(t.deadline).getTime() - Date.now() < 24 * 60 * 60_000 && !d.notifications.some(n => n.type === 'deadline' && n.taskId === t.id));
  if (!soon.length) return;
  setData(state => ({ ...state, notifications: [...soon.map(t => ({ id: id(), familyId, taskId: t.id, text: `Скоро срок задачи: ${t.title}`, at: new Date().toISOString(), read: false, type: 'deadline' })), ...state.notifications] }));
};
