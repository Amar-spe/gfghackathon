const express = require('express');
const router = express.Router();
const { scoreAmbulance } = require('../utils/aiEngine');

const AMBULANCE_SPECS = [
  { type: 'Basic Life Support', equipmentType: 'BLS' },
  { type: 'Advanced Life Support', equipmentType: 'ALS' },
  { type: 'Mobile ICU', equipmentType: 'ICU' },
  { type: 'Cardiac Support', equipmentType: 'Cardiac' },
  { type: 'Trauma Support', equipmentType: 'Trauma' },
  { type: 'Advanced Life Support', equipmentType: 'ALS' }
];

const AMBULANCE_NAMES = ['AMB-001', 'AMB-002', 'AMB-003', 'AMB-004', 'AMB-005', 'AMB-006'];
const DRIVER_NAMES = ['Driver Rajesh', 'Driver Suresh', 'Driver Anita', 'Driver Vikram', 'Driver Priya', 'Driver Arun'];

function generateNearby(lat, lng, radiusKm) {
  const r = radiusKm / 111.32;
  const u = Math.random(), v = Math.random();
  const w = r * Math.sqrt(u), t = 2 * Math.PI * v;
  return {
    lat: lat + w * Math.cos(t),
    lng: lng + (w * Math.sin(t)) / Math.cos(lat * Math.PI / 180)
  };
}

// GET /api/ambulances?lat=12.97&lng=77.59&emergencyType=Accident&emergencyMode=false
router.get('/', (req, res) => {
  const { lat, lng, emergencyType = 'Accident', emergencyMode = 'false' } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required query parameters' });
  }

  const centerLat = parseFloat(lat);
  const centerLng = parseFloat(lng);

  if (isNaN(centerLat) || isNaN(centerLng)) {
    return res.status(400).json({ error: 'lat and lng must be valid numbers' });
  }

  const trafficConditions = {};
  const trafficLevels = ['LOW', 'MEDIUM', 'HIGH'];
  const trafficWeights = [0.4, 0.35, 0.25];

  const getTraffic = () => {
    let r = Math.random(), sum = 0;
    for (let i = 0; i < trafficWeights.length; i++) {
      sum += trafficWeights[i];
      if (r < sum) return trafficLevels[i];
    }
    return 'LOW';
  };

  const statusChoices = ['available', 'available', 'available', 'busy', 'returning', 'maintenance'];

  const ambulances = Array.from({ length: 6 }, (_, i) => {
    const radiusKm = 0.5 + Math.random() * 2.5;
    const pos = generateNearby(centerLat, centerLng, radiusKm);
    const spec = AMBULANCE_SPECS[i % AMBULANCE_SPECS.length];
    const status = statusChoices[i % statusChoices.length];
    const isStationary = status === 'busy' || status === 'maintenance';

    const ambulance = {
      id: i + 1,
      name: AMBULANCE_NAMES[i],
      lat: pos.lat,
      lng: pos.lng,
      equipment: 65 + Math.floor(Math.random() * 35),
      status,
      type: spec.type,
      equipmentType: spec.equipmentType,
      driver: DRIVER_NAMES[i],
      crewSize: 2 + Math.floor(Math.random() * 2),
      speed: isStationary ? 0 : 35 + Math.floor(Math.random() * 25),
      contact: `+91-98${Math.floor(1000000 + Math.random() * 8999999)}`
    };
    trafficConditions[`amb_${ambulance.id}`] = getTraffic();
    return ambulance;
  });

  // Score all ambulances considering emergency type and traffic
  const emergencyLoc = { lat: centerLat, lng: centerLng };
  const isEmergencyMode = emergencyMode === 'true';

  const scoredAmbulances = ambulances.map(amb => {
    const scoring = scoreAmbulance(amb, emergencyLoc, trafficConditions, isEmergencyMode, emergencyType);
    return { ...amb, ...scoring };
  }).sort((a, b) => {
    // Available units ALWAYS rank ahead of non-available units
    const aAvail = a.status === 'available';
    const bAvail = b.status === 'available';
    if (aAvail && !bAvail) return -1;
    if (!aAvail && bAvail) return 1;
    return b.score - a.score;
  });

  // Never designate a busy or maintenance unit as bestAmbulanceId
  const bestAvailable = scoredAmbulances.find(a => a.status === 'available') || null;

  res.json({
    ambulances: scoredAmbulances,
    trafficConditions,
    bestAmbulanceId: bestAvailable ? bestAvailable.id : null,
    emergencyType,
    generatedAt: new Date().toISOString()
  });
});

module.exports = router;
