const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (url && key) {
  try {
    supabase = createClient(url, key, { auth: { persistSession: false } });
  } catch (err) {
    console.warn('Supabase initialization failed:', err.message);
  }
}

async function requireAuth(req, res, next) {
  if (!supabase) {
    req.user = {
      id: 'demo-citizen-user-001',
      email: 'aarav@lifeline.org',
      user_metadata: { full_name: 'Aarav Sharma' }
    };
    return next();
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Authorization header required' });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ success: false, error: 'Invalid or expired Supabase session' });
    req.user = data.user;
    next();
  } catch (e) {
    return res.status(500).json({ success: false, error: `Auth validation failed: ${e.message}` });
  }
}

module.exports = { supabase, requireAuth };
