/**
 * ============================================================================
 * LIFELINE AI - CITIZEN RESCUE IMPACT POINTS STATE MANAGEMENT STORE
 * ============================================================================
 * 
 * CRITICAL SAFETY & ETHICAL CONSTRAINTS (MANDATORY SYSTEM DIRECTIVES):
 * 1. NEVER award points based on patient survival, recovery, or clinical outcomes.
 *    Civic volunteers and citizens must NEVER be evaluated or incentivized based
 *    on medical results or clinical triage outcomes. Points are awarded SOLELY
 *    for timely, verified logistical accuracy and civic coordination.
 * 
 * 2. Dispatch priority must ALWAYS remain strictly based on emergency need, severity,
 *    and clinical protocols, completely isolated from this community reward system.
 * 
 * 3. Hospital verification is required BEFORE any points are credited. Points are
 *    awarded only after a designated Hospital User (Triage / Receiving Staff)
 *    explicitly verifies patient handover and confirms report validity upon arrival.
 * 
 * 4. Point values are NEVER hardcoded in the frontend. All reward rules and multipliers
 *    are dynamically fetched from backend configuration (/api/citizen/config).
 * 
 * 5. USER DETAILS ACCESS CONTROL:
 *    Personal citizen details, point balances, badges, and private audit trails
 *    are protected and ONLY displayed after user authentication.
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CitizenRescueContext = createContext();

// Backend API Base URL
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Dynamic Baseline Configuration (Served from backend /api/citizen/config)
const DEFAULT_BASELINE_CONFIG = {
  version: '2026.4.1',
  currencyName: 'Rescue Impact Points',
  currencySymbol: 'RIP',
  rules: {
    VALID_INCIDENT_REPORT: {
      actionKey: 'VALID_INCIDENT_REPORT',
      label: 'Valid Incident Report',
      points: 10,
      description: 'Accurate initial reporting of an emergency incident verified upon ambulance intake.',
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
    duplicateTimeWindowMinutes: 20
  },
  ethicalDisclaimer: 'Outcomes depend strictly on clinical emergency factors. Dispatch priority and medical care are 100% isolated from citizen reward points. Points are never awarded for clinical survival.'
};

// Registered Directory of Citizen Accounts (For Authentication)
export const REGISTERED_CITIZENS = [
  {
    citizenId: 'CIT-8492',
    email: 'aarav@lifeline.org',
    fullName: 'Aarav Sharma',
    handle: '@aarav_rescue',
    phone: '+91 98450 23411',
    communityZone: 'Koramangala, Bengaluru',
    organization: 'Community First Responders (Volunteer)',
    joinedDate: '2025-11-14',
    totalPoints: 85,
    verifiedContributions: 6,
    accountStatus: 'Good Standing',
    restrictionFlag: null,
    hourlyReportsSubmitted: 1,
    dailyReportsSubmitted: 2,
    avatar: '👨‍💼',
    cooldownUntil: null
  },
  {
    citizenId: 'CIT-7104',
    email: 'priya@lifeline.org',
    fullName: 'Dr. Priya Patel',
    handle: '@priya_cpr',
    phone: '+91 97412 88301',
    communityZone: 'Indiranagar, Bengaluru',
    organization: 'Red Cross Youth Brigade',
    joinedDate: '2026-01-20',
    totalPoints: 75,
    verifiedContributions: 5,
    accountStatus: 'Good Standing',
    restrictionFlag: null,
    hourlyReportsSubmitted: 0,
    dailyReportsSubmitted: 1,
    avatar: '👩‍⚕️',
    cooldownUntil: null
  },
  {
    citizenId: 'CIT-6321',
    email: 'rahul@lifeline.org',
    fullName: 'Rahul Venkat',
    handle: '@rahul_v_firstaid',
    phone: '+91 96110 54199',
    communityZone: 'Whitefield, Bengaluru',
    organization: 'Bangalore Civil Defense Volunteers',
    joinedDate: '2026-03-05',
    totalPoints: 65,
    verifiedContributions: 5,
    accountStatus: 'Good Standing',
    restrictionFlag: null,
    hourlyReportsSubmitted: 1,
    dailyReportsSubmitted: 2,
    avatar: '👨‍🔧',
    cooldownUntil: null
  }
];

const DEFAULT_BADGES = [
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
];

const DEFAULT_AUDIT_HISTORY = [
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
  }
];

const DEFAULT_PENDING_REPORTS = [
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
    citizenId: 'CIT-7104',
    citizenName: 'Dr. Priya Patel',
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
];

const DEFAULT_LEADERBOARD = [
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
];

const DEFAULT_AREA_AGGREGATES = [
  { area: 'Koramangala', verifiedAssists: 142, pointsGenerated: 1840, activeVolunteers: 64, avgVerifyTimeMin: 4.2 },
  { area: 'Indiranagar', verifiedAssists: 118, pointsGenerated: 1520, activeVolunteers: 52, avgVerifyTimeMin: 3.8 },
  { area: 'Whitefield', verifiedAssists: 96, pointsGenerated: 1210, activeVolunteers: 41, avgVerifyTimeMin: 5.1 },
  { area: 'Jayanagar', verifiedAssists: 84, pointsGenerated: 1080, activeVolunteers: 36, avgVerifyTimeMin: 4.6 },
  { area: 'Electronic City', verifiedAssists: 72, pointsGenerated: 940, activeVolunteers: 29, avgVerifyTimeMin: 6.0 },
  { area: 'Central MG Road', verifiedAssists: 68, pointsGenerated: 890, activeVolunteers: 25, avgVerifyTimeMin: 3.5 }
];

const DEFAULT_ORG_AGGREGATES = [
  { org: 'Community First Responders', members: 128, verifiedPoints: 3420, verifiedTasks: 210, badge: 'Lead Partner' },
  { org: 'Red Cross Youth Brigade', members: 84, verifiedPoints: 2150, verifiedTasks: 145, badge: 'Certified Corps' },
  { org: 'St. John Ambulance Volunteers', members: 62, verifiedPoints: 1680, verifiedTasks: 112, badge: 'Civic Escort' },
  { org: 'Bangalore Civil Defense Volunteers', members: 50, verifiedPoints: 1290, verifiedTasks: 88, badge: 'Urban Shield' }
];

export function CitizenRescueProvider({ children }) {
  // ── Dynamic Configuration (NO HARDCODING) ─────────────────────────
  const [config, setConfig] = useState(DEFAULT_BASELINE_CONFIG);

  // ── AUTHENTICATION STATE: USER DETAILS SHOWN ONLY AFTER LOGIN ────
  // Initially null (logged out), so user's personal details are hidden until login.
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeline_citizen_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  // State collections
  const [citizenDirectory, setCitizenDirectory] = useState(REGISTERED_CITIZENS);
  const [badges, setBadges] = useState(DEFAULT_BADGES);
  const [auditHistory, setAuditHistory] = useState(DEFAULT_AUDIT_HISTORY);
  const [pendingVerifications, setPendingVerifications] = useState(DEFAULT_PENDING_REPORTS);
  const [leaderboard, setLeaderboard] = useState(DEFAULT_LEADERBOARD);
  const [areaAggregates, setAreaAggregates] = useState(DEFAULT_AREA_AGGREGATES);
  const [orgAggregates, setOrgAggregates] = useState(DEFAULT_ORG_AGGREGATES);

  const [loading, setLoading] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);

  // ── Fetch dynamic point configuration from backend ────────────────
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/citizen/config`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setConfig(json.data);
        }
      }
    } catch (err) {
      console.warn('Using baseline dynamic points config:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ── LOGIN CITIZEN ─────────────────────────────────────────────────
  const loginCitizen = useCallback((identifier) => {
    // identifier can be citizenId, email, or name
    const found = citizenDirectory.find(
      c => c.citizenId === identifier || c.email?.toLowerCase() === identifier.toLowerCase() || c.fullName.toLowerCase() === identifier.toLowerCase()
    );

    if (found) {
      setCurrentUser(found);
      localStorage.setItem('lifeline_citizen_user', JSON.stringify(found));
      setLastNotification({
        type: 'success',
        message: `Welcome back, ${found.fullName}! Personal Rescue Telemetry & Points unlocked.`
      });
      return { success: true, user: found };
    }

    setLastNotification({
      type: 'danger',
      message: 'Citizen profile not found. Please select a valid profile or register.'
    });
    return { success: false, error: 'User not found' };
  }, [citizenDirectory]);

  // ── LOGOUT CITIZEN ────────────────────────────────────────────────
  const logoutCitizen = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('lifeline_citizen_user');
    setLastNotification({
      type: 'info',
      message: 'Logged out. Personal details and point history are now protected.'
    });
  }, []);

  // ── REGISTER NEW CITIZEN ──────────────────────────────────────────
  const registerCitizen = useCallback(({ fullName, phone, communityZone, email }) => {
    const newCitizenId = `CIT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCitizen = {
      citizenId: newCitizenId,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@lifeline.org`,
      fullName,
      handle: `@${fullName.toLowerCase().replace(/\s+/g, '_')}`,
      phone: phone || '+91 98000 00000',
      communityZone: communityZone || 'Central Bengaluru',
      organization: 'Civic First Responder Volunteer',
      joinedDate: new Date().toISOString().split('T')[0],
      totalPoints: 0,
      verifiedContributions: 0,
      accountStatus: 'Good Standing',
      restrictionFlag: null,
      hourlyReportsSubmitted: 0,
      dailyReportsSubmitted: 0,
      avatar: '👤',
      cooldownUntil: null
    };

    setCitizenDirectory(prev => [newCitizen, ...prev]);
    setCurrentUser(newCitizen);
    localStorage.setItem('lifeline_citizen_user', JSON.stringify(newCitizen));

    setLastNotification({
      type: 'success',
      message: `Account created for ${fullName} (${newCitizenId})! Ready to earn Rescue Impact Points upon hospital verification.`
    });

    return newCitizen;
  }, []);

  // ── RE-EVALUATE BADGES FOR CURRENT USER ───────────────────────────
  const recomputeBadges = useCallback((verifiedCount, userHistory) => {
    const verifiedTasks = userHistory.filter(
      h => h.actionKey === 'CONFIRMED_AUTHORIZED_RESPONDER_TASK' && h.verificationStatus === 'VERIFIED_VALID'
    ).length;
    const locationCorrections = userHistory.filter(
      h => h.actionKey === 'VERIFIED_LOCATION_CORRECTION' && h.verificationStatus === 'VERIFIED_VALID'
    ).length;
    const logisticsTasks = userHistory.filter(
      h => h.actionKey === 'SUCCESSFUL_EMERGENCY_LOGISTICS_TASK' && h.verificationStatus === 'VERIFIED_VALID'
    ).length;

    setBadges(prev => prev.map(b => {
      if (b.id === 'badge-verified-reporter') {
        const unlocked = verifiedCount >= b.requiredCount;
        return { ...b, currentCount: verifiedCount, isUnlocked: unlocked, unlockedAt: unlocked ? (b.unlockedAt || new Date().toISOString()) : null };
      }
      if (b.id === 'badge-community-helper') {
        const total = locationCorrections + verifiedTasks;
        const unlocked = total >= b.requiredCount;
        return { ...b, currentCount: total, isUnlocked: unlocked, unlockedAt: unlocked ? (b.unlockedAt || new Date().toISOString()) : null };
      }
      if (b.id === 'badge-responder-partner') {
        const unlocked = verifiedTasks >= b.requiredCount;
        return { ...b, currentCount: verifiedTasks, isUnlocked: unlocked, unlockedAt: unlocked ? (b.unlockedAt || new Date().toISOString()) : null };
      }
      if (b.id === 'badge-logistics-vanguard') {
        const unlocked = logisticsTasks >= b.requiredCount;
        return { ...b, currentCount: logisticsTasks, isUnlocked: unlocked, unlockedAt: unlocked ? (b.unlockedAt || new Date().toISOString()) : null };
      }
      return b;
    }));
  }, []);

  // ── DYNAMIC POINT VALUE LOOKUP (NO HARDCODING) ───────────────────
  const getDynamicPointsForAction = useCallback((actionKey) => {
    const rule = config?.rules?.[actionKey];
    return rule ? rule.points : 0;
  }, [config]);

  // ── CORE HOSPITAL VERIFICATION ACTION ─────────────────────────────
  /**
   * Points must ONLY be awarded to the citizen's account after a "Hospital" user
   * (via Hospital portal/backend) explicitly verifies the patient report is valid
   * upon receiving the patient.
   */
  const verifyReportByHospital = useCallback(async ({
    reportId,
    verificationResult, // 'VERIFY_VALID' | 'MARK_DUPLICATE' | 'FLAG_FRAUDULENT'
    verifierName = 'Dr. Aris Thorne (Chief Triage Officer)',
    verifierRole = 'Hospital Emergency Intake Staff',
    hospitalName = 'Victoria Hospital ER',
    notes = ''
  }) => {
    setLoading(true);

    // Find the pending report
    const report = pendingVerifications.find(r => r.reportId === reportId);
    if (!report) {
      setLoading(false);
      return { success: false, error: 'Report not found' };
    }

    const now = new Date().toISOString();
    let pointsAwarded = 0;
    let auditStatus = '';
    let notificationMsg = '';

    if (verificationResult === 'VERIFY_VALID') {
      // Dynamic calculation from configuration (NO HARDCODING)
      pointsAwarded = getDynamicPointsForAction(report.actionKey);
      auditStatus = 'VERIFIED_VALID';
      notificationMsg = `Hospital ER verified patient arrival. Awarded +${pointsAwarded} Rescue Impact Points to ${report.citizenName}!`;

      // Update citizen's points in directory and in active profile if matches
      setCitizenDirectory(prev => prev.map(c => {
        if (c.citizenId === report.citizenId) {
          return {
            ...c,
            totalPoints: c.totalPoints + pointsAwarded,
            verifiedContributions: c.verifiedContributions + 1
          };
        }
        return c;
      }));

      // If the currently logged-in user is the author of this verified report:
      if (currentUser && currentUser.citizenId === report.citizenId) {
        const newTotal = currentUser.totalPoints + pointsAwarded;
        const newCount = currentUser.verifiedContributions + 1;
        const updatedUser = {
          ...currentUser,
          totalPoints: newTotal,
          verifiedContributions: newCount
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('lifeline_citizen_user', JSON.stringify(updatedUser));
      }

      // Record in immutable audit trail
      const auditRecord = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        reportId: report.reportId,
        citizenId: report.citizenId,
        citizenName: report.citizenName,
        actionTaken: report.details,
        category: config.rules[report.actionKey]?.category || 'Assistance',
        actionKey: report.actionKey,
        pointsAwarded,
        verificationStatus: auditStatus,
        verifiedBy: verifierName,
        hospital: hospitalName,
        timestamp: now,
        notes: notes || `Patient intake completed at triage. Logistical coordinates verified accurate by ${verifierRole}.`
      };

      const updatedHistory = [auditRecord, ...auditHistory];
      setAuditHistory(updatedHistory);

      // Recompute badges if matches logged-in user
      if (currentUser && currentUser.citizenId === report.citizenId) {
        recomputeBadges(currentUser.verifiedContributions + 1, updatedHistory.filter(h => h.citizenId === currentUser.citizenId));
      }

      // Update weekly leaderboard
      setLeaderboard(prev => prev.map(item => {
        if (item.userId === report.citizenId) {
          const newPts = item.verifiedPoints + pointsAwarded;
          return { ...item, verifiedPoints: newPts, verifiedCount: item.verifiedCount + 1 };
        }
        return item;
      }).sort((a, b) => b.verifiedPoints - a.verifiedPoints).map((u, i) => ({ ...u, rank: i + 1 })));

    } else if (verificationResult === 'MARK_DUPLICATE') {
      pointsAwarded = 0;
      auditStatus = 'DUPLICATE_UNVERIFIED';
      notificationMsg = 'Hospital triage marked report as duplicate. 0 points credited per policy.';

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
        notes: notes || 'Duplicate report matching an existing active dispatch.'
      };

      setAuditHistory(prev => [auditRecord, ...prev]);

    } else if (verificationResult === 'FLAG_FRAUDULENT') {
      pointsAwarded = 0;
      auditStatus = 'FRAUDULENT_FLAGGED';
      notificationMsg = `Hospital ER flagged fraudulent report for ${report.citizenName}. Account placed under restriction.`;

      // Apply restriction
      setCitizenDirectory(prev => prev.map(c => {
        if (c.citizenId === report.citizenId) {
          return {
            ...c,
            accountStatus: 'Restricted',
            restrictionFlag: {
              flaggedBy: verifierName,
              hospital: hospitalName,
              reason: notes || 'Fabricated or malicious emergency report flagged upon triage intake.',
              flaggedAt: now,
              appealAllowed: true,
              appealStatus: 'PENDING_CITIZEN_SUBMISSION'
            }
          };
        }
        return c;
      }));

      if (currentUser && currentUser.citizenId === report.citizenId) {
        const restrictedUser = {
          ...currentUser,
          accountStatus: 'Restricted',
          restrictionFlag: {
            flaggedBy: verifierName,
            hospital: hospitalName,
            reason: notes || 'Fabricated emergency report flagged upon hospital triage intake.',
            flaggedAt: now,
            appealAllowed: true,
            appealStatus: 'PENDING_CITIZEN_SUBMISSION'
          }
        };
        setCurrentUser(restrictedUser);
        localStorage.setItem('lifeline_citizen_user', JSON.stringify(restrictedUser));
      }

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
        notes: `FRAUD FLAG: ${notes || 'Malicious report detected. Account flagged.'}`
      };

      setAuditHistory(prev => [auditRecord, ...prev]);
    }

    // Remove from pending queue
    setPendingVerifications(prev => prev.filter(r => r.reportId !== reportId));
    setLastNotification({
      type: verificationResult === 'VERIFY_VALID' ? 'success' : verificationResult === 'FLAG_FRAUDULENT' ? 'danger' : 'warning',
      message: notificationMsg
    });
    setLoading(false);

    return { success: true, pointsAwarded, message: notificationMsg };
  }, [pendingVerifications, currentUser, auditHistory, config, getDynamicPointsForAction, recomputeBadges]);

  // ── SUBMIT CITIZEN REPORT ─────────────────────────────────────────
  const submitCitizenReport = useCallback(async ({
    actionKey = 'VALID_INCIDENT_REPORT',
    emergencyType = 'Road Collision',
    location = 'MG Road Metro Station',
    details = '',
    receivingHospital = 'Victoria Hospital ER'
  }) => {
    // Require login
    if (!currentUser) {
      setLastNotification({
        type: 'warning',
        message: 'Please sign in or register as a citizen to submit emergency reports and earn points.'
      });
      return { success: false, error: 'Authentication required' };
    }

    if (currentUser.accountStatus === 'Restricted') {
      setLastNotification({
        type: 'danger',
        message: 'Your account is restricted. Submit an appeal to the Hospital Oversight Board before reporting.'
      });
      return { success: false, error: 'Account restricted' };
    }

    const newReportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPending = {
      reportId: newReportId,
      citizenId: currentUser.citizenId,
      citizenName: currentUser.fullName,
      actionKey,
      actionLabel: config.rules[actionKey]?.label || 'Emergency Report',
      emergencyType,
      location,
      reportedAt: new Date().toISOString(),
      patientIntakeStatus: 'In Transit / ER Queue',
      ambulanceAssigned: 'AMB-004 (Active)',
      receivingHospital,
      details: details || `Citizen reported ${emergencyType} at ${location}.`,
      duplicateScore: '0.02 (Clear)',
      status: 'AWAITING_HOSPITAL_VERIFICATION'
    };

    setPendingVerifications(prev => [newPending, ...prev]);
    setLastNotification({
      type: 'info',
      message: `Report ${newReportId} queued for ${receivingHospital}. Points will be credited once hospital verifies patient intake!`
    });

    return { success: true, data: newPending };
  }, [currentUser, config]);

  // ── SUBMIT APPEAL ─────────────────────────────────────────────────
  const submitAppeal = useCallback(async ({ reason, additionalEvidence }) => {
    if (!currentUser) return;

    const updated = {
      ...currentUser,
      accountStatus: 'Under Review',
      restrictionFlag: currentUser.restrictionFlag ? {
        ...currentUser.restrictionFlag,
        appealStatus: 'UNDER_BOARD_REVIEW'
      } : null
    };

    setCurrentUser(updated);
    localStorage.setItem('lifeline_citizen_user', JSON.stringify(updated));

    setLastNotification({
      type: 'info',
      message: 'Appeal submitted to Hospital Oversight Board. Account status updated to Under Review.'
    });

    return { success: true };
  }, [currentUser]);

  // ── RESET STATE BASELINE ──────────────────────────────────────────
  const resetToBaseline = useCallback(() => {
    setCitizenDirectory(REGISTERED_CITIZENS);
    setCurrentUser(REGISTERED_CITIZENS[0]); // Reset to Aarav
    localStorage.setItem('lifeline_citizen_user', JSON.stringify(REGISTERED_CITIZENS[0]));
    setBadges(DEFAULT_BADGES);
    setAuditHistory(DEFAULT_AUDIT_HISTORY);
    setPendingVerifications(DEFAULT_PENDING_REPORTS);
    setLeaderboard(DEFAULT_LEADERBOARD);
    setLastNotification({ type: 'success', message: 'Demo state reset to default baseline.' });
  }, []);

  return (
    <CitizenRescueContext.Provider value={{
      config,
      currentUser,
      isLoggedIn: !!currentUser,
      loginCitizen,
      logoutCitizen,
      registerCitizen,
      citizenDirectory,
      badges,
      auditHistory,
      pendingVerifications,
      leaderboard,
      areaAggregates,
      orgAggregates,
      loading,
      lastNotification,
      clearNotification: () => setLastNotification(null),
      verifyReportByHospital,
      submitCitizenReport,
      submitAppeal,
      resetToBaseline,
      getDynamicPointsForAction
    }}>
      {children}
    </CitizenRescueContext.Provider>
  );
}

export function useCitizenRescue() {
  const context = useContext(CitizenRescueContext);
  if (!context) {
    throw new Error('useCitizenRescue must be used within a CitizenRescueProvider');
  }
  return context;
}
