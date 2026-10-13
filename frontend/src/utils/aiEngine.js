import { calculateDistance } from './geoUtils.js';

export const EMERGENCY_PROFILES = {
  'Cardiac Arrest': { cardiac: 3.0, trauma: 0.5, neuro: 1.5, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5, severity: 5, speedWeight: 3.0, targetWindowMin: 8, label: 'CRITICAL', color: '#dc2626', requiredSpecialty: 'cardiac', urgencyTier: 'CRITICAL' },
  'Heart Attack': { cardiac: 3.0, trauma: 0.5, neuro: 1.5, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5, severity: 5, speedWeight: 3.0, targetWindowMin: 8, label: 'CRITICAL', color: '#dc2626', requiredSpecialty: 'cardiac', urgencyTier: 'CRITICAL' },
  'Stroke': { cardiac: 1.5, trauma: 0.5, neuro: 3.0, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5, severity: 5, speedWeight: 3.0, targetWindowMin: 10, label: 'CRITICAL', color: '#dc2626', requiredSpecialty: 'neuro', urgencyTier: 'CRITICAL' },
  'Accident': { cardiac: 1.0, trauma: 3.0, neuro: 2.0, burn: 1.0, maternity: 0.5, pediatric: 1.0, general: 0.8, severity: 4, speedWeight: 2.5, targetWindowMin: 15, label: 'SEVERE', color: '#d97706', requiredSpecialty: 'trauma', urgencyTier: 'HIGH' },
  'Trauma': { cardiac: 1.5, trauma: 3.0, neuro: 2.5, burn: 1.0, maternity: 0.5, pediatric: 1.0, general: 0.8, severity: 4, speedWeight: 2.0, targetWindowMin: 15, label: 'SEVERE', color: '#d97706', requiredSpecialty: 'trauma', urgencyTier: 'HIGH' },
  'Burn': { cardiac: 1.0, trauma: 1.5, neuro: 1.0, burn: 3.0, maternity: 0.5, pediatric: 1.0, general: 0.8, severity: 3, speedWeight: 1.8, targetWindowMin: 20, label: 'MODERATE', color: '#ea580c', requiredSpecialty: 'burn', urgencyTier: 'URGENT' },
  'Pregnancy': { cardiac: 1.0, trauma: 1.0, neuro: 1.0, burn: 0.5, maternity: 3.0, pediatric: 1.5, general: 1.0, severity: 3, speedWeight: 1.5, targetWindowMin: 20, label: 'MODERATE', color: '#0d9488', requiredSpecialty: 'maternity', urgencyTier: 'URGENT' },
  'Pediatric': { cardiac: 1.0, trauma: 1.5, neuro: 1.0, burn: 1.0, maternity: 0.5, pediatric: 3.0, general: 1.0, severity: 4, speedWeight: 2.2, targetWindowMin: 15, label: 'SEVERE', color: '#d97706', requiredSpecialty: 'pediatric', urgencyTier: 'HIGH' },
  'General': { cardiac: 0.8, trauma: 0.8, neuro: 0.8, burn: 0.8, maternity: 0.8, pediatric: 0.8, general: 3.0, severity: 2, speedWeight: 1.0, targetWindowMin: 30, label: 'MODERATE', color: '#0d9488', requiredSpecialty: null, urgencyTier: 'STANDARD' }
};

const TRAFFIC_MULTIPLIERS = { LOW: 1.0, MEDIUM: 1.45, HIGH: 2.15 };
const EMERGENCY_REDUCTION = 0.58;

export const getTrafficMultiplier = (level, emergencyMode) => {
  const base = TRAFFIC_MULTIPLIERS[level] || 1.0;
  return emergencyMode ? base * EMERGENCY_REDUCTION : base;
};

export function getDispatchUrgencyAssessment(totalTransitMinutes, emergencyType) {
  const profile = EMERGENCY_PROFILES[emergencyType] || EMERGENCY_PROFILES['General'];
  const targetMin = profile.targetWindowMin || 20;
  const transitMin = Math.max(0.1, Number(totalTransitMinutes) || 10);
  const ratio = transitMin / targetMin;
  const etaPerformance = ratio > 1.5 ? 'CRITICAL_DELAY' : ratio > 1.0 ? 'EXTENDED_RESPONSE' : 'OPTIMAL_RESPONSE';

  return {
    urgencyTier: profile.urgencyTier,
    targetWindowMin: targetMin,
    totalTransitMin: Math.round(transitMin * 10) / 10,
    etaPerformance,
    recommendationSummary: `Clinical target for ${emergencyType}: ${targetMin} min. Projected transit: ${transitMin.toFixed(1)} min (${etaPerformance.replace('_', ' ').toLowerCase()}).`
  };
}

export const calculateSurvivalProbability = () => null;

export function scoreAmbulance(ambulance, emergencyLoc, trafficConditions = {}, emergencyMode = false, emergencyType = 'General') {
  const dist = calculateDistance(ambulance.lat, ambulance.lng, emergencyLoc.lat, emergencyLoc.lng);
  const trafficLevel = trafficConditions[`amb_${ambulance.id}`] || 'LOW';
  const mult = getTrafficMultiplier(trafficLevel, emergencyMode);
  const effectiveDist = dist * mult;
  const etaMins = (effectiveDist / 40) * 60;

  const distScore = 35 / (1 + effectiveDist / 10);
  const timeScore = 35 / (1 + etaMins / 12);
  const baseEquip = ((ambulance.equipment || 70) / 100) * 8;

  const ambType = ambulance.type || '';
  const equipType = ambulance.equipmentType || '';
  const isICU = ambType.includes('ICU') || equipType === 'ICU';
  const isCardiac = ambType.includes('Cardiac') || equipType === 'Cardiac';
  const isTrauma = ambType.includes('Trauma') || equipType === 'Trauma';
  const isALS = ambType.includes('Advanced Life Support') || equipType === 'ALS';
  const isBLS = ambType.includes('Basic Life Support') || equipType === 'BLS';

  let matchBonus = 5;
  if (emergencyType === 'Cardiac Arrest' || emergencyType === 'Heart Attack') {
    matchBonus = isCardiac ? 12 : isICU ? 11 : isALS ? 8 : isTrauma ? 4 : 3;
  } else if (emergencyType === 'Stroke') {
    matchBonus = isICU ? 12 : isALS ? 10 : isCardiac ? 6 : isTrauma ? 5 : 3;
  } else if (emergencyType === 'Accident' || emergencyType === 'Trauma') {
    matchBonus = isTrauma ? 12 : isICU ? 11 : isALS ? 8 : isCardiac ? 4 : 3;
  } else if (emergencyType === 'Burn') {
    matchBonus = isALS ? 12 : isICU ? 11 : isTrauma ? 8 : 4;
  } else if (emergencyType === 'Pregnancy') {
    matchBonus = isALS ? 12 : isICU ? 11 : isBLS ? 6 : 4;
  } else if (emergencyType === 'Pediatric') {
    matchBonus = isICU ? 12 : isALS ? 10 : isBLS ? 6 : 5;
  } else {
    matchBonus = (isALS || isICU) ? 10 : (isCardiac || isTrauma) ? 8 : 7;
  }

  const equipScore = Math.min(20, baseEquip + matchBonus);
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
    dispatchable = true;
  } else if (status === 'busy') {
    availScore = -50;
  } else if (status === 'maintenance') {
    availScore = -100;
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
  result.valueOf = () => total;
  result.toString = () => String(total);
  return result;
}

export function scoreHospital(hospital, emergencyLoc, emergencyType = 'General', trafficConditions = {}, emergencyMode = false) {
  const dist = calculateDistance(hospital.lat, hospital.lng, emergencyLoc.lat, emergencyLoc.lng);
  const trafficLevel = trafficConditions[`hosp_${hospital.id}`] || 'LOW';
  const mult = getTrafficMultiplier(trafficLevel, emergencyMode);
  const effectiveDist = dist * mult;
  const etaMins = (effectiveDist / 40) * 60;

  const profile = EMERGENCY_PROFILES[emergencyType] || EMERGENCY_PROFILES['General'];
  const distScore = 35 / (1 + effectiveDist / 12);
  const timeScore = 35 / (1 + etaMins / 15);

  let specialtyScore = 0;
  if (hospital.cardiac && profile.cardiac > 1.0) specialtyScore += 6;
  if (hospital.trauma && profile.trauma > 1.0) specialtyScore += 6;
  if (hospital.neuro && profile.neuro > 1.0) specialtyScore += 6;
  if (hospital.burn && profile.burn > 1.0) specialtyScore += 6;
  if (hospital.maternity && profile.maternity > 1.0) specialtyScore += 6;
  if (hospital.pediatric && profile.pediatric > 1.0) specialtyScore += 6;

  specialtyScore = Math.min(specialtyScore + ((hospital.capability || 60) / 100) * 6, 20);
  if (profile.requiredSpecialty && !hospital[profile.requiredSpecialty]) {
    specialtyScore = Math.max(2, specialtyScore - 10);
  }

  const ratingScore = ((hospital.rating || 3.5) / 5) * 5;
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

export function getRecommendationReasons(hospital, emergencyType, rankedHospitals = []) {
  const reasons = [];
  if (rankedHospitals.length > 0) {
    if (rankedHospitals.every(h => !h.estimatedTime || hospital.estimatedTime <= h.estimatedTime)) {
      reasons.push('Fastest travel time');
    } else if (rankedHospitals.every(h => !h.distance || hospital.distance <= h.distance)) {
      reasons.push('Closest facility');
    }
  }

  if ((emergencyType === 'Cardiac Arrest' || emergencyType === 'Heart Attack') && hospital.cardiac) reasons.push('Cardiology unit equipped');
  if (emergencyType === 'Stroke' && hospital.neuro) reasons.push('Neurology center equipped');
  if ((emergencyType === 'Accident' || emergencyType === 'Trauma') && hospital.trauma) reasons.push('Trauma care center');
  if (emergencyType === 'Burn' && hospital.burn) reasons.push('Specialized burn care');
  if (emergencyType === 'Pregnancy' && hospital.maternity) reasons.push('Maternity department available');
  if (emergencyType === 'Pediatric' && hospital.pediatric) reasons.push('Pediatric unit available');
  if (hospital.trafficLevel === 'LOW') reasons.push('Low traffic corridor');
  if (hospital.rating >= 4.5) reasons.push(`Top rated facility (${hospital.rating}/5.0)`);
  if (hospital.beds != null && hospital.beds >= 300) reasons.push(`High bed capacity (${hospital.beds} verified)`);
  else if (hospital.beds == null) reasons.push('Capacity unverified');

  return reasons.length > 0 ? reasons : ['Nearest suitable emergency facility'];
}

export const getSurvivalColor = prob => (prob >= 80 ? '#0d9488' : prob >= 60 ? '#d97706' : '#dc2626');

export function formatETA(minutes) {
  if (minutes == null) return '—';
  if (minutes < 1) return '< 1 min';
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}
