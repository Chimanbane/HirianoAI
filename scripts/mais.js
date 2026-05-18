document.addEventListener('DOMContentLoaded', () => {
    const attachBtn = document.getElementById('attachBtn');
    const attachmentMenu = document.getElementById('attachmentMenu');

    // Abre/Fecha o menu ao clicar no botão +
    attachBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede que o clique feche o menu imediatamente
        attachmentMenu.classList.toggle('show');
        attachBtn.classList.toggle('active');
    });

    // Fecha o menu se clicar em qualquer outro lugar da tela
    document.addEventListener('click', (e) => {
        if (!attachmentMenu.contains(e.target) && e.target !== attachBtn) {
            attachmentMenu.classList.remove('show');
            attachBtn.classList.remove('active');
        }
    });

    // Ação para os itens (exemplo)
    const items = document.querySelectorAll('.attach-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const label = item.querySelector('span').innerText;
            console.log(`Abrindo: ${label}`);
            attachmentMenu.classList.remove('show');
            attachBtn.classList.remove('active');
        });
    });
});
