import { createClient } from '@supabase/supabase-js';
 
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 
// If the env vars are missing the app still runs in demo mode (no crash).
export const isSupabaseConfigured = Boolean(url && anonKey);
 
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
 
// Attaches the logged-in user's token to calls made to our own backend
export async function authHeaders() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
