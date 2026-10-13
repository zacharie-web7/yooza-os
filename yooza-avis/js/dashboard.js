/**
 * dashboard.js — Tableau de bord Yooza Avis V1
 */

'use strict';

function renderDashboard(container) {
  const stats = computeStats(AppState.clients);

  // Clients récents (5 derniers par date d'intervention)
  const recents = [...AppState.clients]
    .sort((a, b) => new Date(b.dateFinIntervention) - new Date(a.dateFinIntervention))
    .slice(0, 5);

  // Clients à envoyer en priorité
  const aEnvoyer = AppState.clients.filter(c => c.statut === STATUS.TO_SEND)
    .sort((a, b) => new Date(a.dateFinIntervention) - new Date(b.dateFinIntervention))
    .slice(0, 4);

  container.innerHTML = `
    <!-- KPIs -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap">⏳</div>
        <div>
          <div class="stat-value">${stats.enAttente}</div>
          <div class="stat-label">En attente d'envoi</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap">📤</div>
        <div>
          <div class="stat-value">${stats.envoyes}</div>
          <div class="stat-label">Demandes envoyées</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap">✅</div>
        <div>
          <div class="stat-value">${stats.recus}</div>
          <div class="stat-label">Avis reçus</div>
        </div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-icon-wrap">⭐</div>
        <div>
          <div class="stat-value">${stats.noteMoyenne}</div>
          <div class="stat-label">Note moyenne Google</div>
        </div>
      </div>
    </div>

    <!-- Contenu principal en deux colonnes -->
    <div class="dashboard-main-grid">

      <!-- Activité récente -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="section-label">Activité récente</div>
            <div class="card-title">Dernières interventions</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="navigate('#/clients')">
            Voir tout
          </button>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Intervention</th>
                <th>Date</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${recents.map(c => `
                <tr onclick="navigate('#/client/${safeClientId(c.id)}')">
                  <td>
                    <div class="client-name">${escapeHtml(c.nom)}</div>
                    <div class="client-company">${escapeHtml(c.entreprise)}</div>
                  </td>
                  <td class="text-sm text-muted">${escapeHtml(c.typeIntervention)}</td>
                  <td class="text-sm text-muted">${escapeHtml(formatDate(c.dateFinIntervention))}</td>
                  <td>
                    <span class="badge ${STATUS_BADGE_CLASS[c.statut]}">
                      ${escapeHtml(STATUS_LABELS[c.statut])}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();navigate('#/client/${safeClientId(c.id)}')">
                      →
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Panneau latéral -->
      <div style="display:flex;flex-direction:column;gap:1.25rem">

        <!-- À envoyer en priorité -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="section-label">Action requise</div>
              <div class="card-title">À envoyer</div>
            </div>
            <span class="badge warning">${stats.enAttente}</span>
          </div>
          <div class="card-body" style="padding-top:0.75rem;padding-bottom:0.75rem">
            ${aEnvoyer.length === 0 ? `
              <div class="empty-state" style="padding:1.5rem">
                <div class="empty-state-icon">🎉</div>
                <div class="empty-state-title">Tout est à jour !</div>
              </div>
            ` : aEnvoyer.map(c => `
              <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid var(--yooza-border)">
                <div style="width:36px;height:36px;background:var(--yooza-yellow);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;color:var(--yooza-black)">
                  ${escapeHtml(getInitials(c.nom))}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:0.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c.nom)}</div>
                  <div style="font-size:0.75rem;color:var(--yooza-gray)">${escapeHtml(formatDate(c.dateFinIntervention))}</div>
                </div>
                <button class="btn btn-primary btn-sm"
                  onclick="event.stopPropagation();quickSend(${safeClientId(c.id)})"
                  title="Marquer comme envoyé">
                  Envoyer
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Résumé des avis reçus -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="section-label">Performance</div>
              <div class="card-title">Avis Google</div>
            </div>
          </div>
          <div class="card-body">
            <div style="text-align:center;padding:0.5rem 0">
              <div style="font-family:var(--font-heading);font-size:3rem;font-weight:700;color:var(--yooza-black);line-height:1">
                ${stats.noteMoyenne}
              </div>
              <div style="margin:0.5rem 0">
                ${stats.noteMoyenne !== '—' ? renderStars(Math.round(parseFloat(stats.noteMoyenne))) : ''}
              </div>
              <div style="font-size:0.875rem;color:var(--yooza-gray)">
                Basé sur ${stats.recus} avis
              </div>
            </div>
            <hr class="divider" style="margin:1rem 0">
            <div style="display:flex;justify-content:space-between;font-size:0.875rem">
              <span style="color:var(--yooza-gray)">Taux de réponse</span>
              <span style="font-weight:700">
                ${stats.envoyes + stats.recus > 0
                  ? Math.round((stats.recus / (stats.envoyes + stats.recus)) * 100) + '%'
                  : '—'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// Envoi rapide depuis le tableau de bord
function quickSend(clientId) {
  const client = AppState.clients.find(c => c.id === clientId);
  if (!client || client.statut !== STATUS.TO_SEND) return;

  const message = generateMessage(client, AppState.settings);
  const canal = AppState.settings.canal;
  const canalLabel = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp' }[canal] || canal;

  openModal(
    'Simuler une demande d\'avis',
    `
      <div class="alert alert-info" style="margin-bottom:1rem">
        <span>ℹ️</span>
        <span>Canal prévu : <strong>${escapeHtml(canalLabel)}</strong> — ${escapeHtml(canal === 'email' ? client.email : client.telephone)}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Client</label>
        <div style="font-weight:600">${escapeHtml(client.nom)} — ${escapeHtml(client.entreprise)}</div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Message qui sera envoyé</label>
        <div class="message-preview">${escapeHtml(message)}</div>
      </div>
    `,
    `
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="confirmSend(${safeClientId(clientId)})">
        ✓ Confirmer la simulation
      </button>
    `
  );
}

function confirmSend(clientId) {
  const client = AppState.clients.find(c => c.id === clientId);
  if (!client) return;

  const today = new Date().toISOString().split('T')[0];
  client.statut = STATUS.SENT;
  client.dateEnvoi = today;
  saveClients();
  closeModal();
  showToast(`Simulation effectuée à ${client.nom} !`, 'success');

  // Re-rendre le tableau de bord
  const contentEl = document.getElementById('page-content');
  renderDashboard(contentEl);
}
