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
    return res.status(400).json({ error: 'Invalid request: emergencyLocation with valid numeric lat and lng is required' });
  }

  const scoredAmbulances = (Array.isArray(ambulances) ? ambulances : []).map(amb => ({
    ...amb,
    ...scoreAmbulance(amb, emergencyLocation, trafficConditions, emergencyMode, emergencyType)
  })).sort((a, b) => {
    const aAvail = a.status === 'available';
    const bAvail = b.status === 'available';
    if (aAvail && !bAvail) return -1;
    if (!aAvail && bAvail) return 1;
    return b.score - a.score;
  });

  const targetHospitals = (Array.isArray(inputHospitals) && inputHospitals.length > 0) ? inputHospitals : fallbackHospitals;

  const scoredHospitals = targetHospitals.map(h => ({
    ...h,
    ...scoreHospital(h, emergencyLocation, emergencyType, trafficConditions, emergencyMode)
  })).sort((a, b) => b.score - a.score);

  const scoredWithReasons = scoredHospitals.map(h => ({
    ...h,
    reasons: getRecommendationReasons(h, emergencyType, scoredHospitals)
  }));

  const bestAmbulance = scoredAmbulances.find(a => a.status === 'available') || null;
  const bestHospital = scoredWithReasons[0] || null;

  const totalTime = bestAmbulance
    ? (bestAmbulance.estimatedArrival || 0) + (bestHospital?.estimatedTime || 5)
    : (bestHospital?.estimatedTime || 10);

  const urgencyAssessment = getDispatchUrgencyAssessment(totalTime, emergencyType);

  res.json({
    decision: {
      selectedAmbulance: bestAmbulance,
      rankedAmbulances: scoredAmbulances,
      recommendedHospital: bestHospital,
      rankedHospitals: scoredWithReasons.slice(0, 3),
      estimatedTotalETA: Math.round(totalTime * 10) / 10,
      survivalProbability: calculateSurvivalProbability(),
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
