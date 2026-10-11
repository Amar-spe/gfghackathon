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

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, authHeaders, isSupabaseConfigured } from '../../lib/supabase';

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

// ── Supabase row -> UI shape mappers ────────────────────────────────
const slugHandle = (name = '') =>
  '@' + (name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'citizen');

const mapProfileRow = (row, reports = []) => {
  const now = Date.now();
  const hourly = reports.filter(r => now - new Date(r.reported_at).getTime() < 60 * 60 * 1000).length;
  const daily = reports.filter(r => now - new Date(r.reported_at).getTime() < 24 * 60 * 60 * 1000).length;
  return {
    isDemo: false,
    dbId: row.id,
    citizenId: row.citizen_id,
    email: row.email || '',
    fullName: row.full_name,
    handle: slugHandle(row.full_name),
    phone: row.phone || '',
    communityZone: row.community_zone || '',
    organization: row.organization || 'Civic First Responder Volunteer',
    joinedDate: (row.joined_at || '').slice(0, 10),
    totalPoints: row.total_points ?? 0,
    verifiedContributions: row.verified_contributions ?? 0,
    accountStatus: row.account_status || 'Good Standing',
    restrictionFlag: row.restriction_flag || null,
    hourlyReportsSubmitted: hourly,
    dailyReportsSubmitted: daily,
    avatar: '👤',
    cooldownUntil: row.cooldown_until || null
  };
};

const mapReportRow = (r, user, config) => ({
  reportId: r.report_id,
  citizenId: user?.citizenId,
  citizenName: user?.fullName,
  actionKey: r.action_key,
  actionLabel: config?.rules?.[r.action_key]?.label || 'Emergency Report',
  emergencyType: r.emergency_type || 'Emergency',
  location: r.location || '',
  reportedAt: r.reported_at,
  patientIntakeStatus: 'In Transit / ER Queue',
  ambulanceAssigned: 'Pending assignment',
  receivingHospital: r.receiving_hospital || 'Hospital ER',
  details: r.details || `Citizen reported ${r.emergency_type} at ${r.location}.`,
  duplicateScore: 'Pending check',
  status: r.status,
  source: 'supabase'
});

const auditStatusFor = (a) =>
  a.action_key === 'FRAUDULENT_REPORT' ? 'FRAUDULENT_FLAGGED'
    : a.action_key === 'DUPLICATE_UNVERIFIED_REPORT' ? 'DUPLICATE_UNVERIFIED'
      : 'VERIFIED_VALID';

const mapAuditRow = (a, user, config) => ({
  id: `AUD-${a.id}`,
  reportId: a.report_id || '—',
  citizenId: user?.citizenId,
  citizenName: user?.fullName,
  actionTaken: config?.rules?.[a.action_key]?.label || a.action_key,
  category: config?.rules?.[a.action_key]?.category || 'Assistance',
  actionKey: a.action_key,
  pointsAwarded: a.points_awarded ?? 0,
  verificationStatus: auditStatusFor(a),
  verifiedBy: 'Hospital Triage',
  hospital: '—',
  timestamp: a.created_at,
  notes: a.note || ''
});

export function CitizenRescueProvider({ children }) {
  // ── Dynamic Configuration (NO HARDCODING) ─────────────────────────
  const [config, setConfig] = useState(DEFAULT_BASELINE_CONFIG);

  // ── AUTHENTICATION STATE: USER DETAILS SHOWN ONLY AFTER LOGIN ────
  // Initially null (logged out), so user's personal details are hidden until login.
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Only demo profiles are restored from localStorage.
      // Real accounts are restored from the Supabase session instead.
      const saved = localStorage.getItem('lifeline_citizen_user');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && parsed.isDemo !== false ? parsed : null;
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

  // Raw rows for real (Supabase) accounts
  const [realReportRows, setRealReportRows] = useState([]);
  const [realAuditRows, setRealAuditRows] = useState([]);
  const [realLeaderboardRows, setRealLeaderboardRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);

  // Always-fresh config for callbacks that must not re-run when config changes
  const configRef = useRef(config);
  configRef.current = config;

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

  // ── REAL (SUPABASE) ACCOUNT DATA ──────────────────────────────────
  // Demo profiles (1-click) stay fully local. Accounts created through
  // Supabase Auth (isDemo === false) read/write real data in the database.
  const isRealUser = currentUser?.isDemo === false;

  const callBackend = useCallback(async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && json.success !== false, json };
  }, []);

  const loadRealUserData = useCallback(async (authUser) => {
    if (!supabase || !authUser) return null;
    try {
      const meta = authUser.user_metadata || {};

      let { data: row, error } = await supabase
        .from('citizens').select('*').eq('id', authUser.id).maybeSingle();
      if (error) throw error;

      // First login after sign-up (e.g. after email confirmation): create the profile row
      if (!row) {
        const { data: created, error: insertError } = await supabase
          .from('citizens')
          .insert({
            id: authUser.id,
            full_name: meta.full_name || authUser.email?.split('@')[0] || 'Citizen',
            email: authUser.email,
            phone: meta.phone || null,
            community_zone: meta.community_zone || null
          })
          .select()
          .single();
        if (insertError) throw insertError;
        row = created;
      }

      const [reportsRes, auditRes, boardRes] = await Promise.all([
        supabase.from('reports').select('*').eq('citizen_id', authUser.id)
          .order('reported_at', { ascending: false }).limit(200),
        supabase.from('audit_log').select('*').eq('citizen_id', authUser.id)
          .order('created_at', { ascending: false }).limit(200),
        supabase.from('leaderboard_view').select('*').limit(20)
      ]);
      if (reportsRes.error) throw reportsRes.error;
      if (auditRes.error) throw auditRes.error;
      if (boardRes.error) console.warn('leaderboard_view not available:', boardRes.error.message);

      const reportRows = reportsRes.data || [];
      const auditRows = auditRes.data || [];
      const profile = mapProfileRow(row, reportRows);

      setRealReportRows(reportRows);
      setRealAuditRows(auditRows);
      setRealLeaderboardRows(boardRes.data || []);
      setCurrentUser(profile);

      // Badges are computed from the user's real verified history
      setBadges(DEFAULT_BADGES.map(b => ({ ...b, currentCount: 0, isUnlocked: false, unlockedAt: null })));
      recomputeBadges(
        profile.verifiedContributions,
        auditRows.map(a => mapAuditRow(a, profile, configRef.current))
      );
      return profile;
    } catch (err) {
      console.error('Supabase load failed:', err);
      setLastNotification({ type: 'danger', message: `Could not load your account data: ${err.message}` });
      return null;
    }
  }, [recomputeBadges]);

  const refreshCitizenData = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.user ? loadRealUserData(data.session.user) : null;
  }, [loadRealUserData]);

  // Restore an existing Supabase session on page load / handle sign-out
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session?.user) loadRealUserData(data.session.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(prev => (prev && prev.isDemo === false ? null : prev));
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadRealUserData]);

  // What the UI sees: real data for real accounts, local demo data otherwise
  const realPending = useMemo(
    () => (isRealUser
      ? realReportRows
          .filter(r => r.status === 'AWAITING_HOSPITAL_VERIFICATION')
          .map(r => mapReportRow(r, currentUser, config))
      : []),
    [isRealUser, realReportRows, currentUser, config]
  );
  const realAudit = useMemo(
    () => (isRealUser ? realAuditRows.map(a => mapAuditRow(a, currentUser, config)) : []),
    [isRealUser, realAuditRows, currentUser, config]
  );
  const realLeaderboard = useMemo(
    () => realLeaderboardRows.map((r, i) => ({
      rank: i + 1,
      userId: r.citizen_id,
      name: r.full_name,
      handle: slugHandle(r.full_name),
      zone: r.community_zone || '—',
      verifiedPoints: r.total_points,
      verifiedCount: r.verified_contributions,
      avatar: '👤',
      badge: 'Community Member',
      isCurrentUser: r.citizen_id === currentUser?.citizenId,
      trend: '—'
    })),
    [realLeaderboardRows, currentUser]
  );

  const effectivePending = isRealUser ? realPending : pendingVerifications;
  const effectiveAudit = isRealUser ? realAudit : auditHistory;
  const effectiveLeaderboard = isRealUser ? realLeaderboard : leaderboard;

  // ── LOGIN CITIZEN ─────────────────────────────────────────────────
  // loginCitizen(email, password)  -> real Supabase account
  // loginCitizen(citizenId | email | name) -> local demo profile
  const loginCitizen = useCallback(async (identifier, password) => {
    if (password && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password
      });
      if (error) {
        setLastNotification({ type: 'danger', message: `Sign-in failed: ${error.message}` });
        return { success: false, error: error.message };
      }
      const profile = await loadRealUserData(data.user);
      if (profile) {
        setLastNotification({
          type: 'success',
          message: `Welcome back, ${profile.fullName}! Personal Rescue Telemetry & Points unlocked.`
        });
        return { success: true, user: profile };
      }
      return { success: false, error: 'Could not load profile' };
    }

    // identifier can be citizenId, email, or name (demo profiles)
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
  }, [citizenDirectory, loadRealUserData]);

  // ── LOGOUT CITIZEN ────────────────────────────────────────────────
  const logoutCitizen = useCallback(async () => {
    setCurrentUser(null);
    setRealReportRows([]);
    setRealAuditRows([]);
    setRealLeaderboardRows([]);
    localStorage.removeItem('lifeline_citizen_user');
    if (supabase) {
      try { await supabase.auth.signOut(); } catch (_) { /* ignore */ }
    }
    setLastNotification({
      type: 'info',
      message: 'Logged out. Personal details and point history are now protected.'
    });
  }, []);

  // ── REGISTER NEW CITIZEN ──────────────────────────────────────────
  // With email + password -> real Supabase account. Without -> local demo account.
  const registerCitizen = useCallback(async ({ fullName, phone, communityZone, email, password }) => {
    if (supabase && password && email) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName, phone, community_zone: communityZone } }
      });
      if (error) {
        setLastNotification({ type: 'danger', message: `Registration failed: ${error.message}` });
        return { success: false, error: error.message };
      }
      if (!data.session) {
        // Email confirmation is ON in Supabase: profile is created on first login
        setLastNotification({
          type: 'info',
          message: 'Account created. Check your email to confirm it, then sign in.'
        });
        return { success: true, needsConfirmation: true };
      }
      const profile = await loadRealUserData(data.user);
      if (profile) {
        setLastNotification({
          type: 'success',
          message: `Account created for ${profile.fullName} (${profile.citizenId})! Ready to earn Rescue Impact Points upon hospital verification.`
        });
      }
      return { success: !!profile, user: profile };
    }

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
  }, [loadRealUserData]);

  // ── CORE HOSPITAL VERIFICATION ACTION ─────────────────────────────
  /**
   * Points must ONLY be awarded to the citizen's account after a "Hospital" user
   * (via Hospital portal/backend) explicitly verifies the patient report is valid
   * upon receiving the patient.
   *
   * Real (Supabase) reports are verified by the BACKEND (service key), never by the
   * browser, so a citizen can't credit points to themselves.
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
    const report = effectivePending.find(r => r.reportId === reportId);
    if (!report) {
      setLoading(false);
      return { success: false, error: 'Report not found' };
    }

    // ── Real report: backend verifies and writes points ──
    if (report.source === 'supabase') {
      const { ok, json } = await callBackend('/api/citizen/verify-report', {
        reportId, verificationResult, verifierName, verifierRole, hospitalName, notes
      });
      if (!ok) {
        setLastNotification({ type: 'danger', message: json.error || 'Verification failed on the server.' });
        setLoading(false);
        return { success: false, error: json.error || 'Verification failed' };
      }
      await refreshCitizenData();
      const message = json.message || 'Report verification recorded.';
      setLastNotification({
        type: verificationResult === 'VERIFY_VALID' ? 'success' : verificationResult === 'FLAG_FRAUDULENT' ? 'danger' : 'warning',
        message
      });
      setLoading(false);
      return { success: true, pointsAwarded: json.pointsAwarded ?? json.data?.pointsAwarded ?? 0, message };
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
  }, [effectivePending, currentUser, auditHistory, config, getDynamicPointsForAction, recomputeBadges, callBackend, refreshCitizenData]);

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

    // ── Real account: save to Supabase ──
    if (isRealUser) {
      const rules = config.antiAbuseRules;
      if (currentUser.hourlyReportsSubmitted >= rules.maxReportsPerHour) {
        setLastNotification({
          type: 'warning',
          message: `Rate limit reached. Maximum ${rules.maxReportsPerHour} reports per hour allowed to prevent abuse.`
        });
        return { success: false, error: 'Hourly rate limit reached' };
      }
      if (currentUser.dailyReportsSubmitted >= rules.dailyLimit) {
        setLastNotification({
          type: 'warning',
          message: `Daily limit of ${rules.dailyLimit} reports reached. Please try again tomorrow.`
        });
        return { success: false, error: 'Daily limit reached' };
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          citizen_id: currentUser.dbId,
          action_key: actionKey,
          emergency_type: emergencyType,
          location,
          details: details || `Citizen reported ${emergencyType} at ${location}.`,
          receiving_hospital: receivingHospital
        })
        .select()
        .single();

      if (error) {
        setLastNotification({ type: 'danger', message: `Could not submit report: ${error.message}` });
        return { success: false, error: error.message };
      }

      await refreshCitizenData();
      setLastNotification({
        type: 'info',
        message: `Report ${data.report_id} queued for ${receivingHospital}. Points will be credited once hospital verifies patient intake!`
      });
      return { success: true, data: mapReportRow(data, currentUser, config) };
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
  }, [currentUser, config, isRealUser, refreshCitizenData]);

  // ── SUBMIT APPEAL ─────────────────────────────────────────────────
  const submitAppeal = useCallback(async ({ reason, additionalEvidence }) => {
    if (!currentUser) return;

    // Real account: the backend changes account status (users can't edit it themselves)
    if (isRealUser) {
      const { ok, json } = await callBackend('/api/citizen/appeal', { reason, additionalEvidence });
      if (!ok) {
        setLastNotification({ type: 'danger', message: json.error || 'Could not submit appeal.' });
        return { success: false, error: json.error || 'Appeal failed' };
      }
      await refreshCitizenData();
      setLastNotification({
        type: 'info',
        message: 'Appeal submitted to Hospital Oversight Board. Account status updated to Under Review.'
      });
      return { success: true };
    }

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
  }, [currentUser, isRealUser, callBackend, refreshCitizenData]);

  // ── RESET STATE BASELINE ──────────────────────────────────────────
  const resetToBaseline = useCallback(async () => {
    // Real accounts are never overwritten by demo data: just re-sync from the database
    if (isRealUser) {
      await refreshCitizenData();
      setLastNotification({ type: 'success', message: 'Account data refreshed from the database.' });
      return;
    }
    setCitizenDirectory(REGISTERED_CITIZENS);
    setCurrentUser(REGISTERED_CITIZENS[0]); // Reset to Aarav
    localStorage.setItem('lifeline_citizen_user', JSON.stringify(REGISTERED_CITIZENS[0]));
    setBadges(DEFAULT_BADGES);
    setAuditHistory(DEFAULT_AUDIT_HISTORY);
    setPendingVerifications(DEFAULT_PENDING_REPORTS);
    setLeaderboard(DEFAULT_LEADERBOARD);
    setLastNotification({ type: 'success', message: 'Demo state reset to default baseline.' });
  }, [isRealUser, refreshCitizenData]);

  return (
    <CitizenRescueContext.Provider value={{
      config,
      currentUser,
      isLoggedIn: !!currentUser,
      isRealAccount: isRealUser,
      authConfigured: isSupabaseConfigured,
      loginCitizen,
      logoutCitizen,
      registerCitizen,
      refreshCitizenData,
      citizenDirectory,
      badges,
      auditHistory: effectiveAudit,
      pendingVerifications: effectivePending,
      leaderboard: effectiveLeaderboard,
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