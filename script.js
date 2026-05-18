
let isPremium = false; 

const upgradeProAlert = document.getElementById('upgradeProAlert');

import { 
    auth, db, collection, addDoc, query, orderBy, 
    limit, onSnapshot, serverTimestamp, doc, getDoc, setDoc 
} from "./auth/auth.js";

let userId = null;

// Escuta quando o usuário loga para carregar os limites dele
auth.onAuthStateChanged(async (user) => {
    if (user) {
        userId = user.uid;
        console.log("Usuário logado:", userId);
        
        // Só carrega os dados depois de ter o userId
        await loadUserLimits();
        loadChatHistory();
        
        // Atualiza o avatar na UI
        const avatar = document.querySelector('.user-avatar');
        if (avatar) avatar.innerText = user.displayName ? user.displayName[0] : user.email[0];
    } else {
        // Se não tiver usuário, manda pro login
        window.location.href = "login/login.html";
    }
});

// Função para salvar uma nova conversa ou mensagem
async function saveChatToFirebase(userText, aiResponse) {
    if (!userId) return;

    try {
        const chatRef = collection(db, "users", userId, "chats");
        await addDoc(chatRef, {
            title: userText.substring(0, 30) + "...", // Título baseado na pergunta
            lastMessage: aiResponse,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Erro ao salvar histórico: ", e);
    }
}

// Função para carregar e escutar o histórico (Apenas as últimas 7)
function loadChatHistory() {
    if (!userId) return;

    const historyContainer = document.querySelector('.history');
    const chatRef = collection(db, "users", userId, "chats");
    const q = query(chatRef, orderBy("timestamp", "desc"), limit(7));

    // Escuta em tempo real
    onSnapshot(q, (snapshot) => {
        // Limpa o conteúdo atual mantendo apenas o título "Recentes"
        historyContainer.innerHTML = '<p class="history-title">Recentes</p>';

        snapshot.forEach((doc) => {
            const chat = doc.data();
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <i class="ri-chat-3-line"></i>
                <span>${chat.title}</span>
            `;
            
            // Evento para (futuramente) carregar a conversa antiga
            item.onclick = () => console.log("Carregar chat:", doc.id);
            
            historyContainer.appendChild(item);
        });
    });
}

async function loadUserLimits() {
    if (!userId) return;
    const userDoc = doc(db, "usage_limits", userId);
    const snap = await getDoc(userDoc);

    if (snap.exists()) {
        const data = snap.data();
        const now = Date.now();

        for (const modelName in limits) {
            if (data[modelName]) {
                const modelData = data[modelName];
                const elapsed = Math.floor((now - modelData.startTime) / 1000);

                if (elapsed < limits[modelName].resetTime) {
                    // Ainda está no período de bloqueio
                    limits[modelName].current = modelData.current;
                    startResetTimer(modelName, limits[modelName].resetTime - elapsed);
                } else {
                    // Já passou o tempo, reseta no Firebase também
                    limits[modelName].current = 0;
                }
            }
        }
    }
    checkLimit();
}

async function syncLimitToFirebase(modelName) {
    if (!userId || limits[modelName].max === Infinity) return;
    
    const userDoc = doc(db, "usage_limits", userId);
    const now = Date.now();

    // Se for a primeira mensagem, define o tempo de início do reset
    const snap = await getDoc(userDoc);
    let startTime = now;
    
    if (snap.exists() && snap.data()[modelName] && limits[modelName].current > 1) {
        startTime = snap.data()[modelName].startTime;
    }

    await setDoc(userDoc, {
        [modelName]: {
            current: limits[modelName].current,
            startTime: startTime
        }
    }, { merge: true });
}


const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const welcomeContainer = document.getElementById('welcomeContainer');



function addMessage(text, type) {
    if (type === 'ai-message') {
        const container = document.createElement('div');
        container.classList.add('ai-message-container');

        // Cabeçalho do Modelo
        const modelHeader = document.createElement('div');
        modelHeader.classList.add('ai-model-header');
        let iconClass = currentModel === 'AI Fc2' ? 'ri-brain-line' : (currentModel === 'Pro Unt' ? 'ri-vip-diamond-line' : 'ri-flashlight-line');

        modelHeader.innerHTML = `<i class="${iconClass}"></i><span>${currentModel}</span>`;

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'ai-message');
        
        // Criamos as ações (Like, Copy, etc) mas as deixamos escondidas inicialmente
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-actions');
        actionsDiv.style.opacity = "0"; // Esconde até terminar de digitar
        actionsDiv.innerHTML = `
            <button class="action-btn btn-like" title="Gostei"><i class="ri-thumb-up-line"></i></button>
            <button class="action-btn btn-dislike" title="Não gostei"><i class="ri-thumb-down-line"></i></button>
            <button class="action-btn" title="Compartilhar"><i class="ri-share-line"></i></button>
            <button class="action-btn btn-copy" title="Copiar"><i class="ri-file-copy-line"></i></button>
        `;

        container.appendChild(modelHeader);
        container.appendChild(msgDiv);
        container.appendChild(actionsDiv);
        chatWindow.appendChild(container);

        // --- LÓGICA DO EFEITO DE DIGITAÇÃO ---
        let i = 0;
        const speed = 15; // Velocidade (ms por caractere)
        
        // Função interna para digitar o texto formatado
        function typeEffect() {
    if (!isTyping) return; // Se o usuário parou, interrompe o loop aqui

    if (i < text.length) {
        msgDiv.innerHTML = formatAIResponse(text.substring(0, i + 1));
        i++;
        chatWindow.scrollTop = chatWindow.scrollHeight;
        setTimeout(typeEffect, speed);
    } else {
        // FINALIZOU A DIGITAÇÃO NATURALMENTE
        toggleSendButton(false); 
        
        setTimeout(() => {
            const fills = msgDiv.querySelectorAll('.compare-bar-fill');
            fills.forEach(fill => {
                const targetWidth = fill.style.width;
                fill.style.width = '0%';
                setTimeout(() => { fill.style.width = targetWidth; }, 50);
            });
        }, 100);

        actionsDiv.style.transition = "opacity 0.5s ease";
        actionsDiv.style.opacity = "1";
        setupMessageActions(actionsDiv, text);
    }
}

        
        typeEffect();

    } else {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'user-message');
        msgDiv.innerText = text;
        chatWindow.appendChild(msgDiv);
    }
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


function setupMessageActions(actionsDiv, text) {
    actionsDiv.querySelector('.btn-like').onclick = () => showToast("Obrigado pelo seu Feedback!", "ri-heart-fill");
    
    actionsDiv.querySelector('.btn-dislike').onclick = () => showToast("Deseja sugerir uma melhoria?", "ri-questionnaire-line", true);
    
    actionsDiv.querySelector('.btn-copy').onclick = function() {
        navigator.clipboard.writeText(text).then(() => {
            showToast("Copiado!", "ri-checkbox-circle-fill");
            this.innerHTML = '<i class="ri-check-line" style="color: #10b981;"></i>';
            setTimeout(() => { this.innerHTML = '<i class="ri-file-copy-line"></i>'; }, 2000);
        });
    };
}


// 1. Seleção dos elementos do Modal de Feedback
const feedbackModal = document.getElementById('feedbackModal');
const closeFeedback = document.getElementById('closeFeedback');
const submitFeedback = document.getElementById('submitFeedback');

// 2. Função showToast atualizada para abrir o modal
function showToast(message, icon, hasActions = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    
    let html = `<i class="${icon}"></i> <span>${message}</span>`;
    
    if (hasActions) {
        html += `
            <div class="toast-actions">
                <button class="toast-btn btn-confirm"><i class="ri-thumb-up-line"></i> Sim</button>
                <button class="toast-btn secondary btn-later"><i class="ri-time-line"></i> Mais tarde</button>
            </div>
        `;
    }
    
    toast.innerHTML = html;
    container.appendChild(toast);

    const closeToast = () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    };

    if (hasActions) {
        // Ao clicar em SIM, abre o modal de feedback
        toast.querySelector('.btn-confirm').onclick = () => {
            feedbackModal.classList.add('active');
            closeToast();
        };
        toast.querySelector('.btn-later').onclick = closeToast;
        setTimeout(closeToast, 8000);
    } else {
        setTimeout(closeToast, 3000);
    }
}

// 3. Listeners do Modal de Feedback
closeFeedback.onclick = () => feedbackModal.classList.remove('active');

submitFeedback.onclick = () => {
    const type = document.getElementById('feedbackType').value;
    const msg = document.getElementById('feedbackText').value;

    if(msg.trim() === "") {
        showToast("Por favor, descreva sua sugestão.", "ri-error-warning-line");
        return;
    }

    // Aqui você enviaria para o seu banco de dados (Firebase)
    console.log("Feedback enviado:", { type, msg });
    
    feedbackModal.classList.remove('active');
    document.getElementById('feedbackText').value = ""; // Limpa o campo
    showToast("Feedback enviado com sucesso!", "ri-checkbox-circle-fill");
};

// Fechar modal ao clicar fora (adicione esta linha no seu window listener existente)
window.addEventListener('click', (e) => {
    if (e.target === feedbackModal) feedbackModal.classList.remove('active');
});

// Função para formatar Negrito, Itálico e Listas da IA
function formatAIResponse(text) {
    let formatted = text;

    // 1. RENDERIZADOR DE GRÁFICO (Corrigido para ser robusto)
    formatted = formatted.replace(/\[COMPARE\]([\s\S]*?)\[\/COMPARE\]/g, (match, content) => {
        const lines = content.trim().split('\n');
        let html = '<div class="gemini-compare-container">';
        
        lines.forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine.includes('|')) {
                const parts = cleanLine.split('|').map(s => s.trim());
                const label = parts[0];
                const percentage = parts[1] || '0';
                // Se a cor não for enviada, usa a cor primária definida no seu CSS
                const barColor = parts[2] || 'var(--primary-color)';
                
                html += `
                    <div class="compare-item">
                        <div class="compare-info">
                            <span class="compare-label">${label}</span>
                            <span class="compare-value">${percentage}%</span>
                        </div>
                        <div class="compare-bar-bg">
                            <div class="compare-bar-fill" style="width: ${percentage}%; background: ${barColor};"></div>
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        return html;
    });

    // 2. Formata Negrito **texto**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Formata Itálico *texto*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 4. Formata Listas
    formatted = formatted.replace(/^\s*[\*\-]\s+(.*)$/gm, '<li>$1</li>');

    // 5. Quebras de linha (Adicione isto para o texto normal não ficar colado)
    // Mas evitamos quebrar dentro do container do gráfico
    if (!formatted.includes('gemini-compare-container')) {
        formatted = formatted.replace(/\n/g, '<br>');
    }

    return formatted;
}


// Função auxiliar para evitar que o código HTML seja executado pelo navegador
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

// Função global para copiar o código do bloco
window.copyCode = function(button) {
    const container = button.closest('.code-block-container');
    const code = container.querySelector('code').innerText;

    navigator.clipboard.writeText(code).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="ri-check-line" style="color: #22c55e;"></i> Copiado!';
        button.style.borderColor = "#22c55e";
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.borderColor = "#444";
        }, 2000);
    });
};



// Função principal de envio atualizada com limites
let currentAbortController = null; // Controla a requisição da API
let isTyping = false; // Controla o loop de digitação

async function handleSend() {
    // Se estiver digitando e clicar no botão, ele deve PARAR
    if (isTyping) {
        stopResponse();
        return;
    }

    const text = userInput.value.trim();
    if (!text || !checkLimit()) return; 

    if (welcomeContainer) welcomeContainer.remove(); 

    addMessage(text, 'user-message');
    incrementUsage();

    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Inicia o estado de processamento
    toggleSendButton(true);
    currentAbortController = new AbortController();

    const loadingDiv = document.createElement('div');
    loadingDiv.id = "ai-loading-state";
    loadingDiv.classList.add('ai-message-container');
    loadingDiv.innerHTML = `
        <div class="ai-model-header"><i class="ri-shining-2-line"></i><span>Wanga está processando...</span></div>
        <div class="typing-loader"><span></span><span></span><span></span></div>
    `;
    chatWindow.appendChild(loadingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
    
    const currentUser = auth.currentUser;
        const nameToUse = currentUser ? (currentUser.displayName || "parceiro") : "parceiro";

        // Passa o nome como terceiro argumento
        const aiResponse = await getGroqResponse(text, currentAbortController.signal, nameToUse);
        
        const currentLoading = document.getElementById('ai-loading-state');
        if (currentLoading) currentLoading.remove();

        if (aiResponse) {
            addMessage(aiResponse, 'ai-message');
            
            // Salva no Firebase após a IA responder com sucesso
    saveChatToFirebase(text, aiResponse); 
            
        } else {
            // Se foi abortado, removemos o loading e resetamos
            toggleSendButton(false);
        }
        
    } catch (err) {
        const currentLoading = document.getElementById('ai-loading-state');
        if (currentLoading) currentLoading.remove();
        
        if (err.name === 'AbortError') {
            console.log("Interrompido.");
        } else {
            addMessage("Erro ao conectar com o servidor.", "ai-message");
        }
        toggleSendButton(false);
    }
}

// Função para alternar o botão
function toggleSendButton(isAIResponding) {
    isTyping = isAIResponding;
    const icon = sendBtn.querySelector('i');
    
    if (isAIResponding) {
        // Vira botão de PARAR
        icon.className = 'ri-stop-circle-fill';
        sendBtn.style.color = "#ef4444"; 
    } else {
        // Volta a ser botão de ENVIAR
        icon.className = 'ri-send-plane-2-fill';
        sendBtn.style.color = "var(--primary-color)";
    }
}

function stopResponse() {
    if (currentAbortController) {
        currentAbortController.abort();
    }
    isTyping = false;
    toggleSendButton(false);
}




// Evento do botão enviar
sendBtn.addEventListener('click', handleSend);

// Enviar ao apertar Enter (sem Shift)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Função para os cards de sugestão com efeito de digitação
function fillInput(text) {
    const welcomeContainer = document.getElementById('welcomeContainer');
    const inputField = document.getElementById('userInput');
    
    // Limpa o campo antes de começar
    inputField.value = "";
    let i = 0;
    const speed = 30; // Velocidade da digitação em milissegundos

    function typeWriter() {
        if (i < text.length) {
            inputField.value += text.charAt(i);
            i++;
            // Ajusta a altura do textarea conforme digita
            inputField.style.height = 'auto';
            inputField.style.height = (inputField.scrollHeight) + 'px';
            setTimeout(typeWriter, speed);
        } else {
            // Quando terminar de digitar, espera um pouco e remove o container
            setTimeout(() => {
                if (welcomeContainer) {
                    welcomeContainer.classList.add('fade-out');
                    setTimeout(() => {
                        welcomeContainer.remove();
                        handleSend();
                    }, 400);
                } else {
                    handleSend();
                }
            }, 200);
        }
    }

    typeWriter();
}

// Expõe a função para o HTML (onclick)
window.fillInput = fillInput;

// --- LOGICA DA SIDEBAR ---
const sidebar = document.querySelector('.sidebar');
const menuBtn = document.querySelector('.menu-mobile');
const overlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

menuBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// Ajuste automático do textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});


// Configurações de Limite
const limits = {
    "AI Vt3": { max: 5, current: 0, resetTime: 300, timer: null },
    "AI Fc2": { max: 10, current: 0, resetTime: 300, timer: null },
    "Pro Unt": { max: Infinity, current: 0 }
};

let currentModel = "AI Vt3";

// Elementos da UI
const limitAlert = document.getElementById('limitAlert');
const timerDisplay = document.getElementById('timer-display');
const sendButton = document.getElementById('sendBtn');
const textArea = document.getElementById('userInput');

// Função chamada no clique do dropdown (atualiza o modelo atual)
document.querySelectorAll('.model-option').forEach(option => {
    option.addEventListener('click', () => {
        const selectedModel = option.getAttribute('data-model');
        
        // Se o modelo for Pro e o usuário NÃO for premium
        if (selectedModel === "Pro Unt" && !isPremium) {
            // Mostra o aviso de upgrade
            upgradeProAlert.classList.add('active');
            
            // Bloqueia o input e o botão de envio
            sendButton.disabled = true;
            textArea.disabled = true;
            textArea.placeholder = "Modelo restrito a assinantes...";
            
            // Esconde o outro alerta de limite se estiver aberto
            limitAlert.classList.remove('active');
        } else {
            // Se escolher um modelo grátis ou for premium, remove o alerta
            upgradeProAlert.classList.remove('active');
            
            // Atualiza o modelo atual e re-verifica os limites normais
            currentModel = selectedModel;
            const currentModelDisplay = document.getElementById('currentModel');
            if (currentModelDisplay) currentModelDisplay.innerText = currentModel;
            
            checkLimit(); // Chama sua função existente de limites
        }

        if (typeof modelDropdown !== 'undefined') modelDropdown.classList.remove('show');
    });
});


// Intercepta o envio de mensagens no script.js original
function checkLimit() {
    const model = limits[currentModel];
    
    if (model.current >= model.max) {
        limitAlert.classList.add('active');
        sendButton.disabled = true;
        textArea.disabled = true;
        textArea.placeholder = "Aguarde a restauração...";
        return false;
    } else {
        limitAlert.classList.remove('active');
        sendButton.disabled = false;
        textArea.disabled = false;
        textArea.placeholder = "Digite uma mensagem...";
        return true;
    }
}

const originalCheckLimit = checkLimit;
checkLimit = function() {
    if (currentModel === "Pro Unt" && !isPremium) {
        upgradeProAlert.classList.add('active');
        return false;
    }
    upgradeProAlert.classList.remove('active');
    return originalCheckLimit(); 
};

// Função para incrementar o uso (chame isso dentro do handleSend no seu script principal)
async function incrementUsage() {
    const model = limits[currentModel];
    if (model.max === Infinity) return;

    model.current++;
    
    if (model.current === 1) {
        startResetTimer(currentModel, model.resetTime);
    }
    
    await syncLimitToFirebase(currentModel);
    checkLimit();
}

function startResetTimer(modelName, secondsOverride = null) {
    const model = limits[modelName];
    let timeLeft = secondsOverride || model.resetTime;

    if (model.timer) clearInterval(model.timer);

    model.timer = setInterval(async () => {
        timeLeft--;
        
        if (currentModel === modelName) {
            updateTimerUI(timeLeft);
        }

        if (timeLeft <= 0) {
            clearInterval(model.timer);
            model.current = 0;
            model.timer = null;
            // Limpa o registro no Firebase ao expirar
            if (userId) {
                const userDoc = doc(db, "usage_limits", userId);
                await setDoc(userDoc, { [modelName]: null }, { merge: true });
            }
            checkLimit();
        }
    }, 1000);
}

function updateTimerUI(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}



// --- LÓGICA DO PERFIL ---
const profileBtn = document.querySelector('.ri-user-line').parentElement;
const profileModal = document.getElementById('profileModal');
const closeProfile = document.getElementById('closeProfile');

// Abrir Modal de Perfil
profileBtn.addEventListener('click', () => {
    profileModal.classList.add('active');
    
    const user = auth.currentUser;
    if (user) {
        document.getElementById('profileEmail').innerText = user.email;
        document.getElementById('profileName').innerText = user.displayName || "Usuário Wanga";
        
        const firstLetter = (user.displayName || user.email).charAt(0).toUpperCase();
        document.getElementById('profileAvatar').innerText = firstLetter;
        
        // CHAMA A ATUALIZAÇÃO DOS LIMITES
        updateProfileStats();
    }
});

// Fechar Modal
closeProfile.addEventListener('click', () => {
    profileModal.classList.remove('active');
});

// Fechar ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === profileModal) profileModal.classList.remove('active');
    if (e.target === notificationsModal) notificationsModal.classList.remove('active');
});


// Função para atualizar a UI de limites no perfil
function updateProfileStats() {
    const models = ["AI Vt3", "AI Fc2"];
    const ids = { "AI Vt3": "vt3", "AI Fc2": "fc2" };

    models.forEach(m => {
        const modelData = limits[m];
        const span = document.getElementById(`usage-${ids[m]}`);
        const bar = document.getElementById(`bar-${ids[m]}`);
        
        if (span && bar) {
            // Atualiza o texto (ex: 3 / 5)
            span.innerText = modelData.current;
            
            // Atualiza a barra de progresso
            const percentage = (modelData.current / modelData.max) * 100;
            bar.style.width = `${Math.min(percentage, 100)}%`;
            
            // Muda a cor se estiver acabando
            if (percentage >= 80) bar.style.background = "#ef4444";
        }
    });
}


