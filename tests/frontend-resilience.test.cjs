const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.attributes = {}; this.dataset = {}; this.listeners = {}; this.style = {}; this.className = ''; this.textContent = ''; this.hidden = false; }
  getContext() { return {}; }
  get firstChild() { return this.children[0]; }
  get lastChild() { return this.children.at(-1); }
  get nextElementSibling() { return this.parentNode?.children[this.parentNode.children.indexOf(this) + 1]; }
  get classList() { return { add: (...names) => { this.className += ' ' + names.join(' '); }, contains: name => this.className.split(/\s+/).includes(name), toggle: (name, on) => { const set = new Set(this.className.split(/\s+/).filter(Boolean)); if (on) set.add(name); else set.delete(name); this.className = [...set].join(' '); } }; }
  append(...nodes) { for (const node of nodes) { if (typeof node === 'string') continue; node.remove(); node.parentNode = this; this.children.push(node); } }
  prepend(...nodes) { for (const node of nodes.reverse()) { node.remove(); node.parentNode = this; this.children.unshift(node); } }
  insertBefore(node, ref) { node.remove(); node.parentNode = this; this.children.splice(this.children.indexOf(ref), 0, node); }
  remove() { if (this.parentNode) this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1); this.parentNode = null; }
  replaceChildren(...nodes) { for (const node of this.children) node.parentNode = null; this.children = []; this.append(...nodes); }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; if (key === 'src' || key === 'href') delete this[key]; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  async dispatch(type) { for (const fn of this.listeners[type] || []) await fn({ preventDefault() {} }); }
  matches(selector) {
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    const match = selector.match(/^([\w-]+)(?:\[([\w-]+)=([^\]]+)\])?$/);
    return Boolean(match && this.tagName === match[1] && (!match[2] || String(this[match[2]] || this.attributes[match[2]]) === match[3]));
  }
  querySelectorAll(selector) { const results = []; for (const child of this.children) { if (child.matches(selector)) results.push(child); results.push(...child.querySelectorAll(selector)); } return results; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() {}
}
function deferred() { let resolve, reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; }); return { promise, resolve, reject }; }
function fixture(id, validation, preparation) {
  return { id, revision: 1, validation, preparation, fichiers: [{ sha256: 'courant', createdAt: '2026-10-12' }], historique: [], extraction: { sha256: 'courant', pages: 1, taille: 1024, lecture: { numeroBon: id, details: { client: { nom: 'Client fictif ' + id }, prestations: [{ description: 'Vérification fictive', sources: [] }], texteIntegral: 'Texte fictif', suivisAPrevoir: [] } } } };
}
function context(api, fetch) {
  const page = new Element('main'), urls = { made: [], revoked: [] };
  const box = {
    document: { createElement: tag => new Element(tag), createElementNS: (ns, tag) => new Element(tag), createTextNode: value => Object.assign(new Element('text'), { textContent: value }), getElementById: () => page, querySelector: () => null, querySelectorAll: () => [] },
    location: { hash: '#/dashboard' }, Blob, AbortController, clearTimeout, setTimeout,
    URL: { createObjectURL: () => { const url = 'blob:' + (urls.made.length + 1); urls.made.push(url); return url; }, revokeObjectURL: url => urls.revoked.push(url) },
    fetch: fetch || (async () => ({ ok: true, blob: async () => new Blob(['%PDF-test']) })),
    innerWidth: 1200, matchMedia: () => ({ matches: true }), showToast() {}, navigate() {}, handleRoute() {}, avisAfficherQr() {}, avisLienMessageQr() {}, updateTopbarDate() {}, initPwa() {},
  };
  vm.createContext(box);
  for (const name of ['parcours', 'interface']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../yooza-avis/js/' + name + '.js'), 'utf8'), box);
  const networkApi = box.avisApi;
  box.Avis.config = { apiBase: '/api/v1' }; box.Avis.mode = 'local'; box.Avis.routeGeneration = 3;
  box.avisApi = api || (async () => fixture('1'));
  return { box, page, urls, networkApi };
}
const turn = () => new Promise(resolve => setImmediate(resolve));

function portablePdf(box, overrides = {}) {
  const state = { destroyed: 0, cancelled: 0, pages: [] };
  const document = { numPages: 2, async getPage(number) {
    state.pages.push(number);
    if (overrides.pageFailure && number === 2) throw Error('page unavailable');
    return { getViewport: ({ scale }) => ({ width: 600 * scale, height: 800 * scale }), cleanup() {}, render() {
      const promise = state.nextRender || Promise.resolve(); state.nextRender = null;
      return { promise, cancel() { state.cancelled++; } };
    } };
  } };
  box.Avis.mode = 'tailscale';
  box.avisChargerModulePdf = async () => ({ getDocument(options) {
    state.options = options;
    return { promise: overrides.loading || Promise.resolve(document), async destroy() { state.destroyed++; } };
  } });
  return state;
}

test('le mode privé affiche le PDF dans un canvas paginé et conserve l’original', async () => {
  const { box, page } = context(), state = portablePdf(box);
  await box.avisFiche(page, '3616', 3); await turn();
  assert.equal(page.querySelector('iframe'), null);
  const canvas = page.querySelector('canvas'); assert.ok(canvas); assert.ok(canvas.width * canvas.height <= 4000000);
  assert.equal(page.querySelector('.avis-pdf-count').textContent, 'Page 1 sur 2');
  assert.equal(page.querySelector('.avis-pdf').querySelector('a').href, 'blob:1');
  const next = page.querySelectorAll('button').find(button => button.attributes['aria-label'] === 'Page suivante');
  await next.dispatch('click'); await turn();
  assert.equal(page.querySelector('.avis-pdf-count').textContent, 'Page 2 sur 2'); assert.equal(next.disabled, true);
  const zoom = page.querySelector('.avis-pdf-controls').querySelector('select'); zoom.value = '2'; await zoom.dispatch('change'); await turn();
  assert.ok(canvas.width * canvas.height <= 4000000); assert.equal(canvas.style.width, '640px');
  assert.equal(state.options.useWasm, false);
  box.avisAnnulerPdf(); assert.equal(state.destroyed, 1); assert.equal(canvas.width, 0); assert.equal(canvas.height, 0);
});

test('un lecteur privé indisponible garde le PDF ouvrable et les corrections saisies', async () => {
  const { box, page } = context(); box.Avis.mode = 'tailscale'; box.avisChargerModulePdf = async () => { throw Error('worker unavailable'); };
  await box.avisFiche(page, '3616', 3); await turn();
  assert.equal(page.querySelector('.avis-pdf').querySelector('a').href, 'blob:1'); assert.equal(page.querySelector('.avis-pdf').querySelector('a').hidden, false);
  assert.match(page.querySelector('.avis-erreur').textContent, /aperçu/);
  const input = page.querySelector('form').querySelector('input'); input.value = 'Correction conservée';
  portablePdf(box);
  const retry = page.querySelector('.avis-pdf').querySelectorAll('button').find(button => button.textContent === 'Réessayer le PDF');
  await retry.dispatch('click'); await turn();
  assert.ok(page.querySelector('canvas')); assert.equal(input.value, 'Correction conservée'); assert.equal(retry.hidden, true);
});

test('quitter une fiche pendant le chargement du lecteur détruit le travail et ignore sa réponse', async () => {
  const loading = deferred(), { box, page, urls } = context(), state = portablePdf(box, { loading: loading.promise });
  await box.avisFiche(page, '3616', 3); await turn();
  box.Avis.routeGeneration++; box.avisAnnulerPdf(); page.replaceChildren(new Element('article'));
  loading.resolve({ numPages: 1 }); await turn();
  assert.equal(state.destroyed, 1); assert.equal(page.querySelector('canvas'), null); assert.equal(page.firstChild.tagName, 'article');
  assert.deepEqual(urls.revoked, ['blob:1']);
});

test('une page illisible retire l’aperçu incomplet et libère le lecteur sans perdre l’original', async () => {
  const { box, page } = context(), state = portablePdf(box, { pageFailure: true });
  await box.avisFiche(page, '3616', 3); await turn();
  const next = page.querySelectorAll('button').find(button => button.attributes['aria-label'] === 'Page suivante');
  await next.dispatch('click'); await turn();
  assert.equal(page.querySelector('canvas'), null); assert.equal(page.querySelector('.avis-pdf-viewer').hidden, true);
  assert.equal(state.destroyed, 1); assert.equal(page.querySelector('.avis-pdf').querySelector('a').href, 'blob:1');
  assert.match(page.querySelector('.avis-erreur').textContent, /aperçu/);
});

test('un changement de largeur pendant un rendu est repris une fois le rendu terminé', async () => {
  const { box, page } = context(), state = portablePdf(box); let resize;
  box.ResizeObserver = class { constructor(callback) { resize = callback; } observe() {} disconnect() {} };
  await box.avisFiche(page, '3616', 3); await turn();
  const rendering = deferred(); state.nextRender = rendering.promise;
  const next = page.querySelectorAll('button').find(button => button.attributes['aria-label'] === 'Page suivante');
  await next.dispatch('click'); await turn();
  page.querySelector('.avis-pdf-page').clientWidth = 250; resize();
  await new Promise(resolve => setTimeout(resolve, 170)); rendering.resolve();
  await new Promise(resolve => setTimeout(resolve, 170));
  assert.equal(page.querySelector('canvas').style.width, '250px'); assert.deepEqual(state.pages, [1, 2, 2]);
});

test('le destinataire du mail est proposé sans sélection automatique ni écriture', async () => {
  const calls = [], bon = fixture('3616'); bon.historique = [{ eventType: 'avis.gmail_source', metadata: { sha256: 'courant' } }];
  const { box, page } = context(async path => { calls.push(path); return { revision: 1, sha256: 'courant', suggestions: [{ email: 'client@example.test', source: 'gmail_to', dateEnvoi: '2026-10-08T13:37:00Z' }], partial: false }; });
  let chosen = null; box.avisDestinatairesGmail(page, bon, 3, email => { chosen = email; }); await turn();
  assert.equal(chosen, null); assert.deepEqual(calls, ['/avis/imports/3616/destinataires-gmail']);
  assert.equal(page.querySelector('strong').textContent, 'client@example.test');
  const use = page.querySelectorAll('button').find(button => button.attributes['aria-label'] === 'Utiliser client@example.test'); await use.dispatch('click');
  assert.equal(chosen, 'client@example.test'); assert.equal(calls.length, 1);
});

test('une réponse de destinataires obsolète ne propose aucune adresse et préserve la saisie', async () => {
  const bon = fixture('3616'); bon.historique = [{ eventType: 'avis.gmail_source', metadata: { sha256: 'courant' } }];
  const { box, page } = context(async () => ({ revision: 2, sha256: 'nouvelle', suggestions: [{ email: 'autre@example.test' }] }));
  box.avisDestinatairesGmail(page, bon, 3, () => assert.fail('stale recipient selected')); await turn();
  assert.equal(page.querySelector('strong'), null); assert.match(page.querySelector('[role=status]')?.textContent || page.querySelector('p').textContent, /bon a changé/);
});

test('sans mail source pour le SHA courant, la fiche ne lance aucune lecture Gmail', async () => {
  const { box, page } = context(async () => assert.fail('unexpected Gmail read')), bon = fixture('3616');
  bon.historique = [{ eventType: 'avis.gmail_source', metadata: { sha256: 'ancienne' } }];
  assert.equal(box.avisDestinatairesGmail(page, bon, 3, () => {}), null); assert.equal(page.children.length, 0);
});

for (const same of [false, true]) test('le choix Gmail ' + (same ? 'conserve le contact dont l’adresse correspond' : 'retire le contact précédent même si l’adresse a déjà été saisie'), async () => {
  const bon = fixture('3616', { client: 'Client fictif', contactId: 'contact-a', email: 'a@example.test' });
  bon.historique = [{ eventType: 'avis.gmail_source', metadata: { sha256: 'courant' } }];
  const proposed = same ? 'a@example.test' : 'b@example.test';
  const { box, page } = context(async path => path.endsWith('/destinataires-gmail') ? { revision: 1, sha256: 'courant', suggestions: [{ email: proposed }], partial: false } : bon);
  await box.avisFiche(page, '3616', 3); await turn();
  const email = page.querySelectorAll('input').find(input => input.type === 'email'); email.value = proposed;
  const select = page.querySelectorAll('select').find(select => select.attributes['aria-label'] === 'Contact à rattacher');
  await page.querySelectorAll('button').find(button => button.attributes['aria-label'] === 'Utiliser ' + proposed).dispatch('click');
  assert.equal(email.value, proposed); assert.equal(select.value, same ? 'contact-a' : '');
});

for (const hash of ['#/clients', '#/demandes']) test(hash + ' reste consultable sans demander les compteurs du tableau de bord', async () => {
  const calls = [], { box, page } = context(async route => { calls.push(route); if (route === '/avis/dashboard') throw Error('compteurs HS'); return { data: [fixture('1')], hasMore: false }; });
  box.location.hash = hash;
  let rendered; box.avisVueListe = (target, rows) => { rendered = rows; }; box.avisVueDemandes = box.avisVueListe;
  await box.avisRoute();
  assert.equal(rendered[0].id, '1'); assert.deepEqual(calls, ['/avis/imports?limit=50&offset=0']); assert.equal(page.attributes['aria-busy'], 'false');
});
test('le tableau de bord demande six bons et ne pagine pas une collection de plusieurs milliers', async () => {
  const calls = [], { box } = context(async route => { calls.push(route); return route === '/avis/dashboard' ? { total: 3000 } : { data: [fixture('1')], hasMore: true, nextOffset: 6 }; });
  let rows; box.avisVueDashboard = (target, stats, data) => { rows = data; };
  await box.avisRoute();
  assert.deepEqual(calls.sort(), ['/avis/dashboard', '/avis/imports?limit=6&offset=0'].sort()); assert.equal(rows.length, 1);
});
test('une panne des compteurs conserve les bons récents et annonce l’erreur locale', async () => {
  const { box, page } = context(async route => { if (route === '/avis/dashboard') throw Error('503'); return { data: [fixture('1')] }; });
  let result; box.avisVueDashboard = (target, stats, rows) => { result = { stats, rows }; };
  await box.avisRoute();
  assert.equal(result.stats, null); assert.equal(result.rows[0].id, '1'); assert.equal(page.querySelector('.avis-erreur').textContent, box.avisErreurs.compteurs_indisponibles);
});
test('la prochaine action propose les travaux confirmés et non préparés avant un nouvel import', () => {
  const { box } = context();
  const action = box.avisProchaineAction({ total: 1, aVerifier: 0, terminees: 1, preparees: 0 }, [fixture('12', { completed: true })]);
  assert.equal(action.type, 'preparer'); assert.equal(action.route, '#/bon/12');
});
test('un bon vérifié mais inachevé reste à suivre avant un nouvel import', () => {
  const { box } = context();
  const action = box.avisProchaineAction({ total: 1, aVerifier: 0, terminees: 0, preparees: 0 }, [fixture('13', { completed: false })]);
  assert.equal(action.type, 'encours'); assert.equal(action.route, '#/bon/13');
});
test('la prochaine action serveur peut désigner un bon hors des six derniers', () => {
  const { box } = context();
  const action = box.avisProchaineAction({ total: 20, nextAction: { type: 'verifier', id: 'ancien', client: 'Client fictif', numeroBon: '42' } }, [fixture('recent', { completed: true })]);
  assert.equal(action.type, 'verifier'); assert.equal(action.route, '#/bon/ancien'); assert.match(action.description, /42/);
});
test('sans identifiant récent, un compteur global conduit à la liste filtrée plutôt qu’à un import', () => {
  const { box } = context();
  const action = box.avisProchaineAction({ total: 20, aVerifier: 1, terminees: 19, preparees: 19 }, [fixture('recent', { completed: true }, {})]);
  assert.equal(action.route, '#/clients'); assert.equal(action.filter, 'verifier');
});
test('la fiche complète et son formulaire apparaissent sans attendre le téléchargement PDF', async () => {
  const pending = deferred(), { box, page } = context(async () => fixture('3616'), () => pending.promise);
  await box.avisFiche(page, '3616', 3);
  assert.ok(page.querySelector('.avis-detail-grid')); assert.ok(page.querySelector('form')); assert.equal(page.querySelector('button[type=submit]').textContent, 'Enregistrer la vérification');
  assert.match(page.querySelector('.avis-pdf-facts').textContent, /1 page/);
  assert.equal(page.querySelector('iframe').hidden, true);
  pending.resolve({ ok: false }); await turn();
  assert.ok(page.querySelector('form')); assert.equal(page.querySelector('.avis-erreur').textContent, box.avisErreurs.pdf_indisponible);
  const retry = page.querySelector('.avis-pdf').querySelectorAll('button').find(button => button.textContent === 'Réessayer le PDF'); assert.equal(retry.hidden, false);
});
test('une erreur PDF peut être reprise sans perdre les corrections saisies', async () => {
  let attempt = 0; const { box, page, urls } = context(async () => fixture('3616'), async () => ++attempt === 1 ? { ok: false } : { ok: true, blob: async () => new Blob(['%PDF-fictif']) });
  await box.avisFiche(page, '3616', 3); await turn();
  const input = page.querySelector('form').querySelector('input'); input.value = 'Correction conservée';
  const retry = page.querySelector('.avis-pdf').querySelectorAll('button').find(button => button.textContent === 'Réessayer le PDF'); await retry.dispatch('click'); await turn();
  assert.equal(input.value, 'Correction conservée'); assert.equal(page.querySelector('iframe').src, 'blob:1'); assert.equal(retry.hidden, true); assert.equal(urls.made.length, 1);
});
test('le résultat PDF d’une fiche quittée ne crée aucune URL et ne remplace pas la nouvelle fiche', async () => {
  const pending = deferred(), { box, page, urls } = context(async () => fixture('3616'), () => pending.promise);
  await box.avisFiche(page, '3616', 3);
  box.Avis.routeGeneration++; box.avisAnnulerPdf(); page.replaceChildren(new Element('article'));
  pending.resolve({ ok: true, blob: async () => new Blob(['%PDF-fictif']) }); await turn();
  assert.equal(urls.made.length, 0); assert.equal(page.firstChild.tagName, 'article'); assert.equal(box.Avis.original, null);
});
test('la sélection d’une variante annule le PDF lent précédent et ne conserve que la dernière URL', async () => {
  const requests = []; const { box, page, urls } = context(undefined, () => { const request = deferred(); requests.push(request); return request.promise; });
  const bon = fixture('3616'); bon.fichiers.push({ sha256: 'ancienne', createdAt: '2026-10-10' });
  const original = box.avisOriginal(page, bon, '3616', 3), select = original.querySelector('select');
  select.value = 'ancienne'; await select.dispatch('change');
  requests[1].resolve({ ok: true, blob: async () => new Blob(['ancienne']) }); await turn();
  requests[0].resolve({ ok: true, blob: async () => new Blob(['courant']) }); await turn();
  assert.deepEqual(urls.made, ['blob:1']); assert.equal(original.querySelector('iframe').src, 'blob:1');
  box.avisAnnulerPdf(); assert.deepEqual(urls.revoked, ['blob:1']); assert.equal(box.Avis.original, null);
});
test('la démonstration affiche Clients et le parcours connecté renomme cette même entrée', async () => {
  const html = fs.readFileSync(path.join(__dirname, '../yooza-avis/index.html'), 'utf8'); assert.match(html, /data-route="\/clients"[\s\S]*?<span class="nav-label">Clients<\/span>/);
  const nav = new Element('button'), label = new Element('span'); nav.dataset.route = '/clients'; label.className = 'nav-label'; label.textContent = 'Clients'; nav.append(label);
  const { box } = context(undefined, async () => ({ ok: true, json: async () => ({ mode: 'local' }) }));
  box.document.body = new Element('body'); box.document.querySelectorAll = () => [nav];
  assert.equal(await box.initParcoursAvis(), true); assert.equal(label.textContent, 'Bons et interventions');
});

test('l’import Gmail ne se lance qu’une fois et transmet le curseur opaque pour continuer', async () => {
  const pending = deferred(), calls = [], { box, page } = context(async (route, options) => { calls.push({ route, body: JSON.parse(options.body) }); return pending.promise; });
  const panel = box.avisImportGmail(page, 3), button = panel.querySelector('button');
  const first = button.dispatch('click'); await button.dispatch('click'); assert.equal(calls.length, 1); assert.deepEqual(calls[0].body, {});
  pending.resolve({ importes: [{ importId: 'fictif' }], doublons: [], refuses: [], erreurs: [], messagesLus: 2, hasMore: true, nextCursor: 'opaque-fictif' }); await first; await turn();
  assert.equal(box.Avis.gmailImport.cursor, 'opaque-fictif'); assert.equal(box.Avis.gmailImport.busy, false); assert.match(button.textContent, /Continuer/);
  box.avisApi = async (route, options) => { calls.push({ route, body: JSON.parse(options.body) }); return { importes: [], doublons: [], refuses: [], erreurs: [], messagesLus: 1, hasMore: false }; };
  await button.dispatch('click'); await turn(); assert.deepEqual(calls[1].body, { pageToken: 'opaque-fictif' }); assert.equal(box.Avis.gmailImport.lots.length, 2);
});
test('une collecte terminée après navigation conserve sa reprise sans écraser une fiche', async () => {
  const pending = deferred(), { box, page } = context(() => pending.promise); let routes = 0; box.handleRoute = () => routes++;
  const panel = box.avisImportGmail(page, 3); const first = panel.querySelector('button').dispatch('click');
  box.Avis.routeGeneration++; box.location.hash = '#/bon/nouveau'; page.replaceChildren(new Element('article'));
  pending.resolve({ importes: [], doublons: [], refuses: [], erreurs: [], messagesLus: 1, hasMore: true, nextCursor: 'reprise-fictive' }); await first; await turn();
  assert.equal(box.Avis.gmailImport.cursor, 'reprise-fictive'); assert.equal(routes, 0); assert.equal(page.firstChild.tagName, 'article');
});
test('Teamleader demande un choix de client puis un choix explicite entre ses e-mails', async () => {
  const candidate = { type: 'company', id: 'crm-fictif', name: 'Société fictive', email: null, emails: [{ address: 'a@example.test' }, { address: 'b@example.test' }], active: true }, calls = [];
  const { box, page } = context(async (route, options) => { calls.push({ route, options }); return route.includes('/teamleader/contacts') ? { candidats: [candidate], pages: {} } : { contact: { id: 'local-fictif', name: candidate.name, email: 'b@example.test' }, provenance: { type: 'company', id: candidate.id } }; });
  let selected; const panel = box.avisRechercheTeamleader(page, fixture('1'), 3, result => { selected = result; });
  await panel.querySelector('button').dispatch('click'); await turn(); assert.equal(calls.length, 1); assert.equal(selected, undefined);
  const clients = panel.querySelector('select'); clients.value = '0'; await clients.dispatch('change');
  const email = panel.querySelector('.avis-crm-choice').querySelector('select'), use = panel.querySelector('.avis-crm-choice').querySelector('button');
  assert.equal(use.disabled, true); await use.dispatch('click'); assert.equal(calls.length, 1);
  email.value = 'b@example.test'; await email.dispatch('change'); assert.equal(use.disabled, false); await use.dispatch('click'); await turn();
  assert.equal(selected.contact.id, 'local-fictif'); assert.deepEqual(JSON.parse(calls[1].options.body), { revision: 1, type: 'company', id: 'crm-fictif', email: 'b@example.test' });
});
test('le choix Teamleader remplit la fiche mais ne confirme jamais les travaux', async () => {
  const bon = fixture('1'), candidate = { type: 'contact', id: 'crm-fictif', name: 'Personne fictive', emails: [{ address: 'test@yooza.be' }], active: true };
  const { box, page } = context(async route => route === '/avis/imports/1' ? bon : route.includes('/teamleader/contacts') ? { candidats: [candidate], pages: {} } : { contact: { id: 'local-fictif', name: candidate.name, email: 'test@yooza.be', phone: '0000' }, provenance: { type: 'contact', id: candidate.id } });
  await box.avisFiche(page, '1', 3);
  const picker = page.querySelector('.avis-crm-picker'); await picker.querySelector('button').dispatch('click'); await turn();
  picker.querySelector('select').value = '0'; await picker.querySelector('select').dispatch('change'); await picker.querySelector('.avis-crm-choice').querySelector('button').dispatch('click'); await turn();
  const form = page.querySelector('form'); assert.equal(form.querySelector('input').value, candidate.name); assert.equal(form.querySelector('input[type=email]').value, 'test@yooza.be'); assert.equal(form.querySelector('.avis-case').querySelector('input').checked, false);
});
function sendPreview() { return { bonId: '1', revision: 1, fingerprint: 'a'.repeat(64), from: 'direction@yooza.be', message: { to: 'test@yooza.be', subject: 'Objet serveur fictif', body: 'Message serveur fictif' }, configured: true, confirmationRequired: true }; }
test('l’envoi exige l’aperçu exact et la confirmation, puis résiste à deux clics', async () => {
  const pending = deferred(), calls = [], { box, page } = context(async (route, options) => { calls.push({ route, options }); return route.endsWith('/apercu') ? sendPreview() : pending.promise; });
  const saved = new Element('div'); page.append(saved); const panel = box.avisEnvoi(page, fixture('1'), 3, saved);
  assert.equal(calls.length, 0); assert.equal(panel.querySelectorAll('button').length, 1);
  await panel.querySelector('button').dispatch('click'); await turn();
  assert.equal(saved.querySelector('pre').textContent, 'Message serveur fictif');
  const checkbox = panel.querySelector('input'), send = panel.querySelectorAll('button').find(button => button.textContent === 'Envoyer cet e-mail');
  assert.equal(send.disabled, true); await send.dispatch('click'); assert.equal(calls.length, 1);
  checkbox.checked = true; await checkbox.dispatch('change'); const first = send.dispatch('click'); const second = send.dispatch('click'); assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(calls[1].options.body), { revision: 1, fingerprint: 'a'.repeat(64), confirmSend: true });
  pending.resolve({ state: 'sent', envoiEffectue: true, verification: 'verified' }); await Promise.all([first, second]); await turn();
  assert.equal(panel.querySelector('.avis-send-state').textContent, 'E-mail envoyé et vérifié'); await send.dispatch('click'); assert.equal(calls.length, 2);
});
test('une réponse sent non vérifiée est présentée comme incertaine et ne propose aucune relance', async () => {
  const calls = [], { box, page } = context(async (route, options) => { calls.push({ route, options }); return { state: 'sent', envoiEffectue: true, verification: 'unverified' }; });
  const saved = new Element('div'), panel = box.avisEnvoi(page, fixture('1'), 3, saved); await panel.querySelector('button').dispatch('click'); await turn();
  assert.match(panel.querySelector('.avis-send-state').textContent, /incertain/); assert.equal(panel.querySelector('input'), null); assert.equal(calls.length, 1); assert.equal(calls[0].options, undefined);
});
test('un échec réseau après confirmation ne permet qu’une lecture de l’état, sans second POST', async () => {
  let sends = 0; const { box, page } = context(async route => route.endsWith('/apercu') ? sendPreview() : (sends++, Promise.reject(Error('service_indisponible'))));
  const saved = new Element('div'), panel = box.avisEnvoi(page, fixture('1'), 3, saved); await panel.querySelector('button').dispatch('click'); await turn();
  const checkbox = panel.querySelector('input'); checkbox.checked = true; await checkbox.dispatch('change'); await panel.querySelectorAll('button').find(button => button.textContent === 'Envoyer cet e-mail').dispatch('click'); await turn();
  await panel.querySelectorAll('button').find(button => button.textContent === 'Vérifier l’état de l’envoi').dispatch('click'); await turn();
  const send = panel.querySelectorAll('button').find(button => button.textContent === 'Envoyer cet e-mail'); assert.equal(send.disabled, true); await send.dispatch('click'); assert.equal(sends, 1);
});
test('un aperçu arrivé après navigation ne remplace pas le message de la nouvelle fiche', async () => {
  const pending = deferred(), { box, page } = context(() => pending.promise), saved = new Element('div'); saved.textContent = 'Message actuel';
  const panel = box.avisEnvoi(page, fixture('1'), 3, saved); await panel.querySelector('button').dispatch('click'); box.Avis.routeGeneration++; pending.resolve(sendPreview()); await turn();
  assert.equal(saved.textContent, 'Message actuel'); assert.equal(panel.querySelector('input'), null);
});
test('le pilote bloque un destinataire externe même si la case est modifiée par un script', async () => {
  const calls = [], { box, page } = context(async (route, options) => { calls.push({ route, options }); const preview = sendPreview(); preview.message.to = 'client@example.test'; return preview; });
  const saved = new Element('div'), panel = box.avisEnvoi(page, fixture('1'), 3, saved); await panel.querySelector('button').dispatch('click'); await turn();
  const checkbox = panel.querySelector('input'); assert.equal(checkbox.disabled, true); checkbox.checked = true; await checkbox.dispatch('change');
  const send = panel.querySelectorAll('button').find(button => button.textContent === 'Envoyer cet e-mail'); assert.equal(send.disabled, true); await send.dispatch('click'); assert.equal(calls.length, 1);
});
test('une fiche déjà envoyée se recharge sans erreur et affiche sa preuve sans proposer un nouvel envoi', async () => {
  const bon = fixture('1', { completed: true, email: 'test@yooza.be' }, { message: sendPreview().message, sendAttempt: { state: 'sent', verified: true, messageId: 'fictif' } });
  const { box, page } = context(async () => bon); await box.avisFiche(page, '1', 3);
  assert.equal(page.querySelector('.avis-send-state').textContent, 'E-mail envoyé et vérifié'); assert.equal(page.querySelector('.avis-badge-envoye').textContent, 'Envoyé et vérifié');
  assert.equal(page.querySelectorAll('button').some(button => button.textContent === 'Envoyer cet e-mail'), false);
  const prepare = page.querySelectorAll('button').find(button => button.textContent === 'Préparer la demande'); assert.equal(prepare.disabled, true);
});
test('les préparations envoyées restent incluses dans le compteur Préparés et se filtrent par résultat vérifié', () => {
  const { box } = context(), bons = [fixture('1', { completed: true }, { sendAttempt: { state: 'sent', verified: true } }), fixture('2', { completed: true }, { sendAttempt: { state: 'uncertain', verified: false } }), fixture('3', { completed: true }, {})];
  assert.equal(box.avisFiltrerBons(bons, '', 'prepare').length, 3);
  assert.deepEqual(Array.from(box.avisFiltrerBons(bons, '', 'envoye'), b => b.id), ['1']); assert.deepEqual(Array.from(box.avisFiltrerBons(bons, '', 'envoi'), b => b.id), ['2']);
});
test('un échec Gmail après navigation réactive le panneau courant et y annonce l’erreur sans perdre le curseur', async () => {
  const pending = deferred(), { box, page } = context(() => pending.promise); box.Avis.gmailImport.cursor = 'reprise-fictive';
  const ancien = box.avisImportGmail(page, 3), first = ancien.querySelector('button').dispatch('click');
  box.Avis.routeGeneration = 4; box.location.hash = '#/clients'; page.replaceChildren(); let current = box.avisImportGmail(page, 4); assert.equal(current.querySelector('button').disabled, true);
  box.handleRoute = () => { page.replaceChildren(); current = box.avisImportGmail(page, box.Avis.routeGeneration); };
  pending.reject(Error('service_indisponible')); await first; await turn();
  assert.equal(current.querySelector('button').disabled, false); assert.equal(current.querySelector('button').textContent, 'Continuer l’import'); assert.equal(current.querySelector('.avis-erreur').textContent, box.avisErreurs.service_indisponible); assert.equal(box.Avis.gmailImport.cursor, 'reprise-fictive');
});
test('le rattachement CRM verrouille les choix et ignore une sélection modifiée pendant sa réponse lente', async () => {
  const pending = deferred(), candidates = ['A', 'B'].map(name => ({ type: 'contact', id: name, name: 'Client fictif ' + name, emails: [{ address: name.toLowerCase() + '@example.test' }], active: true }));
  const { box, page } = context(async route => route.includes('/teamleader/contacts') ? { candidats: candidates, pages: {} } : pending.promise); let selected;
  const panel = box.avisRechercheTeamleader(page, fixture('1'), 3, result => { selected = result; }); await panel.querySelector('button').dispatch('click'); await turn();
  const select = panel.querySelector('select'); select.value = '0'; await select.dispatch('change');
  const mail = panel.querySelector('.avis-crm-choice').querySelector('select'), use = panel.querySelector('.avis-crm-choice').querySelector('button'), first = use.dispatch('click');
  assert.equal(select.disabled, true); assert.equal(mail.disabled, true); assert.equal(panel.querySelector('input').disabled, true);
  select.value = '1'; await select.dispatch('change'); pending.resolve({ contact: { id: 'local-A', name: candidates[0].name, email: 'a@example.test' } }); await first; await turn();
  assert.equal(selected, undefined); assert.equal(select.disabled, false); assert.equal(mail.disabled, false); assert.equal(panel.querySelector('input').disabled, false);
});
test('un client CRM inactif ne peut pas être rattaché même par un clic programmatique', async () => {
  let calls = 0; const { box, page } = context(async () => { calls++; return { candidats: [{ type: 'company', id: 'inactif', name: 'Société fictive inactive', emails: [{ address: 'test@example.test' }], active: false }], pages: {} }; });
  const panel = box.avisRechercheTeamleader(page, fixture('1'), 3, () => { throw Error('ne doit pas être appelé'); }); await panel.querySelector('button').dispatch('click'); await turn();
  panel.querySelector('select').value = '0'; await panel.querySelector('select').dispatch('change'); const use = panel.querySelector('.avis-crm-choice').querySelector('button'); assert.equal(use.disabled, true); await use.dispatch('click'); assert.equal(calls, 1);
});
test('le mode privé démarre sans client Google ni jeton et affiche son badge', async () => {
  const cfg = { mode: 'tailscale', apiBase: '/api/v1', confirmationEnvoiRequise: true, identity: { email: 'test@yooza.be' }, capabilities: { gmail: true, teamleader: true, envoi: false } };
  const { box } = context(undefined, async () => ({ ok: true, status: 200, json: async () => cfg })), badge = new Element('span'); box.document.body = new Element('body'); box.document.querySelector = selector => selector === '.version-label' ? badge : null; box.Avis.jeton = 'ancien-jeton';
  assert.equal(await box.initParcoursAvis(), true); assert.equal(box.Avis.mode, 'tailscale'); assert.equal(box.Avis.jeton, null); assert.equal(badge.textContent, 'Accès privé'); assert.equal(box.document.body.classList.contains('avis-connected'), true);
});
test('la route privée ouvre les données sans lancer de connexion Google', async () => {
  const calls = [], { box } = context(async route => { calls.push(route); return { data: [fixture('1')], hasMore: false }; }); box.Avis.mode = 'tailscale'; box.location.hash = '#/clients';
  box.avisConnexion = () => { throw Error('connexion Google inattendue'); }; let rendered = false; box.avisVueListe = () => { rendered = true; };
  await box.avisRoute(); assert.equal(rendered, true); assert.deepEqual(calls, ['/avis/imports?limit=50&offset=0']);
});
test('les appels privés ne fabriquent aucun en-tête d’identité ni Authorization Google', async () => {
  let request; const { box, networkApi } = context(undefined, async (url, options) => { request = { url, options }; return { ok: true, json: async () => ({ data: { total: 0 } }) }; }); box.Avis.mode = 'tailscale'; box.Avis.jeton = 'ne-pas-utiliser';
  await networkApi('/avis/dashboard'); assert.equal(request.url, '/api/v1/avis/dashboard'); assert.equal(request.options.headers.Authorization, undefined); assert.equal(Object.keys(request.options.headers).some(name => /tailscale|identity|user-login/i.test(name)), false);
});
test('le lecteur PDF privé utilise la même origine sans fabriquer d’identité', async () => {
  let request; const { box, page } = context(undefined, async (url, options) => { request = { url, options }; return { ok: true, blob: async () => new Blob(['%PDF-fictif']) }; }); box.Avis.mode = 'tailscale'; box.Avis.jeton = 'ne-pas-utiliser';
  box.avisOriginal(page, fixture('1'), '1', 3); await turn(); assert.equal(request.options.headers.Authorization, undefined); assert.equal(Object.keys(request.options.headers).some(name => /tailscale/i.test(name)), false); assert.match(request.url, /^\/api\/v1\/avis\/imports/);
});
test('un 401 privé annonce la reconnexion sans provoquer de boucle de routes', async () => {
  const { box, networkApi } = context(undefined, async () => ({ ok: false, status: 401, json: async () => ({ error: { code: 'unauthenticated' } }) })); box.Avis.mode = 'tailscale'; let routes = 0; box.handleRoute = () => routes++;
  await assert.rejects(networkApi('/avis/dashboard'), { message: 'acces_prive_requis' }); assert.equal(routes, 0);
});
test('le mode Google conserve le jeton Authorization et sa reconnexion habituelle', async () => {
  let request; const { box, networkApi } = context(undefined, async (url, options) => { request = options; return { ok: false, status: 401, json: async () => ({ error: { code: 'unauthenticated' } }) }; }); box.Avis.mode = 'google'; box.Avis.jeton = 'jeton-fictif'; let routes = 0; box.handleRoute = () => routes++;
  await assert.rejects(networkApi('/avis/dashboard'), { message: 'unauthenticated' }); assert.equal(request.headers.Authorization, 'Bearer jeton-fictif'); assert.equal(box.Avis.jeton, null); assert.equal(routes, 1);
});
test('les modes local et démonstration conservent leur initialisation', async () => {
  const local = context(undefined, async () => ({ ok: true, status: 200, json: async () => ({ mode: 'local' }) })); local.box.document.body = new Element('body'); assert.equal(await local.box.initParcoursAvis(), true); assert.equal(local.box.Avis.mode, 'local');
  const demo = context(undefined, async () => ({ ok: false, status: 404 })); assert.equal(await demo.box.initParcoursAvis(), false); assert.equal(demo.box.Avis.mode, 'demo');
});
test('les capacités désactivées expliquent le manque de connexion et bloquent les actions', async () => {
  let calls = 0; const { box, page } = context(async () => { calls++; throw Error('appel inattendu'); }); box.Avis.config.capabilities = { gmail: false, teamleader: false, envoi: false };
  const gmail = box.avisImportGmail(page, 3), crm = box.avisRechercheTeamleader(page, fixture('1'), 3, () => {}), envoi = box.avisEnvoi(page, fixture('1'), 3, new Element('div'));
  for (const panel of [gmail, crm, envoi]) { const button = panel.querySelector('button'); assert.equal(button.disabled, true); assert.ok(panel.querySelector('.avis-erreur')); await button.dispatch('click'); }
  assert.equal(calls, 0);
});
test('les réglages privés distinguent capacités configurées, absentes et non connues', async () => {
  const { box, page } = context(async () => ({ reviewUrl: 'https://g.page/r/exemple/review' })); box.Avis.mode = 'tailscale'; box.Avis.config.identity = { email: 'test@yooza.be' }; box.Avis.config.capabilities = { gmail: true, teamleader: false };
  await box.avisReglages(page, 3); const rows = page.querySelectorAll('.avis-capability'), map = Object.fromEntries(rows.map(row => [row.firstChild.textContent, row.lastChild.textContent]));
  assert.equal(map['Import Gmail'], 'Sur demande'); assert.equal(map['Contacts Teamleader'], 'À configurer'); assert.equal(map['Envoi confirmé'], 'À vérifier sur le serveur');
  assert.equal(rows.find(row => row.firstChild.textContent === 'Contacts Teamleader').lastChild.classList.contains('is-available'), false);
  assert.ok(page.querySelectorAll('p').some(p => p.textContent === 'Compte connecté : test@yooza.be'));
});

test('les adresses externes restent bloquées sans autorisation serveur booléenne explicite', async () => {
  for (const permission of [undefined, false, 'true']) {
    const calls = [], preview = sendPreview(); preview.message.to = 'client@example.test'; preview.recipientAllowed = permission;
    const { box, page } = context(async (route, options) => { calls.push({ route, options }); return preview; });
    const panel = box.avisEnvoi(page, fixture('1'), 3, new Element('div'));
    await panel.querySelector('button').dispatch('click'); await turn();
    const checkbox = panel.querySelector('input'), send = panel.querySelectorAll('button').find(b => b.textContent === 'Envoyer cet e-mail');
    assert.equal(checkbox.disabled, true); checkbox.checked = true; await checkbox.dispatch('change'); await send.dispatch('click');
    assert.equal(send.disabled, true); assert.equal(calls.length, 1);
  }
});
test('l’autorisation serveur externe exige encore un aperçu, une confirmation et un seul envoi', async () => {
  const preview = sendPreview(); preview.message.to = 'client@example.test'; preview.recipientAllowed = true;
  const pending = deferred(), calls = [], { box, page } = context(async (route, options) => { calls.push({route,options}); return route.endsWith('/apercu') ? preview : pending.promise; });
  const panel = box.avisEnvoi(page, fixture('1'), 3, new Element('div')); assert.equal(calls.length, 0);
  await panel.querySelector('button').dispatch('click'); await turn();
  const checkbox = panel.querySelector('input'), send = panel.querySelectorAll('button').find(b => b.textContent === 'Envoyer cet e-mail');
  assert.equal(checkbox.disabled, false); assert.equal(send.disabled, true); await send.dispatch('click'); assert.equal(calls.length, 1);
  checkbox.checked = true; await checkbox.dispatch('change'); assert.equal(send.disabled, false);
  const first = send.dispatch('click'), second = send.dispatch('click'); assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(calls[1].options.body), { revision: 1, fingerprint: preview.fingerprint, confirmSend: true });
  pending.resolve({state:'sent', envoiEffectue:true, verification:'verified'}); await Promise.all([first,second]);
  assert.equal(panel.querySelector('.avis-send-state').textContent, 'E-mail envoyé et vérifié');
});
