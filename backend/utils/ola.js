const crypto = require('crypto');

function decodePolyline(str, precision = 5) {
  if (!str || typeof str !== 'string') return [];
  const factor = 10 ** precision;
  let index = 0, lat = 0, lng = 0;
  const points = [];
  while (index < str.length) {
    let shift = 0, result = 0, byte;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push([lat / factor, lng / factor]);
  }
  return points;
}

async function olaDirections(from, to, customKey = null) {
  const key = customKey || process.env.OLA_MAPS_API_KEY;
  if (!key) throw new Error('OLA_MAPS_API_KEY missing. Set OLA_MAPS_API_KEY in backend/.env or provide customKey.');

  const url = new URL('https://api.olamaps.io/routing/v1/directions');
  url.searchParams.set('origin', `${from[0]},${from[1]}`);
  url.searchParams.set('destination', `${to[0]},${to[1]}`);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('steps', 'false');
  url.searchParams.set('alternatives', 'false');
  url.searchParams.set('api_key', key);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'X-Request-Id': crypto.randomUUID(), 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Ola Maps Directions API responded with HTTP ${res.status}`);
    const json = await res.json();
    const route = json.routes?.[0];
    if (!route?.overview_polyline) throw new Error('Ola Maps: No route polyline returned in response');

    const legs = route.legs || [];
    const meters = legs.reduce((s, l) => s + (l.distance || 0), 0);
    const seconds = legs.reduce((s, l) => s + (l.duration || 0), 0);
    const decodedPoints = decodePolyline(route.overview_polyline);

    return {
      points: decodedPoints,
      meters,
      seconds,
      provider: 'ola_maps',
      summary: route.summary || `${(meters / 1000).toFixed(1)} km via Ola Road Network`
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function testOlaConnection(apiKey) {
  try {
    const result = await olaDirections([12.9797, 77.5906], [12.9756, 77.6066], apiKey);
    return {
      success: true,
      message: 'Ola Maps API connected and authenticated successfully',
      sampleDistanceKm: (result.meters / 1000).toFixed(2),
      sampleDurationMins: Math.round(result.seconds / 60)
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = { olaDirections, decodePolyline, testOlaConnection };
