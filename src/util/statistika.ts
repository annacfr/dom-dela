import type { Zadacha, Zapis } from '../tipy/tipy';
import { balliZaZadachu } from './balli';
export const zaPeriod = (tasks: Zadacha[], period: string) => {
  const days = period === 'Неделя' ? 7 : period === 'Месяц' ? 30 : 100000;
  const after = Date.now() - days * 86_400_000;
  return tasks.filter(t => t.status === 'done' && t.completedAt && new Date(t.completedAt).getTime() >= after);
};
export const itogi = (tasks: Zadacha[], history: Zapis[]) => ({
  count: tasks.length,
  points: tasks.reduce((sum, task) => sum + balliZaZadachu(task), 0),
  minutes: tasks.length ? Math.round(tasks.reduce((sum, task) => sum + (task.duration || 0), 0) / tasks.length) : 0,
  overdue: tasks.filter(t => t.completedAt && t.completedAt.slice(0, 16) > t.deadline).length,
  failed: history.filter(h => h.type === 'reservation_expired').length
});
export const categories = (tasks: Zadacha[]) => Object.entries(tasks.reduce<Record<string, number>>((sum, t) => ({ ...sum, [t.category]: (sum[t.category] || 0) + 1 }), {}));
