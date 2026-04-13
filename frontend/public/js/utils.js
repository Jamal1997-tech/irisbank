// Fonction pour afficher des toasts Bootstrap au lieu des alertes
function showToast(message, type = 'info', title = 'Notification') {
  const toastElement = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  const toastHeader = toastElement.querySelector('.toast-header');

  // Changer la couleur selon le type
  toastHeader.className = 'toast-header';
  if (type === 'success') {
    toastHeader.classList.add('bg-success', 'text-white');
  } else if (type === 'error') {
    toastHeader.classList.add('bg-danger', 'text-white');
  } else if (type === 'warning') {
    toastHeader.classList.add('bg-warning');
  } else {
    toastHeader.classList.add('bg-info', 'text-white');
  }

  // Changer l'icône selon le type
  const iconElement = toastHeader.querySelector('i');
  if (type === 'success') {
    iconElement.className = 'fas fa-check-circle me-2';
  } else if (type === 'error') {
    iconElement.className = 'fas fa-exclamation-triangle me-2';
  } else if (type === 'warning') {
    iconElement.className = 'fas fa-exclamation-circle me-2';
  } else {
    iconElement.className = 'fas fa-info-circle me-2';
  }

  toastTitle.textContent = title;
  toastMessage.textContent = message;

  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}