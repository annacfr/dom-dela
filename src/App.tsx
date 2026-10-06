import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useData } from './api/khranilishche';
import { refreshServerData, serverConfigured } from './api/server';
import { Obolochka } from './komponenty/obolochka';
import { Vhod } from './stranitsy/vhod';
import { Registratsiya } from './stranitsy/registratsiya';
import { Nastroyka } from './stranitsy/nastroyka';
import { Glavnaya } from './stranitsy/glavnaya';
import { Zadachi } from './stranitsy/zadachi';
import { FormaZadachi } from './stranitsy/formaZadachi';
import { Kalendar } from './stranitsy/kalendar';
import { Statistika } from './stranitsy/statistika';
import { Chat } from './stranitsy/chat';
import { Profil } from './stranitsy/profil';
import { Semya } from './stranitsy/semya';
import { Uvedomleniya } from './stranitsy/uvedomleniya';
import { Istoriya } from './stranitsy/istoriya';
export default function App() {
  const data = useData(), user = data.users.find(u => u.id === data.currentUserId);
  const userId = user?.id;
  useEffect(() => {
    if (!serverConfigured || !userId) return;
    const refresh = () => { if (document.visibilityState === 'visible') void refreshServerData().catch(error => console.error('Не удалось обновить данные с сервера', error)); };
    const timer = window.setInterval(refresh, 10_000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [userId]);

  if (!user) {
    return <HashRouter><Routes>
      <Route path="/registratsiya" element={<Registratsiya />} />
      <Route path="*" element={<Vhod />} />
    </Routes></HashRouter>;
  }

  if (!user.familyId) {
    return <HashRouter><Routes>
      <Route path="*" element={<Nastroyka />} />
    </Routes></HashRouter>;
  }

  return <HashRouter><Routes>
    <Route element={<Obolochka />}>
      <Route index element={<Glavnaya />} /><Route path="zadachi" element={<Zadachi />} />
      <Route path="zadachi/novaya" element={<FormaZadachi />} /><Route path="zadachi/:id/pravka" element={<FormaZadachi />} />
      <Route path="kalendar" element={<Kalendar />} /><Route path="statistika" element={<Statistika />} />
      <Route path="chat" element={<Chat />} /><Route path="profil" element={<Profil />} />
      <Route path="semya" element={<Semya />} /><Route path="uvedomleniya" element={<Uvedomleniya />} />
      <Route path="istoriya" element={<Istoriya />} /><Route path="*" element={<Navigate to="/" />} />
    </Route>
  </Routes></HashRouter>;
}
