/**
 * Скрипт для страницы архива турниров IQ Capitalist
 */

// Глобальные переменные
let tournamentsData = [];

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация страницы архива турниров');
    
    // Загрузка данных турниров
    loadTournamentsData();
});

/**
 * Загрузка данных о турнирах из index-файла
 */
async function loadTournamentsData() {
    const container = document.getElementById('tournamentsContainer');
    if (!container) {
        console.error('Контейнер для турниров не найден');
        return;
    }

    try {
        // Показываем индикатор загрузки
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Загрузка архива турниров...</p>
            </div>
        `;
        
        // Загрузка индекса турниров
        const response = await fetch('data/tournaments-index.json');
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const indexData = await response.json();
        
        if (!indexData || !Array.isArray(indexData.tournaments)) {
            throw new Error('Некорректный формат данных индекса турниров');
        }
        
        // Сортируем турниры по дате (новые сначала)
        tournamentsData = indexData.tournaments.sort((a, b) => {
            return new Date(b.start_date) - new Date(a.start_date);
        });
        
        // Отображаем все турниры
        renderTournaments();
        
    } catch (error) {
        console.error('Ошибка загрузки данных турниров:', error);
        if (container) {
            showErrorMessage(container, `Ошибка загрузки списка турниров: ${error.message}`);
        }
    }
}



/**
 * Отображение карточек турниров
 */
function renderTournaments() {
    const container = document.getElementById('tournamentsContainer');
    
    // Проверка наличия контейнера
    if (!container) {
        console.error('Контейнер для турниров не найден');
        return;
    }
    
    // Очистка контейнера
    container.innerHTML = '';
    
    // Проверка наличия турниров
    if (tournamentsData.length === 0) {
        container.innerHTML = '<div class="error-message">Турниры не найдены</div>';
        return;
    }
    
    // Отображение всех турниров
    tournamentsData.forEach((tournament, index) => {
        const card = createTournamentCard(tournament, index);
        container.appendChild(card);
    });
}

/**
 * Функция для склонения слова "ответ" в зависимости от числа
 * @param {Number} number - Число для склонения
 * @returns {String} - Правильная форма слова "ответ"
 */
function pluralizeAnswers(number) {
    // Преобразуем в число, если передана строка
    number = Number(number);
    
    // Получаем последнюю цифру
    const lastDigit = number % 10;
    // Получаем две последние цифры для проверки чисел 11-19
    const lastTwoDigits = number % 100;
    
    // Правила склонения:
    // 1 ответ (кроме чисел, оканчивающихся на 11)
    if (lastDigit === 1 && lastTwoDigits !== 11) {
        return 'ответ';
    }
    // 2-4 ответа (кроме чисел, оканчивающихся на 12-14)
    else if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
        return 'ответа';
    }
    // 5-20, 0 ответов
    else {
        return 'ответов';
    }
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
    
    // Обработка статистики ответов из индексного файла
    // Устанавливаем значения по умолчанию
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalTimeout = 0;
    
    // Извлекаем статистику ответов из данных турнира
    if (tournament.answers_stats) {
        const correctAnswers = tournament.answers_stats.correct_answers || {};
        const wrongAnswers = tournament.answers_stats.wrong_answers || {};
        
        // Подсчитываем правильные ответы
        totalCorrect = (correctAnswers.fast || 0) + 
                      (correctAnswers.medium || 0) + 
                      (correctAnswers.slow || 0);
        
        // Подсчитываем неправильные ответы
        totalWrong = (wrongAnswers.fast || 0) + 
                    (wrongAnswers.medium || 0) + 
                    (wrongAnswers.slow || 0);
        
        // Получаем количество таймаутов
        totalTimeout = tournament.answers_stats.timeouts || 0;
    }
    
    // Используем общее количество ответов из индексного файла как запасной вариант
    const totalAnswers = (totalCorrect + totalWrong + totalTimeout) || tournament.total_answers || 0;
    
    // Вычисляем проценты для графика
    let correctPercent = 0;
    let wrongPercent = 0;
    let timeoutPercent = 0;
    
    if (totalAnswers > 0) {
        correctPercent = Math.round((totalCorrect / totalAnswers) * 100);
        wrongPercent = Math.round((totalWrong / totalAnswers) * 100);
        timeoutPercent = Math.round((totalTimeout / totalAnswers) * 100);
        
        // Убедимся, что сумма процентов равна 100
        const totalPercent = correctPercent + wrongPercent + timeoutPercent;
        if (totalPercent !== 100) {
            // Корректируем наибольшее значение
            if (correctPercent >= wrongPercent && correctPercent >= timeoutPercent) {
                correctPercent += (100 - totalPercent);
            } else if (wrongPercent >= correctPercent && wrongPercent >= timeoutPercent) {
                wrongPercent += (100 - totalPercent);
            } else {
                timeoutPercent += (100 - totalPercent);
            }
        }
    }
    
    // Получаем данные об участниках по уровням
    const levelParticipants = tournament.players_by_level || {};
    
    // Получаем информацию о призовом фонде и количестве вопросов
    const prizePool = tournament.total_prize || 0;
    const totalQuestions = tournament.total_questions || 80; // По умолчанию 80 вопросов
    
    // Формируем содержимое карточки
    card.innerHTML = `
        <div class="tournament-header">
            <h2 class="tournament-title">Турнир №${tournament.id}</h2>
        </div>
        
        <div class="key-info">
            <div class="date-block">
                <div class="date-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>
                <div class="date-text">${dateText}</div>
            </div>
            
            <div class="stats-row">
                <div class="participants-block">
                    <div class="participants-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="participants-value">${formatNumber(tournament.total_players || 0)}</div>
                </div>
                
                <div class="prize-pool-block">
                    <div class="prize-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="8" r="7"></circle>
                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                        </svg>
                    </div>
                    <div class="prize-value">${formatNumber(prizePool)}</div>
                    <div class="prize-iqc">IQC</div>
                </div>
            </div>
        </div>
        
        <div class="additional-info">
            <div class="info-block questions-block">
                <div class="info-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                <div class="info-content">
                    <div class="info-value">${formatNumber(totalQuestions)}</div>
                    <div class="info-label">вопросов</div>
                </div>
            </div>
            
            <div class="info-block answers-block">
                <div class="info-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div class="info-content">
                    <div class="info-value">${formatNumber(totalAnswers)}</div>
                    <div class="info-label">${pluralizeAnswers(totalAnswers)}</div>
                </div>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="levels-overview">
            <div class="levels-title">Участники</div>
            <div class="levels-badges">
                ${createLevelBadges(levelParticipants)}
            </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="answers-overview">
            <div class="answers-title">Ответы</div>
            
            <div class="answers-chart">
                <div class="chart-bar">
                    <div class="chart-segment correct" style="width: ${correctPercent}%;" title="Правильные: ${formatNumber(totalCorrect)} (${correctPercent}%)"></div>
                    <div class="chart-segment wrong" style="width: ${wrongPercent}%;" title="Неправильные: ${formatNumber(totalWrong)} (${wrongPercent}%)"></div>
                    <div class="chart-segment timeout" style="width: ${timeoutPercent}%;" title="Таймауты: ${formatNumber(totalTimeout)} (${timeoutPercent}%)"></div>
                </div>
                
                <div class="chart-legend">
                    <div class="legend-item">
                        <div class="legend-color correct"></div>
                        <div class="legend-text">
                            <div class="legend-value">${formatNumber(totalCorrect)}</div>
                            <div class="legend-label">правильных</div>
                        </div>
                    </div>
                    
                    <div class="legend-item">
                        <div class="legend-color wrong"></div>
                        <div class="legend-text">
                            <div class="legend-value">${formatNumber(totalWrong)}</div>
                            <div class="legend-label">неправильных</div>
                        </div>
                    </div>
                    
                    <div class="legend-item">
                        <div class="legend-color timeout"></div>
                        <div class="legend-text">
                            <div class="legend-value">${formatNumber(totalTimeout)}</div>
                            <div class="legend-label">таймаутов</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="view-details">
            <span>Подробнее</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </div>
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
        'Легенда', 'Гуру'
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
 * Отображение сообщения об ошибке
 * @param {HTMLElement} container - DOM-элемент контейнера
 * @param {String} message - Текст сообщения
 */
function showErrorMessage(container, message) {
    if (!container) return;
    
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
