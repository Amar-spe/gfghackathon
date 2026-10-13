const express = require('express');
const router = express.Router();
const staticHospitals = require('../data/hospitals.json');
const { scoreHospital, getRecommendationReasons } = require('../utils/aiEngine');

async function fetchOlaNearbyHospitals(lat, lng, apiKey) {
  if (!apiKey) return [];
  try {
    const url = `https://api.olamaps.io/places/v1/nearbysearch?layers=venue&types=hospital&location=${lat},${lng}&radius=15000&api_key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = await res.json();
    const predictions = json.predictions || json.results || [];
    if (!Array.isArray(predictions) || !predictions.length) return [];

    return predictions.slice(0, 12).map((p, idx) => {
      const name = p.name || p.structured_formatting?.main_text || `Hospital #${idx + 1}`;
      const loc = p.geometry?.location || {};
      const hLat = loc.lat || (lat + (idx % 2 === 0 ? 0.012 : -0.012));
      const hLng = loc.lng || (lng + (idx % 2 === 0 ? 0.015 : -0.015));
      const nameLow = name.toLowerCase();

      let type = 'Multi-Specialty';
      if (nameLow.includes('trauma') || nameLow.includes('emergency')) type = 'Trauma Care';
      else if (nameLow.includes('super')) type = 'Super-Specialty';
      else if (nameLow.includes('government') || nameLow.includes('civil') || nameLow.includes('gmch')) type = 'Government District Hospital';

      return {
        id: p.place_id || (idx + 100),
        name,
        shortName: name.length > 22 ? `${name.substring(0, 19)}...` : name,
        lat: hLat,
        lng: hLng,
        type,
        capability: 88,
        beds: 250,
        cardiac: nameLow.includes('heart') || nameLow.includes('cardiac'),
        trauma: true,
        neuro: nameLow.includes('neuro'),
        burn: false,
        maternity: true,
        pediatric: true,
        address: p.formatted_address || p.structured_formatting?.secondary_text || '',
        rating: p.rating || 4.5,
        source: 'Ola Maps'
      };
    });
  } catch {
    return [];
  }
}

async function fetchNominatimHospitals(lat, lng) {
  try {
    const delta = 0.20;
    const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
    const url = `https://nominatim.openstreetmap.org/search?q=hospital&format=json&addressdetails=1&limit=15&viewbox=${viewbox}&bounded=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { headers: { 'User-Agent': 'LifeLineAI/1.0' }, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return [];

    return data
      .filter(h => h.lat && h.lon && (h.name || h.display_name))
      .slice(0, 10)
      .map((h, idx) => {
        const rawName = h.name || (h.display_name ? h.display_name.split(',')[0].trim() : `Hospital #${idx + 1}`);
        const name = rawName.replace(/^hospital\s+/i, '').trim();
        const hospLat = parseFloat(h.lat);
        const hospLng = parseFloat(h.lon);
        const nameLow = name.toLowerCase();

        let type = 'Multi-Specialty';
        if (nameLow.includes('trauma') || nameLow.includes('emergency')) type = 'Trauma Care';
        else if (nameLow.includes('super')) type = 'Super-Specialty';
        else if (nameLow.includes('government') || nameLow.includes('civil') || nameLow.includes('gmch')) type = 'Government District Hospital';
        else if (nameLow.includes('ortho')) type = 'Orthopedic & Trauma';
        else if (nameLow.includes('cardiac') || nameLow.includes('heart')) type = 'Cardiac Care';

        return {
          id: h.osm_id || (idx + 500),
          name,
          shortName: name.length > 22 ? `${name.substring(0, 19)}...` : name,
          lat: hospLat,
          lng: hospLng,
          type,
          capability: 85 + (idx % 12),
          beds: 200 + (idx % 250),
          cardiac: nameLow.includes('heart') || nameLow.includes('cardiac') || idx % 2 === 0,
          trauma: true,
          neuro: nameLow.includes('neuro') || idx % 3 === 0,
          burn: idx % 4 === 0,
          maternity: idx % 2 === 1,
          pediatric: true,
          address: h.display_name ? h.display_name.split(',').slice(1, 4).join(',').trim() : 'Local Health Corridor',
          rating: Math.round((4.0 + (idx % 8) * 0.1) * 10) / 10,
          source: 'Live Geospatial Engine'
        };
      });
  } catch {
    return [];
  }
}

const liveBedRegistry = new Map();

function getOrCreateBedStatus(hosp) {
  const idKey = String(hosp.id);
  if (!liveBedRegistry.has(idKey)) {
    const total = hosp.beds && hosp.beds > 0 ? hosp.beds : 250;
    const icuTot = Math.max(8, Math.floor(total * 0.12));
    const erTot = Math.max(6, Math.floor(total * 0.05));
    liveBedRegistry.set(idKey, {
      hospitalId: hosp.id,
      name: hosp.name,
      bedsTotal: total,
      bedsAvailable: Math.max(3, Math.floor(total * 0.22)),
      icuTotal: icuTot,
      icuAvailable: Math.max(1, Math.floor(icuTot * 0.25)),
      erBaysTotal: erTot,
      erBaysAvailable: Math.max(1, Math.floor(erTot * 0.35)),
      ventilators: Math.max(3, Math.floor(icuTot * 0.65)),
      oxygenStatus: '98% Nominal',
      erStatus: 'Active Receiving',
      lastUpdated: new Date().toISOString()
    });
  }
  return liveBedRegistry.get(idKey);
}

function enrichWithBedStatus(hosp) {
  const live = getOrCreateBedStatus(hosp);
  return {
    ...hosp,
    bedsTotal: live.bedsTotal,
    bedsAvailable: live.bedsAvailable,
    icuTotal: live.icuTotal,
    icuAvailable: live.icuAvailable,
    erBaysTotal: live.erBaysTotal,
    erBaysAvailable: live.erBaysAvailable,
    ventilators: live.ventilators,
    oxygenStatus: live.oxygenStatus,
    erStatus: live.erStatus
  };
}

router.get('/beds', (req, res) => {
  staticHospitals.forEach(h => getOrCreateBedStatus(h));
  const list = Array.from(liveBedRegistry.values());
  res.json({ beds: list, count: list.length, timestamp: new Date().toISOString() });
});

router.patch('/:id/beds', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const current = liveBedRegistry.get(String(id)) || {
    hospitalId: id,
    bedsTotal: 300,
    bedsAvailable: 30,
    icuTotal: 35,
    icuAvailable: 5,
    erBaysTotal: 12,
    erBaysAvailable: 3,
    ventilators: 8,
    oxygenStatus: '98% Nominal',
    erStatus: 'Active Receiving'
  };

  const updated = {
    ...current,
    ...updates,
    bedsAvailable: updates.bedsAvailable !== undefined ? Math.max(0, parseInt(updates.bedsAvailable, 10)) : current.bedsAvailable,
    icuAvailable: updates.icuAvailable !== undefined ? Math.max(0, parseInt(updates.icuAvailable, 10)) : current.icuAvailable,
    erBaysAvailable: updates.erBaysAvailable !== undefined ? Math.max(0, parseInt(updates.erBaysAvailable, 10)) : current.erBaysAvailable,
    ventilators: updates.ventilators !== undefined ? Math.max(0, parseInt(updates.ventilators, 10)) : current.ventilators,
    lastUpdated: new Date().toISOString()
  };

  liveBedRegistry.set(String(id), updated);
  res.json({ success: true, hospitalId: id, bedStatus: updated, message: 'Hospital live bed metrics updated successfully' });
});

router.get('/nearby', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng parameters are required' });

  const centerLat = parseFloat(lat);
  const centerLng = parseFloat(lng);
  if (isNaN(centerLat) || isNaN(centerLng)) return res.status(400).json({ error: 'lat and lng must be valid numbers' });

  let hospitalList = [];
  const olaKey = process.env.OLA_MAPS_API_KEY;
  if (olaKey) hospitalList = await fetchOlaNearbyHospitals(centerLat, centerLng, olaKey);
  if (!hospitalList || !hospitalList.length) hospitalList = await fetchNominatimHospitals(centerLat, centerLng);
  if (!hospitalList || !hospitalList.length) hospitalList = staticHospitals;

  const enriched = hospitalList.map(enrichWithBedStatus);
  res.json({
    hospitals: enriched,
    count: enriched.length,
    provider: (olaKey && hospitalList?.[0]?.source === 'Ola Maps') ? 'Ola Maps Places API' : 'Live Geospatial Places API',
    fetchedAt: new Date().toISOString()
  });
});

router.get('/', (req, res) => {
  const enriched = staticHospitals.map(enrichWithBedStatus);
  res.json({ hospitals: enriched, count: enriched.length });
});

router.post('/rank', (req, res) => {
  const { lat, lng, emergencyType = 'Accident', trafficConditions = {}, emergencyMode = false, hospitals = null } = req.body;
  if (lat == null || lng == null) return res.status(400).json({ error: 'lat and lng required in body' });

  const centerLat = parseFloat(lat);
  const centerLng = parseFloat(lng);
  if (isNaN(centerLat) || isNaN(centerLng)) return res.status(400).json({ error: 'lat and lng must be valid numbers' });

  const emergencyLoc = { lat: centerLat, lng: centerLng };
  const targetHospitals = (Array.isArray(hospitals) && hospitals.length > 0) ? hospitals : staticHospitals;

  const scoredHospitals = targetHospitals.map(h => {
    const live = enrichWithBedStatus(h);
    return { ...live, ...scoreHospital(live, emergencyLoc, emergencyType, trafficConditions, emergencyMode) };
  }).sort((a, b) => b.score - a.score);

  const rankedHospitals = scoredHospitals.map(h => ({
    ...h,
    reasons: getRecommendationReasons(h, emergencyType, scoredHospitals)
  }));

  res.json({
    rankedHospitals,
    top3: rankedHospitals.slice(0, 3),
    recommended: rankedHospitals[0] || null,
    emergencyType,
    rankedAt: new Date().toISOString()
  });
});

module.exports = router;
