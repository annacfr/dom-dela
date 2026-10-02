import { useState } from 'react';
import type { Chelovek, Zadacha } from '../tipy/tipy';
export function IspolniteliZadachi({ users, task }: { users: Chelovek[]; task?: Zadacha }) {
  const [mode, setMode] = useState(task?.assignees === 'all' ? 'all' : task?.assignees === 'open' ? 'open' : 'members');
  return <fieldset className="assignees"><legend>Исполнитель</legend><select value={mode} onChange={e => setMode(e.target.value)} aria-label="Способ назначения"><option value="members">Один или несколько</option><option value="all">Вся семья</option><option value="open">Открытая задача «кто первый»</option></select>{mode === 'members' && <div className="member-options">{users.map(u => <label key={u.id}><input name="assignees" type="checkbox" value={u.id} defaultChecked={Array.isArray(task?.assignees) && task.assignees.includes(u.id)} />{u.name} <small>{u.role === 'adult' ? 'взрослый' : 'ребёнок'}</small></label>)}</div>}<input type="hidden" name="assignmentMode" value={mode} /></fieldset>;
}
