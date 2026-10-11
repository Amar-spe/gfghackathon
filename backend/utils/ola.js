const crypto = require('crypto');

// Standard encoded-polyline decoder -> [[lat, lng], ...]
function decodePolyline(str, precision = 5) {
  const factor = 10 ** precision;
  let index = 0, lat = 0, lng = 0;
  const points = [];
  while (index < str.length) {
    let shift = 0, result = 0, byte;
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push([lat / factor, lng / factor]);
  }
  return points;
}

async function olaDirections(from, to) {
  const key = process.env.OLA_MAPS_API_KEY;
  if (!key) throw new Error('OLA_MAPS_API_KEY missing');

  const url = new URL('https://api.olamaps.io/routing/v1/directions');
  url.searchParams.set('origin', `${from[0]},${from[1]}`);
  url.searchParams.set('destination', `${to[0]},${to[1]}`);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('steps', 'false');
  url.searchParams.set('alternatives', 'false');
  url.searchParams.set('api_key', key);

  const res = await fetch(url, { method: 'POST', headers: { 'X-Request-Id': crypto.randomUUID() } });
  if (!res.ok) throw new Error(`Ola Maps ${res.status}`);
  const json = await res.json();

  const route = json.routes?.[0];
  if (!route?.overview_polyline) throw new Error('Ola Maps: no route returned');

  const legs = route.legs || [];
  return {
    points: decodePolyline(route.overview_polyline),
    meters: legs.reduce((s, l) => s + (l.distance || 0), 0),
    seconds: legs.reduce((s, l) => s + (l.duration || 0), 0),
  };
}

module.exports = { olaDirections, decodePolyline };