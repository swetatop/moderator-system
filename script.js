// База данных кандидатов
let candidates = JSON.parse(localStorage.getItem('candidates')) || [];

// Элементы DOM
const candidatesList = document.getElementById('candidatesList');
const candidateForm = document.getElementById('candidateForm');
const candidateModal = document.getElementById('candidateModal');
const addCandidateBtn = document.getElementById('addCandidateBtn');
const modalCancel = document.getElementById('modalCancel');

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Инициализация главной страницы
    updateDashboardStats();
    
    // Инициализация страницы кандидатов
    if (candidatesList) {
        renderCandidates();
        setupEventListeners();
    }
}

// Обновление статистики на главной
function updateDashboardStats() {
    const totalCandidates = candidates.length;
    const newToday = candidates.filter(c => {
        const today = new Date().toDateString();
        return new Date(c.dateAdded).toDateString() === today;
    }).length;
    
    const needReview = candidates.filter(c => c.status === 'new').length;
    
    // Обновляем элементы если они есть на странице
    if (document.getElementById('candidatesCount')) {
        document.getElementById('candidatesCount').textContent = needReview;
    }
    if (document.getElementById('trainingProgress')) {
        document.getElementById('trainingProgress').textContent = '45%';
    }
    if (document.getElementById('avgRating')) {
        document.getElementById('avgRating').textContent = '4.2';
    }
}

// Рендер кандидатов
function renderCandidates(filteredCandidates = null) {
    const data = filteredCandidates || candidates;
    
    candidatesList.innerHTML = '';
    
    if (data.length === 0) {
        candidatesList.innerHTML = '<p class="no-data">Немає кандидатів</p>';
        return;
    }
    
    data.forEach(candidate => {
        const candidateCard = document.createElement('div');
        candidateCard.className = 'candidate-card';
        candidateCard.innerHTML = `
            <div class="candidate-header">
                <div>
                    <div class="candidate-name">${candidate.name}</div>
                    <div class="candidate-discord">${candidate.discord}</div>
                </div>
                <span class="status-badge status-${candidate.status}">
                    ${getStatusText(candidate.status)}
                </span>
            </div>
            <div class="candidate-notes">
                ${candidate.notes || 'Нотаток немає'}
            </div>
            <div class="candidate-date">
                Додано: ${new Date(candidate.dateAdded).toLocaleDateString()}
            </div>
            <div class="candidate-actions">
                <button onclick="editCandidate(${candidate.id})" class="btn-secondary">Редагувати</button>
                <button onclick="deleteCandidate(${candidate.id})" class="btn-secondary">Видалити</button>
            </div>
        `;
        candidatesList.appendChild(candidateCard);
    });
}

// Текст статуса
function getStatusText(status) {
    const statusMap = {
        'new': 'Новий',
        'reviewed': 'Переглянутий', 
        'approved': 'Схвалений',
        'rejected': 'Відхилений'
    };
    return statusMap[status] || status;
}

// Настройка событий
function setupEventListeners() {
    // Добавление кандидата
    if (addCandidateBtn) {
        addCandidateBtn.addEventListener('click', () => {
            openModal();
        });
    }
    
    // Отмена в модалке
    if (modalCancel) {
        modalCancel.addEventListener('click', closeModal);
    }
    
    // Сохранение формы
    if (candidateForm) {
        candidateForm.addEventListener('submit', saveCandidate);
    }
    
    // Фильтрация
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCandidates);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filterCandidates);
    }
}

// Фильтрация кандидатов
function filterCandidates() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = candidates;
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    if (searchText) {
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(searchText) ||
            c.discord.toLowerCase().includes(searchText)
        );
    }
    
    renderCandidates(filtered);
}

// Работа с модальным окном
function openModal(candidate = null) {
    const modal = document.getElementById('candidateModal');
    const form = document.getElementById('candidateForm');
    const title = document.getElementById('modalTitle');
    
    if (candidate) {
        title.textContent = 'Редагувати кандидата';
        document.getElementById('candidateName').value = candidate.name;
        document.getElementById('candidateDiscord').value = candidate.discord;
        document.getElementById('candidateStatus').value = candidate.status;
        document.getElementById('candidateNotes').value = candidate.notes || '';
        form.dataset.editId = candidate.id;
    } else {
        title.textContent = 'Додати кандидата';
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('candidateModal');
    modal.style.display = 'none';
}

function saveCandidate(e) {
    e.preventDefault();
    
    const form = e.target;
    const name = document.getElementById('candidateName').value;
    const discord = document.getElementById('candidateDiscord').value;
    const status = document.getElementById('candidateStatus').value;
    const notes = document.getElementById('candidateNotes').value;
    
    if (form.dataset.editId) {
        // Редактирование
        const id = parseInt(form.dataset.editId);
        const index = candidates.findIndex(c => c.id === id);
        if (index !== -1) {
            candidates[index] = {
                ...candidates[index],
                name,
                discord, 
                status,
                notes
            };
        }
    } else {
        // Добавление нового
        const newCandidate = {
            id: Date.now(),
            name,
            discord,
            status,
            notes,
            dateAdded: new Date().toISOString()
        };
        candidates.push(newCandidate);
    }
    
    saveToLocalStorage();
    renderCandidates();
    closeModal();
    updateDashboardStats();
}

// Удаление кандидата
function deleteCandidate(id) {
    if (confirm('Видалити цього кандидата?')) {
        candidates = candidates.filter(c => c.id !== id);
        saveToLocalStorage();
        renderCandidates();
        updateDashboardStats();
    }
}

// Редактирование кандидата
function editCandidate(id) {
    const candidate = candidates.find(c => c.id === id);
    if (candidate) {
        openModal(candidate);
    }
}

// Сохранение в LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('candidates', JSON.stringify(candidates));
}

// Закрытие модалки по клику вне её
window.addEventListener('click', function(e) {
    const modal = document.getElementById('candidateModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Функция для начала теста
function startTest(testType) {
    alert(`Початок тесту: ${testType}`);
    // Здесь можно добавить логику тестирования
}
