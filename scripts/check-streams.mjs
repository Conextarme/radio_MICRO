#!/usr/bin/env node
/*
 * Comprueba que las URLs de streaming en stations.json siguen respondiendo.
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
const TIMEOUT_MS = 10000;

async function checkUrl(url) {
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

async function main() {
  const raw = await readFile(STATIONS_PATH, 'utf8');
  const stations = JSON.parse(raw);
  const withStream = stations.filter((s) => s.streamUrl);

  console.log(`Comprobando ${withStream.length} emisoras con stream configurado...\n`);

  const results = await Promise.all(
    withStream.map(async (station) => {
      const result = await checkUrl(station.streamUrl);
      return { name: station.name, reliable: station.reliable !== false, ...result };
    })
  );

  const failed = [];
  for (const r of results) {
    const flag = r.ok ? 'OK  ' : 'FAIL';
    const reliableNote = r.reliable === false ? ' (ya marcada como no fiable)' : '';
    console.log(`[${flag}] ${r.name} — ${r.status}${reliableNote}`);
    if (!r.ok && r.reliable !== false) {
      failed.push(r.name);
    }
  }

  console.log('');
  if (failed.length) {
    console.log(`${failed.length} emisora(s) fiable(s) han fallado la comprobación:`);
    failed.forEach((name) => console.log(`  - ${name}`));
    console.log('\nRevisa su streamUrl en stations.json (puede que la emisora haya cambiado de servidor o esté caída temporalmente).');
    process.exitCode = 1;
  } else {
    console.log('Todas las emisoras fiables han respondido correctamente.');
  }
}

main().catch((err) => {
  console.error('Error ejecutando la comprobación:', err);
  process.exitCode = 1;
});
