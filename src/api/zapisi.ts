import type { Dannye, Uvedomlenie, Zapis } from '../tipy/tipy';
import { id } from '../util/daty';
const family = (data: Dannye) => data.users.find(u => u.id === data.currentUserId)?.familyId;
export const history = (data: Dannye, type: string, text: string, userId?: string): Zapis[] => [{ id: id(), familyId: family(data), type, text, userId, at: new Date().toISOString() }, ...data.history];
export const notify = (data: Dannye, type: string, text: string, userId?: string): Uvedomlenie[] => [{ id: id(), familyId: family(data), type, text, userId, at: new Date().toISOString(), read: false }, ...data.notifications];
