const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ambulancesRouter = require('./routes/ambulances');
const hospitalsRouter = require('./routes/hospitals');
const routeRouter = require('./routes/route');
const aiDecisionRouter = require('./routes/aiDecision');
const citizenRouter = require('./routes/citizen');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
  : '*';

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Root status route (prevents "Cannot GET /" when visiting port 3001)
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>LifeLine AI - Backend API</title></head>
      <body style="font-family:sans-serif; background:#071525; color:#c8e0f4; padding:40px; text-align:center;">
        <h1 style="color:#00d4ff;">🚑 LifeLine AI - Backend API Server</h1>
        <p style="font-size:16px; color:#a0c0d8;">The backend server is running successfully on <strong>Port 3001</strong>.</p>
        <p style="font-size:18px; margin-top:24px;">
          👉 To view the <strong>Web Application UI</strong>, open: <br/><br/>
          <a href="http://localhost:3000" style="background:#00d4ff; color:#040c18; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">
            Open App (http://localhost:3000)
          </a>
        </p>
        <div style="margin-top:40px; font-size:13px; color:#4a7090;">
          API endpoints: /api/citizen/config | /api/ambulances | /api/hospitals | /health
        </div>
      </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'LifeLine AI Backend', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/ambulances', ambulancesRouter);
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/calculate-route', routeRouter);
app.use('/api/ai-decision', aiDecisionRouter);
app.use('/api/citizen', citizenRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚑 LifeLine AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints:`);
  console.log(`   GET  /api/ambulances?lat=&lng=`);
  console.log(`   GET  /api/hospitals`);
  console.log(`   POST /api/calculate-route`);
  console.log(`   POST /api/ai-decision\n`);
});
