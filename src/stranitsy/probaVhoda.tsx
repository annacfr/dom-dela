import { Link } from 'react-router-dom';
import { ProbaZnak } from '../komponenty/probaZnak';
import { ProbaFormaVhoda } from '../komponenty/probaFormaVhoda';
export function ProbaVhoda() {
  return <div className="pv-page"><div className="pv-scenery" aria-hidden="true" />
    <main className="pv-shell"><div className="pv-brand">
      <span className="pv-kicker">Проба нового облика</span>
      <ProbaZnak /><h1>Дом дела</h1>
      <p>Маленькие дела.<br />Большое чувство дома.</p>
    </div><section className="pv-panel" aria-labelledby="pv-title">
      <span className="pv-overline">Рады видеть вас дома</span>
      <h2 id="pv-title">Войти в семью</h2>
      <p className="pv-intro">Продолжим заботиться о том, что важно — вместе.</p>
      <ProbaFormaVhoda />
    </section><Link className="pv-back" to="/vhod">Вернуться к текущему дизайну</Link></main>
  </div>;
}
