import type { Zadacha } from '../tipy/tipy';
import { balliUchastnika } from './balli';
export const dostizheniya = (tasks: Zadacha[], userId: string) => {
  const done = tasks.filter(t => t.status === 'done' && t.completedBy === userId);
  const points = balliUchastnika(tasks, userId);
  const week = done.filter(t => t.completedAt && Date.now() - new Date(t.completedAt).getTime() < 7 * 86_400_000);
  return [{ title: 'Первое дело', active: done.length >= 1 }, { title: 'Пять дел', active: done.length >= 5 }, { title: 'Неделя без просрочек', active: week.length >= 1 && week.every(t => t.completedAt!.slice(0, 16) <= t.deadline) }, { title: 'Серия из трёх', active: done.length >= 3 }, { title: '100 баллов', active: points >= 100 }];
};
