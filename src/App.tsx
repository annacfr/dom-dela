import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useData } from './api/khranilishche';
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
  return <HashRouter><Routes>
    <Route path="/vhod" element={user ? <Navigate to="/" /> : <Vhod />} />
    <Route path="/registratsiya" element={user ? <Navigate to="/nastroyka" /> : <Registratsiya />} />
    {!user ? <Route path="*" element={<Navigate to="/vhod" />} /> : !user.familyId ? <><Route path="/nastroyka" element={<Nastroyka />} /><Route path="*" element={<Navigate to="/nastroyka" />} /></> :
      <Route element={<Obolochka />}>
        <Route index element={<Glavnaya />} /><Route path="zadachi" element={<Zadachi />} />
        <Route path="zadachi/novaya" element={<FormaZadachi />} /><Route path="zadachi/:id/pravka" element={<FormaZadachi />} />
        <Route path="kalendar" element={<Kalendar />} /><Route path="statistika" element={<Statistika />} />
        <Route path="chat" element={<Chat />} /><Route path="profil" element={<Profil />} />
        <Route path="semya" element={<Semya />} /><Route path="uvedomleniya" element={<Uvedomleniya />} />
        <Route path="istoriya" element={<Istoriya />} /><Route path="*" element={<Navigate to="/" />} />
      </Route>}
  </Routes></HashRouter>;
}
