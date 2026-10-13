/**
 * client-detail.js — Fiche client Yooza Avis V1
 */

'use strict';

function renderClientDetail(container, clientId) {
  // Compatibilité : appelé avec (container, id) ou (id) selon le routeur
  if (typeof container === 'string' || typeof container === 'number') {
    clientId = container;
    container = document.getElementById('page-content');
  }

  const client = AppState.clients.find(c => c.id === Number(clientId));

  if (!client) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❓</div>
        <div class="empty-state-title">Client introuvable</div>
        <div class="empty-state-desc">Ce client n'existe pas ou a été supprimé.</div>
        <button class="btn btn-primary mt-5" onclick="navigate('#/clients')">← Retour à la liste</button>
      </div>
    `;
    return;
  }

  const message = generateMessage(client, AppState.settings);
  const canal = AppState.settings.canal;
  const canalLabel = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp' }[canal] || canal;
  const canalContact = canal === 'email' ? client.email : client.telephone;

  // Étapes de la timeline
  const steps = [
    { label: 'Intervention terminée', key: 'done',     date: client.dateFinIntervention },
    { label: 'Simulation effectuée',       key: 'sent',     date: client.dateEnvoi },
    { label: 'Avis reçu',             key: 'received', date: client.dateAvis },
  ];

  let currentStep = 0;
  if (client.statut === STATUS.SENT)     currentStep = 1;
  if (client.statut === STATUS.RECEIVED) currentStep = 2;

  function stepClass(idx) {
    if (idx < currentStep)  return 'completed';
    if (idx === currentStep) return 'current';
    return '';
  }

  container.innerHTML = `
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <span class="breadcrumb-item" onclick="navigate('#/clients')">Clients</span>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-current">${escapeHtml(client.nom)}</span>
    </div>

    <!-- En-tête fiche -->
    <div class="client-detail-header">
      <div class="client-avatar-lg">${escapeHtml(getInitials(client.nom))}</div>
      <div class="client-detail-info">
        <div class="section-label">Fiche client</div>
        <div class="client-detail-name">${escapeHtml(client.nom)}</div>
        <div class="client-detail-company">${escapeHtml(client.entreprise)}</div>
        <div style="margin-top:0.75rem">
          <span class="badge ${STATUS_BADGE_CLASS[client.statut]}" style="font-size:0.8rem;padding:4px 12px">
            ${escapeHtml(STATUS_LABELS[client.statut])}
          </span>
        </div>
      </div>
      <div class="client-detail-actions">
        ${client.statut === STATUS.TO_SEND ? `
          <button class="btn btn-primary" onclick="openSendModal(${safeClientId(client.id)})">
            📤 Simuler une demande d'avis
          </button>
        ` : client.statut === STATUS.SENT ? `
          <button class="btn btn-outline" onclick="markAsReceived(${safeClientId(client.id)})">
            ✓ Marquer avis reçu
          </button>
          <button class="btn btn-ghost" onclick="openSendModal(${safeClientId(client.id)})">
            ↺ Renvoyer
          </button>
        ` : `
          <div style="display:flex;align-items:center;gap:0.5rem;font-weight:700;color:var(--yooza-black)">
            ${renderStars(client.noteGoogle)}
            <span>${escapeHtml(client.noteGoogle)}/5</span>
          </div>
        `}
      </div>
    </div>

    <!-- Timeline statut -->
    <div class="card" style="margin-bottom:1.5rem">
      <div class="card-body" style="padding:1.5rem 2rem">
        <div class="section-label" style="margin-bottom:1rem">Progression</div>
        <div class="status-timeline">
          ${steps.map((step, idx) => `
            <div class="timeline-step ${stepClass(idx)}">
              <div class="timeline-dot">
                ${idx < currentStep ? '✓' : idx + 1}
              </div>
              <div class="timeline-label">
                ${step.label}
                ${step.date ? `<br><span style="font-weight:400;color:var(--yooza-gray)">${escapeHtml(formatDate(step.date))}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Informations en deux colonnes -->
    <div class="client-detail-grid" style="margin-bottom:1.5rem">

      <!-- Informations client -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Informations client</div>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-item-label">Téléphone</div>
              <div class="info-item-value">
                <a href="tel:${encodeURIComponent(String(client.telephone || ''))}" style="color:var(--yooza-black)">${escapeHtml(client.telephone)}</a>
              </div>
            </div>
            <div class="info-item">
              <div class="info-item-label">Email</div>
              <div class="info-item-value">
                <a href="mailto:${encodeURIComponent(String(client.email || ''))}" style="color:var(--yooza-black);word-break:break-all">${escapeHtml(client.email)}</a>
              </div>
            </div>
            <div class="info-item">
              <div class="info-item-label">Entreprise</div>
              <div class="info-item-value">${escapeHtml(client.entreprise)}</div>
            </div>
            <div class="info-item">
              <div class="info-item-label">Adresse</div>
              <div class="info-item-value">${escapeHtml(client.adresse)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations intervention -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Intervention</div>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-item-label">Type</div>
              <div class="info-item-value">${escapeHtml(client.typeIntervention)}</div>
            </div>
            <div class="info-item">
              <div class="info-item-label">Date de fin</div>
              <div class="info-item-value">${escapeHtml(formatDate(client.dateFinIntervention))}</div>
            </div>
            <div class="info-item">
              <div class="info-item-label">Technicien</div>
              <div class="info-item-value">${escapeHtml(client.technicien)}</div>
            </div>
            <div class="info-item">
              <div class="info-item-label">Canal prévu</div>
              <div class="info-item-value">${escapeHtml(canalLabel)} — ${escapeHtml(canalContact)}</div>
            </div>
            ${client.dateEnvoi ? `
              <div class="info-item">
                <div class="info-item-label">Simulation effectuée le</div>
                <div class="info-item-value">${escapeHtml(formatDate(client.dateEnvoi))}</div>
              </div>
            ` : ''}
            ${client.dateAvis ? `
              <div class="info-item">
                <div class="info-item-label">Avis reçu le</div>
                <div class="info-item-value">${escapeHtml(formatDate(client.dateAvis))}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Notes et message -->
    <div class="client-detail-grid">

      <!-- Notes internes -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Notes internes</div>
        </div>
        <div class="card-body">
          <p style="font-size:0.875rem;color:var(--yooza-black);line-height:1.7">
            ${client.notes ? escapeHtml(client.notes) : '<span style="color:var(--yooza-gray)">Aucune note.</span>'}
          </p>
        </div>
      </div>

      <!-- Prévisualisation du message -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Message prévu</div>
          <span style="font-size:0.75rem;color:var(--yooza-gray);background:var(--yooza-cream);padding:3px 10px;border-radius:var(--radius-full);font-weight:600">
            ${escapeHtml(canalLabel)}
          </span>
        </div>
        <div class="card-body">
          <div class="message-preview">${escapeHtml(message)}</div>
          ${client.statut === STATUS.TO_SEND ? `
            <button class="btn btn-primary w-full mt-4" onclick="openSendModal(${safeClientId(client.id)})">
              📤 Simuler cette demande d'avis
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Modal d'envoi depuis la fiche client
// ---------------------------------------------------------------------------
function openSendModal(clientId) {
  const client = AppState.clients.find(c => c.id === clientId);
  if (!client) return;

  const message = generateMessage(client, AppState.settings);
  const canal = AppState.settings.canal;
  const canalLabel = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp' }[canal] || canal;

  openModal(
    'Simuler une demande d\'avis',
    `
      <div class="alert alert-info">
        <span>📋</span>
        <div>
          <strong>${escapeHtml(client.nom)}</strong> — ${escapeHtml(client.entreprise)}<br>
          <span style="font-size:0.8rem">Canal : <strong>${escapeHtml(canalLabel)}</strong> · ${escapeHtml(canal === 'email' ? client.email : client.telephone)}</span>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Message qui sera envoyé</label>
        <div class="message-preview">${escapeHtml(message)}</div>
      </div>
      <div class="alert alert-warning" style="margin-top:1rem;margin-bottom:0">
        <span>⚠️</span>
        <span>En V1, l'envoi réel n'est pas connecté. Cette action met simplement à jour le statut.</span>
      </div>
    `,
    `
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="confirmSendFromDetail(${safeClientId(clientId)})">
        ✓ Confirmer la simulation
      </button>
    `
  );
}

function confirmSendFromDetail(clientId) {
  const client = AppState.clients.find(c => c.id === clientId);
  if (!client) return;

  const today = new Date().toISOString().split('T')[0];
  client.statut = STATUS.SENT;
  client.dateEnvoi = today;
  saveClients();
  closeModal();
  showToast(`Simulation effectuée à ${client.nom} !`, 'success');

  // Re-rendre la fiche
  renderClientDetail(document.getElementById('page-content'), clientId);
}

// ---------------------------------------------------------------------------
// Marquer un avis comme reçu
// ---------------------------------------------------------------------------
function markAsReceived(clientId) {
  const client = AppState.clients.find(c => c.id === clientId);
  if (!client) return;

  openModal(
    'Avis reçu',
    `
      <p style="margin-bottom:1.25rem;font-size:0.9rem;color:var(--yooza-gray)">
        Indiquez la note Google laissée par <strong>${escapeHtml(client.nom)}</strong>.
      </p>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Note Google (1 à 5 étoiles)</label>
        <div style="display:flex;gap:0.75rem;margin-top:0.5rem" id="star-picker">
          ${[1,2,3,4,5].map(n => `
            <button
              type="button"
              class="star-btn"
              data-note="${n}"
              onclick="selectStar(${n})"
              style="font-size:2rem;background:none;border:none;cursor:pointer;opacity:0.3;transition:opacity 0.15s;padding:0"
            >★</button>
          `).join('')}
        </div>
        <input type="hidden" id="note-value" value="5">
      </div>
    `,
    `
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="confirmReceived(${safeClientId(clientId)})">
        ✓ Enregistrer l'avis
      </button>
    `
  );

  // Sélectionner 5 étoiles par défaut
  setTimeout(() => selectStar(5), 50);
}

function selectStar(note) {
  const noteInput = document.getElementById('note-value');
  if (noteInput) noteInput.value = note;

  const btns = document.querySelectorAll('.star-btn');
  btns.forEach(btn => {
    const n = parseInt(btn.dataset.note);
    btn.style.opacity = n <= note ? '1' : '0.25';
    btn.style.color = n <= note ? 'var(--yooza-yellow-dark)' : 'var(--yooza-gray-lighter)';
  });
}

function confirmReceived(clientId) {
  const client = AppState.clients.find(c => c.id === clientId);
  if (!client) return;

  const noteInput = document.getElementById('note-value');
  const note = noteInput ? parseInt(noteInput.value) : 5;
  const today = new Date().toISOString().split('T')[0];

  client.statut = STATUS.RECEIVED;
  client.dateAvis = today;
  client.noteGoogle = note;
  saveClients();
  closeModal();
  showToast(`Avis ${note}★ enregistré pour ${client.nom} !`, 'success');

  renderClientDetail(document.getElementById('page-content'), clientId);
}
