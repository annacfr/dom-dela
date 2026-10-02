import { useEffect, useRef, useState } from 'react';
import { useData } from '../api/khranilishche';
import { otpravit } from '../api/obshchieApi';
import { formatVremeni } from '../util/daty';
import { Zagolovok } from '../komponenty/zagolovok';
export function Chat() {
  const d = useData(), me = d.users.find(u => u.id === d.currentUserId)!, [text, setText] = useState(''), bottom = useRef<HTMLDivElement>(null);
  const messages = d.messages.filter(m => m.familyId === me.familyId);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages.length]);
  return <><Zagolovok title="Семейный чат" subtitle="Тёплое место для коротких разговоров." /><div className="chat-panel"><div className="chat-messages">{messages.map(m => { const sender = d.users.find(u => u.id === m.userId), own = m.userId === me.id; return <div key={m.id} className={`bubble-row ${own ? 'own' : ''} ${!sender ? 'system' : ''}`}>{sender && <span className="avatar small">{sender.avatar}</span>}<div className="bubble"><div className="bubble-meta"><strong>{sender?.name || 'Дом дела'}</strong><time>{formatVremeni(m.at)}</time></div><p>{m.text}</p></div></div>; })}<div ref={bottom} /></div><form className="chat-compose" onSubmit={e => { e.preventDefault(); otpravit(text); setText(''); }}><input value={text} onChange={e => setText(e.target.value)} placeholder="Написать сообщение..." aria-label="Сообщение" maxLength={1000} required /><button className="button" disabled={!text.trim()}>Отправить</button></form></div></>;
}
