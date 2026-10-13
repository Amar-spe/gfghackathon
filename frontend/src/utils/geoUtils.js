const toRad = deg => deg * Math.PI / 180;

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function snapToRoad(lat, lng) {
  try {
    const url = `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.waypoints?.length > 0) {
      const [snappedLng, snappedLat] = data.waypoints[0].location;
      return { lat: snappedLat, lng: snappedLng };
    }
  } catch {}
  return { lat, lng };
}

export function generateNearbyCoords(lat, lng, radiusKm) {
  const r = radiusKm / 111.32;
  const w = r * Math.sqrt(Math.random());
  const t = 2 * Math.PI * Math.random();
  return {
    lat: lat + w * Math.cos(t),
    lng: lng + (w * Math.sin(t)) / Math.cos(toRad(lat))
  };
}

export async function generateRoadAmbulances(emergencyLat, emergencyLng, count = 6, nearbyHospitals = []) {
  const ambulanceSpecs = [
    { type: 'Basic Life Support', equipmentType: 'BLS' },
    { type: 'Advanced Life Support', equipmentType: 'ALS' },
    { type: 'Mobile ICU', equipmentType: 'ICU' },
    { type: 'Cardiac Support', equipmentType: 'Cardiac' },
    { type: 'Trauma Support', equipmentType: 'Trauma' },
    { type: 'Mobile ICU', equipmentType: 'ICU' }
  ];
  const driverNames = ['Driver Rajesh', 'Driver Suresh', 'Driver Anita', 'Driver Vikram', 'Driver Priya', 'Driver Arun'];
  const statusChoices = ['available', 'available', 'available', 'busy', 'returning', 'maintenance'];
  const units = [];

  for (let i = 0; i < count; i++) {
    let baseLat = emergencyLat;
    let baseLng = emergencyLng;
    let radiusKm = 0.5 + Math.random() * 2.2;

    if (nearbyHospitals?.length > 0 && i % 2 === 0) {
      const hosp = nearbyHospitals[i % nearbyHospitals.length];
      baseLat = hosp.lat;
      baseLng = hosp.lng;
      radiusKm = 0.2 + Math.random() * 0.6;
    }

    const nearby = generateNearbyCoords(baseLat, baseLng, radiusKm);
    const snapped = await snapToRoad(nearby.lat, nearby.lng);
    const spec = ambulanceSpecs[i % ambulanceSpecs.length];
    const status = statusChoices[i % statusChoices.length];
    const isStationary = status === 'busy' || status === 'maintenance';

    units.push({
      id: i + 1,
      name: `AMB-${String(i + 1).padStart(3, '0')}`,
      lat: snapped.lat,
      lng: snapped.lng,
      equipment: 65 + Math.floor(Math.random() * 35),
      status,
      type: spec.type,
      equipmentType: spec.equipmentType,
      driver: driverNames[i % driverNames.length],
      crewSize: 2 + Math.floor(Math.random() * 2),
      speed: isStationary ? 0 : 35 + Math.floor(Math.random() * 25)
    });
  }
  return units;
}

const API_BASE = (typeof process !== 'undefined' && process.env?.VITE_BACKEND_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ||
  'http://localhost:3001';

async function fetchRoadRoute(waypoints, profile = 'driving-car') {
  if (waypoints?.length >= 2) {
    try {
      const fromPt = waypoints[0];
      const toPt = waypoints[waypoints.length - 1];
      const midPt = waypoints.length > 2 ? waypoints[Math.floor(waypoints.length / 2)] : [(fromPt[0] + toPt[0]) / 2, (fromPt[1] + toPt[1]) / 2];

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${API_BASE}/api/calculate-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambulance: { lat: fromPt[0], lng: fromPt[1] },
          emergency: { lat: midPt[0], lng: midPt[1] },
          hospital: { lat: toPt[0], lng: toPt[1] }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.route?.length > 5) {
          return {
            waypoints: data.route,
            distanceKm: data.totalDistance,
            durationMin: data.optimizedTime || data.normalTime,
            provider: data.routingProvider || 'ola_maps'
          };
        }
      }
    } catch {}
  }

  const coordStr = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const r = data?.routes?.[0];
      const coords = r?.geometry?.coordinates;
      if (coords?.length > 10) {
        return {
          waypoints: coords.map(([lng, lat]) => [lat, lng]),
          distanceKm: Math.round((r.distance / 1000) * 100) / 100,
          durationMin: Math.round((r.duration / 60) * 10) / 10
        };
      }
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': '5b3ce3597851110001cf6248a5a5a5ef9c3a4372b5efdf11d5a51ef8' },
      body: JSON.stringify({ coordinates: waypoints.map(([lat, lng]) => [lng, lat]), instructions: false, geometry_simplify: false }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const feat = data?.features?.[0];
      const coords = feat?.geometry?.coordinates;
      if (coords?.length > 10) {
        const props = feat?.properties?.summary;
        return {
          waypoints: coords.map(([lng, lat]) => [lat, lng]),
          distanceKm: props?.distance ? Math.round((props.distance / 1000) * 100) / 100 : null,
          durationMin: props?.duration ? Math.round((props.duration / 60) * 10) / 10 : null
        };
      }
    }
  } catch {}

  return null;
}

async function fetchOsrmAllRoutes(f, m, t) {
  try {
    const coordStr = `${f[1]},${f[0]};${m[1]},${m[0]};${t[1]},${t[0]}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false&alternatives=3`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.routes?.length ? data : null;
  } catch {
    return null;
  }
}

async function fetchOrsAvoidRoute(f, m, t, avoidFeatures) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': '5b3ce3597851110001cf6248a5a5a5ef9c3a4372b5efdf11d5a51ef8' },
      body: JSON.stringify({
        coordinates: [[f[1], f[0]], [m[1], m[0]], [t[1], t[0]]],
        instructions: false,
        geometry_simplify: false,
        options: { avoid_features: avoidFeatures }
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data?.features?.[0];
    const coords = feat?.geometry?.coordinates;
    if (!coords || coords.length < 10) return null;
    const props = feat?.properties?.summary;
    return {
      waypoints: coords.map(([lng, lat]) => [lat, lng]),
      distanceKm: props?.distance ? Math.round((props.distance / 1000) * 100) / 100 : null,
      durationMin: props?.duration ? Math.round((props.duration / 60) * 10) / 10 : null
    };
  } catch {
    return null;
  }
}

export async function generateDualRoutes(from, through, to) {
  const f = Array.isArray(from) ? from : [from.lat, from.lng];
  const m = Array.isArray(through) ? through : [through.lat, through.lng];
  const t = Array.isArray(to) ? to : [to.lat, to.lng];

  const [osrmResult, orsAvoidResult, orsHighwayResult] = await Promise.all([
    fetchOsrmAllRoutes(f, m, t),
    fetchOrsAvoidRoute(f, m, t, ['tollways', 'ferries']),
    fetchOrsAvoidRoute(f, m, t, ['highways'])
  ]);

  const toRouteObj = r => r ? {
    waypoints: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: Math.round((r.distance / 1000) * 100) / 100,
    durationMin: Math.round((r.duration / 60) * 10) / 10
  } : null;

  const normalObj = toRouteObj(osrmResult?.routes?.[0]) || await fetchRoadRoute([f, m, t]);
  const optimalObj = toRouteObj(osrmResult?.routes?.[1]) || orsAvoidResult;
  const alternativeObj = orsHighwayResult || toRouteObj(osrmResult?.routes?.[2]) || await fetchRoadRoute([f, m, t]);
  const fallback = normalObj || { waypoints: [], distanceKm: null, durationMin: null };

  return {
    shortest: (normalObj || fallback).waypoints,
    optimal: (optimalObj || normalObj || fallback).waypoints,
    alternative: (alternativeObj || normalObj || fallback).waypoints,
    metrics: {
      normal: { distanceKm: (normalObj || fallback).distanceKm, durationMin: (normalObj || fallback).durationMin },
      optimal: { distanceKm: (optimalObj || normalObj || fallback).distanceKm, durationMin: (optimalObj || normalObj || fallback).durationMin },
      alternative: { distanceKm: (alternativeObj || normalObj || fallback).distanceKm, durationMin: (alternativeObj || normalObj || fallback).durationMin }
    }
  };
}

export async function rerouteFromPosition(currentPos, hospitalPos) {
  const f = currentPos;
  const t = Array.isArray(hospitalPos) ? hospitalPos : [hospitalPos.lat, hospitalPos.lng];

  const primary = await fetchRoadRoute([f, t], 'driving-car');
  if (!primary) return null;

  let alternate = null;
  try {
    const coordStr = `${f[1]},${f[0]};${t[1]},${t[0]}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false&alternatives=true`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const altRoute = data?.routes?.[1];
      if (altRoute?.geometry?.coordinates?.length > 2) {
        alternate = {
          waypoints: altRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          durationSecs: altRoute.duration,
          distanceMeters: altRoute.distance
        };
      }
    }
  } catch {}

  return { primary, alternates: alternate ? [alternate] : [] };
}

export async function generateRouteWaypoints(from, through, to) {
  const { shortest } = await generateDualRoutes(from, through, to);
  return { primary: shortest, alternates: [] };
}

export function getPickupIndex(route) {
  return Math.floor(route.length * 0.42);
}

export function getBearing(from, to) {
  const lat1 = toRad(from[0]), lat2 = toRad(to[0]);
  const dLng = toRad(to[1] - from[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export async function fetchHospitalsFromBackend(lat, lng) {
  try {
    const backendUrl = `${API_BASE}/api/hospitals/nearby?lat=${lat}&lng=${lng}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(backendUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.hospitals) && data.hospitals.length > 0) {
        return data.hospitals;
      }
    }
  } catch {}

  try {
    const delta = 0.20;
    const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
    const url = `https://nominatim.openstreetmap.org/search?q=hospital&format=json&limit=12&viewbox=${viewbox}&bounded=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'LifeLineAI/1.0' } });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        return list.map((h, idx) => {
          const rawName = h.name || (h.display_name ? h.display_name.split(',')[0].trim() : `Hospital #${idx + 1}`);
          const name = rawName.replace(/^hospital\s+/i, '').trim();
          const nameLow = name.toLowerCase();

          let type = 'Multi-Specialty';
          if (nameLow.includes('trauma')) type = 'Trauma Care';
          else if (nameLow.includes('super')) type = 'Super-Specialty';
          else if (nameLow.includes('government') || nameLow.includes('civil') || nameLow.includes('gmch')) type = 'Government District Hospital';
          else if (nameLow.includes('ortho')) type = 'Orthopedic & Trauma';

          return {
            id: h.osm_id || (idx + 700),
            name,
            shortName: name.length > 20 ? `${name.slice(0, 18)}...` : name,
            lat: parseFloat(h.lat),
            lng: parseFloat(h.lon),
            type,
            capability: 88,
            bedsTotal: 350,
            bedsAvailable: 45,
            icuTotal: 30,
            icuAvailable: 8,
            erBaysTotal: 16,
            erBaysAvailable: 6,
            ventilators: 12,
            oxygenStatus: '98% Nominal',
            erStatus: 'Active Receiving',
            cardiac: true,
            trauma: true,
            neuro: true,
            burn: false,
            maternity: true,
            pediatric: true,
            address: h.display_name ? h.display_name.split(',').slice(1, 4).join(',').trim() : 'Emergency Corridor',
            rating: 4.6
          };
        });
      }
    }
  } catch {}

  return [];
}

export const fetchNearbyHospitals = (lat, lng) => fetchHospitalsFromBackend(lat, lng);
