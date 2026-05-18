const contextMenu = document.getElementById('messageContextMenu');
let longPressTimer;
let currentSelectedText = "";

// Função para abrir o menu na posição do clique
function showMenu(x, y, text) {
    currentSelectedText = text;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.left = `${x}px`;
    contextMenu.style.display = 'flex';
}

// Esconder menu ao clicar fora
document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});

// Lógica de Long Press nas mensagens
document.addEventListener('mousedown', handleStart);
document.addEventListener('touchstart', handleStart);
document.addEventListener('mouseup', handleEnd);
document.addEventListener('touchend', handleEnd);

function handleStart(e) {
    const messageElement = e.target.closest('.message');
    if (messageElement) {
        // Se segurar por 600ms, abre o menu
        longPressTimer = setTimeout(() => {
            const x = e.pageX || e.touches[0].pageX;
            const y = e.pageY || e.touches[0].pageY;
            showMenu(x, y, messageElement.innerText);
            
            // Vibração leve em dispositivos móveis (opcional)
            if (navigator.vibrate) navigator.vibrate(50);
        }, 600); 
    }
}

function handleEnd() {
    clearTimeout(longPressTimer);
}

// Lógica das ações do menu
document.querySelectorAll('.menu-item-action').forEach(item => {
    item.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        
        if (action === 'copy') {
            navigator.clipboard.writeText(currentSelectedText);
            showToast("Copiado para a área de transferência!", "ri-checkbox-circle-fill");
        } else if (action === 'delete') {
            showToast("Função de apagar em desenvolvimento", "ri-delete-bin-line");
        }
        
        contextMenu.style.display = 'none';
    });
});
