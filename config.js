// Конфигурация подключения к Google Forms
const CONFIG = {
    // Настройки Google Sheets API
    GOOGLE_SHEETS: {
        API_KEY: 'AIzaSyB3dR3GbR7QKqo0v7V6Xk8Q6wT6XxXxXxX', // Замени на свой API ключ
        SPREADSHEET_ID: null, // Будет установлено пользователем
        RANGE: 'A:Z' // Диапазон данных
    },
    
    // Настройки приложения
    APP: {
        NAME: 'ModSystem',
        VERSION: '1.0.0',
        THEME: 'dark'
    }
};

// Функция для подключения к Google Sheets
async function connectGoogleSheets(spreadsheetId) {
    if (!spreadsheetId) {
        alert('Будь ласка, введіть ID Google Tables');
        return;
    }
    
    try {
        // Сохраняем ID таблицы
        CONFIG.GOOGLE_SHEETS.SPREADSHEET_ID = spreadsheetId;
        localStorage.setItem('googleSheetsId', spreadsheetId);
        
        // Пробуем получить данные
        const data = await fetchGoogleSheetsData(spreadsheetId);
        alert(`Успішно підключено! Знайдено ${data.length} записів.`);
        
        // Обрабатываем данные
        processGoogleFormsData(data);
        
    } catch (error) {
        console.error('Помилка підключення:', error);
        alert('Помилка підключення. Перевірте ID таблиці та спробуйте ще раз.');
    }
}

// Получение данных из Google Sheets
async function fetchGoogleSheetsData(spreadsheetId) {
    const apiKey = CONFIG.GOOGLE_SHEETS.API_KEY;
    const range = CONFIG.GOOGLE_SHEETS.RANGE;
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.values) {
        throw new Error('Не вдалося отримати дані з таблиці');
    }
    
    return data.values;
}

// Обработка данных из Google Forms
function processGoogleFormsData(data) {
    // Предполагаем, что первая строка - заголовки
    const headers = data[0];
    const rows = data.slice(1);
    
    const newCandidates = rows.map(row => {
        const candidate = {
            id: Date.now() + Math.random(),
            name: row[0] || 'Без імені',
            discord: row[1] || 'Не вказано',
            status: 'new',
            dateAdded: new Date().toISOString(),
            source: 'google_forms'
        };
        
        // Сохраняем все данные из формы
        headers.forEach((header, index) => {
            if (index > 1) { // Пропускаем имя и дискорд
                candidate[`form_${header.toLowerCase()}`] = row[index];
            }
        });
        
        return candidate;
    });
    
    // Добавляем новых кандидатов в базу
    addCandidatesFromGoogleForms(newCandidates);
}

// Добавление кандидатов из Google Forms
function addCandidatesFromGoogleForms(newCandidates) {
    let existingCandidates = JSON.parse(localStorage.getItem('candidates')) || [];
    
    // Фильтруем дубликаты по имени и дискорду
    const uniqueCandidates = newCandidates.filter(newCandidate => {
        return !existingCandidates.some(existing => 
            existing.name === newCandidate.name && 
            existing.discord === newCandidate.discord
        );
    });
    
    // Добавляем уникальных кандидатов
    existingCandidates = [...existingCandidates, ...uniqueCandidates];
    localStorage.setItem('candidates', JSON.stringify(existingCandidates));
    
    // Обновляем интерфейс
    if (typeof renderCandidates === 'function') {
        renderCandidates();
    }
    
    alert(`Додано ${uniqueCandidates.length} нових кандидатів з Google Forms`);
}
