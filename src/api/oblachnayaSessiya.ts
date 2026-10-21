import type { Dannye } from '../tipy/tipy';
import { supabase } from './supabase';
import { getData, getStatus, leaveCloud, setCloudData, setStatus } from './khranilishche';
let started = false, channelFamily = '', sessionUser = '', version = 0;
export const obnovitOblako = async () => {
  const client = supabase;
  if (!client || !getStatus().cloud) return;
  const run = ++version;
  try {
    const { data, error } = await client.rpc('cloud_snapshot');
    if (run !== version || !getStatus().cloud) return;
    if (error) { setStatus({ loading: false, error: `Не удалось загрузить данные: ${error.message}` }); return; }
    setCloudData(data as Dannye);
  } catch (error) { if (run === version) setStatus({ loading: false, error: `Нет соединения: ${String(error)}` }); return; }
  const familyId = getData().users.find(u => u.id === getData().currentUserId)?.familyId || '';
  if (familyId === channelFamily) return;
  client.removeAllChannels(); channelFamily = familyId;
  if (familyId) client.channel(`family-${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` }, () => void obnovitOblako())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `family_id=eq.${familyId}` }, () => void obnovitOblako()).subscribe();
};
export const nachatOblako = async () => {
  const client = supabase;
  if (!client || started) return; started = true;
  client.auth.onAuthStateChange((_event, session) => {
    if (session && session.user.id !== sessionUser) { sessionUser = session.user.id; version++; channelFamily = ''; client.removeAllChannels(); setStatus({ cloud: true, loading: true, error: '' }); setTimeout(() => void obnovitOblako(), 0); }
    else if (!session && getStatus().cloud) { sessionUser = ''; version++; channelFamily = ''; client.removeAllChannels(); leaveCloud(); }
  });
  const { data, error } = await client.auth.getSession();
  if (error) setStatus({ error: error.message });
  if (data.session) { setStatus({ cloud: true, loading: true }); await obnovitOblako(); }
  window.setInterval(() => { if (getStatus().cloud) void obnovitOblako(); }, 20_000);
  window.addEventListener('focus', () => { if (getStatus().cloud) void obnovitOblako(); });
};
