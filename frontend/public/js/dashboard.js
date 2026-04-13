const API_BASE = 'http://localhost:3000/api';
let user = null;
let accounts = [];

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
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  user = JSON.parse(localStorage.getItem('user'));
  if (user.role === 'admin') {
    window.location.href = 'admin.html';
    return;
  }

  loadDashboard();
  loadAccounts();
  loadTransactions();
  loadProfile();

  // Update date/time every minute
  setInterval(updateDateTime, 60000);

  // Forms
  document.getElementById('createAccountForm').addEventListener('submit', createAccount);
  document.getElementById('depositForm').addEventListener('submit', deposit);
  document.getElementById('withdrawForm').addEventListener('submit', withdraw);
  document.getElementById('transferForm').addEventListener('submit', transfer);
  document.getElementById('transferIBANForm').addEventListener('submit', transferIBAN);
  document.getElementById('profileForm').addEventListener('submit', updateProfile);
});

function showSection(section) {
  const sections = ['dashboard', 'accounts', 'transactions', 'profile'];
  sections.forEach(s => {
    document.getElementById(`${s}-section`).style.display = s === section ? 'block' : 'none';
  });
}

async function loadDashboard() {
  try {
    // Set user name and date/time
    document.getElementById('userName').textContent = user.nom || 'Utilisateur';
    updateDateTime();

    // Récupérer les comptes frais depuis l'API
    const accountsRes = await fetch(`${API_BASE}/accounts`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (accountsRes.ok) {
      accounts = await accountsRes.json();
      document.getElementById('accountCount').textContent = accounts.length;
      const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.solde), 0);
      document.getElementById('totalBalance').textContent = `${totalBalance.toFixed(2)} €`;

      // Create accounts chart
      createAccountsChart(accounts);

      // Calculate monthly spending
      await loadMonthlySpending();
    }

    // Récupérer les transactions du premier compte
    if (accounts.length > 0) {
      const transactionsRes = await fetch(`${API_BASE}/transactions/history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (transactionsRes.ok) {
        const transactions = await transactionsRes.json();
        document.getElementById('transactionCount').textContent = transactions.length;

        // Load recent transactions for activity section
        loadRecentTransactions(transactions.slice(0, 5));
      }
    }
  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
  }
}

async function loadAccounts() {
  try {
    const response = await fetch(`${API_BASE}/accounts`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      accounts = await response.json();
      const accountsList = document.getElementById('accountsList');
      accountsList.innerHTML = '';

      accounts.forEach(account => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
          <div class="card account-card p-4">
            <div class="card-body text-center">
              <div class="mb-3">
                <i class="fas fa-credit-card fa-3x text-primary mb-3"></i>
                <h5 class="card-title">${account.type_compte.charAt(0).toUpperCase() + account.type_compte.slice(1)}</h5>
              </div>
              <div class="mb-3">
                <p class="mb-1"><strong>IBAN:</strong></p>
                <small class="text-muted">${account.iban}</small>
              </div>
              <div class="mb-3">
                <p class="mb-1"><strong>Solde:</strong></p>
                <h4 class="balance-${parseFloat(account.solde) >= 0 ? 'positive' : 'negative'}">${account.solde} €</h4>
              </div>
              <div class="mb-3">
                <span class="badge badge-modern ${account.statut === 'actif' ? 'bg-success' : 'bg-warning'}">${account.statut}</span>
              </div>
              <button class="btn btn-outline-danger btn-sm" onclick="deleteAccount(${account.id})">
                <i class="fas fa-trash"></i> Supprimer
              </button>
            </div>
          </div>
        `;
        accountsList.appendChild(card);
      });

      // Populate select options
      populateAccountSelects();
    }
  } catch (error) {
    console.error('Erreur chargement comptes:', error);
  }
}

function populateAccountSelects() {
  const selects = ['depositAccount', 'withdrawAccount', 'transferFrom', 'transferIBANFrom'];
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    accounts.forEach(account => {
      const option = document.createElement('option');
      option.value = account.id;
      option.textContent = `${account.type_compte} - ${account.iban} (${account.solde} €)`;
      select.appendChild(option);
    });
  });

  // Transfer to
  const transferTo = document.getElementById('transferTo');
  transferTo.innerHTML = '';
  accounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = `${account.type_compte} - ${account.iban}`;
    transferTo.appendChild(option);
  });
}

async function loadTransactions() {
  try {
    const response = await fetch(`${API_BASE}/transactions/history`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const transactions = await response.json();
      const transactionsList = document.getElementById('transactionsList');
      transactionsList.innerHTML = '<h4>Historique des transactions</h4><div class="table-responsive"><table class="table table-striped"><thead><tr><th>Date</th><th>Type</th><th>Montant</th><th>Description</th></tr></thead><tbody id="transactionsTableBody"></tbody></table></div>';

      const tbody = document.getElementById('transactionsTableBody');
      transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date(transaction.date_transaction).toLocaleDateString()}</td>
          <td>${transaction.type_transaction}</td>
          <td>${transaction.montant} €</td>
          <td>${transaction.description || ''}</td>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Erreur chargement transactions:', error);
  }
}

async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE}/users/profile`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const profile = await response.json();
      document.getElementById('profileNom').value = profile.nom;
      document.getElementById('profilePrenom').value = profile.prenom;
      document.getElementById('profileEmail').value = profile.email;
      document.getElementById('profileTelephone').value = profile.telephone || '';
      document.getElementById('profileDateNaissance').value = profile.date_naissance.split('T')[0];
      document.getElementById('profileAdresse').value = profile.adresse || '';
    }
  } catch (error) {
    console.error('Erreur chargement profil:', error);
  }
}

async function createAccount(e) {
  e.preventDefault();
  const type = document.getElementById('accountType').value;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify({ type_compte: type })
    });

    const data = await response.json();
    if (response.ok) {
      showToast('Compte créé avec succès !', 'success', 'Succès');
      loadAccounts();
      loadDashboard();
      bootstrap.Modal.getInstance(document.getElementById('createAccountModal')).hide();
    } else {
      showToast(data.message || 'Erreur création compte', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function deposit(e) {
  e.preventDefault();
  const accountId = document.getElementById('depositAccount').value;
  const amount = document.getElementById('depositAmount').value;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/transactions/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify({ compte_id: accountId, montant: amount })
    });

    const data = await response.json();
    if (response.ok) {
      showToast('Dépôt effectué avec succès !', 'success', 'Succès');
      loadAccounts();
      loadDashboard();
      loadTransactions();
      bootstrap.Modal.getInstance(document.getElementById('depositModal')).hide();
    } else {
      showToast(data.message || 'Erreur dépôt', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function withdraw(e) {
  e.preventDefault();
  const accountId = document.getElementById('withdrawAccount').value;
  const amount = document.getElementById('withdrawAmount').value;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/transactions/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify({ compte_id: accountId, montant: amount })
    });

    const data = await response.json();
    if (response.ok) {
      showToast('Retrait effectué avec succès !', 'success', 'Succès');
      loadAccounts();
      loadDashboard();
      loadTransactions();
      bootstrap.Modal.getInstance(document.getElementById('withdrawModal')).hide();
    } else {
      showToast(data.message || 'Erreur retrait', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function transfer(e) {
  e.preventDefault();
  const fromId = document.getElementById('transferFrom').value;
  const toId = document.getElementById('transferTo').value;
  const amount = document.getElementById('transferAmount').value;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/transactions/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify({ expediteur_id: fromId, destinataire_id: toId, montant: amount })
    });

    const data = await response.json();
    if (response.ok) {
      showToast('Virement effectué avec succès !', 'success', 'Succès');
      loadAccounts();
      loadDashboard();
      loadTransactions();
      bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
    } else {
      showToast(data.message || 'Erreur virement', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function transferIBAN(e) {
  e.preventDefault();
  const fromId = document.getElementById('transferIBANFrom').value;
  const iban = document.getElementById('transferIBANTo').value;
  const amount = document.getElementById('transferIBANAmount').value;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/transactions/transfer-iban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify({ expediteur_id: fromId, iban_destinataire: iban, montant: amount })
    });

    const data = await response.json();
    if (response.ok) {
      showToast('Virement effectué avec succès !', 'success', 'Succès');
      loadAccounts();
      loadDashboard();
      loadTransactions();
      bootstrap.Modal.getInstance(document.getElementById('transferIBANModal')).hide();
    } else {
      showToast(data.message || 'Erreur virement', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function updateProfile(e) {
  e.preventDefault();
  const profileData = {
    nom: document.getElementById('profileNom').value,
    prenom: document.getElementById('profilePrenom').value,
    telephone: document.getElementById('profileTelephone').value,
    adresse: document.getElementById('profileAdresse').value,
    date_naissance: document.getElementById('profileDateNaissance').value
  };

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    if (response.ok) {
      showToast('Profil mis à jour avec succès !', 'success', 'Succès');
      user.nom = profileData.nom;
      user.prenom = profileData.prenom;
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      showToast(data.message || 'Erreur mise à jour profil', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function deleteAccount(accountId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) return;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE}/accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken || ''
      }
    });

    if (response.ok) {
      showToast('Compte supprimé avec succès !', 'success', 'Succès');
      loadAccounts();
      loadDashboard();
    } else {
      const data = await response.json();
      showToast(data.message || 'Erreur suppression compte', 'error', 'Erreur');
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

// New functions for enhanced dashboard
function updateDateTime() {
  const now = new Date();
  document.getElementById('currentDate').textContent = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('currentTime').textContent = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadMonthlySpending() {
  if (accounts.length === 0) return;

  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const response = await fetch(`${API_BASE}/transactions/history/${accounts[0].id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const transactions = await response.json();
      const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() + 1 === currentMonth &&
               transactionDate.getFullYear() === currentYear &&
               (t.type_transaction === 'retrait' || t.type_transaction === 'virement');
      });

      const monthlySpending = monthlyTransactions.reduce((sum, t) => sum + parseFloat(t.montant), 0);
      document.getElementById('monthlySpending').textContent = `${monthlySpending.toFixed(2)} €`;
    }
  } catch (error) {
    console.error('Erreur chargement dépenses mensuelles:', error);
  }
}

function createAccountsChart(accounts) {
  const ctx = document.getElementById('accountsChart').getContext('2d');

  // Count accounts by type
  const accountTypes = {};
  accounts.forEach(account => {
    const type = account.type_compte.charAt(0).toUpperCase() + account.type_compte.slice(1);
    accountTypes[type] = (accountTypes[type] || 0) + 1;
  });

  const data = {
    labels: Object.keys(accountTypes),
    datasets: [{
      data: Object.values(accountTypes),
      backgroundColor: [
        '#007bff',
        '#28a745',
        '#ffc107',
        '#dc3545',
        '#6f42c1'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function loadRecentTransactions(transactions) {
  const container = document.getElementById('recentTransactions');
  container.innerHTML = '';

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="fas fa-inbox fa-2x mb-2"></i>
        <p>Aucune transaction récente</p>
      </div>
    `;
    return;
  }

  transactions.forEach(transaction => {
    const transactionItem = document.createElement('div');
    transactionItem.className = 'list-group-item border-0 px-0 py-3';

    const amountClass = transaction.type_transaction === 'depot' ? 'text-success' :
                       transaction.type_transaction === 'retrait' ? 'text-danger' : 'text-info';

    const iconClass = transaction.type_transaction === 'depot' ? 'fa-arrow-down' :
                     transaction.type_transaction === 'retrait' ? 'fa-arrow-up' : 'fa-exchange-alt';

    transactionItem.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="flex-shrink-0">
          <div class="bg-light rounded-circle p-2 me-3">
            <i class="fas ${iconClass} ${amountClass}"></i>
          </div>
        </div>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">${transaction.type_transaction.charAt(0).toUpperCase() + transaction.type_transaction.slice(1)}</h6>
              <small class="text-muted">${new Date(transaction.date).toLocaleDateString('fr-FR')}</small>
            </div>
            <div class="text-end">
              <span class="fw-bold ${amountClass}">${transaction.montant} €</span>
            </div>
          </div>
          ${transaction.description ? `<small class="text-muted">${transaction.description}</small>` : ''}
        </div>
      </div>
    `;

    container.appendChild(transactionItem);
  });
}

// Support Functions
document.getElementById('supportType').addEventListener('change', function() {
  const priorityField = document.getElementById('priorityField');
  if (this.value === 'ticket') {
    priorityField.style.display = 'block';
  } else {
    priorityField.style.display = 'none';
  }
});

document.getElementById('supportForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const type = document.getElementById('supportType').value;
  const subject = document.getElementById('supportSubject').value;
  const message = document.getElementById('supportMessage').value;
  const priority = document.getElementById('supportPriority').value;

  try {
    const csrfToken = await getCsrfToken();
    let response;
    if (type === 'ticket') {
      response = await fetch(`${API_BASE}/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({
          sujet: subject,
          description: message,
          priorite: priority
        })
      });
    } else {
      response = await fetch(`${API_BASE}/support/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom: user.nom + ' ' + user.prenom,
          email: user.email,
          sujet: subject,
          message: message
        })
      });
    }

    if (response.ok) {
      showToast(type === 'ticket' ? 'Ticket créé avec succès !' : 'Message envoyé avec succès !', 'success', 'Succès');
      bootstrap.Modal.getInstance(document.getElementById('supportModal')).hide();
      document.getElementById('supportForm').reset();
    } else {
      const data = await response.json();
      showToast(data.message || 'Erreur lors de l\'envoi', 'error', 'Erreur');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showToast('Erreur lors de l\'envoi', 'error', 'Erreur');
  }
});