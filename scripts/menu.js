// --- LÓGICA DA SIDEBAR MOBILE ---
const sidebar = document.querySelector('.sidebar');
const menuBtn = document.querySelector('.menu-mobile');
const overlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Opcional: Impede o scroll do fundo quando o menu está aberto
    if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

// Eventos de clique
menuBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// Fechar ao clicar em um item do histórico (melhora UX no mobile)
document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
});


// FILTRAR RECENTES 
const historySearch = document.getElementById('historySearch');

if (historySearch) {
    historySearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.history-item');

        items.forEach(item => {
            const text = item.innerText.toLowerCase();
            if (text.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}
