const express = require('express');
const router = express.Router();
const {
  scoreAmbulance,
  scoreHospital,
  getRecommendationReasons,
  getDispatchUrgencyAssessment,
  calculateSurvivalProbability
} = require('../utils/aiEngine');
const fallbackHospitals = require('../data/hospitals.json');

// POST /api/ai-decision
// Full AI decision: selects best available ambulance + ranks hospitals based on emergency type
router.post('/', (req, res) => {
  const {
    emergencyLocation,
    emergencyType = 'Accident',
    ambulances = [],
    hospitals: inputHospitals = null,
    trafficConditions = {},
    emergencyMode = false
  } = req.body;

  if (!emergencyLocation || typeof emergencyLocation.lat !== 'number' || typeof emergencyLocation.lng !== 'number') {
    return res.status(400).json({
      error: 'Invalid request: emergencyLocation with valid numeric lat and lng is required'
    });
  }

  // Score ambulances
  const scoredAmbulances = (Array.isArray(ambulances) ? ambulances : []).map(amb => {
    const scoring = scoreAmbulance(amb, emergencyLocation, trafficConditions, emergencyMode, emergencyType);
    return { ...amb, ...scoring };
  }).sort((a, b) => {
    // Available units ALWAYS rank ahead of non-available units
    const aAvail = a.status === 'available';
    const bAvail = b.status === 'available';
    if (aAvail && !bAvail) return -1;
    if (!aAvail && bAvail) return 1;
    return b.score - a.score;
  });

  // Use provided dynamic hospitals or fallback to static list
  const targetHospitals = (Array.isArray(inputHospitals) && inputHospitals.length > 0)
    ? inputHospitals
    : fallbackHospitals;

  // Score hospitals
  const scoredHospitals = targetHospitals.map(h => {
    const scoring = scoreHospital(h, emergencyLocation, emergencyType, trafficConditions, emergencyMode);
    return { ...h, ...scoring };
  }).sort((a, b) => b.score - a.score);

  // Attach contextual recommendation reasons with awareness of all ranked hospitals
  const scoredWithReasons = scoredHospitals.map(h => ({
    ...h,
    reasons: getRecommendationReasons(h, emergencyType, scoredHospitals)
  }));

  // Never pick a busy or maintenance ambulance as the recommended unit
  const bestAmbulance = scoredAmbulances.find(a => a.status === 'available') || null;
  const bestHospital = scoredWithReasons[0] || null;

  // Estimated total transit ETA
  const totalTime = bestAmbulance
    ? (bestAmbulance.estimatedArrival || 0) + (bestHospital?.estimatedTime || 5)
    : (bestHospital?.estimatedTime || 10);

  // Clinical dispatch urgency evaluation (replaces unvalidated survival prediction)
  const urgencyAssessment = getDispatchUrgencyAssessment(totalTime, emergencyType);

  res.json({
    decision: {
      selectedAmbulance: bestAmbulance,
      rankedAmbulances: scoredAmbulances,
      recommendedHospital: bestHospital,
      rankedHospitals: scoredWithReasons.slice(0, 3),
      estimatedTotalETA: Math.round(totalTime * 10) / 10,
      survivalProbability: calculateSurvivalProbability(), // Disabled per clinical safety policy
      urgencyAssessment,
      emergencyMode,
      reasoning: {
        ambulanceSelection: bestAmbulance
          ? `${bestAmbulance.name} selected: Available ${bestAmbulance.type} unit with closest ETA (${bestAmbulance.estimatedArrival} min) under ${bestAmbulance.trafficLevel} traffic`
          : 'No available ambulance units currently in service in this corridor',
        hospitalSelection: bestHospital
          ? `${bestHospital.name} recommended: Best capability match for ${emergencyType} (Score: ${bestHospital.score}) with ${bestHospital.estimatedTime} min ETA`
          : 'No medical facilities found within operational range',
        urgencyAnalysis: urgencyAssessment.recommendationSummary,
        survivalAnalysis: 'Medically unvalidated survival prediction replaced with clinical urgency assessment and response window benchmarks.'
      }
    },
    processedAt: new Date().toISOString()
  });
});

module.exports = router;
