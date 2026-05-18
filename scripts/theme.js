const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = document.getElementById('darkModeIcon');
const darkModeText = document.getElementById('darkModeText');

// Verifica se o usuário já tinha uma preferência salva
if (localStorage.getItem('theme') === 'dark') {
    enableDarkMode();
}

darkModeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
});

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    darkModeIcon.classList.replace('ri-moon-line', 'ri-sun-line');
    darkModeText.innerText = "Modo Claro";
    localStorage.setItem('theme', 'dark');
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    darkModeIcon.classList.replace('ri-sun-line', 'ri-moon-line');
    darkModeText.innerText = "Modo Escuro";
    localStorage.setItem('theme', 'light');
}

