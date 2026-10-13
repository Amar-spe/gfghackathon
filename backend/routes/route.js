const express = require('express');
const router = express.Router();
const { olaDirections, testOlaConnection } = require('../utils/ola');

const interpolate = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const addWaypoint = (lat, lng, scale = 0.004) => [lat + (Math.random() - 0.5) * scale, lng + (Math.random() - 0.5) * scale];

function haversine(a, b) {
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function generateRoute(from, through, to, steps = 120) {
  const leg1 = [from, addWaypoint((from[0] * 2 + through[0]) / 3, (from[1] * 2 + through[1]) / 3, 0.003), addWaypoint((from[0] + through[0] * 2) / 3, (from[1] + through[1] * 2) / 3, 0.003), through];
  const leg2 = [through, addWaypoint((through[0] * 2 + to[0]) / 3, (through[1] * 2 + to[1]) / 3, 0.003), addWaypoint((through[0] + to[0] * 2) / 3, (through[1] + to[1] * 2) / 3, 0.003), to];

  const points = [];
  const stepsL1 = Math.floor(steps * 0.45);
  const stepsL2 = steps - stepsL1;

  for (let i = 0; i < stepsL1; i++) {
    const seg = (i / stepsL1) * (leg1.length - 1);
    const idx = Math.floor(seg);
    if (idx < leg1.length - 1) points.push(interpolate(leg1[idx], leg1[idx + 1], seg - idx));
  }
  points.push(through);

  for (let i = 0; i <= stepsL2; i++) {
    const seg = (i / stepsL2) * (leg2.length - 1);
    const idx = Math.floor(seg);
    if (idx < leg2.length - 1) points.push(interpolate(leg2[idx], leg2[idx + 1], seg - idx));
  }
  return points;
}

router.get('/status', (req, res) => {
  const hasKey = Boolean(process.env.OLA_MAPS_API_KEY);
  res.json({
    olaConfigured: hasKey,
    provider: hasKey ? 'Ola Maps Directions API (Active)' : 'Simulated Dynamic Spline Engine (Fallback)',
    maskedKey: hasKey ? `${process.env.OLA_MAPS_API_KEY.slice(0, 4)}...${process.env.OLA_MAPS_API_KEY.slice(-4)}` : null,
    message: hasKey ? 'Ola Maps live turn-by-turn routing is active' : 'Set OLA_MAPS_API_KEY in backend/.env to enable live Ola road directions'
  });
});

router.post('/test-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ success: false, error: 'apiKey string required in request body' });
  const result = await testOlaConnection(apiKey);
  res.json(result);
});

router.post('/', async (req, res) => {
  const { ambulance, emergency, hospital, emergencyMode = false, olaApiKey = null } = req.body;
  if (!ambulance || !emergency || !hospital) {
    return res.status(400).json({ error: 'ambulance, emergency, hospital coordinates required' });
  }

  const from = [ambulance.lat, ambulance.lng];
  const through = [emergency.lat, emergency.lng];
  const to = [hospital.lat, hospital.lng];

  let routePoints = [];
  let totalDistance = 0;
  let normalTime = 0;
  let pickupIndex = 0;
  let routingProvider = 'simulated';
  let olaError = null;

  const activeOlaKey = olaApiKey || process.env.OLA_MAPS_API_KEY;
  if (activeOlaKey) {
    try {
      const [leg1, leg2] = await Promise.all([
        olaDirections(from, through, activeOlaKey),
        olaDirections(through, to, activeOlaKey)
      ]);
      if (leg1.points.length > 0 && leg2.points.length > 0) {
        routePoints = [...leg1.points, ...leg2.points.slice(1)];
        pickupIndex = leg1.points.length - 1;
        totalDistance = (leg1.meters + leg2.meters) / 1000;
        normalTime = (leg1.seconds + leg2.seconds) / 60;
        routingProvider = 'ola_maps';
      }
    } catch (err) {
      olaError = err.message;
    }
  }

  if (routePoints.length === 0) {
    routePoints = generateRoute(from, through, to, 120);
    totalDistance = 0;
    for (let i = 1; i < routePoints.length; i++) {
      totalDistance += haversine(routePoints[i - 1], routePoints[i]);
    }
    normalTime = (totalDistance / 35) * 60;
    pickupIndex = Math.floor(routePoints.length * 0.45);
    routingProvider = 'simulated';
  }

  const optimizedTime = normalTime * (emergencyMode ? 0.58 : 0.78);

  res.json({
    route: routePoints,
    totalPoints: routePoints.length,
    totalDistance: Math.round(totalDistance * 100) / 100,
    normalTime: Math.round(normalTime * 10) / 10,
    optimizedTime: Math.round(optimizedTime * 10) / 10,
    pickupIndex,
    routingProvider,
    olaConfigured: Boolean(activeOlaKey),
    olaError,
    calculatedAt: new Date().toISOString()
  });
});

module.exports = router;
