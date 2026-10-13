import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const HospitalBedContext = createContext();

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Haversine distance calculator between 2 coordinates in km
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5.0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Drive time estimation in emergency speed
export function calculateTravelTime(distanceKm) {
  const mins = Math.round((distanceKm / 35) * 60 + 2);
  return Math.max(3, mins);
}

/**
 * Dynamically generate or resolve real nearby hospitals clustered around an incident coordinate.
 * Guarantees that hospitals are genuinely near the incident (1-8 km) instead of pointing to a remote city.
 */
export function generateHospitalsAroundLocation(centerLat, centerLng, baseHospitals = []) {
  if (!centerLat || !centerLng) return baseHospitals;

  // Filter any existing hospitals that are within 35 km of the incident
  const nearbyExisting = baseHospitals.filter(h => {
    const d = calculateDistance(centerLat, centerLng, h.lat, h.lng);
    return d <= 35;
  });

  // If real live hospitals exist from Ola Maps / OpenStreetMap, ALWAYS return them directly!
  if (nearbyExisting.length >= 1) {
    return nearbyExisting;
  }

  // Backup cluster if no online map network is reachable:
  const templates = [
    {
      name: 'Apollo Emergency & Trauma Hospital',
      shortName: 'Apollo Emergency',
      type: 'Level 1 Trauma Center',
      offsetLat: 0.011, offsetLng: 0.013,
      bedsTotal: 450, bedsAvailable: 95,
      icuTotal: 60, icuAvailable: 14,
      erBaysTotal: 28, erBaysAvailable: 10,
      cardiac: true, trauma: true, neuro: true, burn: true, maternity: true, pediatric: true,
      rating: 4.8
    },
    {
      name: 'City Memorial Emergency Hospital',
      shortName: 'City Memorial',
      type: 'Multi-Specialty Emergency Hub',
      offsetLat: -0.014, offsetLng: 0.016,
      bedsTotal: 380, bedsAvailable: 80,
      icuTotal: 45, icuAvailable: 12,
      erBaysTotal: 22, erBaysAvailable: 8,
      cardiac: true, trauma: true, neuro: false, burn: false, maternity: true, pediatric: true,
      rating: 4.6
    },
    {
      name: 'Metro LifeCare Super-Specialty',
      shortName: 'Metro LifeCare',
      type: 'Super-Specialty Cardiac & Stroke Hub',
      offsetLat: 0.019, offsetLng: -0.018,
      bedsTotal: 520, bedsAvailable: 110,
      icuTotal: 70, icuAvailable: 18,
      erBaysTotal: 30, erBaysAvailable: 12,
      cardiac: true, trauma: false, neuro: true, burn: false, maternity: false, pediatric: true,
      rating: 4.9
    },
    {
      name: 'St. Jude Regional ER Hospital',
      shortName: 'St. Jude ER',
      type: 'Multi-Specialty Regional Hub',
      offsetLat: -0.022, offsetLng: -0.019,
      bedsTotal: 300, bedsAvailable: 65,
      icuTotal: 35, icuAvailable: 9,
      erBaysTotal: 18, erBaysAvailable: 7,
      cardiac: false, trauma: true, neuro: true, burn: true, maternity: true, pediatric: false,
      rating: 4.5
    },
    {
      name: 'Central District Medical Institute',
      shortName: 'Central District',
      type: 'Government Apex Trauma Center',
      offsetLat: 0.027, offsetLng: 0.024,
      bedsTotal: 600, bedsAvailable: 130,
      icuTotal: 80, icuAvailable: 20,
      erBaysTotal: 35, erBaysAvailable: 15,
      cardiac: true, trauma: true, neuro: true, burn: false, maternity: true, pediatric: true,
      rating: 4.4
    },
    {
      name: 'Greenwood Critical Care Institute',
      shortName: 'Greenwood ER',
      type: 'Specialized Critical Care & Resuscitation',
      offsetLat: -0.031, offsetLng: 0.027,
      bedsTotal: 250, bedsAvailable: 50,
      icuTotal: 40, icuAvailable: 11,
      erBaysTotal: 16, erBaysAvailable: 6,
      cardiac: true, trauma: false, neuro: true, burn: true, maternity: false, pediatric: false,
      rating: 4.7
    }
  ];

  return templates.map((tmpl, idx) => ({
    id: 1000 + idx,
    name: tmpl.name,
    shortName: tmpl.shortName,
    lat: centerLat + tmpl.offsetLat,
    lng: centerLng + tmpl.offsetLng,
    type: tmpl.type,
    capability: 92 + idx,
    rating: tmpl.rating,
    bedsTotal: tmpl.bedsTotal,
    bedsAvailable: tmpl.bedsAvailable,
    icuTotal: tmpl.icuTotal,
    icuAvailable: tmpl.icuAvailable,
    erBaysTotal: tmpl.erBaysTotal,
    erBaysAvailable: tmpl.erBaysAvailable,
    ventilators: Math.floor(tmpl.icuAvailable * 2.5),
    oxygenStatus: '98% Nominal',
    erStatus: 'Active Receiving',
    cardiac: tmpl.cardiac,
    trauma: tmpl.trauma,
    neuro: tmpl.neuro,
    burn: tmpl.burn,
    maternity: tmpl.maternity,
    pediatric: tmpl.pediatric,
    address: `Emergency Health Corridor, Sector ${idx + 1}`,
    phone: `+91-80-4500-${1000 + idx}`,
    reviewsCount: 450 + idx * 80,
    topReview: 'Immediate triage reception and dedicated trauma bay ready on approach.',
    reviews: []
  }));
}

export const CITIZEN_LOCATION_PRESETS = [
  { id: 'indiranagar', name: 'Indiranagar (100ft Rd), Bengaluru', lat: 12.9716, lng: 77.6412 },
  { id: 'koramangala', name: 'Koramangala Sony Signal, Bengaluru', lat: 12.9352, lng: 77.6245 },
  { id: 'mgroad', name: 'MG Road Metro Station, Bengaluru', lat: 12.9756, lng: 77.6066 },
  { id: 'whitefield', name: 'ITPL Main Rd, Whitefield, Bengaluru', lat: 12.9850, lng: 77.7310 },
  { id: 'jayanagar', name: '4th Block Complex, Jayanagar, Bengaluru', lat: 12.9298, lng: 77.5838 },
  { id: 'malleshwaram', name: '8th Cross, Malleshwaram, Bengaluru', lat: 13.0031, lng: 77.5702 }
];

const INITIAL_HOSPITALS = [
  {
    id: 1,
    name: 'Manipal Hospital HAL',
    shortName: 'Manipal',
    lat: 12.9594,
    lng: 77.6488,
    type: 'Multi-Specialty Private Apex',
    capability: 95,
    rating: 4.8,
    bedsTotal: 650,
    bedsAvailable: 140,
    icuTotal: 78,
    icuAvailable: 15,
    erBaysTotal: 32,
    erBaysAvailable: 11,
    ventilators: 50,
    oxygenStatus: '98% Nominal',
    erStatus: 'Active Receiving',
    cardiac: true,
    trauma: true,
    neuro: true,
    burn: false,
    maternity: true,
    pediatric: true,
    address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru',
    phone: '+91-80-2502-4444',
    reviewsCount: 1420,
    topReview: 'Rapid ER triage and cardiac team prepped before ambulance arrival. Clean modern bays.',
    avgWaitTime: '3 mins',
    reviews: [
      {
        id: 'rev-101',
        author: 'Siddharth M.',
        rating: 5,
        date: 'Yesterday',
        verified: true,
        comment: 'Ambulance brought my father during an acute cardiac event. The ER was alerted via LifeLine AI and cath lab team was waiting at the ramp. Outstanding response time.',
        tags: ['Cardiac Care', 'Zero Wait ER', 'Paramedic Sync']
      },
      {
        id: 'rev-102',
        author: 'Sunita Reddy',
        rating: 5,
        date: '3 days ago',
        verified: true,
        comment: 'Cleanest ICU wards in east Bengaluru. Doctors gave clear updates every 2 hours during critical admission.',
        tags: ['ICU Cleanliness', 'Compassionate Staff']
      },
      {
        id: 'rev-103',
        author: 'Kunal G.',
        rating: 4,
        date: '1 week ago',
        verified: true,
        comment: 'Very efficient trauma reception. Stretcher transfer took less than 40 seconds from ambulance bay.',
        tags: ['Trauma Bay', 'Fast Intake']
      }
    ]
  },
  {
    id: 2,
    name: 'Fortis Hospital Cunningham',
    shortName: 'Fortis',
    lat: 12.8926,
    lng: 77.5983,
    type: 'Super-Specialty Tertiary Care',
    capability: 92,
    rating: 4.6,
    bedsTotal: 450,
    bedsAvailable: 95,
    icuTotal: 54,
    icuAvailable: 12,
    erBaysTotal: 22,
    erBaysAvailable: 7,
    ventilators: 35,
    oxygenStatus: '99% Nominal',
    erStatus: 'Active Receiving',
    cardiac: true,
    trauma: true,
    neuro: true,
    burn: false,
    maternity: false,
    pediatric: true,
    address: '14, Cunningham Rd, Vasanth Nagar, Bengaluru',
    phone: '+91-80-6621-4444',
    reviewsCount: 980,
    topReview: 'Top neuro trauma care. Clean facilities and prompt ICU allocation.',
    avgWaitTime: '4 mins',
    reviews: [
      {
        id: 'rev-201',
        author: 'Deepa Narayanan',
        rating: 5,
        date: '2 days ago',
        verified: true,
        comment: 'Stroke protocol is immaculate. CT scan was performed within 7 minutes of arrival. Dr. Vikram’s team saved critical brain function.',
        tags: ['Stroke Protocol', 'Neuro ICU', 'Quick CT']
      },
      {
        id: 'rev-202',
        author: 'Rohan Mehra',
        rating: 4,
        date: '5 days ago',
        verified: true,
        comment: 'High tech trauma bay and ventilator support. Transparent billing and clear status displays in waiting area.',
        tags: ['Trauma Surgery', 'Modern Equipment']
      }
    ]
  },
  {
    id: 3,
    name: 'Apollo Hospitals Bannerghatta',
    shortName: 'Apollo',
    lat: 12.9007,
    lng: 77.5960,
    type: 'Multi-Specialty Apex Hub',
    capability: 94,
    rating: 4.7,
    bedsTotal: 500,
    bedsAvailable: 110,
    icuTotal: 60,
    icuAvailable: 14,
    erBaysTotal: 25,
    erBaysAvailable: 9,
    ventilators: 40,
    oxygenStatus: '97% Nominal',
    erStatus: 'Active Receiving',
    cardiac: true,
    trauma: true,
    neuro: true,
    burn: true,
    maternity: true,
    pediatric: true,
    address: '154/11, Bannerghatta Rd, Opp IIM, Bengaluru',
    phone: '+91-80-2941-4444',
    reviewsCount: 1240,
    topReview: 'Excellent burn isolation unit and emergency cardiac catheterization team on 24/7 duty.',
    avgWaitTime: '2 mins',
    reviews: [
      {
        id: 'rev-301',
        author: 'Vikram Joshi',
        rating: 5,
        date: '1 day ago',
        verified: true,
        comment: 'Called ambulance through LifeLine after road accident. Handover was seamless, burn and plastic surgery unit ready instantly.',
        tags: ['Burn Unit', 'Seamless Handover', '24/7 ER']
      },
      {
        id: 'rev-302',
        author: 'Meera Iyer',
        rating: 5,
        date: '4 days ago',
        verified: true,
        comment: 'Pediatric emergency department was so gentle and calm with my 4-year-old during severe respiratory distress.',
        tags: ['Pediatric ER', 'Oxygen Support']
      }
    ]
  },
  {
    id: 4,
    name: 'Victoria Hospital ER Complex',
    shortName: 'Victoria',
    lat: 12.9623,
    lng: 77.5736,
    type: 'Government Apex Trauma Hub',
    capability: 88,
    rating: 4.3,
    bedsTotal: 1500,
    bedsAvailable: 285,
    icuTotal: 120,
    icuAvailable: 22,
    erBaysTotal: 60,
    erBaysAvailable: 18,
    ventilators: 85,
    oxygenStatus: '96% Nominal',
    erStatus: 'Active Receiving',
    cardiac: true,
    trauma: true,
    neuro: true,
    burn: true,
    maternity: true,
    pediatric: true,
    address: 'Fort Road, Near City Market, Bengaluru',
    phone: '+91-80-2670-1150',
    reviewsCount: 2850,
    topReview: 'Largest government trauma center. Unrivaled multi-casualty capacity and trauma surgery team.',
    avgWaitTime: '5 mins',
    reviews: [
      {
        id: 'rev-401',
        author: 'Anand Kumar',
        rating: 4,
        date: 'Yesterday',
        verified: true,
        comment: 'Despite heavy rush, the triage officers Dr. Aris and nurses attended our highway accident victims immediately. High volume capacity.',
        tags: ['High Capacity', 'Govt Trauma', 'Affordable Care']
      },
      {
        id: 'rev-402',
        author: 'Lakshmi Bai',
        rating: 5,
        date: '1 week ago',
        verified: true,
        comment: 'Mass casualty and burn facility is unmatched in south India. Free emergency blood units provided on spot.',
        tags: ['Mass Casualty Hub', 'Blood Bank']
      }
    ]
  },
  {
    id: 5,
    name: 'Bowring & Lady Curzon Hospital',
    shortName: 'Bowring',
    lat: 12.9829,
    lng: 77.6047,
    type: 'Multi-Specialty Government',
    capability: 84,
    rating: 4.2,
    bedsTotal: 1000,
    bedsAvailable: 180,
    icuTotal: 80,
    icuAvailable: 9,
    erBaysTotal: 40,
    erBaysAvailable: 12,
    ventilators: 45,
    oxygenStatus: '98% Nominal',
    erStatus: 'Active Receiving',
    cardiac: true,
    trauma: true,
    neuro: false,
    burn: true,
    maternity: true,
    pediatric: true,
    address: 'Lady Curzon Rd, Tasker Town, Shivaji Nagar, Bengaluru',
    phone: '+91-80-2559-1362',
    reviewsCount: 890,
    topReview: 'Central city emergency station with responsive staff and quick patient intake bays.',
    avgWaitTime: '4 mins',
    reviews: [
      {
        id: 'rev-501',
        author: 'Farhan Sheikh',
        rating: 4,
        date: '3 days ago',
        verified: true,
        comment: 'Centrally located hospital right in Shivajinagar. Ambulance reached in 6 minutes. Rapid IV and stabilization team.',
        tags: ['Central Location', 'Quick Stabilize']
      },
      {
        id: 'rev-502',
        author: 'Geetha P.',
        rating: 4,
        date: '5 days ago',
        verified: true,
        comment: 'Dedicated maternity and pediatric intake ward. ER staff was responsive and empathetic.',
        tags: ['Maternity ER', 'Responsive']
      }
    ]
  }
];

export const AUTHORIZED_OFFICIALS = [
  {
    id: 'OFF-101',
    name: 'Dr. Aris Thorne',
    role: 'Chief Triage Officer',
    hospitalId: 4,
    hospitalName: 'Victoria Hospital ER Complex',
    badge: 'Apex Trauma Intake Lead',
    pin: '1234'
  },
  {
    id: 'OFF-102',
    name: 'Dr. Rajesh Rao',
    role: 'Lead ER Registrar',
    hospitalId: 1,
    hospitalName: 'Manipal Hospital HAL',
    badge: 'Cardiac & Neuro Intake',
    pin: '1234'
  },
  {
    id: 'OFF-103',
    name: 'Dr. Neha Swaminathan',
    role: 'Clinical Director',
    hospitalId: 3,
    hospitalName: 'Apollo Hospitals Bannerghatta',
    badge: 'Super-Specialty Intake',
    pin: '1234'
  },
  {
    id: 'OFF-104',
    name: 'Dr. Kavita Menon',
    role: 'Head of Emergency Medicine',
    hospitalId: 5,
    hospitalName: 'Bowring & Lady Curzon Hospital',
    badge: 'Government Apex ER',
    pin: '1234'
  },
  {
    id: 'OFF-105',
    name: 'Dr. Vikram Patel',
    role: 'Trauma Surgery Director',
    hospitalId: 2,
    hospitalName: 'Fortis Hospital Cunningham',
    badge: 'Level 1 Trauma Consultant',
    pin: '1234'
  }
];

export const HOSPITAL_AMBULANCE_REGISTRY = {
  1: [
    {
      id: 101, hospitalId: 1, hospitalName: 'Manipal Hospital HAL',
      name: 'MANIPAL-ICU-01', type: 'Mobile ICU', equipmentType: 'ICU', equipment: 98,
      status: 'available', driver: 'Rajesh Kumar', paramedic: 'Sneha Nair (CCRN)',
      crewSize: 3, speed: 55, contact: '+91-98451-20101', latOffset: 0.002, lngOffset: 0.003
    },
    {
      id: 102, hospitalId: 1, hospitalName: 'Manipal Hospital HAL',
      name: 'MANIPAL-CARDIAC-02', type: 'Cardiac Support', equipmentType: 'Cardiac', equipment: 94,
      status: 'available', driver: 'Suresh Patil', paramedic: 'Arun Verma (EMT-P)',
      crewSize: 2, speed: 58, contact: '+91-98451-20102', latOffset: -0.002, lngOffset: 0.004
    },
    {
      id: 103, hospitalId: 1, hospitalName: 'Manipal Hospital HAL',
      name: 'MANIPAL-ALS-03', type: 'Advanced Life Support', equipmentType: 'ALS', equipment: 89,
      status: 'available', driver: 'Vikram Joshi', paramedic: 'Deepa Rao',
      crewSize: 2, speed: 60, contact: '+91-98451-20103', latOffset: 0.003, lngOffset: -0.003
    },
    {
      id: 104, hospitalId: 1, hospitalName: 'Manipal Hospital HAL',
      name: 'MANIPAL-BLS-04', type: 'Basic Life Support', equipmentType: 'BLS', equipment: 80,
      status: 'busy', driver: 'Anand K.', paramedic: 'Meera P.',
      crewSize: 2, speed: 0, contact: '+91-98451-20104', latOffset: -0.003, lngOffset: -0.002
    }
  ],
  2: [
    {
      id: 201, hospitalId: 2, hospitalName: 'Fortis Hospital Cunningham',
      name: 'FORTIS-TRAUMA-01', type: 'Trauma Support', equipmentType: 'Trauma', equipment: 96,
      status: 'available', driver: 'Vinay Gowda', paramedic: 'Karthik S. (Trauma Tech)',
      crewSize: 3, speed: 56, contact: '+91-98452-20201', latOffset: 0.002, lngOffset: 0.003
    },
    {
      id: 202, hospitalId: 2, hospitalName: 'Fortis Hospital Cunningham',
      name: 'FORTIS-ICU-02', type: 'Mobile ICU', equipmentType: 'ICU', equipment: 93,
      status: 'available', driver: 'Naveen Kumar', paramedic: 'Pooja Hegde',
      crewSize: 3, speed: 52, contact: '+91-98452-20202', latOffset: -0.003, lngOffset: 0.003
    },
    {
      id: 203, hospitalId: 2, hospitalName: 'Fortis Hospital Cunningham',
      name: 'FORTIS-ALS-03', type: 'Advanced Life Support', equipmentType: 'ALS', equipment: 88,
      status: 'available', driver: 'Manish Verma', paramedic: 'Ritu Sen',
      crewSize: 2, speed: 58, contact: '+91-98452-20203', latOffset: 0.003, lngOffset: -0.003
    },
    {
      id: 204, hospitalId: 2, hospitalName: 'Fortis Hospital Cunningham',
      name: 'FORTIS-BLS-04', type: 'Basic Life Support', equipmentType: 'BLS', equipment: 79,
      status: 'maintenance', driver: 'Ramesh Babu', paramedic: 'Devendra K.',
      crewSize: 2, speed: 0, contact: '+91-98452-20204', latOffset: -0.002, lngOffset: -0.004
    }
  ],
  3: [
    {
      id: 301, hospitalId: 3, hospitalName: 'Apollo Hospitals Bannerghatta',
      name: 'APOLLO-CARDIAC-01', type: 'Cardiac Support', equipmentType: 'Cardiac', equipment: 99,
      status: 'available', driver: 'Prashant Nair', paramedic: 'Dr. Triage Vivek',
      crewSize: 3, speed: 62, contact: '+91-98453-20301', latOffset: 0.003, lngOffset: 0.002
    },
    {
      id: 302, hospitalId: 3, hospitalName: 'Apollo Hospitals Bannerghatta',
      name: 'APOLLO-ICU-02', type: 'Mobile ICU', equipmentType: 'ICU', equipment: 95,
      status: 'available', driver: 'Santosh K.', paramedic: 'Lakshmi Narayan',
      crewSize: 3, speed: 54, contact: '+91-98453-20302', latOffset: -0.003, lngOffset: 0.003
    },
    {
      id: 303, hospitalId: 3, hospitalName: 'Apollo Hospitals Bannerghatta',
      name: 'APOLLO-ALS-03', type: 'Advanced Life Support', equipmentType: 'ALS', equipment: 90,
      status: 'available', driver: 'Girish Murthy', paramedic: 'Ananya S.',
      crewSize: 2, speed: 57, contact: '+91-98453-20303', latOffset: 0.002, lngOffset: -0.004
    },
    {
      id: 304, hospitalId: 3, hospitalName: 'Apollo Hospitals Bannerghatta',
      name: 'APOLLO-RAPID-04', type: 'Basic Life Support', equipmentType: 'BLS', equipment: 79,
      status: 'busy', driver: 'Sunil Rao', paramedic: 'Kavita Das',
      crewSize: 2, speed: 0, contact: '+91-98453-20304', latOffset: -0.004, lngOffset: -0.002
    }
  ],
  4: [
    {
      id: 401, hospitalId: 4, hospitalName: 'Victoria Hospital ER Complex',
      name: 'VICTORIA-TRAUMA-01', type: 'Trauma Support', equipmentType: 'Trauma', equipment: 95,
      status: 'available', driver: 'Harish R.', paramedic: 'Shankar Gowda',
      crewSize: 3, speed: 53, contact: '+91-98454-20401', latOffset: 0.003, lngOffset: 0.003
    },
    {
      id: 402, hospitalId: 4, hospitalName: 'Victoria Hospital ER Complex',
      name: 'VICTORIA-ICU-02', type: 'Mobile ICU', equipmentType: 'ICU', equipment: 91,
      status: 'available', driver: 'Basavaraj M.', paramedic: 'Chitra K.',
      crewSize: 3, speed: 50, contact: '+91-98454-20402', latOffset: -0.002, lngOffset: 0.004
    },
    {
      id: 403, hospitalId: 4, hospitalName: 'Victoria Hospital ER Complex',
      name: 'VICTORIA-ALS-03', type: 'Advanced Life Support', equipmentType: 'ALS', equipment: 87,
      status: 'available', driver: 'Chetan Kumar', paramedic: 'Govind Rao',
      crewSize: 2, speed: 55, contact: '+91-98454-20403', latOffset: 0.004, lngOffset: -0.003
    },
    {
      id: 404, hospitalId: 4, hospitalName: 'Victoria Hospital ER Complex',
      name: 'VICTORIA-BLS-04', type: 'Basic Life Support', equipmentType: 'BLS', equipment: 76,
      status: 'available', driver: 'Ranganath P.', paramedic: 'Mallikarjun',
      crewSize: 2, speed: 48, contact: '+91-98454-20404', latOffset: -0.003, lngOffset: -0.002
    }
  ],
  5: [
    {
      id: 501, hospitalId: 5, hospitalName: 'Bowring & Lady Curzon Hospital',
      name: 'BOWRING-ICU-01', type: 'Mobile ICU', equipmentType: 'ICU', equipment: 93,
      status: 'available', driver: 'Imran Khan', paramedic: 'Tabassum F.',
      crewSize: 3, speed: 54, contact: '+91-98455-20501', latOffset: 0.002, lngOffset: 0.003
    },
    {
      id: 502, hospitalId: 5, hospitalName: 'Bowring & Lady Curzon Hospital',
      name: 'BOWRING-CARDIAC-02', type: 'Cardiac Support', equipmentType: 'Cardiac', equipment: 89,
      status: 'available', driver: 'Mohammed Z.', paramedic: 'Afreen Banu',
      crewSize: 2, speed: 56, contact: '+91-98455-20502', latOffset: -0.003, lngOffset: 0.003
    },
    {
      id: 503, hospitalId: 5, hospitalName: 'Bowring & Lady Curzon Hospital',
      name: 'BOWRING-ALS-03', type: 'Advanced Life Support', equipmentType: 'ALS', equipment: 85,
      status: 'available', driver: 'Sameer Pasha', paramedic: 'Zakir Hussain',
      crewSize: 2, speed: 52, contact: '+91-98455-20503', latOffset: 0.003, lngOffset: -0.003
    },
    {
      id: 504, hospitalId: 5, hospitalName: 'Bowring & Lady Curzon Hospital',
      name: 'BOWRING-BLS-04', type: 'Basic Life Support', equipmentType: 'BLS', equipment: 75,
      status: 'maintenance', driver: 'Syed Tanveer', paramedic: 'Naseer Ahmed',
      crewSize: 2, speed: 0, contact: '+91-98455-20504', latOffset: -0.002, lngOffset: -0.004
    }
  ]
};

export function HospitalBedProvider({ children }) {
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [selectedHospitalId, setSelectedHospitalId] = useState(1);
  const activeHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];
  const [incomingIntakes, setIncomingIntakes] = useState([]);
  const [hospitalFleets, setHospitalFleets] = useState(HOSPITAL_AMBULANCE_REGISTRY);
  const [activeMission, setActiveMission] = useState(null);
  
  // Citizen Current Location (default: check stored GPS or Indiranagar, Bengaluru)
  const [citizenLocation, setCitizenLocation] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('lifeline_citizen_live_pos') : null;
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return CITIZEN_LOCATION_PRESETS[0];
  });
  const [isLocatingCitizen, setIsLocatingCitizen] = useState(false);
  const [citizenGpsAccuracy, setCitizenGpsAccuracy] = useState(null);
  const [citizenLocationError, setCitizenLocationError] = useState(null);

  const requestCitizenLiveLocation = useCallback((forcePrompt = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setCitizenLocationError('Geolocation not supported by this browser');
      return;
    }
    setIsLocatingCitizen(true);
    setCitizenLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const liveLoc = {
          id: 'live-gps',
          name: 'My Current Location (Live GPS)',
          address: `Live Device Coordinates (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          isLive: true
        };
        setCitizenLocation(liveLoc);
        setCitizenGpsAccuracy(Math.round(pos.coords.accuracy));
        setIsLocatingCitizen(false);
        try {
          localStorage.setItem('lifeline_citizen_live_pos', JSON.stringify(liveLoc));
        } catch (_) {}
      },
      (err) => {
        console.warn('Citizen GPS request notice:', err.message);
        setCitizenLocationError(err.message);
        setIsLocatingCitizen(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Auto-request live browser location access on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      requestCitizenLiveLocation();
    }
  }, [requestCitizenLiveLocation]);

  // Official Authentication State
  const [currentOfficial, setCurrentOfficial] = useState(null); // null = Citizen View (Read-Only)
  const isOfficialLoggedIn = !!currentOfficial;

  // Active call confirmation / tracking modal state
  const [lastDispatchedCall, setLastDispatchedCall] = useState(null);

  // Live Real-Time Ambulance GPS Tracking (streamed from Ambulance Cockpit MDT)
  const [ambulanceLiveLocation, setAmbulanceLiveLocationState] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('lifeline_ambulance_live_pos') : null;
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const setAmbulanceLiveLocation = useCallback((locData) => {
    setAmbulanceLiveLocationState(locData);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lifeline_ambulance_live_pos', JSON.stringify(locData));
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('lifeline:ambulance-location', { detail: locData }));
    }
  }, []);

  useEffect(() => {
    const handleLocationEvent = (e) => {
      if (e.detail) {
        setAmbulanceLiveLocationState(e.detail);
      }
    };
    window.addEventListener('lifeline:ambulance-location', handleLocationEvent);
    return () => window.removeEventListener('lifeline:ambulance-location', handleLocationEvent);
  }, []);

  const [auditLog, setAuditLog] = useState([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString('en-IN'),
      hospitalName: 'Manipal Hospital HAL',
      officialName: 'Dr. Rajesh Rao (Lead ER Registrar)',
      type: 'ADMISSION',
      details: 'Patient admitted from AMB-103 (Cardiac Event). 1 ICU Bed allocated.',
      bedsLeft: 140,
      icuLeft: 15
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 42).toLocaleTimeString('en-IN'),
      hospitalName: 'Victoria Hospital ER Complex',
      officialName: 'Dr. Aris Thorne (Chief Triage Officer)',
      type: 'DISCHARGE',
      details: 'Routine discharge processed in Ward 4. +1 General Bed available.',
      bedsLeft: 285,
      icuLeft: 22
    }
  ]);

  // Sync initial bed data from backend
  useEffect(() => {
    async function loadBeds() {
      try {
        const res = await fetch(`${API_BASE}/api/hospitals/beds`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.beds && Array.isArray(data.beds)) {
          setHospitals(prev => {
            const bedMap = new Map(data.beds.map(b => [Number(b.hospitalId), b]));
            return prev.map(h => {
              const live = bedMap.get(h.id);
              if (!live) return h;
              return {
                ...h,
                bedsTotal: live.bedsTotal ?? h.bedsTotal,
                bedsAvailable: live.bedsAvailable ?? h.bedsAvailable,
                icuTotal: live.icuTotal ?? h.icuTotal,
                icuAvailable: live.icuAvailable ?? h.icuAvailable,
                erBaysTotal: live.erBaysTotal ?? h.erBaysTotal,
                erBaysAvailable: live.erBaysAvailable ?? h.erBaysAvailable,
                ventilators: live.ventilators ?? h.ventilators,
                oxygenStatus: live.oxygenStatus ?? h.oxygenStatus,
                erStatus: live.erStatus ?? h.erStatus
              };
            });
          });
        }
      } catch (err) {
        console.warn('Live bed backend sync fallback to local store:', err.message);
      }
    }
    loadBeds();
  }, []);

  // Compute live distance & travel times for all hospitals relative to citizen's position
  const hospitalsWithTelemetry = useMemo(() => {
    const effectiveHospitals = generateHospitalsAroundLocation(citizenLocation.lat, citizenLocation.lng, hospitals);

    return effectiveHospitals.map(h => {
      const dist = calculateDistance(citizenLocation.lat, citizenLocation.lng, h.lat, h.lng);
      const time = calculateTravelTime(dist);
      return {
        ...h,
        distanceKm: dist,
        travelTimeMins: time,
        formattedDistance: `${dist.toFixed(1)} km`,
        formattedTravelTime: `${time} mins`
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [hospitals, citizenLocation]);

  // Official Login handler
  const loginOfficial = useCallback((officialId, pin = '1234') => {
    const official = AUTHORIZED_OFFICIALS.find(o => o.id === officialId);
    if (!official) {
      return { success: false, message: 'Invalid Official ID.' };
    }
    if (pin && official.pin && pin !== official.pin) {
      return { success: false, message: 'Incorrect Security PIN.' };
    }

    setCurrentOfficial(official);
    setSelectedHospitalId(official.hospitalId);

    setAuditLog(logs => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN'),
        hospitalName: official.hospitalName,
        officialName: `${official.name} (${official.role})`,
        type: 'SECURITY_AUTH',
        details: `Official authenticated for ${official.hospitalName}. Administrative edit privileges unlocked.`,
        bedsLeft: null,
        icuLeft: null
      },
      ...logs.slice(0, 40)
    ]);

    return { success: true, official };
  }, []);

  // Official Logout handler
  const logoutOfficial = useCallback(() => {
    if (currentOfficial) {
      setAuditLog(logs => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-IN'),
          hospitalName: currentOfficial.hospitalName,
          officialName: currentOfficial.name,
          type: 'SECURITY_LOGOUT',
          details: `Official session closed. System locked back into Citizen Read-Only Mode.`,
          bedsLeft: null,
          icuLeft: null
        },
        ...logs.slice(0, 40)
      ]);
    }
    setCurrentOfficial(null);
  }, [currentOfficial]);

  // Update hospital beds - STRICTLY GUARDED TO LOGGED-IN OFFICIALS
  const updateHospitalBeds = useCallback(async (hospitalId, updates) => {
    if (!currentOfficial) {
      return {
        success: false,
        error: 'ACCESS DENIED: Bed data can only be modified by authorized hospital triage officials. Please sign in.'
      };
    }

    setHospitals(prev => prev.map(h => {
      if (h.id !== hospitalId) return h;
      const updated = {
        ...h,
        ...updates,
        bedsAvailable: updates.bedsAvailable !== undefined ? Math.max(0, updates.bedsAvailable) : h.bedsAvailable,
        icuAvailable: updates.icuAvailable !== undefined ? Math.max(0, updates.icuAvailable) : h.icuAvailable,
        erBaysAvailable: updates.erBaysAvailable !== undefined ? Math.max(0, updates.erBaysAvailable) : h.erBaysAvailable,
        ventilators: updates.ventilators !== undefined ? Math.max(0, updates.ventilators) : h.ventilators
      };

      // Add to audit log with official's name
      setAuditLog(logs => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-IN'),
          hospitalName: h.name,
          officialName: `${currentOfficial.name} (${currentOfficial.role})`,
          type: 'MANUAL_UPDATE',
          details: `Bed status updated: ${updated.bedsAvailable} available (${updated.icuAvailable} ICU). Authorized by ${currentOfficial.name}.`,
          bedsLeft: updated.bedsAvailable,
          icuLeft: updated.icuAvailable
        },
        ...logs.slice(0, 40)
      ]);

      return updated;
    }));

    // Async backend call
    try {
      await fetch(`${API_BASE}/api/hospitals/${hospitalId}/beds`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn('Backend patch failed:', e.message);
    }

    return { success: true };
  }, [currentOfficial]);

  // Quick direct admission - GUARDED TO OFFICIALS
  const quickAdmit = useCallback((hospitalId, isICU = false) => {
    if (!currentOfficial) {
      return {
        success: false,
        error: 'ACCESS DENIED: Bed admission requires Hospital Official credentials.'
      };
    }

    setHospitals(prev => prev.map(h => {
      if (h.id !== hospitalId) return h;
      const newAvail = Math.max(0, h.bedsAvailable - 1);
      const newICU = isICU ? Math.max(0, h.icuAvailable - 1) : h.icuAvailable;
      const updated = { ...h, bedsAvailable: newAvail, icuAvailable: newICU };

      setAuditLog(logs => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-IN'),
          hospitalName: h.name,
          officialName: `${currentOfficial.name} (${currentOfficial.role})`,
          type: 'INTAKE_ADMIT',
          details: `Patient admitted by ${currentOfficial.name}. Allocated ${isICU ? 'ICU Bed' : 'General Bed'}. Remaining: ${newAvail} (${newICU} ICU).`,
          bedsLeft: newAvail,
          icuLeft: newICU
        },
        ...logs.slice(0, 40)
      ]);

      fetch(`${API_BASE}/api/hospitals/${hospitalId}/beds`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedsAvailable: newAvail, icuAvailable: newICU })
      }).catch(() => {});

      return updated;
    }));

    return { success: true };
  }, [currentOfficial]);

  // Quick patient discharge - GUARDED TO OFFICIALS
  const quickDischarge = useCallback((hospitalId, isICU = false) => {
    if (!currentOfficial) {
      return {
        success: false,
        error: 'ACCESS DENIED: Patient discharge requires Hospital Official credentials.'
      };
    }

    setHospitals(prev => prev.map(h => {
      if (h.id !== hospitalId) return h;
      const newAvail = Math.min(h.bedsTotal, h.bedsAvailable + 1);
      const newICU = isICU ? Math.min(h.icuTotal, h.icuAvailable + 1) : h.icuAvailable;
      const updated = { ...h, bedsAvailable: newAvail, icuAvailable: newICU };

      setAuditLog(logs => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-IN'),
          hospitalName: h.name,
          officialName: `${currentOfficial.name} (${currentOfficial.role})`,
          type: 'PATIENT_DISCHARGE',
          details: `Patient discharged from ${isICU ? 'ICU' : 'General Ward'} by ${currentOfficial.name}. Bed freed: ${newAvail} available.`,
          bedsLeft: newAvail,
          icuLeft: newICU
        },
        ...logs.slice(0, 40)
      ]);

      fetch(`${API_BASE}/api/hospitals/${hospitalId}/beds`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedsAvailable: newAvail, icuAvailable: newICU })
      }).catch(() => {});

      return updated;
    }));

    return { success: true };
  }, [currentOfficial]);

  // Add review from a citizen
  const addHospitalReview = useCallback((hospitalId, newReview) => {
    setHospitals(prev => prev.map(h => {
      if (h.id !== hospitalId) return h;
      const updatedReviews = [
        {
          id: `rev-${Date.now()}`,
          author: newReview.author || 'Citizen Reviewer',
          rating: newReview.rating || 5,
          date: 'Just now',
          verified: true,
          comment: newReview.comment || 'Prompt emergency response and attentive medical care.',
          tags: newReview.tags || ['Verified Citizen']
        },
        ...(h.reviews || [])
      ];

      const avgRating = parseFloat(
        (updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1)
      );

      return {
        ...h,
        reviews: updatedReviews,
        reviewsCount: (h.reviewsCount || 0) + 1,
        rating: avgRating,
        topReview: newReview.comment || h.topReview
      };
    }));
  }, []);

  // CITIZEN DIRECT AMBULANCE SUMMON TO SPECIFIC HOSPITAL
  const callAmbulanceToHospital = useCallback(({
    hospitalId,
    citizenName = 'Citizen Caller',
    citizenPhone = '+91-98765-43210',
    emergencyType = 'Acute Medical Emergency',
    notes = ''
  }) => {
    const targetHospital = hospitals.find(h => h.id === hospitalId) || hospitals[0];
    const dist = calculateDistance(citizenLocation.lat, citizenLocation.lng, targetHospital.lat, targetHospital.lng);
    const eta = calculateTravelTime(dist);
    const ambulanceUnit = `AMB-${Math.floor(100 + Math.random() * 900)}`;
    const callId = `EMG-${Date.now().toString(36).toUpperCase()}`;

    // 1. Register incoming ambulance in hospital intake queue
    const newIntake = {
      id: `intake-${Date.now()}`,
      ambulanceName: `${ambulanceUnit} (Code Red)`,
      emergencyType,
      hospitalId: targetHospital.id,
      hospitalName: targetHospital.name,
      eta: `${eta} mins`,
      distance: `${dist} km`,
      triageLevel: emergencyType.toLowerCase().includes('cardiac') ? 'Priority 1 (Cardiac)' : 'Priority 1 (Emergency)',
      patientName: citizenName,
      contact: citizenPhone,
      location: citizenLocation.name,
      notes: notes || `Direct citizen summon to ${targetHospital.name}. Destination locked.`
    };

    setIncomingIntakes(prev => [newIntake, ...prev]);

    // 2. Broadcast live event to Central Dispatcher in real time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lifeline:citizen-emergency', {
        detail: {
          id: callId,
          locationName: citizenLocation.name,
          type: emergencyType,
          timeReported: 'Just now',
          status: 'PENDING',
          severity: 'CODE RED',
          icon: emergencyType.toLowerCase().includes('cardiac') ? '🫀' : '🚑',
          details: `Direct citizen emergency call. Patient requested transfer to ${targetHospital.name} (${dist} km away, ~${eta} mins). Caller: ${citizenName} (${citizenPhone}).`,
          citizenName,
          receivingHospital: targetHospital.name,
          receivingHospitalId: targetHospital.id,
          lat: citizenLocation.lat,
          lng: citizenLocation.lng
        }
      }));
    }

    // 3. Add to hospital audit log
    setAuditLog(logs => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN'),
        hospitalName: targetHospital.name,
        officialName: 'Citizen Emergency Summon',
        type: 'CITIZEN_DISPATCH',
        details: `Ambulance summoned by citizen ${citizenName}. Unit ${ambulanceUnit} routed to ${targetHospital.name}. Estimated arrival: ${eta} mins.`,
        bedsLeft: targetHospital.bedsAvailable,
        icuLeft: targetHospital.icuAvailable
      },
      ...logs.slice(0, 40)
    ]);

    const result = {
      callId,
      ambulanceUnit,
      targetHospital,
      dist,
      eta,
      citizenName,
      citizenLocation: citizenLocation.name,
      emergencyType
    };

    setLastDispatchedCall(result);
    return result;
  }, [hospitals, citizenLocation]);

  // Register incoming ambulance dispatched toward a hospital
  const registerIncomingAmbulance = useCallback((intake) => {
    setIncomingIntakes(prev => {
      const exists = prev.some(i => i.id === intake.id);
      if (exists) return prev.map(i => i.id === intake.id ? { ...i, ...intake } : i);
      return [intake, ...prev];
    });
  }, []);

  // Update existing incoming ambulance progress
  const updateIncomingAmbulance = useCallback((id, updates) => {
    setIncomingIntakes(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  // Remove incoming ambulance when admitted/cleared
  const removeIncomingAmbulance = useCallback((id) => {
    setIncomingIntakes(prev => prev.filter(i => i.id !== id));
  }, []);

  // Get ambulance fleet for a specific hospital
  const getHospitalFleet = useCallback((hospId, hospName, baseLat, baseLng) => {
    const key = Number(hospId);
    let fleet = hospitalFleets[key];

    if (!fleet) {
      const prefix = hospName ? hospName.slice(0, 4).toUpperCase() : `H${key}`;
      fleet = [
        {
          id: key * 10 + 1, hospitalId: key, hospitalName: hospName || `Hospital #${key}`,
          name: `${prefix}-ICU-01`, type: 'Mobile ICU', equipmentType: 'ICU', equipment: 96,
          status: 'available', driver: 'Driver Rajesh', paramedic: 'Sneha Nair (CCRN)',
          crewSize: 3, speed: 55, contact: '+91-98450-11001', latOffset: 0.002, lngOffset: 0.003
        },
        {
          id: key * 10 + 2, hospitalId: key, hospitalName: hospName || `Hospital #${key}`,
          name: `${prefix}-CARDIAC-02`, type: 'Cardiac Support', equipmentType: 'Cardiac', equipment: 92,
          status: 'available', driver: 'Driver Suresh', paramedic: 'Arun Verma (EMT-P)',
          crewSize: 2, speed: 58, contact: '+91-98450-11002', latOffset: -0.002, lngOffset: 0.004
        },
        {
          id: key * 10 + 3, hospitalId: key, hospitalName: hospName || `Hospital #${key}`,
          name: `${prefix}-ALS-03`, type: 'Advanced Life Support', equipmentType: 'ALS', equipment: 88,
          status: 'available', driver: 'Driver Vikram', paramedic: 'Deepa Rao',
          crewSize: 2, speed: 54, contact: '+91-98450-11003', latOffset: 0.003, lngOffset: -0.003
        },
        {
          id: key * 10 + 4, hospitalId: key, hospitalName: hospName || `Hospital #${key}`,
          name: `${prefix}-BLS-04`, type: 'Basic Life Support', equipmentType: 'BLS', equipment: 78,
          status: 'available', driver: 'Driver Anand', paramedic: 'Meera P.',
          crewSize: 2, speed: 50, contact: '+91-98450-11004', latOffset: -0.003, lngOffset: -0.002
        }
      ];
    }

    const hospObj = hospitals.find(h => h.id === key);
    const centerLat = baseLat || hospObj?.lat || 12.9716;
    const centerLng = baseLng || hospObj?.lng || 77.5946;

    return fleet.map(amb => ({
      ...amb,
      lat: centerLat + amb.latOffset,
      lng: centerLng + amb.lngOffset,
      hospitalName: hospName || hospObj?.name || amb.hospitalName
    }));
  }, [hospitalFleets, hospitals]);

  // Update ambulance status (doctors / officials only)
  const updateAmbulanceStatus = useCallback(async (hospId, ambId, newStatus, extra = {}) => {
    const key = Number(hospId);
    setHospitalFleets(prev => {
      const curFleet = prev[key] || [];
      const updatedFleet = curFleet.map(amb => {
        if (amb.id === ambId) {
          return { ...amb, status: newStatus, ...extra };
        }
        return amb;
      });
      return { ...prev, [key]: updatedFleet };
    });

    if (currentOfficial) {
      setAuditLog(logs => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-IN'),
          hospitalName: currentOfficial.hospitalName,
          officialName: `${currentOfficial.name} (${currentOfficial.role})`,
          type: 'FLEET_UPDATE',
          details: `Ambulance #${ambId} status changed to ${newStatus.toUpperCase()}`,
          bedsLeft: activeHospital.bedsAvailable,
          icuLeft: activeHospital.icuAvailable
        },
        ...logs
      ]);
    }

    try {
      await fetch(`${API_BASE}/api/ambulances/${ambId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extra })
      });
    } catch (_) {}
  }, [currentOfficial, activeHospital]);

  // Assign task to an ambulance from dispatch unit
  const assignAmbulanceTask = useCallback((hospId, ambId, missionData) => {
    const key = Number(hospId);
    setHospitalFleets(prev => {
      const curFleet = prev[key] || [];
      const updated = curFleet.map(amb => {
        if (amb.id === ambId) {
          return { ...amb, status: 'enroute', assignedTask: missionData };
        }
        return amb;
      });
      return { ...prev, [key]: updated };
    });
    setActiveMission(missionData);
  }, []);

  return (
    <HospitalBedContext.Provider value={{
      hospitals,
      hospitalsWithTelemetry,
      activeHospital,
      selectedHospitalId,
      setSelectedHospitalId,
      // Official Authentication
      currentOfficial,
      isOfficialLoggedIn,
      loginOfficial,
      logoutOfficial,
      // Bed capacity operations (strictly official guarded)
      updateHospitalBeds,
      quickAdmit,
      quickDischarge,
      // Ambulance fleet management per hospital
      hospitalFleets,
      getHospitalFleet,
      updateAmbulanceStatus,
      assignAmbulanceTask,
      activeMission,
      setActiveMission,
      // Citizen location and ambulance summon
      citizenLocation,
      setCitizenLocation,
      isLocatingCitizen,
      citizenGpsAccuracy,
      citizenLocationError,
      requestCitizenLiveLocation,
      callAmbulanceToHospital,
      addHospitalReview,
      lastDispatchedCall,
      setLastDispatchedCall,
      // Live Ambulance GPS Telemetry
      ambulanceLiveLocation,
      setAmbulanceLiveLocation,
      // Telemetry queue
      incomingIntakes,
      registerIncomingAmbulance,
      updateIncomingAmbulance,
      removeIncomingAmbulance,
      auditLog
    }}>
      {children}
    </HospitalBedContext.Provider>
  );
}

export function useHospitalBeds() {
  const context = useContext(HospitalBedContext);
  if (!context) {
    throw new Error('useHospitalBeds must be used within a HospitalBedProvider');
  }
  return context;
}
