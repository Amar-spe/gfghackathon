const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

if (url && key) {
  supabase = createClient(url, key, { auth: { persistSession: false } });
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_KEY missing — Supabase features disabled (demo mode)');
}

// Express middleware: verifies the user's Supabase login token
async function requireAuth(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured. Running in demo mode.' });
  }
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Login required' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session' });
  }
  req.user = data.user;
  next();
}

module.exports = { supabase, requireAuth };