// Función serverless de Vercel: devuelve la canción que suena en una emisora,
// y cuando el proveedor lo ofrece, las anteriores y las siguientes.
//
// GET /api/now-playing?url=<streamUrl>
// -> { now: {artist, title, cover} | null, history: [...], next: [...], source }
//
// Se hace desde el servidor porque casi ninguna emisora permite leer estos
// datos directamente desde el navegador (CORS), y los metadatos ICY que van
// dentro del propio stream no son accesibles desde un <audio>.
//
// Solo acepta URLs que estén en las listas de emisoras del proyecto, para que
// no sirva como proxy abierto hacia cualquier dirección.

var stationsNormal = require('../stations.json');
var stationsRelax = require('../emisoras-relax.json');
var stationsModes = require('../emisoras-modos.json');

var TIMEOUT_MS = 6000;
var MAX_LIST = 10;
var UA = 'Mozilla/5.0 (compatible; RadioSinMicrocortes/1.0)';

var allowedUrls = buildAllowList();

function buildAllowList() {
  var set = new Set();
  function walk(node) {
    if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === 'object') {
      if (typeof node.streamUrl === 'string') set.add(node.streamUrl);
      if (typeof node.stream === 'string') set.add(node.stream);
      Object.keys(node).forEach(function (k) { walk(node[k]); });
    }
  }
  walk(stationsNormal);
  walk(stationsRelax);
  walk(stationsModes);
  return set;
}

/* --- Utilidades --- */

function withTimeout(ms) {
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, ms);
  return { signal: controller.signal, controller: controller, done: function () { clearTimeout(timer); } };
}

async function getText(url) {
  var t = withTimeout(TIMEOUT_MS);
  try {
    var res = await fetch(url, { headers: { 'User-Agent': UA }, signal: t.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  } finally {
    t.done();
  }
}

async function getJson(url) {
  var txt = await getText(url);
  if (!txt) return null;
  try { return JSON.parse(txt); } catch (e) { return null; }
}

function clean(s) {
  if (s == null) return '';
  return String(s).replace(/\s+/g, ' ').trim();
}

// Títulos que no son una canción: vacíos, solo guiones, "Unknown", o
// identificadores internos de cuñas publicitarias ("Marca_Campaña_2026_...").
function isJunk(text) {
  var t = clean(text).replace(/^[-–—\s]+|[-–—\s]+$/g, '');
  if (!t) return true;
  if (/^[\w.-]{16,}$/.test(t) && t.indexOf('_') !== -1) return true;
  return /^(unknown|desconocido|n\/a|null|undefined|-)$/i.test(t);
}

// Los metadatos ICY suelen ir en UTF-8, pero algunos servidores viejos usan
// Latin-1: si el UTF-8 no es válido, se reinterpreta como Windows-1252.
function decodeMeta(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (e) {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

// "Artista - Título" en un solo texto -> {artist, title}
function splitTitle(raw) {
  var text = clean(raw);
  if (isJunk(text)) return null;
  var idx = text.indexOf(' - ');
  if (idx > 0) {
    var artist = clean(text.slice(0, idx));
    var title = clean(text.slice(idx + 3));
    if (title && !isJunk(title)) {
      return { artist: isJunk(artist) ? '' : artist, title: title };
    }
  }
  return { artist: '', title: text };
}

function track(artist, title, extra) {
  artist = clean(artist);
  title = clean(title);
  if (isJunk(title) && isJunk(artist)) return null;
  if (isJunk(title)) { title = artist; artist = ''; }
  var t = { artist: isJunk(artist) ? '' : artist, title: title };
  if (extra && extra.cover) t.cover = extra.cover;
  if (extra && extra.at) t.at = extra.at;
  return t;
}

function compact(list) {
  return (list || []).filter(Boolean).slice(0, MAX_LIST);
}

function toIso(value) {
  if (value == null || value === '') return undefined;
  var d = typeof value === 'number' ? new Date(value < 1e12 ? value * 1000 : value) : new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/* --- Proveedores con API propia (dan historial y a veces próximas) --- */

// Triton / StreamTheWorld (PRISA: Los 40, Cadena Dial, Radiolé...)
async function fromTriton(u) {
  if (!/streamtheworld\.com$/i.test(u.hostname)) return null;
  var seg = decodeURIComponent(u.pathname.split('/').pop() || '');
  var base = seg.replace(/\.(aac|mp3)$/i, '').replace(/_SC$/i, '');
  var candidates = [base];
  if (/AAC$/i.test(base)) candidates.push(base.replace(/AAC$/i, ''));
  else candidates.push(base + 'AAC');
  if (base.indexOf('_') > 0) candidates.push(base.split('_')[0]);

  for (var i = 0; i < candidates.length; i++) {
    var xml = await getText('https://np.tritondigital.com/public/nowplaying?mountName=' +
      encodeURIComponent(candidates[i]) + '&numberToFetch=' + (MAX_LIST + 1) + '&eventType=track');
    if (!xml || xml.indexOf('<nowplaying-info ') === -1) continue;
    var items = [];
    var re = /<nowplaying-info [^>]*timestamp="(\d+)"[^>]*>([\s\S]*?)<\/nowplaying-info>/g;
    var m;
    while ((m = re.exec(xml))) {
      var props = {};
      var pr = /<property name="([^"]+)"><!\[CDATA\[([\s\S]*?)\]\]><\/property>/g;
      var p;
      while ((p = pr.exec(m[2]))) props[p[1]] = p[2];
      var artist = (props.track_artist_name || '').split(',').map(clean).join(', ');
      items.push(track(artist, props.cue_title, { cover: props.track_cover_url, at: toIso(Number(m[1])) }));
    }
    items = items.filter(Boolean);
    if (!items.length) continue;
    return { now: items[0], history: compact(items.slice(1)), next: [], source: 'triton' };
  }
  return null;
}

// SomaFM: ice2.somafm.com/<canal>-128-mp3
async function fromSomaFm(u) {
  if (!/somafm\.com$/i.test(u.hostname)) return null;
  var channel = (u.pathname.split('/')[1] || '').replace(/-\d+-(mp3|aac|aacp)$/i, '');
  if (!channel) return null;
  var data = await getJson('https://somafm.com/songs/' + encodeURIComponent(channel) + '.json');
  if (!data || !Array.isArray(data.songs) || !data.songs.length) return null;
  var items = data.songs.map(function (s) {
    return track(s.artist, s.title, { at: toIso(Number(s.date)) });
  }).filter(Boolean);
  if (!items.length) return null;
  return { now: items[0], history: compact(items.slice(1)), next: [], source: 'somafm' };
}

// laut.fm: stream.laut.fm/<emisora> o <emisora>.stream.laut.fm/<emisora>
async function fromLautFm(u) {
  if (!/(^|\.)stream\.laut\.fm$/i.test(u.hostname)) return null;
  var name = u.pathname.split('/')[1];
  if (!name) return null;
  var base = 'https://api.laut.fm/station/' + encodeURIComponent(name);
  var results = await Promise.all([getJson(base + '/current_song'), getJson(base + '/last_songs')]);
  var cur = results[0];
  var last = Array.isArray(results[1]) ? results[1] : [];
  function lautTrack(s) {
    if (!s) return null;
    return track(s.artist && s.artist.name, s.title, { at: toIso(s.started_at) });
  }
  var now = lautTrack(cur);
  if (!now) return null;
  var history = last.map(lautTrack).filter(function (t) {
    return t && !(t.title === now.title && t.artist === now.artist);
  });
  return { now: now, history: compact(history), next: [], source: 'laut.fm' };
}

// Radio.co: <host>.radio.co/<id>/listen
async function fromRadioCo(u) {
  if (!/(^|\.)radio\.co$/i.test(u.hostname)) return null;
  var id = u.pathname.split('/')[1];
  if (!/^s[0-9a-f]+$/i.test(id || '')) return null;
  var data = await getJson('https://public.radio.co/stations/' + id + '/status');
  if (!data || !data.current_track) return null;
  var now = splitTitle(data.current_track.title);
  if (!now) return null;
  if (data.current_track.artwork_url_large || data.current_track.artwork_url) {
    now.cover = data.current_track.artwork_url_large || data.current_track.artwork_url;
  }
  var history = (data.history || []).map(function (h) { return splitTitle(h.title); })
    .filter(Boolean);
  if (history.length && history[0].title === now.title && history[0].artist === now.artist) {
    history = history.slice(1);
  }
  return { now: now, history: compact(history), next: [], source: 'radio.co' };
}

// RadioKing: listen.radioking.com/radio/<id>/stream/... o play.radioking.io/<slug>
async function fromRadioKing(u) {
  var id = null;
  if (/listen\.radioking\.com$/i.test(u.hostname)) {
    id = u.pathname.split('/')[2];
  } else if (/play\.radioking\.io$/i.test(u.hostname)) {
    id = u.pathname.split('/')[1];
  }
  if (!id) return null;
  var base = 'https://api.radioking.io/widget/radio/' + encodeURIComponent(id) + '/track/';
  var results = await Promise.all([getJson(base + 'current'), getJson(base + 'ckoi?limit=' + MAX_LIST), getJson(base + 'next')]);
  var cur = results[0];
  if (!cur || !cur.title) return null;
  var now = track(cur.artist, cur.title, { cover: cur.cover });
  if (!now) return null;
  function rk(s) { return s && track(s.artist, s.title, { at: toIso(s.started_at) }); }
  var history = (Array.isArray(results[1]) ? results[1] : []).map(rk).filter(function (t) {
    return t && !(t.title === now.title && t.artist === now.artist);
  });
  var next = (Array.isArray(results[2]) ? results[2] : []).map(rk);
  return { now: now, history: compact(history), next: compact(next), source: 'radioking' };
}

// Rainwave: relay.rainwave.cc/<canal>.mp3 (las siguientes son las que se votan)
var RAINWAVE_SID = { game: 1, ocremix: 2, covers: 3, chiptune: 4, all: 5, chill: 6 };
async function fromRainwave(u) {
  if (!/rainwave\.cc$/i.test(u.hostname)) return null;
  var key = (u.pathname.split('/')[1] || '').replace(/\.(mp3|ogg)$/i, '');
  var sid = RAINWAVE_SID[key];
  if (!sid) return null;
  var data = await getJson('https://rainwave.cc/api4/info?sid=' + sid);
  if (!data || !data.sched_current) return null;
  function rwSong(s, at) {
    if (!s) return null;
    var artists = (s.artists || []).map(function (a) { return a.name; }).join(', ');
    var album = s.albums && s.albums[0] && s.albums[0].name;
    var t = track(artists, s.title, { at: at });
    if (t && album) t.album = album;
    return t;
  }
  function firstSong(ev) { return ev && ev.songs && ev.songs[0]; }
  var now = rwSong(firstSong(data.sched_current), toIso(data.sched_current.start_actual || data.sched_current.start));
  if (!now) return null;
  var history = (data.sched_history || []).map(function (ev) { return rwSong(firstSong(ev), toIso(ev.start_actual || ev.start)); });
  // De cada elección futura solo se sabe qué canciones compiten, no cuál ganará:
  // se muestra la primera de cada una como orientación.
  var next = (data.sched_next || []).map(function (ev) { return rwSong(firstSong(ev)); });
  return { now: now, history: compact(history), next: compact(next), source: 'rainwave' };
}

// Zeno.fm: stream.zeno.fm/<mount> (canal de eventos que manda el título al conectar)
async function fromZeno(u) {
  if (!/stream\.zeno\.fm$/i.test(u.hostname)) return null;
  var mount = u.pathname.split('/')[1];
  if (!mount) return null;
  // Más corto que el resto: si no llega el título, aún queda probar el ICY.
  var t = withTimeout(3500);
  try {
    var res = await fetch('https://api.zeno.fm/mounts/metadata/subscribe/' + encodeURIComponent(mount), {
      headers: { 'User-Agent': UA, Accept: 'text/event-stream' }, signal: t.signal
    });
    if (!res.ok || !res.body) return null;
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buf = '';
    while (buf.length < 8192) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });
      var m = /data:\s*(\{[^\n]*"streamTitle"[^\n]*\})/.exec(buf);
      if (m) {
        t.controller.abort();
        try {
          var now = splitTitle(JSON.parse(m[1]).streamTitle);
          return now ? { now: now, history: [], next: [], source: 'zeno' } : null;
        } catch (e) { return null; }
      }
    }
    return null;
  } catch (e) {
    return null;
  } finally {
    t.controller.abort();
    t.done();
  }
}

/* --- Genéricos: metadatos ICY del stream y estado de Icecast/Shoutcast --- */

async function fromIcy(u) {
  var t = withTimeout(TIMEOUT_MS);
  try {
    var res = await fetch(u.href, { headers: { 'Icy-MetaData': '1', 'User-Agent': UA }, signal: t.signal });
    var metaint = parseInt(res.headers.get('icy-metaint') || '0', 10);
    if (!res.ok || !metaint || !res.body || metaint > 256 * 1024) return null;
    var reader = res.body.getReader();
    var buf = new Uint8Array(0);
    while (true) {
      if (buf.length > metaint) {
        var len = buf[metaint] * 16;
        if (buf.length >= metaint + 1 + len) {
          var raw = decodeMeta(buf.slice(metaint + 1, metaint + 1 + len));
          var m = /StreamTitle='([\s\S]*?)';/.exec(raw);
          var now = m ? splitTitle(m[1]) : null;
          return now ? { now: now, history: [], next: [], source: 'icy' } : null;
        }
      }
      var chunk = await reader.read();
      if (chunk.done) return null;
      var merged = new Uint8Array(buf.length + chunk.value.length);
      merged.set(buf);
      merged.set(chunk.value, buf.length);
      buf = merged;
    }
  } catch (e) {
    return null;
  } finally {
    t.controller.abort();
    t.done();
  }
}

async function fromIcecastStatus(u) {
  var data = await getText(u.origin + '/status-json.xsl');
  if (!data || data.indexOf('icestats') === -1) return null;
  try {
    // Algunos Icecast antiguos generan JSON inválido ("title": - ,)
    var json = JSON.parse(data.replace(/:\s*-\s*([,}])/g, ':null$1'));
    var sources = json.icestats && json.icestats.source;
    sources = Array.isArray(sources) ? sources : (sources ? [sources] : []);
    var match = sources.find(function (s) {
      try { return s.listenurl && new URL(s.listenurl).pathname === u.pathname; } catch (e) { return false; }
    }) || (sources.length === 1 ? sources[0] : null);
    if (!match) return null;
    var now = match.artist && match.title
      ? track(match.artist, match.title)
      : splitTitle(match.title || match.yp_currently_playing);
    return now ? { now: now, history: [], next: [], source: 'icecast' } : null;
  } catch (e) {
    return null;
  }
}

var PROVIDERS = [fromTriton, fromSomaFm, fromLautFm, fromRadioCo, fromRadioKing, fromRainwave, fromZeno];

async function resolveNowPlaying(streamUrl) {
  var u = new URL(streamUrl);
  for (var i = 0; i < PROVIDERS.length; i++) {
    var r = await PROVIDERS[i](u);
    if (r) return r;
  }
  if (/\.m3u8($|\?)/i.test(u.pathname)) return null;
  return (await fromIcy(u)) || (await fromIcecastStatus(u));
}

module.exports = async function handler(req, res) {
  var streamUrl = req.query && req.query.url;
  if (typeof streamUrl !== 'string' || !allowedUrls.has(streamUrl)) {
    res.status(400).json({ error: 'Emisora desconocida' });
    return;
  }
  var result = null;
  try {
    result = await resolveNowPlaying(streamUrl);
  } catch (e) {
    result = null;
  }
  // La CDN de Vercel guarda la respuesta unos segundos: si varias personas
  // escuchan la misma emisora, solo se consulta a la emisora una vez.
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
  res.status(200).json(result || { now: null, history: [], next: [], source: null });
};

module.exports.resolveNowPlaying = resolveNowPlaying;
module.exports.allowedUrls = allowedUrls;
