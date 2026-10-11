import test from 'node:test';
import assert from 'node:assert/strict';

import {
  scoreAmbulance,
  scoreHospital,
  getRecommendationReasons,
  getDispatchUrgencyAssessment,
  calculateSurvivalProbability,
  formatETA,
  EMERGENCY_PROFILES
} from '../src/utils/aiEngine.js';

test('frontend aiEngine: available ambulance outscores busy/maintenance ambulances', () => {
  const loc = { lat: 12.9716, lng: 77.5946 };
  const maintAmb = { id: 1, lat: 12.9720, lng: 77.5950, equipment: 95, status: 'maintenance', type: 'Mobile ICU' };
  const busyAmb = { id: 2, lat: 12.9730, lng: 77.5960, equipment: 95, status: 'busy', type: 'Mobile ICU' };
  const availAmb = { id: 3, lat: 12.9900, lng: 77.5946, equipment: 80, status: 'available', type: 'BLS' };

  const sMaint = scoreAmbulance(maintAmb, loc, {}, false, 'Cardiac Arrest');
  const sBusy = scoreAmbulance(busyAmb, loc, {}, false, 'Cardiac Arrest');
  const sAvail = scoreAmbulance(availAmb, loc, {}, false, 'Cardiac Arrest');

  assert.equal(sAvail.isAvailable, true);
  assert.equal(sMaint.isAvailable, false);
  assert.equal(sBusy.isAvailable, false);

  assert.ok(sAvail.score > sMaint.score, 'Available ambulance must score higher than maintenance ambulance');
  assert.ok(sAvail.score > sBusy.score, 'Available ambulance must score higher than busy ambulance');
});

test('frontend aiEngine: equipment matching for cardiac vs trauma emergencies', () => {
  const loc = { lat: 12.9716, lng: 77.5946 };
  const cardiacAmb = { id: 1, lat: 12.9750, lng: 77.5950, equipment: 85, status: 'available', type: 'Cardiac Support', equipmentType: 'Cardiac' };
  const traumaAmb = { id: 2, lat: 12.9750, lng: 77.5950, equipment: 85, status: 'available', type: 'Trauma Support', equipmentType: 'Trauma' };

  const cardiacForCardiac = scoreAmbulance(cardiacAmb, loc, {}, false, 'Cardiac Arrest');
  const traumaForCardiac = scoreAmbulance(traumaAmb, loc, {}, false, 'Cardiac Arrest');
  assert.ok(cardiacForCardiac.score > traumaForCardiac.score, 'Cardiac Support unit must score higher for Cardiac Arrest');

  const traumaForTrauma = scoreAmbulance(traumaAmb, loc, {}, false, 'Accident');
  const cardiacForTrauma = scoreAmbulance(cardiacAmb, loc, {}, false, 'Accident');
  assert.ok(traumaForTrauma.score > cardiacForTrauma.score, 'Trauma Support unit must score higher for Accident');
});

test('frontend aiEngine: smooth distance decay and hospital capacity handling', () => {
  const loc = { lat: 12.9716, lng: 77.5946 };
  const base = { capability: 80, rating: 4.5, beds: 300, cardiac: true, trauma: true, neuro: true, burn: true, maternity: true };

  const h5km = { ...base, id: 1, lat: 12.9716 + (5 / 111), lng: 77.5946 };
  const h18km = { ...base, id: 2, lat: 12.9716 + (18 / 111), lng: 77.5946 };
  const h45km = { ...base, id: 3, lat: 12.9716 + (45 / 111), lng: 77.5946 };

  const s5 = scoreHospital(h5km, loc, 'General', {}, false);
  const s18 = scoreHospital(h18km, loc, 'General', {}, false);
  const s45 = scoreHospital(h45km, loc, 'General', {}, false);

  assert.ok(s18.score > 0, '18km hospital must receive positive score');
  assert.ok(s5.score > s18.score && s18.score > s45.score, 'Scores must decrease smoothly with distance');

  // Unknown bed capacity
  const unknownCapHosp = { ...base, id: 4, lat: 12.9750, lng: 77.5950, beds: null };
  const uScore = scoreHospital(unknownCapHosp, loc, 'General', {}, false);
  assert.equal(uScore.capacityStatus, 'UNKNOWN');
});

test('frontend aiEngine: dispatch urgency assessment and formatETA', () => {
  const urgency = getDispatchUrgencyAssessment(6.5, 'Cardiac Arrest');
  assert.equal(urgency.urgencyTier, 'CRITICAL');
  assert.equal(urgency.etaPerformance, 'OPTIMAL_RESPONSE');
  assert.equal(calculateSurvivalProbability(), null);

  assert.equal(formatETA(0.5), '< 1 min');
  assert.equal(formatETA(5.0), '5 min');
  assert.equal(formatETA(null), '—');
});
