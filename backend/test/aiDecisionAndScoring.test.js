const test = require('node:test');
const assert = require('node:assert/strict');

const {
  scoreAmbulance,
  scoreHospital,
  getRecommendationReasons,
  getDispatchUrgencyAssessment,
  calculateSurvivalProbability,
  calculateDistance,
  EMERGENCY_PROFILES
} = require('../utils/aiEngine');

const aiDecisionRouter = require('../routes/aiDecision');
const hospitalsRouter = require('../routes/hospitals');
const ambulancesRouter = require('../routes/ambulances');

// ── Mock Helpers ────────────────────────────────────────────────────────────
function mockReqRes({ body = {}, query = {} } = {}) {
  const req = { body, query };
  let statusCode = 200;
  let jsonResponse = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    }
  };

  return { req, res, getStatus: () => statusCode, getJson: () => jsonResponse };
}

// ── 1. Ambulance Availability Tests ─────────────────────────────────────────
test('scoreAmbulance: available ambulance beats closer busy or maintenance ambulance', () => {
  const emergencyLoc = { lat: 12.9716, lng: 77.5946 };
  const traffic = {};

  // Maintenance ambulance very close (0.2 km away)
  const maintenanceAmb = {
    id: 1,
    name: 'AMB-MAINT',
    lat: 12.9720,
    lng: 77.5950,
    equipment: 95,
    status: 'maintenance',
    type: 'Mobile ICU',
    equipmentType: 'ICU'
  };

  // Busy ambulance close (0.5 km away)
  const busyAmb = {
    id: 2,
    name: 'AMB-BUSY',
    lat: 12.9730,
    lng: 77.5960,
    equipment: 95,
    status: 'busy',
    type: 'Mobile ICU',
    equipmentType: 'ICU'
  };

  // Available ambulance further away (2.5 km away)
  const availableAmb = {
    id: 3,
    name: 'AMB-AVAIL',
    lat: 12.9900,
    lng: 77.5946,
    equipment: 80,
    status: 'available',
    type: 'Basic Life Support',
    equipmentType: 'BLS'
  };

  const maintScore = scoreAmbulance(maintenanceAmb, emergencyLoc, traffic, false, 'Cardiac Arrest');
  const busyScore = scoreAmbulance(busyAmb, emergencyLoc, traffic, false, 'Cardiac Arrest');
  const availScore = scoreAmbulance(availableAmb, emergencyLoc, traffic, false, 'Cardiac Arrest');

  assert.equal(maintScore.isAvailable, false);
  assert.equal(busyScore.isAvailable, false);
  assert.equal(availScore.isAvailable, true);

  // Available unit must outscore busy and maintenance units
  assert.ok(availScore.score > maintScore.score, 'Available ambulance must outscore maintenance ambulance');
  assert.ok(availScore.score > busyScore.score, 'Available ambulance must outscore busy ambulance');
});

// ── 2. Emergency-Specific Ambulance Equipment Matching ──────────────────────
test('scoreAmbulance: matches equipment specifically to emergency type', () => {
  const loc = { lat: 12.9716, lng: 77.5946 };
  const traffic = {};

  const cardiacUnit = {
    id: 1,
    lat: 12.9750,
    lng: 77.5950,
    equipment: 85,
    status: 'available',
    type: 'Cardiac Support',
    equipmentType: 'Cardiac'
  };

  const traumaUnit = {
    id: 2,
    lat: 12.9750,
    lng: 77.5950,
    equipment: 85,
    status: 'available',
    type: 'Trauma Support',
    equipmentType: 'Trauma'
  };

  // For Cardiac Arrest: Cardiac unit must outscore Trauma unit at identical distance
  const cardiacScoreForCardiac = scoreAmbulance(cardiacUnit, loc, traffic, false, 'Cardiac Arrest');
  const traumaScoreForCardiac = scoreAmbulance(traumaUnit, loc, traffic, false, 'Cardiac Arrest');
  assert.ok(
    cardiacScoreForCardiac.score > traumaScoreForCardiac.score,
    'Cardiac Support unit must score higher than Trauma Support for Cardiac Arrest'
  );

  // For Severe Trauma: Trauma unit must outscore Cardiac unit at identical distance
  const traumaScoreForTrauma = scoreAmbulance(traumaUnit, loc, traffic, false, 'Trauma');
  const cardiacScoreForTrauma = scoreAmbulance(cardiacUnit, loc, traffic, false, 'Trauma');
  assert.ok(
    traumaScoreForTrauma.score > cardiacScoreForTrauma.score,
    'Trauma Support unit must score higher than Cardiac Support for Trauma emergency'
  );
});

// ── 3. Continuous Distance Decay (No 14km Cliff) ───────────────────────────
test('scoreHospital: continuous monotonic decay across medium and distant ranges', () => {
  const loc = { lat: 12.9716, lng: 77.5946 };
  const baseHosp = {
    capability: 80,
    rating: 4.5,
    beds: 300,
    cardiac: true,
    trauma: true,
    neuro: true,
    burn: true,
    maternity: true
  };

  // 5 km away
  const hosp5km = { ...baseHosp, id: 1, lat: 12.9716 + (5 / 111), lng: 77.5946 };
  // 16 km away (previously would score 0 on distance & ETA)
  const hosp16km = { ...baseHosp, id: 2, lat: 12.9716 + (16 / 111), lng: 77.5946 };
  // 35 km away
  const hosp35km = { ...baseHosp, id: 3, lat: 12.9716 + (35 / 111), lng: 77.5946 };
  // 75 km away
  const hosp75km = { ...baseHosp, id: 4, lat: 12.9716 + (75 / 111), lng: 77.5946 };

  const s5 = scoreHospital(hosp5km, loc, 'General', {}, false);
  const s16 = scoreHospital(hosp16km, loc, 'General', {}, false);
  const s35 = scoreHospital(hosp35km, loc, 'General', {}, false);
  const s75 = scoreHospital(hosp75km, loc, 'General', {}, false);

  // Distant hospitals must have non-zero scores and be monotonically strictly decreasing
  assert.ok(s16.score > 0, '16km hospital must receive non-zero score (no 14km cliff)');
  assert.ok(s35.score > 0, '35km hospital must receive non-zero score');
  assert.ok(s75.score > 0, '75km hospital must receive non-zero score');

  assert.ok(s5.score > s16.score, '5km must score higher than 16km');
  assert.ok(s16.score > s35.score, '16km must score higher than 35km');
  assert.ok(s35.score > s75.score, '35km must score higher than 75km');
});

// ── 4. Unsuitable Hospitals & Critical Specialty Gaps ───────────────────────
test('scoreHospital: penalizes hospitals lacking critical specialty for acute emergency', () => {
  const loc = { lat: 12.9716, lng: 77.5946 };

  // Hospital with Cardiac Cath Lab 4 km away
  const equippedHosp = {
    id: 1,
    name: 'Heart Institute',
    lat: 12.9716 + (4 / 111),
    lng: 77.5946,
    capability: 85,
    rating: 4.2,
    beds: 250,
    cardiac: true,
    trauma: false
  };

  // Hospital lacking Cardiac care 2 km away
  const nonEquippedHosp = {
    id: 2,
    name: 'Community Clinic',
    lat: 12.9716 + (2 / 111),
    lng: 77.5946,
    capability: 70,
    rating: 4.2,
    beds: 100,
    cardiac: false,
    trauma: false
  };

  const equippedScore = scoreHospital(equippedHosp, loc, 'Cardiac Arrest', {}, false);
  const nonEquippedScore = scoreHospital(nonEquippedHosp, loc, 'Cardiac Arrest', {}, false);

  assert.ok(
    equippedScore.score > nonEquippedScore.score,
    'Cardiac-equipped hospital must outrank non-equipped hospital for Cardiac Arrest even if slightly further'
  );
});

// ── 5. Unknown Hospital Capacity vs Verified Capacity ───────────────────────
test('scoreHospital: handles missing capacity as UNKNOWN rather than assuming verified beds', () => {
  const loc = { lat: 12.9716, lng: 77.5946 };

  const verifiedHosp = {
    id: 1,
    lat: 12.9750,
    lng: 77.5950,
    capability: 80,
    rating: 4.0,
    beds: 500, // Verified 500 beds
    cardiac: true
  };

  const unknownHosp = {
    id: 2,
    lat: 12.9750,
    lng: 77.5950,
    capability: 80,
    rating: 4.0,
    beds: null, // Capacity unknown/missing from OSM
    cardiac: true
  };

  const vScore = scoreHospital(verifiedHosp, loc, 'General', {}, false);
  const uScore = scoreHospital(unknownHosp, loc, 'General', {}, false);

  assert.equal(vScore.capacityStatus, 'VERIFIED');
  assert.equal(uScore.capacityStatus, 'UNKNOWN');
  assert.ok(vScore.score > uScore.score, 'Verified high capacity hospital must score higher than unknown capacity');

  const reasons = getRecommendationReasons(unknownHosp, 'General', [unknownHosp]);
  assert.ok(reasons.includes('Capacity unverified'), 'Recommendation reasons must indicate unverified capacity');
});

// ── 6. POST /api/ai-decision Endpoint Validation & Safe Urgency Assessment ──
test('POST /api/ai-decision: rejects missing or invalid emergencyLocation with HTTP 400', () => {
  // Missing location
  const { req: req1, res: res1, getStatus: getStatus1, getJson: getJson1 } = mockReqRes({ body: {} });
  // Find handler
  const postHandler = aiDecisionRouter.stack.find(s => s.route?.methods?.post)?.route?.stack[0]?.handle;
  assert.ok(postHandler, 'aiDecision router must have a POST handler');

  postHandler(req1, res1);
  assert.equal(getStatus1(), 400);
  assert.ok(getJson1().error, 'Must return error message for missing location');

  // Invalid non-numeric location
  const { req: req2, res: res2, getStatus: getStatus2, getJson: getJson2 } = mockReqRes({
    body: { emergencyLocation: { lat: 'invalid', lng: 77.59 } }
  });
  postHandler(req2, res2);
  assert.equal(getStatus2(), 400);
});

test('POST /api/ai-decision: never crashes, provides explainable urgency assessment and never selects busy unit', () => {
  const postHandler = aiDecisionRouter.stack.find(s => s.route?.methods?.post)?.route?.stack[0]?.handle;

  const payload = {
    emergencyLocation: { lat: 12.9716, lng: 77.5946 },
    emergencyType: 'Cardiac Arrest',
    ambulances: [
      { id: 1, name: 'AMB-BUSY', lat: 12.9720, lng: 77.5950, equipment: 95, status: 'busy', type: 'Mobile ICU' },
      { id: 2, name: 'AMB-AVAIL', lat: 12.9800, lng: 77.5946, equipment: 85, status: 'available', type: 'Cardiac Support' }
    ],
    hospitals: [
      { id: 101, name: 'Cardiac Specialty Hospital', lat: 12.9750, lng: 77.5950, capability: 90, rating: 4.8, beds: 350, cardiac: true }
    ],
    emergencyMode: true
  };

  const { req, res, getStatus, getJson } = mockReqRes({ body: payload });
  postHandler(req, res);

  assert.equal(getStatus(), 200);
  const data = getJson();
  assert.ok(data.decision, 'Response must include decision object');

  // Selected ambulance must be the available unit, not the closer busy unit
  assert.equal(data.decision.selectedAmbulance.id, 2);
  assert.equal(data.decision.selectedAmbulance.name, 'AMB-AVAIL');

  // Must include clinical urgency assessment and null unvalidated survival prediction
  assert.equal(data.decision.survivalProbability, null);
  assert.ok(data.decision.urgencyAssessment, 'Must include urgencyAssessment');
  assert.equal(data.decision.urgencyAssessment.urgencyTier, 'CRITICAL');
  assert.ok(data.decision.reasoning.urgencyAnalysis, 'Must include urgencyAnalysis explanation');
  assert.ok(data.decision.recommendedHospital.reasons.length > 0, 'Must include recommendation reasons');
});

// ── 7. POST /api/hospitals/rank Endpoint Validation ─────────────────────────
test('POST /api/hospitals/rank: validates input and returns structured recommendation reasons', () => {
  const postHandler = hospitalsRouter.stack.find(s => s.route?.methods?.post && s.route?.path === '/rank')?.route?.stack[0]?.handle;
  assert.ok(postHandler, 'hospitals router must have POST /rank handler');

  // Missing coordinates
  const { req: reqFail, res: resFail, getStatus: getFailStatus } = mockReqRes({ body: {} });
  postHandler(reqFail, resFail);
  assert.equal(getFailStatus(), 400);

  // Valid ranking request
  const { req, res, getStatus, getJson } = mockReqRes({
    body: {
      lat: 12.9716,
      lng: 77.5946,
      emergencyType: 'Stroke',
      hospitals: [
        { id: 1, name: 'Neuro Center', lat: 12.9750, lng: 77.5950, capability: 90, rating: 4.7, neuro: true, beds: 200 },
        { id: 2, name: 'General Clinic', lat: 12.9740, lng: 77.5950, capability: 60, rating: 3.8, neuro: false, beds: 20 }
      ]
    }
  });

  postHandler(req, res);
  assert.equal(getStatus(), 200);
  const data = getJson();

  assert.ok(Array.isArray(data.rankedHospitals));
  assert.equal(data.recommended.id, 1, 'Neuro Center must be recommended for Stroke');
  assert.ok(Array.isArray(data.recommended.reasons), 'Recommended hospital must include reasons array');
  assert.ok(data.recommended.reasons.includes('Neurology center equipped'));
});

// ── 8. GET /api/ambulances Endpoint Validation ──────────────────────────────
test('GET /api/ambulances: validates coordinates and never designates unavailable unit as bestAmbulanceId', () => {
  const getHandler = ambulancesRouter.stack.find(s => s.route?.methods?.get && s.route?.path === '/')?.route?.stack[0]?.handle;
  assert.ok(getHandler, 'ambulances router must have GET / handler');

  // Missing coordinates
  const { req: reqFail, res: resFail, getStatus: getFailStatus } = mockReqRes({ query: {} });
  getHandler(reqFail, resFail);
  assert.equal(getFailStatus(), 400);

  // Valid coordinates
  const { req, res, getStatus, getJson } = mockReqRes({
    query: { lat: '12.9716', lng: '77.5946', emergencyType: 'Accident' }
  });
  getHandler(req, res);
  assert.equal(getStatus(), 200);
  const data = getJson();

  assert.ok(Array.isArray(data.ambulances));
  assert.equal(data.ambulances.length, 6);

  if (data.bestAmbulanceId != null) {
    const bestUnit = data.ambulances.find(a => a.id === data.bestAmbulanceId);
    assert.equal(bestUnit.status, 'available', 'bestAmbulanceId unit must have status available');
  }
});
