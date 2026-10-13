const EMERGENCY_PROFILES = {
  'Cardiac Arrest': { cardiac: 3.0, trauma: 0.5, neuro: 1.5, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5, severity: 5, speedWeight: 3.0, targetWindowMin: 8, urgencyTier: 'CRITICAL', requiredSpecialty: 'cardiac', preferredAmbulance: ['Cardiac Support', 'Mobile ICU'] },
  'Heart Attack': { cardiac: 3.0, trauma: 0.5, neuro: 1.5, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5, severity: 5, speedWeight: 3.0, targetWindowMin: 8, urgencyTier: 'CRITICAL', requiredSpecialty: 'cardiac', preferredAmbulance: ['Cardiac Support', 'Mobile ICU'] },
  'Stroke': { cardiac: 1.5, trauma: 0.5, neuro: 3.0, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5, severity: 5, speedWeight: 3.0, targetWindowMin: 10, urgencyTier: 'CRITICAL', requiredSpecialty: 'neuro', preferredAmbulance: ['Mobile ICU', 'Advanced Life Support'] },
  'Accident': { cardiac: 1.0, trauma: 3.0, neuro: 2.0, burn: 1.0, maternity: 0.5, pediatric: 1.0, general: 0.8, severity: 4, speedWeight: 2.5, targetWindowMin: 15, urgencyTier: 'HIGH', requiredSpecialty: 'trauma', preferredAmbulance: ['Trauma Support', 'Mobile ICU', 'Advanced Life Support'] },
  'Trauma': { cardiac: 1.5, trauma: 3.0, neuro: 2.5, burn: 1.0, maternity: 0.5, pediatric: 1.0, general: 0.8, severity: 4, speedWeight: 2.0, targetWindowMin: 15, urgencyTier: 'HIGH', requiredSpecialty: 'trauma', preferredAmbulance: ['Trauma Support', 'Mobile ICU'] },
  'Burn': { cardiac: 1.0, trauma: 1.5, neuro: 1.0, burn: 3.0, maternity: 0.5, pediatric: 1.0, general: 0.8, severity: 3, speedWeight: 1.8, targetWindowMin: 20, urgencyTier: 'URGENT', requiredSpecialty: 'burn', preferredAmbulance: ['Advanced Life Support', 'Mobile ICU'] },
  'Pregnancy': { cardiac: 1.0, trauma: 1.0, neuro: 1.0, burn: 0.5, maternity: 3.0, pediatric: 1.5, general: 1.0, severity: 3, speedWeight: 1.5, targetWindowMin: 20, urgencyTier: 'URGENT', requiredSpecialty: 'maternity', preferredAmbulance: ['Advanced Life Support', 'Mobile ICU'] },
  'Pediatric': { cardiac: 1.0, trauma: 1.5, neuro: 1.0, burn: 1.0, maternity: 0.5, pediatric: 3.0, general: 1.0, severity: 4, speedWeight: 2.2, targetWindowMin: 15, urgencyTier: 'HIGH', requiredSpecialty: 'pediatric', preferredAmbulance: ['Mobile ICU', 'Advanced Life Support'] },
  'General': { cardiac: 0.8, trauma: 0.8, neuro: 0.8, burn: 0.8, maternity: 0.8, pediatric: 0.8, general: 3.0, severity: 2, speedWeight: 1.0, targetWindowMin: 30, urgencyTier: 'STANDARD', requiredSpecialty: null, preferredAmbulance: ['Basic Life Support', 'Advanced Life Support'] }
};

const TRAFFIC_MULTIPLIERS = { LOW: 1.0, MEDIUM: 1.45, HIGH: 2.15 };
const EMERGENCY_MODE_REDUCTION = 0.58;

const toRad = deg => deg * Math.PI / 180;

function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDispatchUrgencyAssessment(totalTransitMinutes, emergencyType) {
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

const calculateSurvivalProbability = () => null;

function scoreAmbulance(ambulance, emergencyLoc, trafficConditions = {}, emergencyMode = false, emergencyType = 'General') {
  const distance = calculateDistance(ambulance.lat, ambulance.lng, emergencyLoc.lat, emergencyLoc.lng);
  const trafficLevel = trafficConditions[`amb_${ambulance.id}`] || 'LOW';
  let trafficMult = (TRAFFIC_MULTIPLIERS[trafficLevel] || 1.0) * (emergencyMode ? EMERGENCY_MODE_REDUCTION : 1.0);

  const effectiveDistance = distance * trafficMult;
  const etaMinutes = (effectiveDistance / 40) * 60;
  const distanceScore = 35 / (1 + effectiveDistance / 10);
  const timeScore = 35 / (1 + etaMinutes / 12);
  const baseEquipScore = ((ambulance.equipment || 70) / 100) * 8;

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

  const equipmentScore = Math.min(20, baseEquipScore + matchBonus);
  const status = ambulance.status || 'available';
  let availabilityScore = 0;
  let isAvailable = false;
  let dispatchable = false;

  if (status === 'available') {
    availabilityScore = 10;
    isAvailable = true;
    dispatchable = true;
  } else if (status === 'returning') {
    availabilityScore = 4;
    dispatchable = true;
  } else if (status === 'busy') {
    availabilityScore = -50;
  } else if (status === 'maintenance') {
    availabilityScore = -100;
  }

  const total = Math.max(0, distanceScore + timeScore + equipmentScore + availabilityScore);

  return {
    score: Math.round(total * 10) / 10,
    distance: Math.round(distance * 100) / 100,
    trafficLevel,
    estimatedArrival: Math.round(etaMinutes * 10) / 10,
    isAvailable,
    dispatchable,
    equipmentMatch: matchBonus
  };
}

function scoreHospital(hospital, emergencyLoc, emergencyType = 'General', trafficConditions = {}, emergencyMode = false) {
  const distance = calculateDistance(hospital.lat, hospital.lng, emergencyLoc.lat, emergencyLoc.lng);
  const trafficLevel = trafficConditions[`hosp_${hospital.id}`] || 'LOW';
  let trafficMult = (TRAFFIC_MULTIPLIERS[trafficLevel] || 1.0) * (emergencyMode ? EMERGENCY_MODE_REDUCTION : 1.0);

  const effectiveDistance = distance * trafficMult;
  const etaMinutes = (effectiveDistance / 40) * 60;
  const distanceScore = 35 / (1 + effectiveDistance / 12);
  const timeScore = 35 / (1 + etaMinutes / 15);

  const profile = EMERGENCY_PROFILES[emergencyType] || EMERGENCY_PROFILES['General'];
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

  const total = distanceScore + timeScore + specialtyScore + ratingScore + capacityScore;

  return {
    score: Math.round(total * 10) / 10,
    distance: Math.round(distance * 100) / 100,
    trafficLevel,
    estimatedTime: Math.round(etaMinutes * 10) / 10,
    normalTime: Math.round((distance / 40 * 60) * 10) / 10,
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

function getRecommendationReasons(hospital, emergencyType, rankedHospitals = []) {
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

module.exports = {
  calculateDistance,
  scoreAmbulance,
  scoreHospital,
  getRecommendationReasons,
  getDispatchUrgencyAssessment,
  calculateSurvivalProbability,
  EMERGENCY_PROFILES,
  TRAFFIC_MULTIPLIERS
};
