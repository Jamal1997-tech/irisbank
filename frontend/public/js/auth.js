const API_BASE = 'http://localhost:3000/api';

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
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Connexion
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, mot_de_passe: password })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      } else {
        showToast(data.message || 'Erreur de connexion', 'error', 'Erreur');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur de connexion au serveur', 'error', 'Erreur');
    }
  });

  // Inscription
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userData = {
      nom: document.getElementById('nom').value,
      prenom: document.getElementById('prenom').value,
      email: document.getElementById('registerEmail').value,
      telephone: document.getElementById('telephone').value,
      adresse: document.getElementById('adresse').value,
      date_naissance: document.getElementById('date_naissance').value,
      mot_de_passe: document.getElementById('registerPassword').value
    };

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success', 'Succès');
        document.getElementById('login-tab').click();
      } else {
        showToast(data.message || 'Erreur d\'inscription', 'error', 'Erreur');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur de connexion au serveur', 'error', 'Erreur');
    }
  });
});