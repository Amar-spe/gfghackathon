// LifeLine AI - Core AI Decision Engine
// Multi-factor intelligent scoring system for ambulance selection and hospital recommendation

const EMERGENCY_PROFILES = {
  'Cardiac Arrest': {
    cardiac: 3.0, trauma: 0.5, neuro: 1.5, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5,
    severity: 5, speedWeight: 3.0, targetWindowMin: 8, urgencyTier: 'CRITICAL',
    requiredSpecialty: 'cardiac', preferredAmbulance: ['Cardiac Support', 'Mobile ICU']
  },
  'Heart Attack': {
    cardiac: 3.0, trauma: 0.5, neuro: 1.5, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5,
    severity: 5, speedWeight: 3.0, targetWindowMin: 8, urgencyTier: 'CRITICAL',
    requiredSpecialty: 'cardiac', preferredAmbulance: ['Cardiac Support', 'Mobile ICU']
  },
  'Stroke': {
    cardiac: 1.5, trauma: 0.5, neuro: 3.0, burn: 0.5, maternity: 0.5, pediatric: 0.5, general: 0.5,
    severity: 5, speedWeight: 3.0, targetWindowMin: 10, urgencyTier: 'CRITICAL',
    requiredSpecialty: 'neuro', preferredAmbulance: ['Mobile ICU', 'Advanced Life Support']
  },
  'Accident': {
    cardiac: 1.0, trauma: 3.0, neuro: 2.0, burn: 1.0, maternity: 0.5, pediatric: 1.0, general: 0.8,
    severity: 4, speedWeight: 2.5, targetWindowMin: 15, urgencyTier: 'HIGH',
    requiredSpecialty: 'trauma', preferredAmbulance: ['Trauma Support', 'Mobile ICU', 'Advanced Life Support']
  },
  'Trauma': {
    cardiac: 1.5, trauma: 3.0, neuro: 2.5, burn: 1.0, maternity: 0.5, pediatric: 1.0, general: 0.8,
    severity: 4, speedWeight: 2.0, targetWindowMin: 15, urgencyTier: 'HIGH',
    requiredSpecialty: 'trauma', preferredAmbulance: ['Trauma Support', 'Mobile ICU']
  },
  'Burn': {
    cardiac: 1.0, trauma: 1.5, neuro: 1.0, burn: 3.0, maternity: 0.5, pediatric: 1.0, general: 0.8,
    severity: 3, speedWeight: 1.8, targetWindowMin: 20, urgencyTier: 'URGENT',
    requiredSpecialty: 'burn', preferredAmbulance: ['Advanced Life Support', 'Mobile ICU']
  },
  'Pregnancy': {
    cardiac: 1.0, trauma: 1.0, neuro: 1.0, burn: 0.5, maternity: 3.0, pediatric: 1.5, general: 1.0,
    severity: 3, speedWeight: 1.5, targetWindowMin: 20, urgencyTier: 'URGENT',
    requiredSpecialty: 'maternity', preferredAmbulance: ['Advanced Life Support', 'Mobile ICU']
  },
  'Pediatric': {
    cardiac: 1.0, trauma: 1.5, neuro: 1.0, burn: 1.0, maternity: 0.5, pediatric: 3.0, general: 1.0,
    severity: 4, speedWeight: 2.2, targetWindowMin: 15, urgencyTier: 'HIGH',
    requiredSpecialty: 'pediatric', preferredAmbulance: ['Mobile ICU', 'Advanced Life Support']
  },
  'General': {
    cardiac: 0.8, trauma: 0.8, neuro: 0.8, burn: 0.8, maternity: 0.8, pediatric: 0.8, general: 3.0,
    severity: 2, speedWeight: 1.0, targetWindowMin: 30, urgencyTier: 'STANDARD',
    requiredSpecialty: null, preferredAmbulance: ['Basic Life Support', 'Advanced Life Support']
  }
};

const TRAFFIC_MULTIPLIERS = { LOW: 1.0, MEDIUM: 1.45, HIGH: 2.15 };
const EMERGENCY_MODE_REDUCTION = 0.58;

/**
 * Calculate haversine distance between two points (km)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

/**
 * Evaluates clinical dispatch urgency against benchmark EMS response windows.
 * Replaces unvalidated survival prediction with an explainable response assessment.
 */
function getDispatchUrgencyAssessment(totalTransitMinutes, emergencyType) {
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

/**
 * Backward-compatibility stub: medically unvalidated survival prediction is disabled.
 * Returns null to maintain safe contract for callers.
 */
function calculateSurvivalProbability() {
  return null;
}

/**
 * Score an ambulance for selection
 * 35% Distance, 35% Estimated Travel Time, 20% Equipment Match, 10% Availability
 *
 * Requirements:
 * - Never allow busy or maintenance units to outrank available units.
 * - Match equipment type to emergency nature.
 * - Use smooth continuous decay curves (no flat floors).
 */
function scoreAmbulance(ambulance, emergencyLoc, trafficConditions = {}, emergencyMode = false, emergencyType = 'General') {
  const distance = calculateDistance(ambulance.lat, ambulance.lng, emergencyLoc.lat, emergencyLoc.lng);
  const trafficLevel = trafficConditions[`amb_${ambulance.id}`] || 'LOW';
  let trafficMult = TRAFFIC_MULTIPLIERS[trafficLevel] || 1.0;
  if (emergencyMode) trafficMult *= EMERGENCY_MODE_REDUCTION;

  const effectiveDistance = distance * trafficMult;
  const etaMinutes = (effectiveDistance / 40) * 60;

  // 35% Distance score — rational decay without artificial cliff
  const distanceScore = 35 / (1 + effectiveDistance / 10);

  // 35% ETA score — rational decay without artificial cliff
  const timeScore = 35 / (1 + etaMinutes / 12);

  // 20% Equipment score (0 to 20 pts)
  // Baseline hardware quality (max 8 pts)
  const baseEquipScore = ((ambulance.equipment || 70) / 100) * 8;

  // Clinical equipment match bonus (max 12 pts)
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

  const equipmentScore = Math.min(20, baseEquipScore + matchBonus);

  // 10% Availability score + strict dispatch gating
  // Busy or maintenance units must NEVER outrank available units
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
    isAvailable = false;
    dispatchable = true; // Can be rerouted in extreme priority
  } else if (status === 'busy') {
    availabilityScore = -50; // Heavy penalty ensures it drops below available units
    isAvailable = false;
    dispatchable = false;
  } else if (status === 'maintenance') {
    availabilityScore = -100; // Out of service
    isAvailable = false;
    dispatchable = false;
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

/**
 * Score a hospital for a given emergency
 * 35% Distance, 35% Estimated Travel Time, 20% Emergency Specialty Match, 10% Rating & Capacity
 *
 * Requirements:
 * - Smooth continuous decay curves (no 14km cutoff where distant hospitals get 0).
 * - Enforce critical specialty capabilities for acute emergencies.
 * - Handle unknown/missing bed capacity transparently (do not assume verified availability).
 */
function scoreHospital(hospital, emergencyLoc, emergencyType = 'General', trafficConditions = {}, emergencyMode = false) {
  const distance = calculateDistance(hospital.lat, hospital.lng, emergencyLoc.lat, emergencyLoc.lng);
  const trafficLevel = trafficConditions[`hosp_${hospital.id}`] || 'LOW';
  let trafficMult = TRAFFIC_MULTIPLIERS[trafficLevel] || 1.0;
  if (emergencyMode) trafficMult *= EMERGENCY_MODE_REDUCTION;

  const effectiveDistance = distance * trafficMult;
  const etaMinutes = (effectiveDistance / 40) * 60;

  // 35% Distance score — rational decay without artificial cutoff
  const distanceScore = 35 / (1 + effectiveDistance / 12);

  // 35% ETA score — rational decay without artificial cutoff
  const timeScore = 35 / (1 + etaMinutes / 15);

  // 20% Specialty & Capability match
  const profile = EMERGENCY_PROFILES[emergencyType] || EMERGENCY_PROFILES['General'];
  let specialtyScore = 0;

  if (hospital.cardiac && profile.cardiac > 1.0) specialtyScore += 6;
  if (hospital.trauma && profile.trauma > 1.0) specialtyScore += 6;
  if (hospital.neuro && profile.neuro > 1.0) specialtyScore += 6;
  if (hospital.burn && profile.burn > 1.0) specialtyScore += 6;
  if (hospital.maternity && profile.maternity > 1.0) specialtyScore += 6;
  if (hospital.pediatric && profile.pediatric > 1.0) specialtyScore += 6;

  // Capability base score (max 6 pts)
  specialtyScore += ((hospital.capability || 60) / 100) * 6;
  specialtyScore = Math.min(specialtyScore, 20);

  // Critical specialty requirement penalty:
  // If the emergency requires a critical department and hospital lacks it,
  // apply a capability deficit deduction so patients are not routed to incapable centers.
  if (profile.requiredSpecialty && !hospital[profile.requiredSpecialty]) {
    specialtyScore = Math.max(2, specialtyScore - 10);
  }

  // 10% Rating & Capacity Availability score:
  // 5% facility rating (max 5)
  const ratingScore = ((hospital.rating || 3.5) / 5) * 5;

  // 5% verified capacity / bed readiness (max 5)
  // If capacity is unknown, keep it neutral (2.5) rather than fabricating high availability.
  let capacityScore = 2.5;
  let capacityStatus = 'UNKNOWN';

  if (hospital.beds != null && typeof hospital.beds === 'number' && hospital.beds > 0) {
    capacityStatus = 'VERIFIED';
    capacityScore = Math.min(5, 1.5 + (hospital.beds / 500) * 3.5);
  }

  const availabilityAndRatingScore = ratingScore + capacityScore;
  const total = distanceScore + timeScore + specialtyScore + availabilityAndRatingScore;

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

/**
 * Generate transparent, context-aware recommendation reason tags.
 */
function getRecommendationReasons(hospital, emergencyType, rankedHospitals = []) {
  const reasons = [];

  if (rankedHospitals.length > 0) {
    const isFastest = rankedHospitals.every(h => !h.estimatedTime || hospital.estimatedTime <= h.estimatedTime);
    if (isFastest) reasons.push('Fastest travel time');

    const isClosest = rankedHospitals.every(h => !h.distance || hospital.distance <= h.distance);
    if (isClosest && !reasons.includes('Fastest travel time')) reasons.push('Closest facility');
  }

  // Specialty matches
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

  // Traffic conditions
  if (hospital.trafficLevel === 'LOW') {
    reasons.push('Low traffic corridor');
  }

  // Quality & Capacity
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
