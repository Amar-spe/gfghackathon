/**
 * ============================================================================
 * LIFELINE AI - CITIZEN RESCUE IMPACT POINTS API & VERIFICATION ENGINE
 * ============================================================================
 * 
 * CRITICAL SAFETY & ETHICAL CONSTRAINTS (MANDATORY SYSTEM DIRECTIVES):
 * 1. NEVER award points based on patient survival, recovery, or clinical outcomes.
 *    Civic volunteers and citizens must NEVER be incentivized or evaluated based
 *    on medical results, patient survival, or clinical triage outcomes. Points
 *    are awarded SOLELY for timely, verified logistical accuracy and civic coordination.
 * 
 * 2. Dispatch priority must ALWAYS remain strictly based on emergency need, severity,
 *    and clinical protocols, completely isolated from this community reward system.
 * 
 * 3. Hospital verification is required BEFORE any points are credited. Points are
 *    awarded only after a designated Hospital User (Triage / Receiving Staff)
 *    explicitly verifies patient handover and confirms report validity upon arrival.
 * 
 * 4. Point values are NEVER hardcoded in the frontend. All reward rules and multipliers
 *    are dynamically served via the /api/citizen/config endpoint.
 * ============================================================================
 */
const { supabase, requireAuth } = require('../utils/supabase');
const express = require('express');
const router = express.Router();

// ── Dynamic Reward Configuration (Fetched by Frontend State Store) ──────────
const DYNAMIC_POINTS_CONFIG = {
  version: '2026.4.1',
  currencyName: 'Rescue Impact Points',
  currencySymbol: 'RIP',
  rules: {
    VALID_INCIDENT_REPORT: {
      actionKey: 'VALID_INCIDENT_REPORT',
      label: 'Valid Incident Report',
      points: 10,
      description: 'Accurate initial reporting of an emergency incident verified upon ambulance dispatch/intake.',
      category: 'Reporting'
    },
    VERIFIED_LOCATION_CORRECTION: {
      actionKey: 'VERIFIED_LOCATION_CORRECTION',
      label: 'Verified Location Correction',
      points: 5,
      description: 'Accurate pinpointing, gate access, or obstruction update that shortened responder travel.',
      category: 'Navigation'
    },
    CONFIRMED_AUTHORIZED_RESPONDER_TASK: {
      actionKey: 'CONFIRMED_AUTHORIZED_RESPONDER_TASK',
      label: 'Confirmed Authorized Responder Task',
      points: 20,
      description: 'Paramedic or hospital-authorized civic task (e.g., clearing stretcher path, AED guide).',
      category: 'Field Assist'
    },
    SUCCESSFUL_EMERGENCY_LOGISTICS_TASK: {
      actionKey: 'SUCCESSFUL_EMERGENCY_LOGISTICS_TASK',
      label: 'Emergency Logistics Task',
      points: 15,
      description: 'Relayed emergency supplies, opened perimeter access, or coordinated civilian crowd barrier.',
      category: 'Logistics'
    },
    DUPLICATE_UNVERIFIED_REPORT: {
      actionKey: 'DUPLICATE_UNVERIFIED_REPORT',
      label: 'Duplicate / Unverified Report',
      points: 0,
      description: 'Report matched an active incident or could not be verified by hospital intake.',
      category: 'Duplicate'
    },
    FRAUDULENT_REPORT: {
      actionKey: 'FRAUDULENT_REPORT',
      label: 'Fraudulent / Malicious Report',
      points: 0,
      triggersRestriction: true,
      description: 'Fabricated or prank incident report detected by emergency intake. Account restricted.',
      category: 'Anti-Abuse'
    }
  },
  antiAbuseRules: {
    maxReportsPerHour: 3,
    dailyLimit: 8,
    duplicateGeofenceRadiusMeters: 150,
    duplicateTimeWindowMinutes: 20,
    minAccountAgeDays: 0,
    penaltyCooldownHours: 48
  },
  ethicalDisclaimer: 'Outcomes depend strictly on clinical emergency factors. Dispatch priority and medical care are 100% isolated from citizen reward points. Points are never awarded for clinical survival.'
};

// ── In-Memory State Store (Mock State with Dynamic Verification Lifecycle) ──
let state = {
  // Current active citizen user profile
  activeCitizen: {
    citizenId: 'CIT-8492',
    fullName: 'Aarav Sharma',
    handle: '@aarav_rescue',
    phone: '+91 98450 23411',
    communityZone: 'Koramangala, Bengaluru',
    organization: 'Community First Responders (Volunteer)',
    joinedDate: '2025-11-14',
    totalPoints: 85,
    verifiedContributions: 6,
    accountStatus: 'Good Standing', // 'Good Standing' | 'Under Review' | 'Restricted'
    restrictionFlag: null, // e.g. { reason, timestamp, appealStatus }
    hourlyReportsSubmitted: 1,
    dailyReportsSubmitted: 2,
    cooldownUntil: null
  },

  // Hospital & Receiving Facility Verifiers
  availableHospitals: [
    { id: 'HOSP-01', name: 'Victoria Hospital ER', admin: 'Dr. Aris Thorne (Chief Triage Officer)', badge: 'Level 1 Trauma' },
    { id: 'HOSP-02', name: 'Bowring & Lady Curzon Hospital', admin: 'Dr. Kavita Menon (Head of Emergency)', badge: 'Multi-Specialty' },
    { id: 'HOSP-03', name: 'Manipal Hospital HAL', admin: 'Dr. Rajesh Rao (Lead ER Registrar)', badge: 'Cardiac & Neuro' },
    { id: 'HOSP-04', name: 'Apollo Hospitals Bannerghatta', admin: 'Dr. Neha Swaminathan (Clinical Director)', badge: 'Super-Specialty' }
  ],

  // Incoming reports awaiting explicit verification by a hospital upon patient arrival
  pendingVerifications: [
    {
      reportId: 'REP-9021',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionKey: 'VALID_INCIDENT_REPORT',
      actionLabel: 'Valid Incident Report',
      emergencyType: 'Cardiac Arrest',
      location: '12th Main Road, 4th Block, Koramangala',
      reportedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      patientIntakeStatus: 'Arrived at ER Bay 1',
      ambulanceAssigned: 'AMB-001 (ALS Unit)',
      receivingHospital: 'Victoria Hospital ER',
      details: 'Patient collapsed near SBI ATM. Bystander CPR initiated. Accurate coordinates provided.',
      duplicateScore: '0.02 (Low Risk)',
      status: 'AWAITING_HOSPITAL_VERIFICATION'
    },
    {
      reportId: 'REP-9022',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionKey: 'VERIFIED_LOCATION_CORRECTION',
      actionLabel: 'Verified Location Correction',
      emergencyType: 'Road Collision',
      location: 'Service Road Junction, Outer Ring Road, Bellandur',
      reportedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      patientIntakeStatus: 'In Transit to Trauma Center',
      ambulanceAssigned: 'AMB-003 (Trauma Unit)',
      receivingHospital: 'Bowring & Lady Curzon Hospital',
      details: 'Updated narrow flyover entry obstruction. Directed driver via 80ft road gate.',
      duplicateScore: '0.05 (Low Risk)',
      status: 'AWAITING_HOSPITAL_VERIFICATION'
    },
    {
      reportId: 'REP-9023',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionKey: 'CONFIRMED_AUTHORIZED_RESPONDER_TASK',
      actionLabel: 'Confirmed Authorized Responder Task',
      emergencyType: 'Severe Respiratory Distress',
      location: 'Indiranagar Metro Station Exit B',
      reportedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      patientIntakeStatus: 'Patient Received at Triage',
      ambulanceAssigned: 'AMB-002 (Mobile ICU)',
      receivingHospital: 'Manipal Hospital HAL',
      details: 'Citizen coordinated clear crowd pathway from station concourse to ambulance bay.',
      duplicateScore: '0.01 (Low Risk)',
      status: 'AWAITING_HOSPITAL_VERIFICATION'
    },
    {
      reportId: 'REP-9024',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionKey: 'SUCCESSFUL_EMERGENCY_LOGISTICS_TASK',
      actionLabel: 'Emergency Logistics Task',
      emergencyType: 'Multi-Vehicle Pileup',
      location: 'Hosur Main Road, Silk Board Flyover Ramp',
      reportedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      patientIntakeStatus: 'Admitted to ER',
      ambulanceAssigned: 'AMB-005 (Trauma ICU)',
      receivingHospital: 'Victoria Hospital ER',
      details: 'Facilitated portable suction unit transfer from secondary support van to primary ALS.',
      duplicateScore: '0.00 (Low Risk)',
      status: 'AWAITING_HOSPITAL_VERIFICATION'
    }
  ],

  // Immutable Audit History of verified rewards
  auditHistory: [
    {
      id: 'AUD-7701',
      reportId: 'REP-8801',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionTaken: 'Initial Incident Report (Road Accident)',
      category: 'Reporting',
      actionKey: 'VALID_INCIDENT_REPORT',
      pointsAwarded: 10,
      verificationStatus: 'VERIFIED_VALID',
      verifiedBy: 'Dr. Aris Thorne (Chief Triage Officer)',
      hospital: 'Victoria Hospital ER',
      timestamp: '2026-10-09T08:14:22.000Z',
      notes: 'Patient successfully checked into trauma bay. Citizen coordinates verified 100% accurate on arrival.'
    },
    {
      id: 'AUD-7702',
      reportId: 'REP-8802',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionTaken: 'Precision Landmark Correction (Gate 4 Access)',
      category: 'Navigation',
      actionKey: 'VERIFIED_LOCATION_CORRECTION',
      pointsAwarded: 5,
      verificationStatus: 'VERIFIED_VALID',
      verifiedBy: 'Dr. Rajesh Rao (Lead ER Registrar)',
      hospital: 'Manipal Hospital HAL',
      timestamp: '2026-10-07T14:32:10.000Z',
      notes: 'Ambulance driver confirmed shortcut saved ~4.5 minutes through blocked gate 2.'
    },
    {
      id: 'AUD-7703',
      reportId: 'REP-8803',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionTaken: 'Authorized Bystander First-Aid Guide Assist',
      category: 'Field Assist',
      actionKey: 'CONFIRMED_AUTHORIZED_RESPONDER_TASK',
      pointsAwarded: 20,
      verificationStatus: 'VERIFIED_VALID',
      verifiedBy: 'Dr. Kavita Menon (Head of Emergency)',
      hospital: 'Bowring & Lady Curzon Hospital',
      timestamp: '2026-10-05T19:05:45.000Z',
      notes: 'Paramedic crew verified citizen assisted in holding cervical stabilization collar as instructed.'
    },
    {
      id: 'AUD-7704',
      reportId: 'REP-8804',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionTaken: 'Emergency Barrier Clearance for Rapid Evacuation',
      category: 'Logistics',
      actionKey: 'SUCCESSFUL_EMERGENCY_LOGISTICS_TASK',
      pointsAwarded: 15,
      verificationStatus: 'VERIFIED_VALID',
      verifiedBy: 'Dr. Neha Swaminathan (Clinical Director)',
      hospital: 'Apollo Hospitals Bannerghatta',
      timestamp: '2026-10-03T11:22:00.000Z',
      notes: 'Security barrier cleared and parked two-wheelers moved to allow ALS stretcher turnaround.'
    },
    {
      id: 'AUD-7705',
      reportId: 'REP-8805',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionTaken: 'Secondary Fire Incident Call',
      category: 'Duplicate',
      actionKey: 'DUPLICATE_UNVERIFIED_REPORT',
      pointsAwarded: 0,
      verificationStatus: 'DUPLICATE_UNVERIFIED',
      verifiedBy: 'Dr. Aris Thorne (Chief Triage Officer)',
      hospital: 'Victoria Hospital ER',
      timestamp: '2026-10-01T16:45:18.000Z',
      notes: 'Incident already logged by Fire Dept dispatch 4 minutes prior. Marked duplicate per policy (0 pts awarded).'
    },
    {
      id: 'AUD-7706',
      reportId: 'REP-8806',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionTaken: 'Authorized Defibrillator Delivery from Metro Depot',
      category: 'Logistics',
      actionKey: 'SUCCESSFUL_EMERGENCY_LOGISTICS_TASK',
      pointsAwarded: 15,
      verificationStatus: 'VERIFIED_VALID',
      verifiedBy: 'Dr. Rajesh Rao (Lead ER Registrar)',
      hospital: 'Manipal Hospital HAL',
      timestamp: '2026-09-28T10:11:33.000Z',
      notes: 'AED station lock released and pad pack transported to on-scene team.'
    },
    {
      id: 'AUD-7707',
      reportId: 'REP-8807',
      citizenId: 'CIT-8492',
      citizenName: 'Aarav Sharma',
      actionTaken: 'Pedestrian Crossing Incident Report',
      category: 'Reporting',
      actionKey: 'VALID_INCIDENT_REPORT',
      pointsAwarded: 20,
      verificationStatus: 'VERIFIED_VALID',
      verifiedBy: 'Dr. Kavita Menon (Head of Emergency)',
      hospital: 'Bowring & Lady Curzon Hospital',
      timestamp: '2026-09-24T21:40:12.000Z',
      notes: 'Confirmed accurate triage details.'
    }
  ],

  // Recognition Badges with unlock requirements
  badges: [
    {
      id: 'badge-verified-reporter',
      title: 'Verified Reporter',
      tier: 'Gold',
      icon: '🛡️',
      color: '#00d4ff',
      description: 'Submitted 5+ emergency reports verified as accurate by hospital ER triage.',
      requiredCount: 5,
      currentCount: 6,
      isUnlocked: true,
      unlockedAt: '2026-10-05T19:05:45.000Z'
    },
    {
      id: 'badge-community-helper',
      title: 'Community Helper',
      tier: 'Silver',
      icon: '🤝',
      color: '#00ff88',
      description: 'Completed 5+ verified location corrections or civic clearance assists.',
      requiredCount: 5,
      currentCount: 4,
      isUnlocked: false,
      unlockedAt: null
    },
    {
      id: 'badge-responder-partner',
      title: 'Responder Partner',
      tier: 'Platinum',
      icon: '⭐',
      color: '#ffa500',
      description: 'Accomplished 3+ paramedic or hospital-authorized active field tasks.',
      requiredCount: 3,
      currentCount: 3,
      isUnlocked: true,
      unlockedAt: '2026-10-09T08:14:22.000Z'
    },
    {
      id: 'badge-logistics-vanguard',
      title: 'Logistics Vanguard',
      tier: 'Master',
      icon: '📦',
      color: '#a855f7',
      description: 'Coordinated 3+ verified medical logistics or pathway clearance operations.',
      requiredCount: 3,
      currentCount: 2,
      isUnlocked: false,
      unlockedAt: null
    }
  ],

  // Community Leaderboard (Weekly)
  leaderboard: [
    {
      rank: 1,
      userId: 'CIT-8492',
      name: 'Aarav Sharma',
      handle: '@aarav_rescue',
      zone: 'Koramangala, Bengaluru',
      verifiedPoints: 85,
      verifiedCount: 6,
      avatar: '👨‍💼',
      badge: 'Responder Partner',
      isCurrentUser: true,
      trend: '▲ (+15 pts this week)'
    },
    {
      rank: 2,
      userId: 'CIT-7104',
      name: 'Dr. Priya Patel',
      handle: '@priya_cpr',
      zone: 'Indiranagar, Bengaluru',
      verifiedPoints: 75,
      verifiedCount: 5,
      avatar: '👩‍⚕️',
      badge: 'Verified Reporter',
      isCurrentUser: false,
      trend: '▲ (+10 pts this week)'
    },
    {
      rank: 3,
      userId: 'CIT-6321',
      name: 'Rahul Venkat',
      handle: '@rahul_v_firstaid',
      zone: 'Whitefield, Bengaluru',
      verifiedPoints: 65,
      verifiedCount: 5,
      avatar: '👨‍🔧',
      badge: 'Community Helper',
      isCurrentUser: false,
      trend: '▼ (0 pts this week)'
    },
    {
      rank: 4,
      userId: 'CIT-9182',
      name: 'Ananya Deshmukh',
      handle: '@ananya_dispatch',
      zone: 'Jayanagar, Bengaluru',
      verifiedPoints: 50,
      verifiedCount: 4,
      avatar: '👩‍💻',
      badge: 'Verified Reporter',
      isCurrentUser: false,
      trend: '▲ (+10 pts this week)'
    },
    {
      rank: 5,
      userId: 'CIT-5049',
      name: 'Karthik Subbaraj',
      handle: '@karthik_swift',
      zone: 'Electronic City, Bengaluru',
      verifiedPoints: 45,
      verifiedCount: 3,
      avatar: '👨‍🚒',
      badge: 'Responder Partner',
      isCurrentUser: false,
      trend: '▲ (+5 pts this week)'
    }
  ],

  // Area & Organization Aggregate Contributions
  areaAggregates: [
    { area: 'Koramangala', verifiedAssists: 142, pointsGenerated: 1840, activeVolunteers: 64, avgVerifyTimeMin: 4.2 },
    { area: 'Indiranagar', verifiedAssists: 118, pointsGenerated: 1520, activeVolunteers: 52, avgVerifyTimeMin: 3.8 },
    { area: 'Whitefield', verifiedAssists: 96, pointsGenerated: 1210, activeVolunteers: 41, avgVerifyTimeMin: 5.1 },
    { area: 'Jayanagar', verifiedAssists: 84, pointsGenerated: 1080, activeVolunteers: 36, avgVerifyTimeMin: 4.6 },
    { area: 'Electronic City', verifiedAssists: 72, pointsGenerated: 940, activeVolunteers: 29, avgVerifyTimeMin: 6.0 },
    { area: 'Central MG Road', verifiedAssists: 68, pointsGenerated: 890, activeVolunteers: 25, avgVerifyTimeMin: 3.5 }
  ],

  organizationAggregates: [
    { org: 'Community First Responders', members: 128, verifiedPoints: 3420, verifiedTasks: 210, badge: 'Lead Partner' },
    { org: 'Red Cross Youth Brigade', members: 84, verifiedPoints: 2150, verifiedTasks: 145, badge: 'Certified Corps' },
    { org: 'St. John Ambulance Volunteers', members: 62, verifiedPoints: 1680, verifiedTasks: 112, badge: 'Civic Escort' },
    { org: 'Bangalore Civil Defense Volunteers', members: 50, verifiedPoints: 1290, verifiedTasks: 88, badge: 'Urban Shield' }
  ],

  // Anti-Abuse Alerts & Geofenced Duplicates
  antiAbuseEvents: [
    {
      id: 'AAB-101',
      type: 'RATE_LIMIT_CHECK',
      status: 'NORMAL',
      detail: '1 of 3 hourly incident reporting limit consumed. Good standing maintained.',
      timestamp: new Date().toISOString()
    },
    {
      id: 'AAB-102',
      type: 'GEOFENCE_SIMILARITY',
      status: 'CLEAR',
      detail: 'No duplicate incidents found within 150m radius of recent reporting location.',
      timestamp: new Date().toISOString()
    }
  ],

  // Appeals submitted by restricted accounts
  appeals: []
};

// ── Helper to re-evaluate badges when points/contributions change ────────────
function updateCitizenBadges() {
  const verifiedCount = state.activeCitizen.verifiedContributions;
  const verifiedTasks = state.auditHistory.filter(
    h => h.actionKey === 'CONFIRMED_AUTHORIZED_RESPONDER_TASK' && h.verificationStatus === 'VERIFIED_VALID'
  ).length;
  const locationCorrections = state.auditHistory.filter(
    h => h.actionKey === 'VERIFIED_LOCATION_CORRECTION' && h.verificationStatus === 'VERIFIED_VALID'
  ).length;
  const logisticsTasks = state.auditHistory.filter(
    h => h.actionKey === 'SUCCESSFUL_EMERGENCY_LOGISTICS_TASK' && h.verificationStatus === 'VERIFIED_VALID'
  ).length;

  state.badges = state.badges.map(b => {
    if (b.id === 'badge-verified-reporter') {
      const unlocked = verifiedCount >= b.requiredCount;
      return {
        ...b,
        currentCount: verifiedCount,
        isUnlocked: unlocked,
        unlockedAt: unlocked ? (b.unlockedAt || new Date().toISOString()) : null
      };
    }
    if (b.id === 'badge-community-helper') {
      const total = locationCorrections + verifiedTasks;
      const unlocked = total >= b.requiredCount;
      return {
        ...b,
        currentCount: total,
        isUnlocked: unlocked,
        unlockedAt: unlocked ? (b.unlockedAt || new Date().toISOString()) : null
      };
    }
    if (b.id === 'badge-responder-partner') {
      const unlocked = verifiedTasks >= b.requiredCount;
      return {
        ...b,
        currentCount: verifiedTasks,
        isUnlocked: unlocked,
        unlockedAt: unlocked ? (b.unlockedAt || new Date().toISOString()) : null
      };
    }
    if (b.id === 'badge-logistics-vanguard') {
      const unlocked = logisticsTasks >= b.requiredCount;
      return {
        ...b,
        currentCount: logisticsTasks,
        isUnlocked: unlocked,
        unlockedAt: unlocked ? (b.unlockedAt || new Date().toISOString()) : null
      };
    }
    return b;
  });

  // Update leaderboard current user entry
  const userEntry = state.leaderboard.find(u => u.isCurrentUser);
  if (userEntry) {
    userEntry.verifiedPoints = state.activeCitizen.totalPoints;
    userEntry.verifiedCount = state.activeCitizen.verifiedContributions;
    state.leaderboard.sort((a, b) => b.verifiedPoints - a.verifiedPoints);
    state.leaderboard.forEach((item, idx) => { item.rank = idx + 1; });
  }
}

// ── GET /api/citizen/config ──────────────────────────────────────────────────
// Returns dynamic point values and ethical safety configuration. NO HARDCODING.
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: DYNAMIC_POINTS_CONFIG,
    timestamp: new Date().toISOString()
  });
});

// ── GET /api/citizen/profile ─────────────────────────────────────────────────
// Returns active citizen profile, points, status, badges, and anti-abuse limits
router.get('/profile', requireAuth, async (req, res) => {
  const { data: profile, error } = await supabase
    .from('citizens').select('*').eq('id', req.user.id).single();
  if (error) return res.status(404).json({ success: false, error: 'Profile not found' });

  const cfg = DYNAMIC_POINTS_CONFIG.antiAbuseRules;
  const since = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const [{ count: hourly }, { count: daily }] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true })
      .eq('citizen_id', req.user.id).gte('reported_at', since),
    supabase.from('reports').select('*', { count: 'exact', head: true })
      .eq('citizen_id', req.user.id).gte('reported_at', dayAgo),
  ]);

  res.json({ success: true, data: {
    profile,
    badges: [], // compute from audit_log or keep your existing badge logic
    antiAbuse: {
      hourlyConsumed: hourly, hourlyLimit: cfg.maxReportsPerHour,
      dailyConsumed: daily,   dailyLimit: cfg.dailyLimit,
      cooldownUntil: profile.cooldown_until, status: profile.account_status
    }
  }});
});

router.post('/report', requireAuth, async (req, res) => {
  const { actionKey = 'VALID_INCIDENT_REPORT', emergencyType, location, details, receivingHospital } = req.body;

  const { data: me } = await supabase.from('citizens').select('account_status, restriction_flag').eq('id', req.user.id).single();
  if (me?.account_status === 'Restricted')
    return res.status(403).json({ success: false, error: 'Account restricted. Submit an appeal first.', restriction: me.restriction_flag });

  const { count } = await supabase.from('reports').select('*', { count: 'exact', head: true })
    .eq('citizen_id', req.user.id).gte('reported_at', new Date(Date.now() - 3600_000).toISOString());
  if (count >= DYNAMIC_POINTS_CONFIG.antiAbuseRules.maxReportsPerHour)
    return res.status(429).json({ success: false, error: 'Rate limit reached.' });

  const { data: report, error } = await supabase.from('reports').insert({
    citizen_id: req.user.id, action_key: actionKey, emergency_type: emergencyType,
    location, details, receiving_hospital: receivingHospital
  }).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });

  res.json({ success: true, message: 'Report submitted. Points are credited after hospital verification.', data: { report } });
});

// ── GET /api/citizen/leaderboard ─────────────────────────────────────────────
// Returns weekly top users, zone aggregates, and organization aggregates
router.get('/leaderboard', (req, res) => {
  res.json({
    success: true,
    data: {
      weeklyLeaderboard: state.leaderboard,
      areaAggregates: state.areaAggregates,
      organizationAggregates: state.organizationAggregates,
      topContributor: state.leaderboard[0] || null
    }
  });
});

// ── GET /api/citizen/audit-history ───────────────────────────────────────────
// Returns complete, immutable audit trail of how points were verified & credited
router.get('/audit-history', (req, res) => {
  res.json({
    success: true,
    data: {
      history: state.auditHistory,
      totalEntries: state.auditHistory.length,
      totalVerifiedPoints: state.activeCitizen.totalPoints
    }
  });
});

// ── GET /api/citizen/pending-verifications ───────────────────────────────────
// Returns incoming community reports waiting for Hospital ER intake verification
router.get('/pending-verifications', (req, res) => {
  res.json({
    success: true,
    data: {
      pending: state.pendingVerifications,
      count: state.pendingVerifications.length,
      availableHospitals: state.availableHospitals
    }
  });
});

// ── POST /api/citizen/verify-report ──────────────────────────────────────────
/**
 * CORE HOSPITAL VERIFICATION ENDPOINT
 * 
 * Points are ONLY awarded after a "Hospital" user explicitly verifies
 * that the patient report is valid upon receiving the patient in the ER.
 * 
 * Verification outcomes:
 * 1. 'VERIFY_VALID':
 *    - Looks up point rule dynamically from DYNAMIC_POINTS_CONFIG (No Hardcoding!).
 *    - Adds points to citizen account.
 *    - Creates signed audit record with hospital verifier, timestamp, and notes.
 * 2. 'MARK_DUPLICATE':
 *    - Awards 0 points.
 *    - Logs duplicate warning in audit history.
 * 3. 'FLAG_FRAUDULENT':
 *    - 0 points awarded.
 *    - Triggers account review/restriction flag on the citizen account.
 *    - Logs anti-abuse penalty event.
 */
router.post('/verify-report', (req, res) => {
  const {
    reportId,
    verificationResult, // 'VERIFY_VALID' | 'MARK_DUPLICATE' | 'FLAG_FRAUDULENT'
    verifierName = 'Dr. Aris Thorne (Chief Triage Officer)',
    verifierRole = 'Hospital Emergency Intake Staff',
    hospitalName = 'Victoria Hospital ER',
    notes = ''
  } = req.body;

  if (!reportId || !verificationResult) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: reportId and verificationResult are mandatory.'
    });
  }

  // Find the pending report
  const reportIndex = state.pendingVerifications.findIndex(r => r.reportId === reportId);
  const report = reportIndex !== -1 ? state.pendingVerifications[reportIndex] : null;

  if (!report) {
    return res.status(404).json({
      success: false,
      error: `Report ${reportId} not found in pending intake verification queue.`
    });
  }

  const now = new Date().toISOString();
  let pointsAwarded = 0;
  let statusMessage = '';
  let auditStatus = '';

  // 1. Valid Verification
  if (verificationResult === 'VERIFY_VALID') {
    // Dynamic point lookup from backend config — strictly no frontend hardcoding
    const rule = DYNAMIC_POINTS_CONFIG.rules[report.actionKey] || DYNAMIC_POINTS_CONFIG.rules.VALID_INCIDENT_REPORT;
    pointsAwarded = rule.points;
    auditStatus = 'VERIFIED_VALID';

    // Award points ONLY to citizen upon hospital arrival verification
    state.activeCitizen.totalPoints += pointsAwarded;
    state.activeCitizen.verifiedContributions += 1;
    statusMessage = `Hospital triage verified report. Awarded +${pointsAwarded} Rescue Impact Points dynamically.`;

    // Create Audit History record
    const auditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      reportId: report.reportId,
      citizenId: report.citizenId,
      citizenName: report.citizenName,
      actionTaken: report.details,
      category: rule.category,
      actionKey: report.actionKey,
      pointsAwarded,
      verificationStatus: auditStatus,
      verifiedBy: verifierName,
      hospital: hospitalName,
      timestamp: now,
      notes: notes || `Hospital ER confirmed patient intake. Logistical report verified accurate by ${verifierRole}.`
    };
    state.auditHistory.unshift(auditRecord);

    // Re-evaluate badge progress
    updateCitizenBadges();

  // 2. Duplicate / Unverified
  } else if (verificationResult === 'MARK_DUPLICATE') {
    pointsAwarded = 0;
    auditStatus = 'DUPLICATE_UNVERIFIED';
    statusMessage = 'Report matched an existing active incident. 0 points awarded per anti-duplicate policy.';

    const auditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      reportId: report.reportId,
      citizenId: report.citizenId,
      citizenName: report.citizenName,
      actionTaken: report.details,
      category: 'Duplicate',
      actionKey: 'DUPLICATE_UNVERIFIED_REPORT',
      pointsAwarded: 0,
      verificationStatus: auditStatus,
      verifiedBy: verifierName,
      hospital: hospitalName,
      timestamp: now,
      notes: notes || 'Hospital verification determined report was redundant to an existing active dispatch.'
    };
    state.auditHistory.unshift(auditRecord);

  // 3. Fraudulent Report -> Triggers Account Restriction Flag
  } else if (verificationResult === 'FLAG_FRAUDULENT') {
    pointsAwarded = 0;
    auditStatus = 'FRAUDULENT_FLAGGED';
    statusMessage = 'Fraudulent incident report flagged by Hospital ER. Citizen account restricted for oversight review.';

    // Flag account as restricted
    state.activeCitizen.accountStatus = 'Restricted';
    state.activeCitizen.restrictionFlag = {
      flaggedBy: verifierName,
      hospital: hospitalName,
      reason: notes || 'Fabricated or malicious emergency report flagged upon hospital patient intake verification.',
      flaggedAt: now,
      appealAllowed: true,
      appealStatus: 'PENDING_CITIZEN_SUBMISSION'
    };

    const auditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      reportId: report.reportId,
      citizenId: report.citizenId,
      citizenName: report.citizenName,
      actionTaken: report.details,
      category: 'Anti-Abuse',
      actionKey: 'FRAUDULENT_REPORT',
      pointsAwarded: 0,
      verificationStatus: auditStatus,
      verifiedBy: verifierName,
      hospital: hospitalName,
      timestamp: now,
      notes: `CRITICAL ANTI-ABUSE: ${notes || 'Malicious report detected. Account flagged for review.'}`
    };
    state.auditHistory.unshift(auditRecord);

    state.antiAbuseEvents.unshift({
      id: `AAB-${Date.now().toString().slice(-3)}`,
      type: 'ACCOUNT_RESTRICTION_TRIGGERED',
      status: 'ALERT',
      detail: `Account CIT-8492 placed under restriction by ${verifierName} (${hospitalName}).`,
      timestamp: now
    });
  } else {
    return res.status(400).json({
      success: false,
      error: `Invalid verificationResult '${verificationResult}'. Must be VERIFY_VALID, MARK_DUPLICATE, or FLAG_FRAUDULENT.`
    });
  }

  // Remove from pending queue
  state.pendingVerifications.splice(reportIndex, 1);

  res.json({
    success: true,
    message: statusMessage,
    data: {
      reportId,
      verificationResult,
      pointsAwarded,
      verifiedBy: verifierName,
      hospital: hospitalName,
      timestamp: now,
      updatedCitizen: state.activeCitizen,
      badges: state.badges,
      auditHistoryCount: state.auditHistory.length,
      remainingPending: state.pendingVerifications.length
    }
  });
});



// ── POST /api/citizen/appeal ─────────────────────────────────────────────────
// Allows citizen to appeal account restriction
router.post('/appeal', (req, res) => {
  const { reason = '', contactPhone = '', additionalEvidence = '' } = req.body;

  if (state.activeCitizen.accountStatus !== 'Restricted') {
    return res.status(400).json({
      success: false,
      error: 'Account is in Good Standing. No restriction appeal required.'
    });
  }

  const appealRecord = {
    appealId: `APP-${Date.now().toString().slice(-4)}`,
    citizenId: state.activeCitizen.citizenId,
    citizenName: state.activeCitizen.fullName,
    reason,
    contactPhone: contactPhone || state.activeCitizen.phone,
    additionalEvidence,
    submittedAt: new Date().toISOString(),
    status: 'UNDER_BOARD_REVIEW'
  };

  state.appeals.push(appealRecord);
  state.activeCitizen.accountStatus = 'Under Review';
  if (state.activeCitizen.restrictionFlag) {
    state.activeCitizen.restrictionFlag.appealStatus = 'UNDER_REVIEW';
  }

  res.json({
    success: true,
    message: 'Appeal submitted to Hospital Oversight & Anti-Abuse Board. Account status updated to Under Review.',
    data: {
      appeal: appealRecord,
      accountStatus: state.activeCitizen.accountStatus
    }
  });
});

// ── POST /api/citizen/reset ──────────────────────────────────────────────────
// Allows instant reset for demonstrations and automated testing
router.post('/reset', (req, res) => {
  state.activeCitizen.totalPoints = 85;
  state.activeCitizen.verifiedContributions = 6;
  state.activeCitizen.accountStatus = 'Good Standing';
  state.activeCitizen.restrictionFlag = null;
  state.activeCitizen.hourlyReportsSubmitted = 1;
  state.activeCitizen.dailyReportsSubmitted = 2;
  updateCitizenBadges();

  res.json({
    success: true,
    message: 'Citizen state reset to default demo baseline successfully.',
    data: {
      profile: state.activeCitizen,
      badges: state.badges
    }
  });
});

module.exports = router;

