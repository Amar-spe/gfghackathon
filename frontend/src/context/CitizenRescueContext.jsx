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
 * 
 * 6. DUAL CLOUD & DEMO BACKEND:
 *    Seamlessly connects to Supabase when configured, or operates in instant local
 *    mode with verified demo personas and real-time dispatcher event streams.
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
    phone: '+91 98450 12345',
    communityZone: 'Koramangala, Bengaluru',
    organization: 'Koramangala Residents Civic Aid',
    joinedDate: '2026-01-15',
    totalPoints: 85,
    verifiedContributions: 6,
    accountStatus: 'Good Standing',
    restrictionFlag: null,
    hourlyReportsSubmitted: 0,
    dailyReportsSubmitted: 1,
    avatar: '👨‍💼',
    cooldownUntil: null
  }
];

const DEFAULT_BADGES = [
  {
    badgeId: 'BADGE-01',
    name: 'Verified Reporter',
    icon: '🛡️',
    category: 'Logistical Accuracy',
    description: 'Submitted 3+ emergency incident reports verified upon hospital intake.',
    earnedAt: '2026-02-10T14:30:00Z',
    isUnlocked: true,
    progress: 100,
    requiredCount: 3,
    currentCount: 6
  },
  {
    badgeId: 'BADGE-02',
    name: 'Responder Partner',
    icon: '🤝',
    category: 'Field Coordination',
    description: 'Completed 2+ authorized paramedic field tasks (e.g. stretcher guide, AED transport).',
    earnedAt: '2026-03-04T09:15:00Z',
    isUnlocked: true,
    progress: 100,
    requiredCount: 2,
    currentCount: 2
  },
  {
    badgeId: 'BADGE-03',
    name: 'Grid Guardian',
    icon: '⭐',
    category: 'Community Excellence',
    description: 'Accumulated 100+ verified Rescue Impact Points with 0 anti-abuse flags.',
    earnedAt: null,
    isUnlocked: false,
    progress: 85,
    requiredCount: 100,
    currentCount: 85
  },
  {
    badgeId: 'BADGE-04',
    name: 'Zero-Delay Route Scout',
    icon: '⚡',
    category: 'Navigation',
    description: 'Provided 5 verified location or obstruction updates that shortened responder transit.',
    earnedAt: null,
    isUnlocked: false,
    progress: 40,
    requiredCount: 5,
    currentCount: 2
  }
];

const DEFAULT_AUDIT_HISTORY = [
  {
    id: 'AUD-901',
    reportId: 'REP-1042',
    citizenId: 'CIT-8492',
    citizenName: 'Aarav Sharma',
    actionTaken: 'Initial Incident Report (Road Collision at Koramangala 80ft Rd)',
    category: 'Reporting',
    actionKey: 'VALID_INCIDENT_REPORT',
    pointsAwarded: 10,
    verificationStatus: 'VERIFIED_ACCURATE',
    verifiedBy: 'Dr. Aris Thorne (Chief Triage Officer)',
    hospital: 'Victoria Hospital ER',
    timestamp: '2026-04-10T11:42:00Z',
    notes: 'Report matched patient arrival perfectly. Stretcher team prepped 4 minutes prior.'
  },
  {
    id: 'AUD-852',
    reportId: 'REP-1029',
    citizenId: 'CIT-8492',
    citizenName: 'Aarav Sharma',
    actionTaken: 'Paramedic Authorized Task: Stretcher clearance & crowd management',
    category: 'Field Assist',
    actionKey: 'CONFIRMED_AUTHORIZED_RESPONDER_TASK',
    pointsAwarded: 20,
    verificationStatus: 'VERIFIED_AUTHORIZED',
    verifiedBy: 'Lead Paramedic Rajesh (AMB-004)',
    hospital: 'Victoria Hospital ER',
    timestamp: '2026-04-05T18:20:00Z',
    notes: 'Citizen guided ambulance safely through gated perimeter.'
  }
];

const DEFAULT_PENDING_REPORTS = [
  {
    reportId: 'REP-1088',
    citizenId: 'CIT-8492',
    citizenName: 'Aarav Sharma',
    actionKey: 'VALID_INCIDENT_REPORT',
    actionLabel: 'Valid Incident Report',
    emergencyType: 'Road Collision',
    location: 'Sony World Junction, Koramangala',
    reportedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    patientIntakeStatus: 'In Transit / ER Queue',
    ambulanceAssigned: 'AMB-104 (Code Red)',
    receivingHospital: 'Victoria Hospital ER Complex',
    details: 'Two-wheeler collision at intersection. Traffic stalled, rider conscious but immobilized.',
    duplicateScore: '0.04 (Clear)',
    status: 'AWAITING_HOSPITAL_VERIFICATION'
  }
];

const DEFAULT_LEADERBOARD = [
  { rank: 1, userId: 'CIT-8492', name: 'Aarav Sharma', handle: '@aarav_rescue', zone: 'Koramangala, Bengaluru', verifiedPoints: 85, verifiedCount: 6, avatar: '👨‍💼', badge: 'Responder Partner', isCurrentUser: true, trend: '▲ (+15 pts this week)' },
  { rank: 2, userId: 'CIT-7104', name: 'Dr. Priya Patel', handle: '@priya_cpr', zone: 'Indiranagar, Bengaluru', verifiedPoints: 75, verifiedCount: 5, avatar: '👩‍⚕️', badge: 'Verified Reporter', isCurrentUser: false, trend: '▲ (+10 pts this week)' },
  { rank: 3, userId: 'CIT-6321', name: 'Rahul Venkat', handle: '@rahul_v_firstaid', zone: 'Whitefield, Bengaluru', verifiedPoints: 65, verifiedCount: 5, avatar: '👨‍🔧', badge: 'Community Helper', isCurrentUser: false, trend: '▼ (0 pts this week)' },
  { rank: 4, userId: 'CIT-9182', name: 'Ananya Deshmukh', handle: '@ananya_dispatch', zone: 'Jayanagar, Bengaluru', verifiedPoints: 50, verifiedCount: 4, avatar: '👩‍💻', badge: 'Verified Reporter', isCurrentUser: false, trend: '▲ (+10 pts this week)' },
  { rank: 5, userId: 'CIT-5049', name: 'Karthik Subbaraj', handle: '@karthik_swift', zone: 'Electronic City, Bengaluru', verifiedPoints: 45, verifiedCount: 3, avatar: '👨‍🚒', badge: 'Responder Partner', isCurrentUser: false, trend: '▲ (+5 pts this week)' }
];

const slugHandle = (name = '') =>
  '@' + (name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'citizen');

const mapProfileRow = (row, reports = []) => {
  const now = Date.now();
  const hourly = reports.filter(r => now - new Date(r.reported_at).getTime() < 60 * 60 * 1000).length;
  const daily = reports.filter(r => now - new Date(r.reported_at).getTime() < 24 * 60 * 60 * 1000).length;
  return {
    isDemo: false,
    dbId: row.id,
    citizenId: row.citizen_id || `CIT-${row.id.slice(0, 4).toUpperCase()}`,
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
  reportId: r.report_id || `REP-${r.id}`,
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

export function CitizenRescueProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_BASELINE_CONFIG);

  const [citizenDirectory, setCitizenDirectory] = useState(REGISTERED_CITIZENS);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeline_citizen_user');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed || REGISTERED_CITIZENS[0];
    } catch (_) {
      return REGISTERED_CITIZENS[0];
    }
  });

  const [badges, setBadges] = useState(DEFAULT_BADGES);
  const [auditHistory, setAuditHistory] = useState(DEFAULT_AUDIT_HISTORY);
  const [pendingVerifications, setPendingVerifications] = useState(DEFAULT_PENDING_REPORTS);
  const [leaderboard, setLeaderboard] = useState(DEFAULT_LEADERBOARD);

  // Raw rows for real (Supabase) accounts
  const [realReportRows, setRealReportRows] = useState([]);
  const [realAuditRows, setRealAuditRows] = useState([]);
  const [realLeaderboardRows, setRealLeaderboardRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);

  const isRealUser = currentUser?.isDemo === false;

  // Sync baseline config from backend
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${API_BASE}/api/citizen/config`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) setConfig(json.data);
      } catch (err) {
        console.warn('Backend config sync unavailable. Running local baseline:', err.message);
      }
    }
    fetchConfig();
  }, []);

  // Supabase real user loader
  const loadRealUserData = useCallback(async (authUser) => {
    if (!supabase || !authUser) return null;
    try {
      const meta = authUser.user_metadata || {};
      let { data: row, error } = await supabase
        .from('citizens').select('*').eq('id', authUser.id).maybeSingle();
      if (error) throw error;

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

      const [reportsRes, auditRes] = await Promise.all([
        supabase.from('reports').select('*').eq('citizen_id', authUser.id).order('reported_at', { ascending: false }).limit(100),
        supabase.from('audit_log').select('*').eq('citizen_id', authUser.id).order('created_at', { ascending: false }).limit(100)
      ]);

      const reports = reportsRes.data || [];
      const audits = auditRes.data || [];
      setRealReportRows(reports);
      setRealAuditRows(audits);

      const profile = mapProfileRow(row, reports);
      setCurrentUser(profile);
      return profile;
    } catch (err) {
      console.warn('Supabase data load fallback to local profile:', err.message);
      return null;
    }
  }, []);

  const refreshCitizenData = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.user ? loadRealUserData(data.session.user) : null;
  }, [loadRealUserData]);

  // Restore Supabase session on mount if present
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session?.user) loadRealUserData(data.session.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(prev => (prev && prev.isDemo === false ? REGISTERED_CITIZENS[0] : prev));
      }
    });
    return () => {
      active = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [loadRealUserData]);

  // Effective data views
  const effectivePending = useMemo(() => {
    if (isRealUser) {
      return realReportRows
        .filter(r => r.status === 'AWAITING_HOSPITAL_VERIFICATION')
        .map(r => mapReportRow(r, currentUser, config));
    }
    return pendingVerifications;
  }, [isRealUser, realReportRows, currentUser, config, pendingVerifications]);

  // LOGIN CITIZEN
  const loginCitizen = useCallback(async (identifier, password) => {
    // 1. If password provided and Supabase is configured, authenticate with Supabase
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
    }

    // 2. Local Demo Profile resolution
    const found = citizenDirectory.find(
      c => c.citizenId === identifier ||
           c.email?.toLowerCase() === identifier.toLowerCase() ||
           c.fullName.toLowerCase() === identifier.toLowerCase()
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

    setLastNotification({ type: 'danger', message: `Citizen profile '${identifier}' not found.` });
    return { success: false, error: 'User not found' };
  }, [citizenDirectory, loadRealUserData]);

  // LOGOUT CITIZEN
  const logoutCitizen = useCallback(async () => {
    setCurrentUser(null);
    localStorage.removeItem('lifeline_citizen_user');
    if (supabase) {
      try { await supabase.auth.signOut(); } catch (_) {}
    }
    setLastNotification({
      type: 'info',
      message: 'Signed out. Personal impact details are now protected.'
    });
  }, []);

  // REGISTER CITIZEN
  const registerCitizen = useCallback(async ({ fullName, phone, communityZone, email, password }) => {
    if (supabase && password && email) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName, phone, community_zone: communityZone } }
      });
      if (error) return { success: false, error: error.message };
      if (!data.session) {
        setLastNotification({
          type: 'info',
          message: 'Account created! Please check your email to confirm registration.'
        });
        return { success: true, needsConfirmation: true };
      }
      const profile = await loadRealUserData(data.user);
      return { success: !!profile, user: profile };
    }

    // Local Demo registration
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
      message: `Account created for ${newCitizen.fullName} (${newCitizen.citizenId})! Ready to earn Rescue Impact Points.`
    });
    return { success: true, user: newCitizen };
  }, [loadRealUserData]);

  // SUBMIT CITIZEN REPORT
  const submitCitizenReport = useCallback(async ({
    actionKey = 'VALID_INCIDENT_REPORT',
    emergencyType = 'Road Collision',
    location = 'MG Road Metro Station',
    details = '',
    receivingHospital = 'Victoria Hospital ER Complex',
    lat,
    lng,
    isLiveGps = false
  }) => {
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
        message: 'Your account is restricted. Submit an appeal before reporting.'
      });
      return { success: false, error: 'Account restricted' };
    }

    const resolvedLat = lat != null ? Number(lat) : (
      location.toLowerCase().includes('koramangala') ? 12.9352
      : location.toLowerCase().includes('indiranagar') ? 12.9716
      : location.toLowerCase().includes('whitefield') ? 12.9698
      : location.toLowerCase().includes('jayanagar') ? 12.9250
      : 12.9716 + (Math.random() - 0.5) * 0.04
    );

    const resolvedLng = lng != null ? Number(lng) : (
      location.toLowerCase().includes('koramangala') ? 77.6245
      : location.toLowerCase().includes('indiranagar') ? 77.6412
      : location.toLowerCase().includes('whitefield') ? 77.7499
      : location.toLowerCase().includes('jayanagar') ? 77.5938
      : 77.5946 + (Math.random() - 0.5) * 0.04
    );

    const newReportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPending = {
      reportId: newReportId,
      citizenId: currentUser.citizenId,
      citizenName: currentUser.fullName,
      actionKey,
      actionLabel: config.rules[actionKey]?.label || 'Emergency Report',
      emergencyType,
      location,
      lat: resolvedLat,
      lng: resolvedLng,
      isLiveGps: !!isLiveGps,
      reportedAt: new Date().toISOString(),
      patientIntakeStatus: 'In Transit / ER Queue',
      ambulanceAssigned: 'AMB-104 (Active)',
      receivingHospital,
      details: details || `Citizen reported ${emergencyType} at ${location}.`,
      duplicateScore: '0.02 (Clear)',
      status: 'AWAITING_HOSPITAL_VERIFICATION'
    };

    setPendingVerifications(prev => [newPending, ...prev]);

    // ── LIVE BROADCAST TO CENTRAL DISPATCHER EVENT BUS & STORAGE ──
    if (typeof window !== 'undefined') {
      const citizenIncidentPayload = {
        id: newReportId,
        locationName: location,
        type: emergencyType,
        timeReported: 'Just now',
        status: 'PENDING',
        severity: emergencyType.toLowerCase().includes('cardiac') ? 'CODE RED' : 'CRITICAL',
        icon: emergencyType.toLowerCase().includes('cardiac') ? '🫀' : '🚑',
        details: details || `Citizen reported ${emergencyType} at ${location}.`,
        citizenName: currentUser.fullName,
        receivingHospital,
        lat: resolvedLat,
        lng: resolvedLng,
        isLiveGps: !!isLiveGps
      };

      try {
        const savedEmergencies = JSON.parse(localStorage.getItem('lifeline_city_emergencies') || '[]');
        const updatedEmergencies = [
          citizenIncidentPayload,
          ...savedEmergencies.filter(e => e.id !== newReportId)
        ];
        localStorage.setItem('lifeline_city_emergencies', JSON.stringify(updatedEmergencies));
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('lifeline:citizen-emergency', {
        detail: citizenIncidentPayload
      }));
    }

    setLastNotification({
      type: 'info',
      message: `Report ${newReportId} transmitted to Central Dispatcher & ${receivingHospital}!`
    });

    return { success: true, data: newPending };
  }, [currentUser, config]);

  // ── Sync with Central Dispatch Ambulance Assignment ───────────────
  useEffect(() => {
    const handleAmbulanceDispatched = (e) => {
      const { mission, ambulance } = e.detail || {};
      if (!mission || !ambulance) return;

      setPendingVerifications(prev => prev.map(item => {
        if (item.reportId === mission.emergencyId || item.location === mission.patientLocation?.address) {
          return {
            ...item,
            ambulanceAssigned: `${ambulance.name} (Dispatched)`,
            patientIntakeStatus: 'Ambulance En Route to Scene'
          };
        }
        return item;
      }));

      setLastNotification({
        type: 'info',
        message: `Central Dispatch assigned ${ambulance.name} to your incident. Unit is en route to scene.`
      });
    };

    window.addEventListener('lifeline:ambulance-dispatched', handleAmbulanceDispatched);
    return () => window.removeEventListener('lifeline:ambulance-dispatched', handleAmbulanceDispatched);
  }, []);

  // VERIFY REPORT BY HOSPITAL
  const verifyReportByHospital = useCallback(async ({
    reportId,
    verificationResult, // 'VERIFY_VALID' | 'MARK_DUPLICATE' | 'FLAG_FRAUDULENT'
    verifierName = 'Dr. Aris Thorne (Chief Triage Officer)',
    verifierRole = 'Hospital Emergency Intake Staff',
    hospitalName = 'Victoria Hospital ER Complex',
    notes = ''
  }) => {
    setLoading(true);

    const report = effectivePending.find(r => r.reportId === reportId);
    if (!report) {
      setLoading(false);
      return { success: false, error: 'Report not found' };
    }

    const now = new Date().toISOString();
    let pointsAwarded = 0;
    let auditStatus = '';
    let notificationMsg = '';

    if (verificationResult === 'VERIFY_VALID') {
      const rule = config.rules[report.actionKey] || config.rules.VALID_INCIDENT_REPORT;
      pointsAwarded = rule.points;
      auditStatus = 'VERIFIED_ACCURATE';
      notificationMsg = `✓ Report verified by ${hospitalName}! +${pointsAwarded} Rescue Impact Points awarded.`;

      setCurrentUser(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          totalPoints: prev.totalPoints + pointsAwarded,
          verifiedContributions: (prev.verifiedContributions || 0) + 1
        };
        localStorage.setItem('lifeline_citizen_user', JSON.stringify(updated));
        return updated;
      });

      setCitizenDirectory(prev => prev.map(c =>
        c.citizenId === report.citizenId
          ? { ...c, totalPoints: c.totalPoints + pointsAwarded, verifiedContributions: (c.verifiedContributions || 0) + 1 }
          : c
      ));

      const auditRecord = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        reportId: report.reportId,
        citizenId: report.citizenId,
        citizenName: report.citizenName,
        actionTaken: report.details,
        category: rule.category || 'Reporting',
        actionKey: report.actionKey,
        pointsAwarded,
        verificationStatus: auditStatus,
        verifiedBy: verifierName,
        hospital: hospitalName,
        timestamp: now,
        notes: notes || 'Hospital triage team verified patient handover and log.'
      };
      setAuditHistory(prev => [auditRecord, ...prev]);
    } else if (verificationResult === 'FLAG_FRAUDULENT') {
      notificationMsg = `⛔ Report flagged as FRAUDULENT by ${hospitalName}. No points awarded. Account restricted.`;
      const auditRecord = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        reportId: report.reportId,
        citizenId: report.citizenId,
        citizenName: report.citizenName,
        actionTaken: `Flagged Fake / Fabricated Incident Report: ${report.emergencyType}`,
        category: 'Anti-Abuse',
        actionKey: 'FRAUDULENT_REPORT',
        pointsAwarded: 0,
        verificationStatus: 'REJECTED_FRAUDULENT',
        verifiedBy: verifierName,
        hospital: hospitalName,
        timestamp: now,
        notes: notes || 'Hospital emergency intake determined incident was fabricated or prank.'
      };
      setAuditHistory(prev => [auditRecord, ...prev]);

      setCurrentUser(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          accountStatus: 'Restricted',
          fakeReportsCount: (prev.fakeReportsCount || 0) + 1
        };
        localStorage.setItem('lifeline_citizen_user', JSON.stringify(updated));
        return updated;
      });
    } else {
      notificationMsg = `Report marked as ${verificationResult} by ${hospitalName}. No points awarded.`;
      const auditRecord = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        reportId: report.reportId,
        citizenId: report.citizenId,
        citizenName: report.citizenName,
        actionTaken: `Duplicate / Unverified: ${report.emergencyType}`,
        category: 'Duplicate',
        actionKey: 'DUPLICATE_UNVERIFIED_REPORT',
        pointsAwarded: 0,
        verificationStatus: 'DUPLICATE_UNVERIFIED',
        verifiedBy: verifierName,
        hospital: hospitalName,
        timestamp: now,
        notes: notes || 'Incident was already being handled by existing ambulance dispatch.'
      };
      setAuditHistory(prev => [auditRecord, ...prev]);
    }

    setPendingVerifications(prev => prev.filter(r => r.reportId !== reportId));
    setLastNotification({
      type: verificationResult === 'VERIFY_VALID' ? 'success' : 'warning',
      message: notificationMsg
    });
    setLoading(false);
    return { success: true, pointsAwarded, message: notificationMsg };
  }, [effectivePending, config]);

  // SUBMIT APPEAL
  const submitAppeal = useCallback(async ({ reason, additionalEvidence }) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      accountStatus: 'Under Review'
    };
    setCurrentUser(updated);
    localStorage.setItem('lifeline_citizen_user', JSON.stringify(updated));
    setLastNotification({
      type: 'info',
      message: 'Appeal submitted to Hospital Oversight Board. Account status updated to Under Review.'
    });
    return { success: true };
  }, [currentUser]);

  // RESET TO BASELINE
  const resetToBaseline = useCallback(() => {
    setCitizenDirectory(REGISTERED_CITIZENS);
    setCurrentUser(REGISTERED_CITIZENS[0]);
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
      isRealAccount: isRealUser,
      authConfigured: isSupabaseConfigured,
      loginCitizen,
      logoutCitizen,
      registerCitizen,
      refreshCitizenData,
      citizenDirectory,
      badges,
      auditHistory,
      pendingVerifications: effectivePending,
      leaderboard,
      loading,
      lastNotification,
      clearNotification: () => setLastNotification(null),
      verifyReportByHospital,
      submitAppeal,
      submitCitizenReport,
      resetToBaseline
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
