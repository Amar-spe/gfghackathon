const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
  : '*';

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/', (req, res) => {
  const hasOla = Boolean(process.env.OLA_MAPS_API_KEY);
  const hasSupabase = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY));
  res.send(`<!DOCTYPE html><html><head><title>LifeLine AI API</title><meta charset="utf-8"/><style>body{font-family:sans-serif;background:#0b1220;color:#c8e0f4;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:#10243a;border:1px solid #1e3a5f;border-radius:12px;padding:28px;max-width:520px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.4)}.badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700}.ok{background:#0d948822;color:#14b8a6;border:1px solid #0d948844}.warn{background:#d9770622;color:#f59e0b;border:1px solid #d9770644}.btn{display:inline-block;background:#0d9488;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px}</style></head><body><div class="card"><h2 style="color:#f8fafc;margin-top:0">LifeLine AI Backend API</h2><p style="color:#94a3b8;font-size:13px">Active on Port 3001</p><p><span class="badge ${hasOla ? 'ok' : 'warn'}">Ola Maps: ${hasOla ? 'CONNECTED' : 'STANDBY'}</span> <span class="badge ${hasSupabase ? 'ok' : 'warn'}">Supabase: ${hasSupabase ? 'CONFIGURED' : 'DEMO MODE'}</span></p><a href="http://localhost:3000" class="btn">Open Dispatcher Dashboard</a></div></body></html>`);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'LifeLine AI Backend',
    olaConfigured: Boolean(process.env.OLA_MAPS_API_KEY),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL),
    timestamp: new Date().toISOString()
  });
});

app.use('/api/ambulances', require('./routes/ambulances'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/calculate-route', require('./routes/route'));
app.use('/api/ai-decision', require('./routes/aiDecision'));
app.use('/api/citizen', require('./routes/citizen'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`LifeLine AI Backend running on port ${PORT}`));
