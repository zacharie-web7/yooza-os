const assert = require('node:assert/strict');
const test = require('node:test');

const { createHarness } = require('./helpers/v1-harness.cjs');

function renderRoute(hash) {
  const app = createHarness({ hash });
  app.evaluate('initAppState(); handleRoute()');
  return app;
}

test('l’ouverture sans hash affiche le dashboard', () => {
  const app = createHarness();
  app.evaluate('initApp()');

  assert.equal(app.element('page-title').textContent, 'Tableau de bord');
  assert.match(app.element('page-content').innerHTML, /Dernières interventions/);
  assert.match(app.element('page-content').innerHTML, /Avis Google/);
});

test('la route #/dashboard affiche les KPI et les données de démonstration', () => {
  const app = renderRoute('#/dashboard');
  const html = app.element('page-content').innerHTML;

  assert.equal(app.element('page-title').textContent, 'Tableau de bord');
  assert.match(html, /En attente d'envoi/);
  assert.match(html, /Martin Dupont/);
  assert.ok(app.document.navItems[0].classList.contains('active'));
});

test('la route #/clients affiche les dix clients triés', () => {
  const app = renderRoute('#/clients');
  const html = app.element('page-content').innerHTML;
  const orderedNames = JSON.parse(
    app.evaluate('JSON.stringify(getFilteredClients().map(client => client.nom))')
  );

  assert.equal(app.element('page-title').textContent, 'Clients');
  assert.match(html, /10 clients/);
  assert.match(html, /Laurent Chevalier/);
  assert.equal(orderedNames[0], 'Laurent Chevalier');
  assert.equal(orderedNames.at(-1), 'Éric Fontaine');
  assert.ok(app.document.navItems[1].classList.contains('active'));
});

test('la recherche et le filtre de statut conservent leur comportement', () => {
  const app = renderRoute('#/clients');

  app.evaluate('handleSearch("laurent")');
  let names = JSON.parse(
    app.evaluate('JSON.stringify(getFilteredClients().map(client => client.nom))')
  );
  assert.deepEqual(names, ['Laurent Chevalier']);

  app.evaluate('handleSearch(""); handleFilterStatut(STATUS.RECEIVED)');
  names = JSON.parse(
    app.evaluate('JSON.stringify(getFilteredClients().map(client => client.nom))')
  );
  assert.equal(names.length, 4);
  assert.equal(app.evaluate('getFilteredClients().every(client => client.statut === STATUS.RECEIVED)'), true);
});

test('la route d’une fiche client affiche ses données et sa progression', () => {
  const app = renderRoute('#/client/1');
  const html = app.element('page-content').innerHTML;

  assert.equal(app.element('page-title').textContent, 'Fiche client');
  assert.match(html, /Martin Dupont/);
  assert.match(html, /Boulangerie Dupont/);
  assert.match(html, /Intervention terminée/);
  assert.match(html, /Simuler une demande d'avis/);
  assert.ok(app.document.navItems[1].classList.contains('active'));
});

test('la route #/settings affiche les réglages et branche l’aperçu', () => {
  const app = renderRoute('#/settings');
  const html = app.element('page-content').innerHTML;

  assert.equal(app.element('page-title').textContent, 'Réglages');
  assert.match(html, /Lien Google Avis/);
  assert.match(html, /Canal d'envoi/);
  assert.match(html, /Modèle de message/);
  assert.ok(app.element('modele-message').events.has('input'));
  assert.ok(app.document.navItems[2].classList.contains('active'));
});

test('une route inconnue revient temporairement au dashboard', () => {
  const app = renderRoute('#/route-inconnue');

  assert.equal(app.element('page-title').textContent, 'Tableau de bord');
  assert.match(app.element('page-content').innerHTML, /Dernières interventions/);
  assert.equal(app.evaluate('AppState.currentRoute'), '#/route-inconnue');
});

test('les données client et réglages dangereuses sont échappées dans le rendu', () => {
  const app = createHarness();
  app.evaluate('initAppState()');
  app.context.__dangerousName = '<img src=x onerror=alert(1)>';
  app.context.__dangerousTemplate = '</textarea><img src=x onerror=alert(1)>';
  app.evaluate(
    'AppState.clients[0].nom = __dangerousName; ' +
    'AppState.settings.modeleMessage = __dangerousTemplate; ' +
    'renderClients(document.getElementById("page-content"))'
  );

  const clientsHtml = app.element('page-content').innerHTML;
  assert.doesNotMatch(clientsHtml, /<img src=x onerror=/);
  assert.match(clientsHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);

  app.evaluate('renderSettings(document.getElementById("page-content"))');
  const settingsHtml = app.element('page-content').innerHTML;
  assert.doesNotMatch(settingsHtml, /<\/textarea><img/);
  assert.match(settingsHtml, /&lt;\/textarea&gt;&lt;img/);
});
