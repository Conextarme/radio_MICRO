#!/usr/bin/env node
/*
 * Comprueba que las URLs de streaming en stations.json y en
 * emisoras-relax.json (modo dormir) siguen respondiendo.
 *
 * Uso: node scripts/check-streams.mjs
 * Requiere Node 18 o superior (usa el fetch nativo, sin dependencias).
 *
 * No reproduce el audio ni descarga el stream entero: solo comprueba que el
 * servidor responde y corta la conexión en cuanto lo sabe (o al llegar el
 * tiempo límite). Termina con código de salida distinto de 0 si encuentra
 * alguna emisora caída, para poder usarlo en un workflow automatizado.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIONS_PATH = path.join(__dirname, '..', 'stations.json');
const SLEEP_STATIONS_PATH = path.join(__dirname, '..', 'emisoras-relax.json');
const TIMEOUT_MS = 10000;

const RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CONCURRENCY = 10;

async function checkUrlOnce(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { Range: 'bytes=0-1024' }
    });
    // No hace falta leer el cuerpo entero: en cuanto llegan cabeceras válidas
    // ya sabemos si el stream responde. Se cancela la conexión igualmente.
    controller.abort();
    if (response.ok || response.status === 206 || response.status === 200) {
      return { ok: true, status: response.status };
    }
    return { ok: false, status: response.status };
  } catch (err) {
    if (err.name === 'AbortError') {
      // Algunos servidores de streaming no cierran nunca la respuesta (es un
      // directo infinito): si llegamos aquí sin haber lanzado antes el abort
      // por timeout real, se considera error; si el abort fue el nuestro
      // (arriba), no debería llegar a este catch en la práctica normal.
      return { ok: false, status: 'timeout' };
    }
    return { ok: false, status: err.code || err.message };
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkUrl(url) {
  let result;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    result = await checkUrlOnce(url);
    if (result.ok) return result;
    if (attempt < RETRIES) await sleep(RETRY_DELAY_MS);
  }
  // Se han agotado los reintentos: se da por caída de verdad, no un fallo puntual.
  return result;
}

/* Ejecuta las comprobaciones en lotes en vez de todas a la vez, para no
   saturar la red del runner de GitHub Actions y provocar falsos positivos
   (ya ocurrió una vez con ~100 emisoras simultáneas). */
async function checkInBatches(items, checkFn) {
  const results = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkFn));
    results.push(...batchResults);
  }
  return results;
}

function flattenSleepStations(data) {
  const out = [];
  for (const categoria of data.categorias || []) {
    for (const emisora of categoria.emisoras || []) {
      out.push({
        name: emisora.nombre,
        streamUrl: emisora.stream,
        reliable: true
      });
    }
  }
  return out;
}

async function loadStations() {
  const rawNormal = await readFile(STATIONS_PATH, 'utf8');
  const normal = JSON.parse(rawNormal)
    .filter((s) => s.streamUrl)
    .map((s) => ({ name: s.name, streamUrl: s.streamUrl, reliable: s.reliable !== false, source: 'normal', file: 'stations.json' }));

  const rawSleep = await readFile(SLEEP_STATIONS_PATH, 'utf8');
  const sleep = flattenSleepStations(JSON.parse(rawSleep))
    .filter((s) => s.streamUrl)
    .map((s) => ({ ...s, source: 'dormir', file: 'emisoras-relax.json' }));

  return normal.concat(sleep);
}

async function main() {
  const withStream = await loadStations();

  console.log(`Comprobando ${withStream.length} emisoras con stream configurado (lotes de ${CONCURRENCY})...\n`);

  const results = await checkInBatches(withStream, async (station) => {
    const result = await checkUrl(station.streamUrl);
    return { ...station, ...result };
  });

  const failed = [];
  for (const r of results) {
    const flag = r.ok ? 'OK  ' : 'FAIL';
    const prefix = r.source === 'dormir' ? '[dormir]' : '[normal]';
    const reliableNote = r.reliable === false ? ' (ya marcada como no fiable)' : '';
    console.log(`[${flag}] ${prefix} ${r.name} — ${r.status}${reliableNote}`);
    if (!r.ok && r.reliable !== false) {
      failed.push(r);
    }
  }

  console.log('');
  if (failed.length) {
    console.log(`${failed.length} emisora(s) fiable(s) han fallado la comprobación:`);
    failed.forEach((r) => console.log(`  - ${r.name} (revisar en ${r.file})`));
    console.log('\nRevisa su streamUrl en el archivo indicado (puede que la emisora haya cambiado de servidor o esté caída temporalmente).');
    process.exitCode = 1;
  } else {
    console.log('Todas las emisoras fiables han respondido correctamente.');
  }
}

main().catch((err) => {
  console.error('Error ejecutando la comprobación:', err);
  process.exitCode = 1;
});
