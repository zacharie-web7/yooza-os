/**
 * app.js — Routeur SPA et navigation Yooza Avis V1
 * --------------------------------------------------
 * Navigation hash-based : #/dashboard, #/clients, #/client/:id, #/settings
 * État global, toast, modal, sidebar mobile.
 */

// ---------------------------------------------------------------------------
// État global de l'application
// ---------------------------------------------------------------------------
var AppState = {
  currentRoute: null,
  settings: null,
  clients: null,
};

function initAppState() {
  AppState.settings = readStoredJson(
    'yooza_settings',
    DEFAULT_SETTINGS,
    function(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  );
  AppState.clients = readStoredJson(
    'yooza_clients',
    DEMO_CLIENTS,
    Array.isArray
  );
}

function copyObj(o) { return JSON.parse(JSON.stringify(o)); }

function readStoredJson(key, fallback, isValid) {
  var rawValue;

  try {
    rawValue = localStorage.getItem(key);
    if (rawValue === null) return copyObj(fallback);

    var parsedValue = JSON.parse(rawValue);
    if (!isValid(parsedValue)) throw new TypeError('Structure de données invalide');
    return parsedValue;
  } catch (error) {
    console.warn('État local Yooza ignoré pour ' + key + ' :', error);
    try { localStorage.removeItem(key); } catch (storageError) {
      console.warn('Impossible de supprimer la valeur locale invalide ' + key + ' :', storageError);
    }
    return copyObj(fallback);
  }
}

// Les écrans V1 utilisent encore des gabarits HTML. Toute donnée variable doit
// passer par cet échappement avant d'être injectée dans un de ces gabarits.
function escapeHtml(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeClientId(value) {
  var id = Number(value);
  return Number.isSafeInteger(id) && id >= 0 ? String(id) : '0';
}

function saveClients()  { localStorage.setItem('yooza_clients',  JSON.stringify(AppState.clients));  }
function saveSettings() { localStorage.setItem('yooza_settings', JSON.stringify(AppState.settings)); }

// ---------------------------------------------------------------------------
// Routeur
// ---------------------------------------------------------------------------
function navigate(path) {
  window.location.hash = path;
}

function getPageTitle(hash) {
  if (hash.startsWith('#/client/'))  return 'Fiche client';
  if (hash === '#/clients')          return 'Clients';
  if (hash === '#/settings')         return 'Réglages';
  return 'Tableau de bord';
}

function getActiveRoute(hash) {
  if (hash.startsWith('#/client/')) return '/clients';
  if (hash === '#/clients')         return '/clients';
  if (hash === '#/settings')        return '/settings';
  return '/dashboard';
}

function handleRoute() {
  if (typeof Avis !== 'undefined' && Avis.mode && Avis.mode !== 'demo') {
    var h=window.location.hash||'#/dashboard',title=document.getElementById('page-title');
    if(title)title.textContent=h.startsWith('#/bon/')?'Fiche intervention':h==='#/settings'?'Réglages':h==='#/clients'?'Bons et interventions':h==='#/demandes'?'Demandes d’avis':'Tableau de bord';
    document.querySelectorAll('.nav-item').forEach(function(item){item.classList.toggle('active',item.dataset.route===(h==='#/settings'?'/settings':h==='#/dashboard'?'/dashboard':h==='#/demandes'?'/demandes':'/clients'));});
    document.querySelectorAll('.nav-item').forEach(function(item){if(item.classList.contains('active'))item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});void avisRoute();closeSidebar();window.scrollTo(0,0);return;
  }
  var hash = window.location.hash || '#/dashboard';
  AppState.currentRoute = hash;

  // Titre topbar
  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = getPageTitle(hash);

  // Nav active
  var activeRoute = getActiveRoute(hash);
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.classList.remove('active');
    if (item.dataset.route === activeRoute) item.classList.add('active');
  });

  // Rendu
  var contentEl = document.getElementById('page-content');
  if (!contentEl) return;
  contentEl.innerHTML = '';

  if (hash.startsWith('#/client/')) {
    var id = hash.split('/')[2];
    renderClientDetail(contentEl, id);
  } else if (hash === '#/clients') {
    renderClients(contentEl);
  } else if (hash === '#/settings') {
    renderSettings(contentEl);
  } else {
    renderDashboard(contentEl);
  }

  closeSidebar();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', handleRoute);

// ---------------------------------------------------------------------------
// Sidebar mobile
// ---------------------------------------------------------------------------
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  var s = document.getElementById('sidebar');
  var o = document.getElementById('sidebar-overlay');
  if (s) s.classList.remove('open');
  if (o) o.classList.remove('visible');
  document.body.style.overflow = '';
}

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------
function showToast(message, type, duration) {
  type = type || 'default';
  duration = duration || 3500;
  var container = document.getElementById('toast-container');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  var icons = { success: '✓', error: '✕', default: 'ℹ' };
  var icon = document.createElement('span');
  icon.style.fontWeight = '700';
  icon.style.fontSize = '1rem';
  icon.textContent = icons[type] || icons.default;
  toast.appendChild(icon);
  toast.appendChild(document.createTextNode(' ' + String(message)));
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(110%)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 260);
  }, duration);
}

// ---------------------------------------------------------------------------
// Modal générique
// ---------------------------------------------------------------------------
function openModal(titleText, bodyHTML, footerHTML) {
  var overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = titleText;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  var overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ---------------------------------------------------------------------------
// Date topbar
// ---------------------------------------------------------------------------
function updateTopbarDate() {
  var now = new Date();
  var options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  var dateStr = now.toLocaleDateString('fr-FR', options);
  var el = document.getElementById('topbar-date');
  if (el) el.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}

// ---------------------------------------------------------------------------
// PWA — cache hors connexion et installation
// ---------------------------------------------------------------------------
var deferredInstallPrompt = null;
var yoozaAppInstalled = false;

function isYoozaAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent || '')
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isYoozaStandalone() {
  return yoozaAppInstalled || navigator.standalone === true
    || (typeof window.matchMedia === 'function'
      && window.matchMedia('(display-mode: standalone)').matches);
}

function showInstallButton() {
  var button = document.getElementById('install-app-button');
  if (button) button.classList.remove('is-hidden');
}

function hideInstallButton() {
  var button = document.getElementById('install-app-button');
  if (button) button.classList.add('is-hidden');
}

function closeYoozaInstallHelp(restoreFocus) {
  var help = document.getElementById('install-app-help');
  var button = document.getElementById('install-app-button');
  if (!help || help.hidden) return;
  var focusInside = help.contains(document.activeElement);
  help.hidden = true;
  if (button) {
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus !== false && focusInside) button.focus();
  }
}

function updateYoozaInstallButton() {
  var button = document.getElementById('install-app-button');
  if (!button) return;
  if (isYoozaAppleMobile()) {
    button.setAttribute('aria-controls', 'install-app-help');
    if (!button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', 'false');
  }
  if (isYoozaStandalone()) {
    hideInstallButton();
    closeYoozaInstallHelp(false);
  } else if (deferredInstallPrompt || isYoozaAppleMobile()) {
    showInstallButton();
  } else {
    hideInstallButton();
  }
}

function toggleYoozaInstallHelp() {
  var help = document.getElementById('install-app-help');
  var button = document.getElementById('install-app-button');
  if (!help || !button) return;
  if (!help.hidden) {
    closeYoozaInstallHelp();
    return;
  }
  var privateNote = document.getElementById('install-app-private-note');
  if (privateNote) privateNote.hidden = typeof Avis === 'undefined' || Avis.mode !== 'tailscale';
  help.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  document.getElementById('install-app-help-title').focus();
}

function initPwa() {
  // Le service worker est disponible en HTTPS et lors des tests localhost.
  if ('serviceWorker' in navigator && (window.isSecureContext || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./service-worker.js').catch(function(error) {
      console.warn('Service worker Yooza Avis non enregistré :', error);
    });
  }

  // Chrome, Edge et la plupart des navigateurs Android exposent cet événement.
  window.addEventListener('beforeinstallprompt', function(event) {
    if (isYoozaStandalone()) return;
    event.preventDefault();
    deferredInstallPrompt = event;
    updateYoozaInstallButton();
  });

  window.addEventListener('appinstalled', function() {
    yoozaAppInstalled = true;
    deferredInstallPrompt = null;
    updateYoozaInstallButton();
    showToast('Yooza Avis est installé sur cet appareil.', 'success');
  });

  var displayMode = typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)') : null;
  if (displayMode && typeof displayMode.addEventListener === 'function') {
    displayMode.addEventListener('change', updateYoozaInstallButton);
  } else if (displayMode && typeof displayMode.addListener === 'function') {
    displayMode.addListener(updateYoozaInstallButton);
  }
  window.addEventListener('keydown', function(event) {
    var help = document.getElementById('install-app-help');
    if (event.key === 'Escape' && help && !help.hidden && help.contains(document.activeElement)) {
      event.preventDefault();
      closeYoozaInstallHelp();
    }
  });
  updateYoozaInstallButton();
}

function installYoozaApp() {
  if (isYoozaStandalone()) return;
  if (isYoozaAppleMobile()) {
    toggleYoozaInstallHelp();
    return;
  }
  if (!deferredInstallPrompt) {
    return;
  }

  var prompt = deferredInstallPrompt;
  deferredInstallPrompt = null;
  updateYoozaInstallButton();
  function failed() {
    showToast('L’installation n’a pas pu démarrer. Réessayez depuis le menu du navigateur.', 'error', 5000);
  }
  try {
    Promise.resolve(prompt.prompt()).then(function() { return prompt.userChoice; }).catch(failed);
  } catch (error) { failed(); }
}

// ---------------------------------------------------------------------------
// Initialisation au chargement
// ---------------------------------------------------------------------------
async function initApp() {
  if (typeof initParcoursAvis === 'function' && await initParcoursAvis()) return;
  var demo=document.getElementById('avis-demo-banner');
  if(!demo){demo=document.createElement('p');demo.id='avis-demo-banner';demo.className='avis-bandeau';demo.textContent='DÉMONSTRATION : clients fictifs, envois simulés. Aucune connexion métier active.';document.querySelector('main').prepend(demo);}
  initAppState();
  updateTopbarDate();
  initPwa();
  handleRoute();
}
