import { calculateDistance } from './geoUtils.js';

// ─── Emergency Profiles ────────────────────────────────────────────
export const EMERGENCY_PROFILES = {
  'Cardiac Arrest': {
    cardiac: 3.0, trauma: 0.5, neuro: 1.5, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5,
    severity: 5, speedWeight: 3.0, targetWindowMin: 8, label: 'CRITICAL', color: '#ff3333',
    requiredSpecialty: 'cardiac', urgencyTier: 'CRITICAL'
  },
  'Heart Attack': {
    cardiac: 3.0, trauma: 0.5, neuro: 1.5, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5,
    severity: 5, speedWeight: 3.0, targetWindowMin: 8, label: 'CRITICAL', color: '#ff3333',
    requiredSpecialty: 'cardiac', urgencyTier: 'CRITICAL'
  },
  'Stroke': {
    cardiac: 1.5, trauma: 0.5, neuro: 3.0, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5,
    severity: 5, speedWeight: 3.0, targetWindowMin: 10, label: 'CRITICAL', color: '#ff3333',
    requiredSpecialty: 'neuro', urgencyTier: 'CRITICAL'
  },
  'Accident': {
    cardiac: 1.0, trauma: 3.0, neuro: 2.0, burn: 1.0, maternity: 0.5, pediatric: 1.0, general: 0.8,
    severity: 4, speedWeight: 2.5, targetWindowMin: 15, label: 'SEVERE', color: '#ff8800',
    requiredSpecialty: 'trauma', urgencyTier: 'HIGH'
  },
  'Trauma': {
    cardiac: 1.5, trauma: 3.0, neuro: 2.5, burn: 1.0, maternity: 0.5, pediatric: 1.0, general: 0.8,
    severity: 4, speedWeight: 2.0, targetWindowMin: 15, label: 'SEVERE', color: '#ffa500',
    requiredSpecialty: 'trauma', urgencyTier: 'HIGH'
  },
  'Burn': {
    cardiac: 1.0, trauma: 1.5, neuro: 1.0, burn: 3.0, maternity: 0.5, pediatric: 1.0, general: 0.8,
    severity: 3, speedWeight: 1.8, targetWindowMin: 20, label: 'MODERATE', color: '#ff5500',
    requiredSpecialty: 'burn', urgencyTier: 'URGENT'
  },
  'Pregnancy': {
    cardiac: 1.0, trauma: 1.0, neuro: 1.0, burn: 0.5, maternity: 3.0, pediatric: 1.5, general: 1.0,
    severity: 3, speedWeight: 1.5, targetWindowMin: 20, label: 'MODERATE', color: '#aa88ff',
    requiredSpecialty: 'maternity', urgencyTier: 'URGENT'
  },
  'Pediatric': {
    cardiac: 1.0, trauma: 1.5, neuro: 1.0, burn: 1.0, maternity: 0.5, pediatric: 3.0, general: 1.0,
    severity: 4, speedWeight: 2.2, targetWindowMin: 15, label: 'SEVERE', color: '#ff66aa',
    requiredSpecialty: 'pediatric', urgencyTier: 'HIGH'
  },
  'General': {
    cardiac: 0.8, trauma: 0.8, neuro: 0.8, burn: 0.8, maternity: 0.8, pediatric: 0.8, general: 3.0,
    severity: 2, speedWeight: 1.0, targetWindowMin: 30, label: 'MODERATE', color: '#00d4ff',
    requiredSpecialty: null, urgencyTier: 'STANDARD'
  }
};

const TRAFFIC_MULTIPLIERS = { LOW: 1.0, MEDIUM: 1.45, HIGH: 2.15 };
const EMERGENCY_REDUCTION  = 0.58;

export function getTrafficMultiplier(level, emergencyMode) {
  const base = TRAFFIC_MULTIPLIERS[level] || 1.0;
  return emergencyMode ? base * EMERGENCY_REDUCTION : base;
}

// ─── Dispatch Urgency Assessment ───────────────────────────────────
export function getDispatchUrgencyAssessment(totalTransitMinutes, emergencyType) {
  const profile = EMERGENCY_PROFILES[emergencyType] || EMERGENCY_PROFILES['General'];
  const targetMin = profile.targetWindowMin || 20;
  const transitMin = Math.max(0.1, Number(totalTransitMinutes) || 10);
  const ratio = transitMin / targetMin;

  let etaPerformance = 'OPTIMAL_RESPONSE';
  if (ratio > 1.5) {
    etaPerformance = 'CRITICAL_DELAY';
  } else if (ratio > 1.0) {
    etaPerformance = 'EXTENDED_RESPONSE';
  }

  return {
    urgencyTier: profile.urgencyTier,
    targetWindowMin: targetMin,
    totalTransitMin: Math.round(transitMin * 10) / 10,
    etaPerformance,
    recommendationSummary: `Clinical target for ${emergencyType}: ${targetMin} min. Projected transit: ${transitMin.toFixed(1)} min (${etaPerformance.replace('_', ' ').toLowerCase()}).`
  };
}

export function calculateSurvivalProbability() {
  return null;
}

// ─── Ambulance Scoring ─────────────────────────────────────────────
// 35% Distance, 35% Estimated Travel Time, 20% Equipment Match, 10% Availability
export function scoreAmbulance(ambulance, emergencyLoc, trafficConditions = {}, emergencyMode = false, emergencyType = 'General') {
  const dist = calculateDistance(ambulance.lat, ambulance.lng, emergencyLoc.lat, emergencyLoc.lng);
  const trafficLevel = trafficConditions[`amb_${ambulance.id}`] || 'LOW';
  const mult = getTrafficMultiplier(trafficLevel, emergencyMode);
  const effectiveDist = dist * mult;
  const etaMins = (effectiveDist / 40) * 60;

  // 35% distance score — rational smooth decay
  const distScore = 35 / (1 + effectiveDist / 10);

  // 35% ETA score — rational smooth decay
  const timeScore = 35 / (1 + etaMins / 12);

  // 20% equipment score (0 to 20 pts)
  const baseEquip = ((ambulance.equipment || 70) / 100) * 8;

  const ambType = ambulance.type || '';
  const equipType = ambulance.equipmentType || '';
  let matchBonus = 5;

  const isICU = ambType.includes('ICU') || equipType === 'ICU';
  const isCardiac = ambType.includes('Cardiac') || equipType === 'Cardiac';
  const isTrauma = ambType.includes('Trauma') || equipType === 'Trauma';
  const isALS = ambType.includes('Advanced Life Support') || equipType === 'ALS';
  const isBLS = ambType.includes('Basic Life Support') || equipType === 'BLS';

  switch (emergencyType) {
    case 'Cardiac Arrest':
    case 'Heart Attack':
      if (isCardiac) matchBonus = 12;
      else if (isICU) matchBonus = 11;
      else if (isALS) matchBonus = 8;
      else if (isTrauma) matchBonus = 4;
      else matchBonus = 3;
      break;

    case 'Stroke':
      if (isICU) matchBonus = 12;
      else if (isALS) matchBonus = 10;
      else if (isCardiac) matchBonus = 6;
      else if (isTrauma) matchBonus = 5;
      else matchBonus = 3;
      break;

    case 'Accident':
    case 'Trauma':
      if (isTrauma) matchBonus = 12;
      else if (isICU) matchBonus = 11;
      else if (isALS) matchBonus = 8;
      else if (isCardiac) matchBonus = 4;
      else matchBonus = 3;
      break;

    case 'Burn':
      if (isALS) matchBonus = 12;
      else if (isICU) matchBonus = 11;
      else if (isTrauma) matchBonus = 8;
      else matchBonus = 4;
      break;

    case 'Pregnancy':
      if (isALS) matchBonus = 12;
      else if (isICU) matchBonus = 11;
      else if (isBLS) matchBonus = 6;
      else matchBonus = 4;
      break;

    case 'Pediatric':
      if (isICU) matchBonus = 12;
      else if (isALS) matchBonus = 10;
      else if (isBLS) matchBonus = 6;
      else matchBonus = 5;
      break;

    case 'General':
    default:
      if (isALS || isICU) matchBonus = 10;
      else if (isCardiac || isTrauma) matchBonus = 8;
      else matchBonus = 7;
      break;
  }

  const equipScore = Math.min(20, baseEquip + matchBonus);

  // 10% availability score
  // Busy or maintenance units must NEVER outrank available units
  const status = ambulance.status || 'available';
  let availScore = 0;
  let isAvailable = false;
  let dispatchable = false;

  if (status === 'available') {
    availScore = 10;
    isAvailable = true;
    dispatchable = true;
  } else if (status === 'returning') {
    availScore = 4;
    isAvailable = false;
    dispatchable = true;
  } else if (status === 'busy') {
    availScore = -50;
    isAvailable = false;
    dispatchable = false;
  } else if (status === 'maintenance') {
    availScore = -100;
    isAvailable = false;
    dispatchable = false;
  }

  const total = Math.max(0, Math.round((distScore + timeScore + equipScore + availScore) * 10) / 10);

  const result = {
    score: total,
    distance: Math.round(dist * 100) / 100,
    trafficLevel,
    estimatedArrival: Math.round(etaMins * 10) / 10,
    isAvailable,
    dispatchable,
    equipmentMatch: matchBonus
  };

  // Enable direct primitive numeric coercions for backward compatibility
  result.valueOf = () => total;
  result.toString = () => String(total);

  return result;
}

// ─── Hospital Scoring ──────────────────────────────────────────────
// 35% Distance, 35% Estimated Travel Time, 20% Emergency Specialty Match, 10% Rating & Capacity
export function scoreHospital(hospital, emergencyLoc, emergencyType = 'General', trafficConditions = {}, emergencyMode = false) {
  const dist = calculateDistance(hospital.lat, hospital.lng, emergencyLoc.lat, emergencyLoc.lng);
  const trafficLevel = trafficConditions[`hosp_${hospital.id}`] || 'LOW';
  const mult = getTrafficMultiplier(trafficLevel, emergencyMode);
  const effectiveDist = dist * mult;
  const etaMins = (effectiveDist / 40) * 60;

  const profile = EMERGENCY_PROFILES[emergencyType] || EMERGENCY_PROFILES['General'];

  // 35% distance score — rational smooth decay (no 14km cliff)
  const distScore = 35 / (1 + effectiveDist / 12);

  // 35% estimated travel time score — rational smooth decay
  const timeScore = 35 / (1 + etaMins / 15);

  // 20% specialty match score
  let specialtyScore = 0;
  if (hospital.cardiac   && profile.cardiac > 1.0)   specialtyScore += 6;
  if (hospital.trauma    && profile.trauma > 1.0)    specialtyScore += 6;
  if (hospital.neuro     && profile.neuro > 1.0)     specialtyScore += 6;
  if (hospital.burn      && profile.burn > 1.0)      specialtyScore += 6;
  if (hospital.maternity && profile.maternity > 1.0) specialtyScore += 6;
  if (hospital.pediatric && profile.pediatric > 1.0) specialtyScore += 6;

  specialtyScore += ((hospital.capability || 60) / 100) * 6;
  specialtyScore = Math.min(specialtyScore, 20);

  // Critical requirement deduction:
  // If the emergency requires a vital specialty and the hospital lacks it,
  // penalize so it cannot outrank an equipped facility.
  if (profile.requiredSpecialty && !hospital[profile.requiredSpecialty]) {
    specialtyScore = Math.max(2, specialtyScore - 10);
  }

  // 10% rating & capacity score
  const ratingScore = ((hospital.rating || 3.5) / 5) * 5;

  // Bed capacity score: verified beds vs unknown capacity
  let capacityScore = 2.5;
  let capacityStatus = 'UNKNOWN';
  if (hospital.beds != null && typeof hospital.beds === 'number' && hospital.beds > 0) {
    capacityStatus = 'VERIFIED';
    capacityScore = Math.min(5, 1.5 + (hospital.beds / 500) * 3.5);
  }

  const total = Math.round((distScore + timeScore + specialtyScore + ratingScore + capacityScore) * 10) / 10;

  return {
    score: total,
    distance: Math.round(dist * 100) / 100,
    trafficLevel,
    estimatedTime: Math.round(etaMins * 10) / 10,
    normalTime: Math.round((dist / 40 * 60) * 10) / 10,
    capacityStatus,
    capabilityBreakdown: {
      cardiac: Boolean(hospital.cardiac),
      trauma: Boolean(hospital.trauma),
      neuro: Boolean(hospital.neuro),
      burn: Boolean(hospital.burn),
      maternity: Boolean(hospital.maternity),
      pediatric: Boolean(hospital.pediatric),
      capability: hospital.capability || 60,
      beds: hospital.beds ?? null
    }
  };
}

// ─── Recommendation Explanation Generator ──────────────────────────
export function getRecommendationReasons(hospital, emergencyType, rankedHospitals = []) {
  const reasons = [];

  // Check if fastest time
  if (rankedHospitals.length > 0) {
    const isFastest = rankedHospitals.every(h => !h.estimatedTime || hospital.estimatedTime <= h.estimatedTime);
    if (isFastest) reasons.push('Fastest travel time');

    const isClosest = rankedHospitals.every(h => !h.distance || hospital.distance <= h.distance);
    if (isClosest && !reasons.includes('Fastest travel time')) reasons.push('Closest facility');
  }

  // Specialty matching reasons
  if ((emergencyType === 'Cardiac Arrest' || emergencyType === 'Heart Attack') && hospital.cardiac) {
    reasons.push('Cardiology unit equipped');
  }
  if (emergencyType === 'Stroke' && hospital.neuro) {
    reasons.push('Neurology center equipped');
  }
  if ((emergencyType === 'Accident' || emergencyType === 'Trauma') && hospital.trauma) {
    reasons.push('Trauma care center');
  }
  if (emergencyType === 'Burn' && hospital.burn) {
    reasons.push('Specialized burn care');
  }
  if (emergencyType === 'Pregnancy' && hospital.maternity) {
    reasons.push('Maternity department available');
  }
  if (emergencyType === 'Pediatric' && hospital.pediatric) {
    reasons.push('Pediatric unit available');
  }

  // Traffic condition reason
  if (hospital.trafficLevel === 'LOW') {
    reasons.push('Low traffic corridor');
  }

  // High rating / capability
  if (hospital.rating >= 4.5) {
    reasons.push(`Top rated facility (⭐ ${hospital.rating})`);
  }

  if (hospital.beds != null && hospital.beds >= 300) {
    reasons.push(`High bed capacity (${hospital.beds} verified)`);
  } else if (hospital.beds == null) {
    reasons.push('Capacity unverified');
  }

  if (reasons.length === 0) {
    reasons.push('Nearest suitable emergency facility');
  }

  return reasons;
}

// ─── Survival Color (retained for UI status colors if needed) ────────
export function getSurvivalColor(prob) {
  if (prob >= 80) return '#00ff88';
  if (prob >= 60) return '#ffa500';
  if (prob >= 40) return '#ff8800';
  return '#ff3333';
}

// ─── ETA formatting ────────────────────────────────────────────────
export function formatETA(minutes) {
  if (minutes == null) return '—';
  if (minutes < 1) return '< 1 min';
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}
