import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const preview = Boolean(env.VERCEL || env.CF_PAGES);
  if (preview && (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY))
    throw new Error('Preview requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
  return { plugins: [react()], base: preview ? '/' : '/dom-dela/', server: { port: 5173 }, build: {
    rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ }] } } }
  } };
});
