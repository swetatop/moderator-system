// Основные данные
let candidates = JSON.parse(localStorage.getItem('candidates')) || [];
let moderators = JSON.parse(localStorage.getItem('moderators')) || [];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Загрузка сохранённых данных
    loadSavedData();
    
    // Инициализация страниц
    initCandidatesPage();
    initModeratorsPage();
    initTrainingPage();
    updateDashboard();
    
    // Настройка Google Forms подключения
    setupGoogleFormsIntegration();
}

// Загрузка сохранённых данных
function loadSavedData() {
    const savedSheetsId = localStorage.getItem('googleSheetsId');
    if (savedSheetsId && document.getElementById('sheetsId')) {
        document.getElementById('sheetsId').value = savedSheetsId;
    }
}

// Инициализация страницы кандидатов
function initCandidatesPage() {
    const candidatesList = document.getElementById('candidatesList');
    if (candidatesList) {
        renderCandidates();
        setupCandidatesEventListeners();
    }
}

// Инициализация страницы модераторов
function initModeratorsPage() {
    const moderatorsList = document.getElementById('moderatorsList');
    if (moderatorsList) {
        renderModerators();
        setupModeratorsEventListeners();
    }
}

// Инициализация страницы инструктажа
function initTrainingPage() {
    // Можно добавить специфичную логику для страницы обучения
}

// Настройка интеграции с Google Forms
function setupGoogleFormsIntegration() {
    const connectBtn = document.getElementById('connectSheets');
    const syncBtn = document.getElementById('syncGoogleForms');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', function() {
            const sheetsId = document.getElementById('sheetsId').value;
            connectGoogleSheets(sheetsId);
        });
    }
    
    if (syncBtn) {
        syncBtn.addEventListener('click', function() {
            const sheetsId = localStorage.getItem('googleSheetsId');
            if (sheetsId) {
                connectGoogleSheets(sheetsId);
            } else {
                alert('Спочатку підключіть Google Tables');
            }
        });
    }
}

// Рендер кандидатов
function renderCandidates(filteredCandidates = null) {
    const data = filteredCandidates || candidates;
    const container = document.getElementById('candidatesList');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                    <h3>Немає кандидатів</h3>
                    <p>Додайте першого кандидата або підключіть Google Forms</p>
                </div>
            </div>
        `;
        return;
    }
    
    data.forEach(candidate => {
        const candidateCard = document.createElement('div');
        candidateCard.className = 'candidate-card';
        candidateCard.innerHTML = `
            <div class="candidate-header">
                <div>
                    <div class="candidate-name">${escapeHtml(candidate.name)}</div>
                    <div class="candidate-discord">${escapeHtml(candidate.discord)}</div>
                </div>
                <span class="status-badge status-${candidate.status}">
                    ${getStatusText(candidate.status)}
                </span>
            </div>
            <div class="candidate-info">
                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">
                    📅 Додано: ${new Date(candidate.dateAdded).toLocaleDateString()}
                </div>
                ${candidate.notes ? `
                    <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem;">
                        <strong>Нотатки:</strong> ${escapeHtml(candidate.notes)}
                    </div>
                ` : ''}
                ${candidate.source === 'google_forms' ? `
                    <div style="color: var(--accent-green); font-size: 0.8rem; margin-top: 0.5rem;">
                        📊 Імпортовано з Google Forms
                    </div>
                ` : ''}
            </div>
            <div class="candidate-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button onclick="editCandidate(${candidate.id})" class="btn-secondary" style="flex: 1;">Редагувати</button>
                <button onclick="deleteCandidate(${candidate.id})" class="btn-secondary" style="flex: 1;">Видалити</button>
            </div>
        `;
        container.appendChild(candidateCard);
    });
}

// Рендер модераторов
function renderModerators() {
    const container = document.getElementById('moderatorsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (moderators.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🛡️</div>
                    <h3>Ще немає модераторів</h3>
                    <p>Додайте першого модератора до команди</p>
                </div>
            </div>
        `;
        return;
    }
    
    moderators.forEach(moderator => {
        const moderatorCard = document.createElement('div');
        moderatorCard.className = 'moderator-card';
        
        const stars = '★'.repeat(moderator.rating) + '☆'.repeat(5 - moderator.rating);
        
        moderatorCard.innerHTML = `
            <div class="moderator-header">
                <div>
                    <div class="moderator-name">${escapeHtml(moderator.name)}</div>
                    <div class="moderator-discord">${escapeHtml(moderator.discord)}</div>
                </div>
                <span class="status-badge status-${moderator.status}">
                    ${getModeratorStatusText(moderator.status)}
                </span>
            </div>
            
            <div class="moderator-rating">
                <span class="rating-stars">${stars}</span>
                <span style="color: var(--text-secondary);">(${moderator.rating}/5)</span>
            </div>
            
            ${moderator.comments ? `
                <div class="moderator-comments">
                    <strong>Коментарі:</strong><br>
                    ${escapeHtml(moderator.comments)}
                </div>
            ` : ''}
            
            <div class="moderator-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button onclick="editModerator(${moderator.id})" class="btn-secondary" style="flex: 1;">Редагувати</button>
                <button onclick="deleteModerator(${moderator.id})" class="btn-secondary" style="flex: 1;">Видалити</button>
            </div>
        `;
        container.appendChild(moderatorCard);
    });
    
    updateModeratorsStats();
}

// Обновление статистики модераторов
function updateModeratorsStats() {
    const total = moderators.length;
    const active = moderators.filter(m => m.status === 'active').length;
    const avgRating = moderators.length > 0 
        ? (moderators.reduce((sum, m) => sum + m.rating, 0) / moderators.length).toFixed(1)
        : '0.0';
    
    if (document.getElementById('totalModerators')) {
        document.getElementById('totalModerators').textContent = total;
    }
    if (document.getElementById('activeCount')) {
        document.getElementById('activeCount').textContent = active;
    }
    if (document.getElementById('avgTeamRating')) {
        document.getElementById('avgTeamRating').textContent = avgRating;
    }
}

// Текст статуса для кандидатов
function getStatusText(status) {
    const statusMap = {
        'new': 'Новий',
        'interview': 'Співбесіда',
        'approved': 'Схвалений',
        'rejected': 'Відхилений'
    };
    return statusMap[status] || status;
}

// Текст статуса для модераторов
function getModeratorStatusText(status) {
    const statusMap = {
        'active': 'Активний',
        'inactive': 'Неактивний',
        'vacation': 'Відпустка'
    };
    return statusMap[status] || status;
}

// Экранирование HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Обновление дашборда
function updateDashboard() {
    if (document.getElementById('totalCandidates')) {
        document.getElementById('totalCandidates').textContent = candidates.length;
    }
    if (document.getElementById('activeModerators')) {
        document.getElementById('activeModerators').textContent = moderators.filter(m => m.status === 'active').length;
    }
    if (document.getElementById('avgRating')) {
        const avg = moderators.length > 0 
            ? (moderators.reduce((sum, m) => sum + m.rating, 0) / moderators.length).toFixed(1)
            : '0.0';
        document.getElementById('avgRating').textContent = avg;
    }
}

// Сохранение данных
function saveData() {
    localStorage.setItem('candidates', JSON.stringify(candidates));
    localStorage.setItem('moderators', JSON.stringify(moderators));
    updateDashboard();
}

// Добавь остальные функции из предыдущей версии (модальные окна, фильтрация и т.д.)
// ... (остальной код из предыдущего script.js)

// Функции для модераторов
function setupModeratorsEventListeners() {
    const addBtn = document.getElementById('addModeratorBtn');
    const modal = document.getElementById('moderatorModal');
    const form = document.getElementById('moderatorForm');
    const cancelBtn = document.getElementById('moderatorModalCancel');
    
    if (addBtn) addBtn.addEventListener('click', () => openModeratorModal());
    if (cancelBtn) cancelBtn.addEventListener('click', closeModeratorModal);
    if (form) form.addEventListener('submit', saveModerator);
}

function openModeratorModal(moderator = null) {
    const modal = document.getElementById('moderatorModal');
    const form = document.getElementById('moderatorForm');
    const title = document.getElementById('moderatorModalTitle');
    
    if (moderator) {
        title.textContent = 'Редагувати модератора';
        document.getElementById('moderatorName').value = moderator.name;
        document.getElementById('moderatorDiscord').value = moderator.discord;
        document.getElementById('moderatorRating').value = moderator.rating;
        document.getElementById('moderatorStatus').value = moderator.status;
        document.getElementById('moderatorComments').value = moderator.comments || '';
        form.dataset.editId = moderator.id;
    } else {
        title.textContent = 'Додати модератора';
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.style.display = 'block';
}

function closeModeratorModal() {
    document.getElementById('moderatorModal').style.display = 'none';
}

function saveModerator(e) {
    e.preventDefault();
    
    const form = e.target;
    const name = document.getElementById('moderatorName').value;
    const discord = document.getElementById('moderatorDiscord').value;
    const rating = parseInt(document.getElementById('moderatorRating').value);
    const status = document.getElementById('moderatorStatus').value;
    const comments = document.getElementById('moderatorComments').value;
    
    if (form.dataset.editId) {
        // Редактирование
        const id = parseInt(form.dataset.editId);
        const index = moderators.findIndex(m => m.id === id);
        if (index !== -1) {
            moderators[index] = { ...moderators[index], name, discord, rating, status, comments };
        }
    } else {
        // Добавление нового
        const newModerator = {
            id: Date.now(),
            name,
            discord,
            rating,
            status,
            comments,
            dateAdded: new Date().toISOString()
        };
        moderators.push(newModerator);
    }
    
    saveData();
    renderModerators();
    closeModeratorModal();
}

function editModerator(id) {
    const moderator = moderators.find(m => m.id === id);
    if (moderator) {
        openModeratorModal(moderator);
    }
}

function deleteModerator(id) {
    if (confirm('Видалити цього модератора?')) {
        moderators = moderators.filter(m => m.id !== id);
        saveData();
        renderModerators();
    }
}

// Функция для отметки инструктажа как проведенного
function markTrainingCompleted() {
    const completedTrainings = JSON.parse(localStorage.getItem('completedTrainings')) || [];
    const today = new Date().toISOString().split('T')[0];
    
    if (!completedTrainings.includes(today)) {
        completedTrainings.push(today);
        localStorage.setItem('completedTrainings', JSON.stringify(completedTrainings));
        alert('✅ Інструктаж відмічено як проведений сьогодні');
    } else {
        alert('ℹ️ Інструктаж вже був проведений сьогодні');
    }
}

// Закрытие модалок по клику вне
window.addEventListener('click', function(e) {
    const candidateModal = document.getElementById('candidateModal');
    const moderatorModal = document.getElementById('moderatorModal');
    
    if (e.target === candidateModal) closeModal();
    if (e.target === moderatorModal) closeModeratorModal();
});
