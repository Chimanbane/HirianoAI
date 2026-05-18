// --- LÓGICA DE NOTIFICAÇÕES ---
const notificationBtn = document.querySelector('.ri-notification-3-line').parentElement;
const notificationsModal = document.getElementById('notificationsModal');
const closeNotifications = document.getElementById('closeNotifications');

// Abre o modal
notificationBtn.addEventListener('click', () => {
    notificationsModal.classList.add('active');
});

// Fecha o modal no botão X
closeNotifications.addEventListener('click', () => {
    notificationsModal.classList.remove('active');
});

// Fecha o modal se clicar fora da caixa branca
notificationsModal.addEventListener('click', (e) => {
    if (e.target === notificationsModal) {
        notificationsModal.classList.remove('active');
    }
});

// Ajuste na lógica de abertura
const badge = document.querySelector('.notification-badge');

notificationBtn.addEventListener('click', () => {
    notificationsModal.classList.add('active');
    
    // Remove o badge (pontinho) quando o usuário lê as notificações
    if (badge) {
        badge.style.display = 'none';
    }
});
