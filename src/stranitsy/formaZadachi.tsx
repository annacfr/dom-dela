import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useData } from '../api/khranilishche';
import { arhivirovat, izmenitZadachu, sozdatZadachu } from '../api/zadachiApi';
import { PolyaZadachi } from '../komponenty/polyaZadachi';
import { IspolniteliZadachi } from '../komponenty/ispolniteliZadachi';
import type { Povtor, Zadacha } from '../tipy/tipy';
import { formatDaty } from '../util/daty';
export function FormaZadachi() {
  const d = useData(), { id } = useParams(), navigate = useNavigate(), me = d.users.find(u => u.id === d.currentUserId)!;
  const [error, setError] = useState('');
  const task = d.tasks.find(t => t.id === id && t.familyId === me.familyId), members = d.users.filter(u => u.familyId === me.familyId);
  if (!task && me.role !== 'adult') return <Navigate to="/zadachi" />;
  if (id && !task) return <div className="panel">Задача не найдена. <Link to="/zadachi">К списку</Link></div>;
  const save = async (form: HTMLFormElement) => {
    const f = new FormData(form), mode = String(f.get('assignmentMode'));
    const assignees: Zadacha['assignees'] = mode === 'all' || mode === 'open' ? mode : f.getAll('assignees').map(String);
    if (Array.isArray(assignees) && !assignees.length) { setError('Выберите исполнителя.'); return; }
    const repeat = String(f.get('repeat')) as Povtor, days = f.getAll('days').map(Number);
    if (repeat === 'custom' && !days.length) { setError('Выберите дни недели.'); return; }
    const date = String(f.get('date')), deadline = String(f.get('deadline'));
    if (deadline.slice(0, 10) < date) { setError('Дедлайн не может быть раньше даты задачи.'); return; }
    const values = { title: String(f.get('title')).trim(), description: String(f.get('description')).trim(), category: String(f.get('category')), date, time: String(f.get('time')), deadline, repeat, days, rotate: f.has('rotate'), priority: String(f.get('priority')), urgent: f.has('urgent'), points: Number(f.get('points')), assignees };
    const saved = task ? await izmenitZadachu({ ...task, ...values }) : await sozdatZadachu(values);
    if (saved === false) { setError('Не удалось сохранить задачу. Проверьте подключение и заполнение полей.'); return; }
    navigate('/zadachi');
  };
  return <div className="form-page"><div className="page-heading"><div><p className="eyebrow">Задачи семьи</p><h1>{task ? 'О задаче' : 'Новое дело'}</h1></div><Link to="/zadachi" className="text-button">← К задачам</Link></div>{task && <section className="panel task-details"><h2>{task.title}</h2><p>{task.description || 'Без описания'}</p><p>Срок: {formatDaty(task.date)} · {task.time} · Дедлайн: {new Date(task.deadline).toLocaleString('ru-RU')}</p>{task.completedBy && <p>Выполнил(а): {d.users.find(u => u.id === task.completedBy)?.name} · {task.duration} мин · {new Date(task.completedAt!).toLocaleString('ru-RU')}</p>}</section>}{me.role === 'adult' && (!task || task.status === 'active') && <form className="panel task-form" onChange={() => setError('')} onSubmit={e => { e.preventDefault(); void save(e.currentTarget); }}><PolyaZadachi task={task} /><IspolniteliZadachi users={members} task={task} />{error && <p className="error" role="alert">{error}</p>}<div className="form-actions"><button className="button">{task ? 'Сохранить изменения' : 'Создать задачу'}</button>{task && <button type="button" className="button ghost" onClick={() => { void arhivirovat(task.id); navigate('/zadachi'); }}>Архивировать</button>}</div></form>}</div>;
}
