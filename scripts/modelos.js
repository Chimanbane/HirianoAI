const modelSelector = document.getElementById('modelSelector');
const modelDropdown = document.getElementById('modelDropdown');
const currentModelText = document.getElementById('currentModel');
const modelOptions = document.querySelectorAll('.model-option');

// Abrir/Fechar Dropdown
modelSelector.addEventListener('click', (e) => {
    // Impede que o clique feche imediatamente ao abrir
    e.stopPropagation();
    modelDropdown.classList.toggle('show');
});

// Selecionar Modelo
modelOptions.forEach(option => {
    option.addEventListener('click', () => {
        const selectedModel = option.getAttribute('data-model');
        
        // Atualiza o texto no cabeçalho
        currentModelText.innerText = selectedModel;
        
        // Remove 'active' de todos e adiciona no selecionado
        modelOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Fecha o menu
        modelDropdown.classList.remove('show');
    });
});

// Fechar se clicar fora do menu
document.addEventListener('click', () => {
    modelDropdown.classList.remove('show');
});