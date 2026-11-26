/* iService chatt – liten chattruta nere till höger på iservicesverige.se.
   Läggs i Webflow: Site settings → Custom code → Footer code, inom <script>…</script>.
   Svaren kommer från Cloudflare-servern (iservice-sync, /chatt) som bara svarar om iService och hemsidan.

   TESTLÄGE: så länge TEST_LAGE = true syns chatten bara för den som öppnat sidan med ?chatt=test en gång
   (sparas i webbläsaren; ?chatt=av stänger av). Sätt false när den ska synas för alla. */
(function () {
  'use strict';
  var TEST_LAGE = true;
  var API = 'https://iservice-sync.iservice-karlstad.workers.dev';
  var TEL = '054-771 22 00', TEL_LANK = 'tel:+46547712200', MEJL = 'support@iservicesverige.se';
  var NAVY = '#03086b', KORALL = '#ff6363';
  var LS = 'iservice_chatt_v1';

  function las(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function skriv(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  if (TEST_LAGE) {
    var q = (location.search.match(/[?&]chatt=([a-z]+)/) || [])[1];
    if (q === 'test') skriv('iservice_chatt_test', '1');
    if (q === 'av') skriv('iservice_chatt_test', null);
    if (las('iservice_chatt_test') !== '1') return;
  }
  if (window.__iserviceChatt) return;
  window.__iserviceChatt = true;

  var css = '' +
    '#isc-knapp{position:fixed;right:20px;bottom:20px;z-index:99998;width:60px;height:60px;border-radius:50%;border:0;background:' + KORALL + ';color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(3,8,107,.35);display:flex;align-items:center;justify-content:center;transition:transform .15s}' +
    '#isc-knapp:hover{transform:scale(1.06)}#isc-knapp svg{width:28px;height:28px}' +
    '#isc-ruta{position:fixed;right:20px;bottom:92px;z-index:99999;width:370px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(3,8,107,.3);display:none;flex-direction:column;overflow:hidden;font-family:inherit;color:#0f1357;font-size:15px;line-height:1.45}' +
    '#isc-ruta.oppen{display:flex}' +
    '#isc-topp{background:' + NAVY + ';color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}' +
    '#isc-topp b{font-size:16px;display:block}#isc-topp small{opacity:.8;font-size:12px}' +
    '#isc-stang{margin-left:auto;background:transparent;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:4px 8px}' +
    '#isc-lista{flex:1;overflow-y:auto;padding:14px;background:#f5f6fb;display:flex;flex-direction:column;gap:8px}' +
    '.isc-m{max-width:85%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}' +
    '.isc-bot{background:#fff;border:1px solid #e3e5f0;align-self:flex-start;border-bottom-left-radius:4px}' +
    '.isc-kund{background:' + NAVY + ';color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
    '.isc-bot a{color:' + NAVY + ';font-weight:600}' +
    '.isc-tankar{color:#758696;font-style:italic}' +
    '.isc-snabb{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}' +
    '.isc-snabb button,.isc-kontakt a{border:1.5px solid ' + NAVY + ';background:#fff;color:' + NAVY + ';border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;text-decoration:none}' +
    '.isc-snabb button:hover,.isc-kontakt a:hover{background:' + NAVY + ';color:#fff}' +
    '.isc-kontakt{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start}' +
    '#isc-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e3e5f0;background:#fff}' +
    '#isc-text{flex:1;border:1.5px solid #c8c8c8;border-radius:10px;padding:9px 11px;font:inherit;font-size:15px;resize:none;max-height:90px}' +
    '#isc-text:focus{outline:none;border-color:' + NAVY + '}' +
    '#isc-skicka{background:' + KORALL + ';color:#fff;border:0;border-radius:10px;padding:0 14px;font:inherit;font-weight:600;cursor:pointer}' +
    '#isc-skicka:disabled{opacity:.5;cursor:default}' +
    '#isc-info{font-size:11px;color:#758696;text-align:center;padding:0 10px 8px;background:#fff}' +
    '@media (max-width:520px){#isc-text{font-size:16px}#isc-ruta{right:0;left:0;bottom:0;width:100%;max-width:100%;height:100%;max-height:100%;border-radius:0}#isc-knapp{right:14px;bottom:14px}#isc-ruta.oppen~#isc-knapp{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  var ruta = el('div', { id: 'isc-ruta', role: 'dialog', 'aria-label': 'Chatta med iService' });
  ruta.innerHTML =
    '<div id="isc-topp"><div><b>iService</b><small>Svarar på frågor om reparationer, priser och köp/sälj</small></div>' +
    '<button id="isc-stang" aria-label="Stäng chatten">×</button></div>' +
    '<div id="isc-lista" aria-live="polite"></div>' +
    '<form id="isc-form"><textarea id="isc-text" rows="1" maxlength="600" placeholder="Skriv din fråga…" aria-label="Din fråga"></textarea>' +
    '<button id="isc-skicka" type="submit">Skicka</button></form>' +
    '<div id="isc-info">Automatiska svar utifrån iservicesverige.se – priser är preliminära.</div>';
  var knapp = el('button', { id: 'isc-knapp', 'aria-label': 'Öppna chatten', title: 'Fråga oss' });
  knapp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/></svg>';
  document.body.appendChild(ruta);
  document.body.appendChild(knapp);

  var lista = ruta.querySelector('#isc-lista'), form = ruta.querySelector('#isc-form'), text = ruta.querySelector('#isc-text'), skicka = ruta.querySelector('#isc-skicka');
  var samtal = [];
  try { samtal = JSON.parse(sessionStorage.getItem(LS) || '[]'); } catch (e) {}
  var upptagen = false;

  // Gör webbadresser, telefonnummer och e-postadresser klickbara (tel:/mailto: öppnar ringappen/mejlappen).
  // Resten är ren text – inget HTML från servern.
  function lankifiera(nod, s) {
    var re = /(https?:\/\/[^\s)]+[^\s).,!?])|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})|((?:\+46\s?|0)\d{1,3}[\s-]?\d{2,3}[\s-]?\d{2}[\s-]?\d{2,3})/g, sista = 0, m;
    while ((m = re.exec(s))) {
      nod.appendChild(document.createTextNode(s.slice(sista, m.index)));
      var a;
      if (m[1]) a = el('a', { href: m[1], target: /iservicesverige\.se/.test(m[1]) ? '_self' : '_blank', rel: 'noopener' }, m[1].replace(/^https?:\/\/(www\.)?iservicesverige\.se/, 'iservicesverige.se'));
      else if (m[2]) a = el('a', { href: 'mailto:' + m[2] }, m[2]);
      else a = el('a', { href: 'tel:' + m[3].replace(/[\s-]/g, '').replace(/^0/, '+46') }, m[3]);
      nod.appendChild(a); sista = re.lastIndex;
    }
    nod.appendChild(document.createTextNode(s.slice(sista)));
  }
  function bubbla(roll, s) {
    var b = el('div', { 'class': 'isc-m ' + (roll === 'kund' ? 'isc-kund' : 'isc-bot') });
    if (roll === 'kund') b.textContent = s; else lankifiera(b, s);
    lista.appendChild(b); lista.scrollTop = lista.scrollHeight;
    return b;
  }
  function spara() { try { sessionStorage.setItem(LS, JSON.stringify(samtal.slice(-20))); } catch (e) {} }

  // Kontakt: ring, eller mejla – länken öppnar besökarens egen mejlapp med frågan redan ifylld.
  function kontaktKnappar() {
    var k = el('div', { 'class': 'isc-kontakt' });
    var senaste = ''; for (var i = samtal.length - 1; i >= 0; i--) if (samtal[i].roll === 'kund') { senaste = samtal[i].text; break; }
    var mejl = 'mailto:' + MEJL + '?subject=' + encodeURIComponent('Fråga från hemsidan') + (senaste ? '&body=' + encodeURIComponent(senaste + '\n\n') : '');
    k.appendChild(el('a', { href: TEL_LANK }, 'Ring ' + TEL));
    k.appendChild(el('a', { href: mejl }, 'Mejla oss'));
    lista.appendChild(k); lista.scrollTop = lista.scrollHeight;
  }

  function snabbval() {
    var s = el('div', { 'class': 'isc-snabb' });
    ['Vad kostar skärmbyte?', 'Vad får jag för min iPhone?', 'Öppettider och adress', 'Garanti'].forEach(function (t) {
      var b = el('button', { type: 'button' }, t);
      b.addEventListener('click', function () { s.remove(); fraga(t); });
      s.appendChild(b);
    });
    lista.appendChild(s);
  }

  function fraga(t) {
    t = String(t || '').trim();
    if (!t || upptagen) return;
    upptagen = true; skicka.disabled = true;
    var sv = lista.querySelector('.isc-snabb'); if (sv) sv.remove();
    bubbla('kund', t);
    samtal.push({ roll: 'kund', text: t }); spara();
    var vant = bubbla('bot', 'Skriver…'); vant.classList.add('isc-tankar');
    fetch(API + '/chatt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meddelanden: samtal.slice(-12) }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        vant.remove();
        var svar = j.svar || ('Något gick fel – ring oss på ' + TEL + '.');
        bubbla('bot', svar);
        samtal.push({ roll: 'bot', text: svar }); spara();
        if (j.visaKontakt) kontaktKnappar();
      })
      .catch(function () {
        vant.remove();
        bubbla('bot', 'Jag når inte fram just nu. Ring oss på ' + TEL + ' eller mejla ' + MEJL + '.');
        kontaktKnappar();
      })
      .then(function () { upptagen = false; skicka.disabled = false; text.focus(); });
  }

  function starta() {
    lista.innerHTML = '';
    bubbla('bot', 'Hej! 👋 Jag svarar på frågor om iService – reparationer, priser, att köpa eller sälja iPhone, öppettider och liknande. Vad undrar du?');
    if (samtal.length) samtal.forEach(function (m) { bubbla(m.roll, m.text); });
    else snabbval();
  }

  function oppna() { ruta.classList.add('oppen'); knapp.setAttribute('aria-label', 'Stäng chatten'); if (!lista.childNodes.length) starta(); setTimeout(function () { text.focus(); }, 50); }
  function stang() { ruta.classList.remove('oppen'); knapp.setAttribute('aria-label', 'Öppna chatten'); knapp.focus(); }
  knapp.addEventListener('click', function () { ruta.classList.contains('oppen') ? stang() : oppna(); });
  ruta.querySelector('#isc-stang').addEventListener('click', stang);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ruta.classList.contains('oppen')) stang(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); var t = text.value; text.value = ''; fraga(t); });
  text.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); } });
})();
