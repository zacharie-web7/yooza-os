const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function context(api) {
  const box = { Avis: { routeGeneration: 3 }, avisFiche() {}, avisReglages() {}, avisApi: api };
  vm.createContext(box);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../yooza-avis/js/interface.js'), 'utf8'), box);
  return box;
}
function bon(id, name, validation, preparation) {
  return { id, validation, preparation, extraction: { lecture: { numeroBon: id, details: { client: { nom: name }, prestations: [{ description: 'Moteur évaporateur remplacé' }] } } } };
}
test('la recherche retrouve les accents, les travaux et les coordonnées corrigées', () => {
  const ui = context();
  const rows = [bon('3616', 'Café des Tilleuls', { email: 'avis@example.test', client: 'Atelier du Pré' }), bon('3617', 'Maison Rivage')];
  assert.deepEqual(Array.from(ui.avisFiltrerBons(rows, 'ATELIER DU PRE', 'tous'), x => x.id), ['3616']);
  assert.deepEqual(Array.from(ui.avisFiltrerBons(rows, 'example.test', 'tous'), x => x.id), ['3616']);
  assert.equal(ui.avisFiltrerBons(rows, 'evaporateur', 'tous').length, 2);
  assert.deepEqual(Array.from(ui.avisFiltrerBons(rows, '3617', 'verifier'), x => x.id), ['3617']);
});
test('fin confirmée inclut les demandes préparées sans classer les travaux en cours comme terminés', () => {
  const ui = context();
  const rows = [bon('1', 'A', { completed: true }, { message: {} }), bon('2', 'B', { completed: true }), bon('3', 'C', { completed: false }), bon('4', 'D')];
  assert.deepEqual(Array.from(ui.avisFiltrerBons(rows, '', 'termine'), x => x.id), ['1', '2']);
  assert.deepEqual(Array.from(ui.avisFiltrerBons(rows, '', 'prepare'), x => x.id), ['1']);
  assert.deepEqual(Array.from(ui.avisFiltrerBons(rows, '', 'encours'), x => x.id), ['3']);
  assert.deepEqual(Array.from(ui.avisFiltrerBons(rows, '', 'verifier'), x => x.id), ['4']);
});
test('un chargement de liste périmé ne remplace pas les données du nouvel écran', async () => {
  let ui;
  ui = context(async () => { ui.Avis.routeGeneration = 4; return { data: [bon('1', 'A')], hasMore: false }; });
  ui.Avis.bons = [{ id: 'courant' }];
  assert.equal(await ui.avisChargerBons(3), null);
  assert.equal(ui.Avis.bons[0].id, 'courant');
});
test('une pagination sans progression arrête le chargement et laisse la liste intacte', async () => {
  const ui = context(async () => ({ data: [], hasMore: true, nextOffset: 0 }));
  ui.Avis.bons = [{ id: 'courant' }];
  await assert.rejects(ui.avisChargerBons(3), { message: 'pagination_invalide' });
  assert.equal(ui.Avis.bons[0].id, 'courant');
});
