import type { Zadacha } from '../tipy/tipy';
export const balliZaZadachu = (task: Zadacha) => task.points + (task.urgent ? Math.ceil(task.points * 0.2) : 0);
export const balliUchastnika = (tasks: Zadacha[], userId: string) => tasks.filter(t => t.status === 'done' && t.completedBy === userId).reduce((sum, t) => sum + balliZaZadachu(t), 0);
