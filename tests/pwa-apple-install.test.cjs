const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function browser(options = {}) {
  const events = {}, media = { matches: !!options.displayStandalone };
  const elements = {};
  const document = {
    activeElement: null,
    getElementById: id => elements[id] || null,
  };
  function element(id) {
    const classes = new Set(), attributes = {};
    return elements[id] = {
      hidden: false,
      classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) },
      setAttribute: (key, value) => { attributes[key] = value; },
      getAttribute: key => attributes[key],
      hasAttribute: key => Object.hasOwn(attributes, key),
      focus() { document.activeElement = this; },
    };
  }
  const button = element('install-app-button'); button.classList.add('is-hidden');
  const help = element('install-app-help'); help.hidden = true;
  const title = element('install-app-help-title'), close = element('close');
  help.contains = node => node === title || node === close;
  const note = element('install-app-private-note'); note.hidden = true;
  media.addEventListener = (_type, listener) => { media.changed = listener; };
  const box = {
    document, navigator: { userAgent: options.userAgent || 'Android', platform: options.platform || 'Linux', maxTouchPoints: options.touch || 0, standalone: !!options.iosStandalone },
    matchMedia: () => media,
    addEventListener: (type, listener) => { events[type] = listener; },
    Avis: { mode: options.mode || 'tailscale' }, Promise,
  };
  box.window = box;
  vm.createContext(box);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../yooza-avis/js/app.js'), 'utf8'), box);
  const toasts = []; box.showToast = (...args) => toasts.push(args);
  box.initPwa();
  return { box, button, help, title, close, note, events, media, document, toasts };
}

test('le bouton Apple est visible sans invite native, y compris sur iPad en mode bureau', () => {
  for (const options of [
    { userAgent: 'Mozilla iPhone Safari' }, { userAgent: 'Mozilla iPad Safari' },
    { userAgent: 'Mozilla iPod Safari' }, { userAgent: 'Mozilla Macintosh Safari', platform: 'MacIntel', touch: 5 },
  ]) {
    const { button } = browser(options);
    assert.equal(button.classList.contains('is-hidden'), false);
    assert.equal(button.getAttribute('aria-controls'), 'install-app-help');
    assert.equal(button.getAttribute('aria-expanded'), 'false');
  }
  assert.equal(browser({ userAgent: 'Mozilla Macintosh Safari', platform: 'MacIntel' }).button.classList.contains('is-hidden'), true);
  assert.equal(browser().button.classList.contains('is-hidden'), true);
});

test('l’aide Apple reste ouverte, se ferme au clavier et rend le focus au bouton', () => {
  const { box, button, help, title, close, note, events, document } = browser({ userAgent: 'iPhone' });
  box.installYoozaApp();
  assert.equal(help.hidden, false); assert.equal(note.hidden, false);
  assert.equal(button.getAttribute('aria-expanded'), 'true'); assert.equal(document.activeElement, title);
  close.focus(); let prevented = false;
  events.keydown({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(help.hidden, true);
  assert.equal(document.activeElement, button); assert.equal(button.getAttribute('aria-expanded'), 'false');
  box.installYoozaApp(); box.installYoozaApp(); assert.equal(help.hidden, true);
});

test('l’aide publique ne demande pas Tailscale et Échap respecte le focus hors de l’aide', () => {
  const { box, button, help, note, events } = browser({ userAgent: 'iPhone', mode: 'demo' });
  box.installYoozaApp(); assert.equal(note.hidden, true); button.focus();
  events.keydown({ key: 'Escape', preventDefault() { throw Error('Échap hors région capturé'); } });
  assert.equal(help.hidden, false);
});

test('les deux signaux de mode installé masquent le bouton Apple et empêchent son ouverture', () => {
  for (const installed of [{ iosStandalone: true }, { displayStandalone: true }]) {
    const { box, button, help, events } = browser({ userAgent: 'iPhone', ...installed });
    assert.equal(button.classList.contains('is-hidden'), true);
    box.installYoozaApp(); assert.equal(help.hidden, true);
    events.beforeinstallprompt({ preventDefault() { throw Error('Invite capturée en mode installé'); } });
    assert.equal(button.classList.contains('is-hidden'), true);
  }
});

test('le passage en mode installé ferme une aide ouverte et ne focalise pas le bouton masqué', () => {
  const { box, button, help, media, document } = browser({ userAgent: 'iPhone' });
  box.installYoozaApp(); media.matches = true; media.changed();
  assert.equal(help.hidden, true); assert.equal(button.classList.contains('is-hidden'), true);
  assert.notEqual(document.activeElement, button);
});

test('Android conserve l’invite native, appelée une seule fois dans le clic utilisateur', async () => {
  for (const outcome of ['accepted', 'dismissed']) {
    const { box, button, help, events } = browser();
    let prevented = false, prompts = 0;
    events.beforeinstallprompt({ preventDefault() { prevented = true; }, prompt() { prompts++; return Promise.resolve(); }, userChoice: Promise.resolve({ outcome }) });
    assert.equal(prevented, true); assert.equal(button.classList.contains('is-hidden'), false);
    box.installYoozaApp(); assert.equal(prompts, 1); box.installYoozaApp();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(prompts, 1); assert.equal(help.hidden, true); assert.equal(button.classList.contains('is-hidden'), true);
  }
});

test('une invite Android refusée par le navigateur donne une erreur récupérable', async () => {
  const { box, events, toasts } = browser();
  events.beforeinstallprompt({ preventDefault() {}, prompt() { return Promise.reject(Error('Unavailable')); } });
  box.installYoozaApp(); await new Promise(resolve => setImmediate(resolve));
  assert.match(toasts[0][0], /menu du navigateur/); assert.equal(toasts[0][1], 'error');
});

test('l’événement appinstalled masque le bouton et ignore une invite native tardive', () => {
  const { button, events } = browser();
  events.appinstalled();
  events.beforeinstallprompt({ preventDefault() { throw Error('Invite tardive capturée'); } });
  assert.equal(button.classList.contains('is-hidden'), true);
});
