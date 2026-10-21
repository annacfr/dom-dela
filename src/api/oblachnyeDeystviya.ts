import { getStatus, setStatus } from './khranilishche';
import { obnovitOblako } from './oblachnayaSessiya';
import { supabase } from './supabase';
export const vOblake = () => getStatus().cloud;
export const deystvie = async (kind: string, payload: Record<string, unknown> = {}) => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('cloud_action', { p_kind: kind, p_data: payload });
    if (error) { setStatus({ error: error.message }); return false; }
    await obnovitOblako(); return !getStatus().error;
  } catch (error) { setStatus({ error: `Нет соединения: ${String(error)}` }); return false; }
};
