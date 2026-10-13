export const TRAFFIC_LEVELS = {
  LOW: { label: 'Low', color: '#0d9488', hexOpacity: '#0d948866', multiplier: 1.0, weight: 5 },
  MEDIUM: { label: 'Medium', color: '#d97706', hexOpacity: '#d9770666', multiplier: 1.45, weight: 6 },
  HIGH: { label: 'High', color: '#dc2626', hexOpacity: '#dc262666', multiplier: 2.15, weight: 7 }
};

const LEVEL_NAMES = ['LOW', 'MEDIUM', 'HIGH'];

function weightedRandom(weights = [0.40, 0.35, 0.25]) {
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r < sum) return LEVEL_NAMES[i];
  }
  return 'LOW';
}

export function estimateTrafficFromTimeOfDay(hour = new Date().getHours()) {
  if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20)) return 'HIGH';
  if ((hour >= 10 && hour < 17) || (hour >= 20 && hour < 23)) return 'MEDIUM';
  return 'LOW';
}

export async function fetchRealTimeTraffic(lat, lng) {
  const key = import.meta.env.VITE_TOMTOM_KEY;
  const estimatedLevel = estimateTrafficFromTimeOfDay();
  if (!key) return { fallback: estimatedLevel };

  const bboxExpand = 0.12;
  const bbox = `${lng - bboxExpand},${lat - bboxExpand},${lng + bboxExpand},${lat + bboxExpand}`;
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bbox}&fields=%7Bincidents%7Btype%2Cgeometry%7Btype%2Ccoordinates%7D%2Cproperties%7BmagnitudeOfDelay%7D%7D%7D&language=en-GB&categoryFilter=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%2C11&timeValidityFilter=present`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return { fallback: estimatedLevel };

    const data = await res.json();
    const incidents = data?.incidents || [];
    const incidentMap = {};
    incidents.forEach((inc, i) => {
      const delay = inc.properties?.magnitudeOfDelay ?? 0;
      incidentMap[`incident_${i}`] = delay >= 3 ? 'HIGH' : delay >= 1 ? 'MEDIUM' : 'LOW';
    });
    return incidentMap;
  } catch {
    return { fallback: estimatedLevel };
  }
}

export async function fetchFlowSegment(lat, lng) {
  const key = import.meta.env.VITE_TOMTOM_KEY;
  if (!key) return null;
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${key}&point=${lat},${lng}&unit=KMPH`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.flowSegmentData ?? null;
  } catch {
    return null;
  }
}

export function levelFromFlowSegment(flowData) {
  if (!flowData) return 'MEDIUM';
  const ratio = flowData.currentSpeed / Math.max(flowData.freeFlowSpeed, 1);
  return ratio < 0.4 ? 'HIGH' : ratio < 0.7 ? 'MEDIUM' : 'LOW';
}

export function generateTrafficConditions(ambulances, hospitals, weights, realIncidents = null) {
  const conditions = {};
  const hasRealData = realIncidents && Object.keys(realIncidents).length > 0;
  const incidentSeverities = hasRealData ? Object.values(realIncidents) : [];
  const highCount = incidentSeverities.filter(v => v === 'HIGH').length;
  const medCount = incidentSeverities.filter(v => v === 'MEDIUM').length;

  let adjustedWeights = highCount > 3 ? [0.15, 0.30, 0.55] : highCount > 1 ? [0.25, 0.40, 0.35] : medCount > 2 ? [0.35, 0.45, 0.20] : (weights || [0.45, 0.35, 0.20]);

  ambulances.forEach(a => { conditions[`amb_${a.id}`] = weightedRandom(adjustedWeights); });
  hospitals.forEach(h => { conditions[`hosp_${h.id}`] = weightedRandom(adjustedWeights); });
  return conditions;
}

export function simulateTrafficIncrease(current) {
  const upgraded = { ...current };
  Object.keys(upgraded).forEach(key => {
    const r = Math.random();
    if (upgraded[key] === 'LOW' && r < 0.65) upgraded[key] = 'MEDIUM';
    if (upgraded[key] === 'MEDIUM' && r < 0.55) upgraded[key] = 'HIGH';
  });
  return upgraded;
}

export function easeTraffic(current) {
  const eased = { ...current };
  Object.keys(eased).forEach(key => {
    if (eased[key] === 'HIGH' && Math.random() < 0.45) eased[key] = 'MEDIUM';
    if (eased[key] === 'MEDIUM' && Math.random() < 0.35) eased[key] = 'LOW';
  });
  return eased;
}

export function getOverallTrafficLevel(conditions) {
  const vals = Object.values(conditions);
  if (!vals.length) return 0;
  const scores = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  return (vals.reduce((s, v) => s + (scores[v] || 0), 0) / vals.length) / 2;
}

export function shouldReroute(conditions, routeProgress) {
  if (routeProgress < 10 || routeProgress > 85) return false;
  const vals = Object.values(conditions);
  if (!vals.length) return false;
  return vals.filter(v => v === 'HIGH').length / vals.length > 0.4;
}

export function generateTrafficSegments(route, conditions, emergencyMode) {
  if (!route || route.length < 4) return [];
  const numSegs = Math.min(24, Math.max(8, Math.floor(route.length / 6)));
  const segLen = Math.floor(route.length / numSegs);
  const pool = Object.values(conditions).length ? Object.values(conditions) : ['LOW', 'MEDIUM', 'HIGH'];

  const segments = [];
  for (let i = 0; i < numSegs; i++) {
    const start = i * segLen;
    const end = Math.min(start + segLen + 1, route.length);
    const lvl = emergencyMode ? 'LOW' : pool[i % pool.length];
    const info = TRAFFIC_LEVELS[lvl] || TRAFFIC_LEVELS.MEDIUM;
    segments.push({
      positions: route.slice(start, end),
      level: lvl,
      color: info.color,
      weight: info.weight
    });
  }
  return segments;
}
