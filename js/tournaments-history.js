/**
 * Скрипт для страницы архива турниров IQ Capitalist
 */

// Глобальные переменные
let tournamentsData = [];
let filteredTournaments = [];
let lastUpdateTimestamp = '';

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация страницы архива турниров');
    
    // Загрузка данных турниров
    loadTournamentsData();
    
    // Привязка обработчика событий для поиска
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterTournaments, 300));
    }
});

/**
 * Загрузка данных о турнирах из index-файла
 */
async function loadTournamentsData() {
    try {
        showLoadingIndicator();
        
        // Загрузка индекса турниров
        const response = await fetch('data/tournaments-index.json');
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const indexData = await response.json();
        
        if (!indexData || !Array.isArray(indexData.tournaments)) {
            throw new Error('Некорректный формат данных индекса турниров');
        }
        
        // Сохраняем дату последнего обновления
        lastUpdateTimestamp = indexData.generated_at || '';
        updateLastUpdateInfo();
        
        // Сортируем турниры по дате (новые сначала)
        tournamentsData = indexData.tournaments.sort((a, b) => {
            return new Date(b.start_date) - new Date(a.start_date);
        });
        
        // Загружаем детальные данные для каждого турнира
        await loadTournamentsDetails();
        
        // Отображаем все турниры
        filteredTournaments = [...tournamentsData];
        renderTournaments();
        
    } catch (error) {
        console.error('Ошибка загрузки данных турниров:', error);
        showErrorMessage(`Ошибка загрузки списка турниров: ${error.message}`);
    } finally {
        hideLoadingIndicator();
    }
}

/**
 * Загрузка детальных данных для каждого турнира
 */
async function loadTournamentsDetails() {
    const tournamentPromises = tournamentsData.map(async (tournament) => {
        try {
            const response = await fetch(`data/${tournament.id}.json`);
            if (!response.ok) {
                console.warn(`Не удалось загрузить данные для турнира ${tournament.id}`);
                return tournament;
            }
            
            const detailData = await response.json();
            return { ...tournament, details: detailData };
        } catch (error) {
            console.error(`Ошибка загрузки деталей турнира ${tournament.id}:`, error);
            return tournament;
        }
    });
    
    // Ждем загрузки всех данных
    tournamentsData = await Promise.all(tournamentPromises);
}

/**
 * Фильтрация турниров по поисковому запросу
 */
function filterTournaments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredTournaments = [...tournamentsData];
    } else {
        filteredTournaments = tournamentsData.filter(tournament => {
            // Поиск по номеру и названию турнира
            return tournament.id.toString().includes(searchTerm) || 
                `турнир ${tournament.id}`.toLowerCase().includes(searchTerm);
        });
    }
    
    renderTournaments();
}

/**
 * Отображение карточек турниров
 */
function renderTournaments() {
    const container = document.getElementById('tournamentsContainer');
    
    // Очистка контейнера
    if (container) {
        container.innerHTML = '';
    } else {
        console.error('Контейнер для турниров не найден');
        return;
    }
    
    // Проверка наличия турниров
    if (filteredTournaments.length === 0) {
        container.innerHTML = '<div class="error-message">Турниры не найдены. Попробуйте изменить параметры поиска.</div>';
        return;
    }
    
    // Отображение всех найденных турниров
    filteredTournaments.forEach((tournament, index) => {
        const card = createTournamentCard(tournament, index);
        container.appendChild(card);
    });
}

/**
 * Создание карточки турнира
 * @param {Object} tournament - Данные турнира
 * @param {Number} index - Индекс для анимации
 * @returns {HTMLElement} - DOM-элемент карточки
 */
function createTournamentCard(tournament, index) {
    const card = document.createElement('a');
    card.href = `tournament.html?id=${tournament.id}`;
    card.className = 'tournament-card';
    card.style.animationDelay = `${index * 0.05}s`;
    
    // Формируем дату турнира
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    const dateText = formatTournamentPeriod(startDate, endDate);
    
    // Статистика ответов
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalTimeout = 0;
    
    // Если есть детализированные данные
    if (tournament.details && tournament.details.players) {
        tournament.details.players.forEach(player => {
            if (player.correct_answers) {
                totalCorrect += (player.correct_answers.fast || 0) + 
                               (player.correct_answers.medium || 0) + 
                               (player.correct_answers.slow || 0);
            }
            
            if (player.wrong_answers) {
                totalWrong += (player.wrong_answers.fast || 0) + 
                             (player.wrong_answers.medium || 0) + 
                             (player.wrong_answers.slow || 0);
            }
            
            totalTimeout += player.timeouts || 0;
        });
    }
    
    // Участники по уровням
    let levelParticipants = {};
    if (tournament.details && tournament.details.stats && tournament.details.stats.players_by_level) {
        levelParticipants = tournament.details.stats.players_by_level;
    }
    
    // Формируем содержимое карточки
    card.innerHTML = `
        <div class="tournament-card-header">
            <h2 class="tournament-title">Турнир №${tournament.id}</h2>
        </div>
        <div class="tournament-date">${dateText}</div>
        
        <div class="tournament-stats">
            <div class="stat-block">
                <div class="stat-title">Вопросов</div>
                <div class="stat-value">${formatNumber(tournament.total_questions || 0)}</div>
            </div>
            <div class="stat-block">
                <div class="stat-title">Участников</div>
                <div class="stat-value">${formatNumber(tournament.details?.stats?.total_players || 0)}</div>
            </div>
        </div>
        
        <div class="tournament-levels">
            ${createLevelBadges(levelParticipants)}
        </div>
        
        <div class="answers-breakdown">
            <div class="answer-type correct">
                <div class="answer-value">${formatNumber(totalCorrect)}</div>
                <div class="answer-label">Правильные</div>
            </div>
            <div class="answer-type wrong">
                <div class="answer-value">${formatNumber(totalWrong)}</div>
                <div class="answer-label">Неправильные</div>
            </div>
            <div class="answer-type timeout">
                <div class="answer-value">${formatNumber(totalTimeout)}</div>
                <div class="answer-label">Таймауты</div>
            </div>
        </div>
        
        <div class="view-details">Подробнее</div>
    `;
    
    return card;
}

/**
 * Создание бейджей для уровней участников
 * @param {Object} levelData - Данные о количестве участников по уровням
 * @returns {String} - HTML-разметка бейджей
 */
function createLevelBadges(levelData) {
    if (!levelData || Object.keys(levelData).length === 0) {
        return '<div class="level-badge"><span class="level-badge-name">Нет данных</span></div>';
    }
    
    // Порядок отображения уровней
    const levelOrder = [
        'Знаток', 'Эксперт', 'Мастер', 'Босс', 'Титан', 
        'Легенда', 'Корифей', 'Гуру'
    ];
    
    // Сортируем уровни в нужном порядке и фильтруем нулевые значения
    const sortedLevels = levelOrder
        .filter(level => level in levelData && levelData[level] > 0)
        .map(level => ({
            name: level,
            count: levelData[level]
        }));
    
    if (sortedLevels.length === 0) {
        return '<div class="level-badge"><span class="level-badge-name">Нет участников</span></div>';
    }
    
    return sortedLevels
        .map(level => `
            <div class="level-badge">
                <span class="level-badge-name">${level.name}:</span>
                <span class="level-badge-value">${level.count}</span>
            </div>
        `)
        .join('');
}

/**
 * Форматирование числа с разделителями
 * @param {Number} num - Число для форматирования
 * @returns {String} - Отформатированное число
 */
function formatNumber(num) {
    if (typeof num !== 'number') return '0';
    return Math.round(num).toLocaleString('ru-RU');
}

/**
 * Форматирование периода проведения турнира
 * @param {Date} startDate - Дата начала
 * @param {Date} endDate - Дата окончания
 * @returns {String} - Отформатированный период
 */
function formatTournamentPeriod(startDate, endDate) {
    if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
        return 'Дата неизвестна';
    }
    
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    const monthNames = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    // Если годы разные
    if (startYear !== endYear) {
        return `${startDay} ${monthNames[startMonth]} ${startYear} - ${endDay} ${monthNames[endMonth]} ${endYear} г.`;
    }
    
    // Если месяцы разные
    if (startMonth !== endMonth) {
        return `${startDay} ${monthNames[startMonth]} - ${endDay} ${monthNames[endMonth]} ${startYear} г.`;
    }
    
    // Если только дни разные
    return `${startDay}-${endDay} ${monthNames[startMonth]} ${startYear} г.`;
}

/**
 * Обновление информации о последнем обновлении
 */
function updateLastUpdateInfo() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement && lastUpdateTimestamp) {
        lastUpdateElement.textContent = `Данные обновлены: ${lastUpdateTimestamp}`;
    }
}

/**
 * Отображение индикатора загрузки
 */
function showLoadingIndicator() {
    const container = document.getElementById('tournamentsContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Загрузка архива турниров...</p>
            </div>
        `;
    }
}

/**
 * Скрытие индикатора загрузки
 */
function hideLoadingIndicator() {
    // Индикатор загрузки удаляется при рендеринге турниров
}

/**
 * Отображение сообщения об ошибке
 * @param {String} message - Текст сообщения
 */
function showErrorMessage(message) {
    const container = document.getElementById('tournamentsContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <p>Пожалуйста, попробуйте обновить страницу позже.</p>
                <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                    Обновить страницу
                </button>
            </div>
        `;
    }
}

/**
 * Функция debounce для оптимизации обработки событий
 * @param {Function} func - Функция для вызова
 * @param {Number} wait - Время задержки в мс
 * @returns {Function} - Функция с debounce
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}
