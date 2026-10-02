import type { Zadacha, Chelovek } from '../tipy/tipy';
import { id } from '../util/daty';
export const sleduyushchaya = (task: Zadacha, users: Chelovek[]): Zadacha | null => {
  if (task.repeat === 'none' || task.repeat === 'custom' && !task.days?.length) return null;
  const next = new Date(`${task.date}T12:00:00`);
  next.setDate(next.getDate() + (task.repeat === 'weekly' ? 7 : 1));
  if (task.repeat === 'weekdays') while ([0, 6].includes(next.getDay())) next.setDate(next.getDate() + 1);
  if (task.repeat === 'custom') while (!task.days?.includes(next.getDay())) next.setDate(next.getDate() + 1);
  const date = next.toISOString().slice(0, 10);
  const first = Array.isArray(task.assignees) ? task.assignees[0] : undefined;
  const members = users.filter(u => u.familyId === users.find(x => x.id === first)?.familyId);
  const assignees = task.rotate && Array.isArray(task.assignees) && task.assignees.length === 1 && members.length > 1
    ? [members[(members.findIndex(u => u.id === task.assignees[0]) + 1) % members.length].id] : task.assignees;
  return { ...task, id: id(), parentId: task.parentId || task.id, date, deadline: `${date}T${task.deadline.slice(11, 16)}`, assignees, status: 'active', reservedBy: undefined, reservedUntil: undefined, startedAt: undefined, completedAt: undefined, completedBy: undefined, duration: undefined };
};
