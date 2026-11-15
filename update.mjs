// Bygger public/priser.json från KassaApps publika pris-rutter i Google Apps Script. Samma innehåll som
// byggPrisfil_ i KassaApp/AppsScript_Code.gs: bara priser som redan visas på iservicesverige.se.
// Körs av .github/workflows/prisfil.yml var 10:e minut.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const API = 'https://script.google.com/macros/s/AKfycbzIbDtT2SsCNGXxePZ_UztQDw4yDV1f51xc3HFUtazw_48NuK1Gg5Dv7sTF7GIlEn1G/exec';
const FILE = 'public/priser.json';
const HOUR = 60 * 60 * 1000;
const RENEW_AFTER = 20 * HOUR; // hemsidan godkänner filen i 48 h, så tidsstämpeln förnyas en gång per dygn
const ALARM_AFTER = 36 * HOUR; // först då räknas ett misslyckat hämtförsök som ett fel (GitHub mejlar)

// Apps Script svarar ibland med en felsida eller långsamt: ett anrop i taget, flera försök.
async function get(type) {
  let err;
  for (let i = 0; i < 4; i++) {
    if (i) await new Promise(r => setTimeout(r, i * 5000));
    try {
      const res = await fetch(`${API}?type=${type}`, { signal: AbortSignal.timeout(60000) });
      const json = JSON.parse(await res.text());
      if (json && json.ok !== false) return json;
      err = new Error(`${type}: ${json && json.error}`);
    } catch (e) {
      err = e;
    }
  }
  throw err;
}

let old = null;
try { old = JSON.parse(await readFile(FILE, 'utf8')); } catch {}
const age = old ? Date.now() - Date.parse(old.generatedAt) : Infinity;

let options, sale, valuation;
try {
  options = await get('public_options');
  sale = await get('public_sale_all');
  valuation = (await get('public_valuation_all')).data;
  if (!Array.isArray(options.modeller) || !options.modeller.length || !sale.prices || !valuation || !Object.keys(valuation).length)
    throw new Error('ofullständigt svar');
} catch (e) {
  console.log(`::warning::Kunde inte hämta priserna från Apps Script (${e.message}). Den gamla filen ligger kvar.`);
  process.exit(age > ALARM_AFTER ? 1 : 0);
}

const same = old && JSON.stringify([old.options, old.sale, old.valuation]) === JSON.stringify([options, sale, valuation]);
if (same && age < RENEW_AFTER) {
  console.log('Oförändrad.');
} else {
  await mkdir('public', { recursive: true });
  await writeFile(FILE, JSON.stringify({ ok: true, version: 1, generatedAt: new Date().toISOString(), options, sale, valuation }));
  console.log(same ? 'Tidsstämpeln förnyad.' : 'Priserna har ändrats.');
}
