import { ProbaZnak } from '../komponenty/probaZnak';
import { ProbaFormaVhoda } from '../komponenty/probaFormaVhoda';
import { ProbaDemo } from '../komponenty/probaDemo';
export function Vhod() {
  return <div className="pv-page"><div className="pv-scenery" aria-hidden="true" />
    <main className="pv-shell"><div className="pv-brand">
      <span className="pv-kicker">Вместе дома</span>
      <ProbaZnak /><h1>Дом дела</h1>
      <p>Маленькие дела.<br />Большое чувство дома.</p>
    </div><section className="pv-panel" aria-labelledby="pv-title">
      <span className="pv-overline">Рады видеть вас дома</span>
      <h2 id="pv-title">Войти в семью</h2>
      <p className="pv-intro">Продолжим заботиться о том, что важно — вместе.</p>
      <ProbaFormaVhoda /><ProbaDemo />
    </section></main>
  </div>;
}
