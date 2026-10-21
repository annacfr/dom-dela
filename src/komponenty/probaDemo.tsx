import { useNavigate } from 'react-router-dom';
import { useData } from '../api/khranilishche';
import { vhodDemo } from '../api/uchetnyeZapisi';
export function ProbaDemo() {
  const users = useData().users.filter(user => user.familyId === 'dom' && !user.hash);
  const navigate = useNavigate();
  return <details className="pv-demo"><summary>Посмотреть демо без регистрации</summary>
    <p>Демо-данные хранятся только в этом браузере.</p>
    <div className="pv-demo-users">{users.map(user => <button key={user.id} type="button" onClick={async () => {
      await vhodDemo(user.id); navigate('/');
    }}><span className="avatar small">{user.avatar}</span><span>{user.name}</span></button>)}</div>
  </details>;
}
