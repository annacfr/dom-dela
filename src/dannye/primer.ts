import type { Dannye, Zadacha } from '../tipy/tipy';
import { sdvig, segodnya } from '../util/daty';
const task = (id: string, title: string, category: string, day: number, points: number, assignees: Zadacha['assignees']): Zadacha => ({ id, familyId: 'dom', title, description: '', category, date: sdvig(day), time: '18:00', deadline: `${sdvig(day)}T20:00`, repeat: 'none', priority: 'Обычный', urgent: false, points, assignees, status: 'active' });
export const primer = (): Dannye => ({
  users: [{ id: 'anya', name: 'Аня', role: 'adult', avatar: 'А', familyId: 'dom' }, { id: 'maksim', name: 'Максим', role: 'adult', avatar: 'М', familyId: 'dom' }, { id: 'masha', name: 'Маша', role: 'child', avatar: 'М', familyId: 'dom' }, { id: 'lev', name: 'Лев', role: 'child', avatar: 'Л', familyId: 'dom' }],
  families: [{ id: 'dom', name: 'Семья Соколовых', code: 'DOM-2026', mood: 'Спокойно' }],
  tasks: [task('kitchen', 'Убрать кухню', 'Уборка', 0, 20, ['anya']), task('trash', 'Вынести мусор', 'Дом', 0, 10, 'open'), task('plants', 'Полить растения', 'Растения', 0, 7, ['masha']), task('dishes', 'Загрузить посудомойку', 'Кухня', 1, 15, ['maksim']), task('things', 'Разобрать вещи', 'Уборка', 2, 20, 'all')],
  events: [{ id: 'dinner', familyId: 'dom', title: 'Семейный ужин', date: segodnya(), time: '19:00', type: 'Встреча' }, { id: 'walk', familyId: 'dom', title: 'Прогулка в парке', date: sdvig(3), time: '12:00', type: 'Прогулка' }],
  messages: [{ id: 'hello', familyId: 'dom', userId: 'anya', text: 'Доброе утро! Что сегодня успеем сделать?', at: new Date().toISOString() }, { id: 'reply', familyId: 'dom', userId: 'maksim', text: 'Я возьму посудомойку завтра.', at: new Date().toISOString() }],
  history: [], notifications: [], requests: [], currentUserId: 'anya', settings: { reminders: true }
});
