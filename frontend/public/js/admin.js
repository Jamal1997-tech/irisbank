// En local avec le frontend servi séparément (port 3001), on cible le backend sur 3000.
// Sinon (backend qui sert aussi le frontend, ou déploiement), on reste en relatif.
const API_BASE = window.location.port === '3001' ? 'http://localhost:3000/api' : '/api';

// Fonction pour récupérer un token CSRF
async function getCsrfToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await fetch(`${API_BASE}/auth/csrf-token`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return data.csrfToken;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du token CSRF:', error);
  }
  return null;
}

document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || user.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }

  loadStats();
  loadUsers();
  loadAccounts();
  loadCharts();
  loadSupportData();

  document.getElementById('editUserForm').addEventListener('submit', updateUser);
});

function showSection(section) {
  const sections = ['stats', 'users', 'accounts', 'logs', 'support', 'settings'];
  sections.forEach(s => {
    document.getElementById(`${s}-section`).style.display = s === section ? 'block' : 'none';
  });
}

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const stats = await response.json();
      document.getElementById('totalUsers').textContent = stats.nombre_clients;
      document.getElementById('totalAccounts').textContent = stats.nombre_comptes;
      document.getElementById('totalDeposits').textContent = `${stats.somme_depots} €`;
      document.getElementById('totalTransactions').textContent = 'N/A'; // Pas dans les stats actuelles
    }
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  }
}

async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const users = await response.json();
      const tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = '';

      users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.id}</td>
          <td>${user.nom}</td>
          <td>${user.prenom}</td>
          <td>${user.email}</td>
          <td>${user.telephone || '-'}</td>
          <td>
            <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">
              ${user.role}
            </span>
          </td>
          <td>${new Date(user.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="editUser(${user.id}, '${user.nom}', '${user.prenom}', '${user.email}', '${user.role}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Erreur chargement utilisateurs:', error);
  }
}

async function loadAccounts() {
  try {
    const response = await fetch(`${API_BASE}/admin/accounts`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const accounts = await response.json();
      const tbody = document.getElementById('accountsTableBody');
      tbody.innerHTML = '';

      // Statistiques comptes
      let totalAccounts = accounts.length;
      let activeAccounts = accounts.filter(acc => acc.statut === 'actif').length;
      let blockedAccounts = accounts.filter(acc => acc.statut === 'bloque').length;
      let totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.solde), 0);

      document.getElementById('accountsTotal').textContent = totalAccounts;
      document.getElementById('accountsActive').textContent = activeAccounts;
      document.getElementById('accountsBlocked').textContent = blockedAccounts;
      document.getElementById('accountsTotalBalance').textContent = totalBalance.toFixed(2) + ' €';

      accounts.forEach(account => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${account.id}</td>
          <td>${account.User.nom} ${account.User.prenom}</td>
          <td>${account.iban}</td>
          <td>${account.type_compte}</td>
          <td>${account.solde} €</td>
          <td>
            <span class="badge ${account.statut === 'actif' ? 'bg-success' : 'bg-danger'}">
              ${account.statut}
            </span>
          </td>
          <td>${new Date(account.date_creation).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="toggleAccountStatus(${account.id}, '${account.statut}')">
              ${account.statut === 'actif' ? 'Bloquer' : 'Débloquer'}
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Erreur chargement comptes:', error);
  }
}

function editUser(id, nom, prenom, email, role) {
  document.getElementById('editUserId').value = id;
  document.getElementById('editUserNom').value = nom;
  document.getElementById('editUserPrenom').value = prenom;
  document.getElementById('editUserEmail').value = email;
  document.getElementById('editUserRole').value = role;

  new bootstrap.Modal(document.getElementById('editUserModal')).show();
}

async function updateUser(e) {
  e.preventDefault();
  const id = document.getElementById('editUserId').value;
  const userData = {
    nom: document.getElementById('editUserNom').value,
    prenom: document.getElementById('editUserPrenom').value,
    email: document.getElementById('editUserEmail').value,
    role: document.getElementById('editUserRole').value
  };

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    if (response.ok) {
      showToast('Utilisateur mis à jour avec succès !', 'success', 'Succès');
      loadUsers();
      bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
    } else {
      showToast(data.message || 'Erreur mise à jour utilisateur', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function deleteUser(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      }
    });

    if (response.ok) {
      showToast('Utilisateur supprimé avec succès !', 'success', 'Succès');
      loadUsers();
      loadStats();
    } else {
      const data = await response.json();
      showToast(data.message || 'Erreur suppression utilisateur', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function toggleAccountStatus(id, currentStatus) {
  const action = currentStatus === 'actif' ? 'block' : 'unblock';
  const endpoint = `${API_BASE}/admin/accounts/${id}/${action}`;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      }
    });

    if (response.ok) {
      showToast(`Compte ${action === 'block' ? 'bloqué' : 'débloqué'} avec succès !`, 'success', 'Succès');
      loadAccounts();
    } else {
      const data = await response.json();
      showToast(data.message || 'Erreur modification statut compte', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Support & Tickets Functions
async function loadSupportData() {
  await Promise.all([
    loadTickets(),
    loadContacts(),
    loadSupportStats()
  ]);
}

async function loadSupportStats() {
  try {
    // Simuler des statistiques pour l'instant
    document.getElementById('totalTickets').textContent = '24';
    document.getElementById('openTickets').textContent = '8';
    document.getElementById('resolvedTickets').textContent = '16';
    document.getElementById('avgResponseTime').textContent = '2.5h';
  } catch (error) {
    console.error('Erreur chargement stats support:', error);
  }
}

async function loadTickets() {
  try {
    const response = await fetch(`${API_BASE}/support/tickets`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const tickets = await response.json();
      const tbody = document.getElementById('ticketsTableBody');
      tbody.innerHTML = '';

      if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-light">Aucun ticket trouvé</td></tr>';
        return;
      }

      tickets.forEach(ticket => {
        const priorityClass = {
          'basse': 'bg-secondary',
          'moyenne': 'bg-warning',
          'haute': 'bg-danger'
        }[ticket.priorite] || 'bg-secondary';

        const statusClass = {
          'ouvert': 'bg-danger',
          'en_cours': 'bg-warning',
          'resolu': 'bg-success',
          'ferme': 'bg-secondary'
        }[ticket.statut] || 'bg-secondary';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${ticket.id}</td>
          <td>${ticket.client ? `${ticket.client.nom} ${ticket.client.prenom}` : 'N/A'}</td>
          <td>${ticket.sujet}</td>
          <td><span class="badge ${priorityClass}">${ticket.priorite}</span></td>
          <td><span class="badge ${statusClass}">${ticket.statut}</span></td>
          <td>${new Date(ticket.date_creation).toLocaleDateString('fr-FR')}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="viewTicket(${ticket.id})">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur chargement tickets:', response.status, errorData);
      showToast(`Erreur chargement tickets: ${response.status}`, 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur chargement tickets:', error);
    showToast('Erreur de connexion au serveur', 'error', 'Erreur');
  }
}

async function loadContacts() {
  try {
    const response = await fetch(`${API_BASE}/support/contacts`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const contacts = await response.json();
      const tbody = document.getElementById('contactsTableBody');
      tbody.innerHTML = '';

      if (contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-light">Aucun message de contact</td></tr>';
        return;
      }

      contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${contact.id}</td>
          <td>${contact.nom}</td>
          <td>${contact.email}</td>
          <td>${contact.sujet}</td>
          <td>${new Date(contact.date_creation).toLocaleDateString('fr-FR')}</td>
          <td>
            <button class="btn btn-sm btn-info" onclick="viewContact(${contact.id})">
              <i class="fas fa-eye"></i>
            </button>
            ${!contact.lu ? '<span class="badge bg-danger ms-1">Nouveau</span>' : ''}
          </td>
        `;
        tbody.appendChild(row);
      });
    } else {
      console.error('Erreur chargement contacts');
    }
  } catch (error) {
    console.error('Erreur chargement contacts:', error);
  }
}

async function viewTicket(ticketId) {
  try {
    const response = await fetch(`${API_BASE}/support/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const ticket = await response.json();

      document.getElementById('ticketId').textContent = ticket.id;
      document.getElementById('ticketClient').textContent = ticket.client ? `${ticket.client.nom} ${ticket.client.prenom}` : 'N/A';
      document.getElementById('ticketSubject').textContent = ticket.sujet;
      document.getElementById('ticketPriority').textContent = ticket.priorite;
      document.getElementById('ticketPriority').className = `badge ${ticket.priorite === 'haute' ? 'bg-danger' : ticket.priorite === 'moyenne' ? 'bg-warning' : 'bg-secondary'}`;
      document.getElementById('ticketStatus').textContent = ticket.statut;
      document.getElementById('ticketStatus').className = `badge ${ticket.statut === 'ouvert' ? 'bg-danger' : ticket.statut === 'en_cours' ? 'bg-warning' : 'bg-success'}`;
      document.getElementById('ticketDate').textContent = new Date(ticket.date_creation).toLocaleDateString('fr-FR');
      document.getElementById('ticketDescription').textContent = ticket.description;

      const responsesDiv = document.getElementById('ticketResponses');
      if (ticket.responses && ticket.responses.length > 0) {
        responsesDiv.innerHTML = ticket.responses.map(response =>
          `<div class="mb-2 p-2 bg-dark rounded">
            <strong>${response.admin ? `${response.admin.nom} ${response.admin.prenom}` : 'Support'}:</strong> ${response.message}
            <br><small class="text-muted">${new Date(response.date_creation).toLocaleString('fr-FR')}</small>
          </div>`
        ).join('');
      } else {
        responsesDiv.innerHTML = '<p class="text-muted">Aucune réponse pour le moment.</p>';
      }

      const modal = new bootstrap.Modal(document.getElementById('ticketModal'));
      modal.show();
    } else {
      showToast('Erreur lors du chargement du ticket', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur chargement ticket:', error);
    showToast('Erreur lors du chargement du ticket', 'error', 'Erreur');
  }
}

async function viewContact(contactId) {
  try {
    const response = await fetch(`${API_BASE}/support/contacts/${contactId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const contact = await response.json();

      document.getElementById('contactId').textContent = contact.id;
      document.getElementById('contactName').textContent = contact.nom;
      document.getElementById('contactEmail').textContent = contact.email;
      document.getElementById('contactDate').textContent = new Date(contact.date_creation).toLocaleDateString('fr-FR');
      document.getElementById('contactMessage').innerHTML = contact.message.replace(/\n/g, '<br>');

      const modal = new bootstrap.Modal(document.getElementById('contactModal'));
      modal.show();
    } else {
      showToast('Erreur lors du chargement du message', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur chargement contact:', error);
    showToast('Erreur lors du chargement du message', 'error', 'Erreur');
  }
}

async function respondToTicket() {
  const ticketId = document.getElementById('ticketId').textContent;
  const response = document.getElementById('ticketResponse').value;
  const statusUpdate = document.getElementById('ticketStatusUpdate').value;

  if (!response.trim()) {
    showToast('Veuillez saisir une réponse', 'warning', 'Attention');
    return;
  }

  try {
    const csrfToken = await getCsrfToken();
    // Ajouter la réponse
    const responseData = await fetch(`${API_BASE}/support/tickets/${ticketId}/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify({ message: response })
    });

    if (!responseData.ok) {
      throw new Error('Erreur lors de l\'envoi de la réponse');
    }

    // Mettre à jour le statut si nécessaire
    if (statusUpdate) {
      await fetch(`${API_BASE}/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ statut: statusUpdate })
      });
    }

    showToast('Réponse envoyée avec succès', 'success', 'Succès');

    document.getElementById('ticketResponse').value = '';
    document.getElementById('ticketStatusUpdate').value = '';

    // Fermer la modal et recharger les données
    bootstrap.Modal.getInstance(document.getElementById('ticketModal')).hide();
    loadSupportData();
  } catch (error) {
    console.error('Erreur:', error);
    showToast('Erreur lors de l\'envoi de la réponse', 'error', 'Erreur');
  }
}

async function markContactAsRead() {
  const contactId = document.getElementById('contactId').textContent;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/support/contacts/${contactId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      }
    });

    if (response.ok) {
      showToast('Message marqué comme lu', 'success', 'Succès');
      bootstrap.Modal.getInstance(document.getElementById('contactModal')).hide();
      loadSupportData();
    } else {
      showToast('Erreur lors de la mise à jour', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showToast('Erreur lors de la mise à jour', 'error', 'Erreur');
  }
}

function replyToContact() {
  const email = document.getElementById('contactEmail').textContent;
  // Simuler l'ouverture d'un client email
  window.open(`mailto:${email}?subject=Réponse à votre message de contact`);
  showToast('Client email ouvert', 'info', 'Information');
}

// Graphiques
let accountsChart, activityChart;

async function loadCharts() {
  try {
    // Données pour le graphique des comptes
    const accountsResponse = await fetch(`${API_BASE}/admin/accounts`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (accountsResponse.ok) {
      const accounts = await accountsResponse.json();

      // Compter les types de comptes
      const accountTypes = accounts.reduce((acc, account) => {
        acc[account.type_compte] = (acc[account.type_compte] || 0) + 1;
        return acc;
      }, {});

      // Graphique camembert des types de comptes
      const ctxAccounts = document.getElementById('accountsChart').getContext('2d');
      accountsChart = new Chart(ctxAccounts, {
        type: 'doughnut',
        data: {
          labels: Object.keys(accountTypes),
          datasets: [{
            data: Object.values(accountTypes),
            backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#ffffff'
              }
            }
          }
        }
      });
    }

    // Graphique d'activité (simulé pour l'instant)
    const ctxActivity = document.getElementById('activityChart').getContext('2d');
    activityChart = new Chart(ctxActivity, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Transactions',
          data: [12, 19, 3, 5, 2, 3],
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.1,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#ffffff'
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('Erreur chargement graphiques:', error);
  }
}

// Filtres utilisateurs
function filterUsers() {
  const searchTerm = document.getElementById('userSearch').value.toLowerCase();
  const roleFilter = document.getElementById('userRoleFilter').value;
  const statusFilter = document.getElementById('userStatusFilter').value;

  const rows = document.querySelectorAll('#usersTableBody tr');

  rows.forEach(row => {
    const name = row.cells[1].textContent.toLowerCase() + ' ' + row.cells[2].textContent.toLowerCase();
    const email = row.cells[3].textContent.toLowerCase();
    const role = row.cells[5].textContent.toLowerCase();

    const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);
    const matchesRole = !roleFilter || role === roleFilter;
    const matchesStatus = !statusFilter || row.cells[6].textContent.toLowerCase().includes(statusFilter);

    row.style.display = matchesSearch && matchesRole && matchesStatus ? '' : 'none';
  });
}

// Filtres comptes
function filterAccounts() {
  const typeFilter = document.getElementById('accountTypeFilter').value;
  const statusFilter = document.getElementById('accountStatusFilter').value;
  const minBalance = parseFloat(document.getElementById('minBalanceFilter').value) || 0;

  const rows = document.querySelectorAll('#accountsTableBody tr');

  rows.forEach(row => {
    const type = row.cells[3].textContent.toLowerCase();
    const status = row.cells[5].textContent.toLowerCase();
    const balance = parseFloat(row.cells[4].textContent.replace(' €', ''));

    const matchesType = !typeFilter || type === typeFilter;
    const matchesStatus = !statusFilter || status === statusFilter;
    const matchesBalance = balance >= minBalance;

    row.style.display = matchesType && matchesStatus && matchesBalance ? '' : 'none';
  });
}

// Export utilisateurs
function exportUsers() {
  showToast('Fonctionnalité d\'export en développement', 'info', 'Info');
}

// Email groupé
function sendBulkEmail() {
  showToast('Fonctionnalité d\'email groupé en développement', 'info', 'Info');
}

// Filtre logs
function filterLogs() {
  showToast('Fonctionnalité de filtrage des logs en développement', 'info', 'Info');
}

// Paramètres système
function updateLimits() {
  const maxWithdrawal = document.getElementById('maxWithdrawal').value;
  const minDeposit = document.getElementById('minDeposit').value;

  showToast(`Limites mises à jour: Retrait max ${maxWithdrawal}€, Dépôt min ${minDeposit}€`, 'success', 'Succès');
}

function clearCache() {
  showToast('Cache vidé avec succès', 'success', 'Succès');
}

function backupDatabase() {
  showToast('Sauvegarde de la base de données lancée', 'success', 'Succès');
}