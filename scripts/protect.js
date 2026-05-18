// 🔒 BLOQUEAR CLIQUE DIREITO APENAS NAS MENSAGENS
document.addEventListener("contextmenu", (e) => {
    if (e.target.closest(".ai-message, .user-message")) {
        e.preventDefault();
    }
});

// 🔒 BLOQUEAR SELEÇÃO APENAS NAS MENSAGENS
document.addEventListener("selectstart", (e) => {
    if (e.target.closest(".ai-message, .user-message")) {
        e.preventDefault();
    }
});

// 🔒 BLOQUEAR CTRL+C apenas se estiver nas mensagens
document.addEventListener("keydown", (e) => {
    if (
        e.ctrlKey &&
        ["c", "x"].includes(e.key.toLowerCase())
    ) {
        const selection = window.getSelection();
        if (selection && selection.anchorNode) {
            const parent = selection.anchorNode.parentElement;
            if (parent && parent.closest(".ai-message, .user-message")) {
                e.preventDefault();
            }
        }
    }
});