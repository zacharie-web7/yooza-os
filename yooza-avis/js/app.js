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
    if(title)title.textContent=h.startsWith('#/bon/')?'Vérifier le bon':h==='#/settings'?'Réglages':'Yooza Avis';
    document.querySelectorAll('.nav-item').forEach(function(item){item.classList.toggle('active',item.dataset.route===(h==='#/settings'?'/settings':h==='#/dashboard'?'/dashboard':'/clients'));});
    void avisRoute();closeSidebar();window.scrollTo(0,0);return;
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

function showInstallButton() {
  var button = document.getElementById('install-app-button');
  if (button) button.classList.remove('is-hidden');
}

function hideInstallButton() {
  var button = document.getElementById('install-app-button');
  if (button) button.classList.add('is-hidden');
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
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallButton();
  });

  window.addEventListener('appinstalled', function() {
    deferredInstallPrompt = null;
    hideInstallButton();
    showToast('Yooza Avis est installé sur cet appareil.', 'success');
  });
}

function installYoozaApp() {
  if (!deferredInstallPrompt) {
    showToast('Sur iPhone, ouvrez Partager puis « Sur l’écran d’accueil ».', 'default', 5000);
    return;
  }

  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(function(choice) {
    if (choice.outcome === 'accepted') {
      hideInstallButton();
    }
    deferredInstallPrompt = null;
  });
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
