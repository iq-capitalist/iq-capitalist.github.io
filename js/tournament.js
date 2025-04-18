/**
 * Скрипт для страницы турнира IQ Capitalist
 * Модифицирован для работы на объединенной странице с tournament_stats.js
 */

// Глобальная переменная для доступа к данным из обоих скриптов
let tournamentData = null;

// Добавление стилей для ссылки скачивания CSV
function addCSVDownloadStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #download-csv-link {
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s, text-decoration 0.3s;
        }
        
        #download-csv-link:hover {
            color: #2980b9;
            text-decoration: underline;
        }
        
        #csv-download-row .info-label {
            color: #555;
        }
    `;
    document.head.appendChild(style);
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем стили для ссылки скачивания CSV
    addCSVDownloadStyles();
    
    // Загрузка шапки и подвала - используем общую функцию из main.js, если она доступна
    if (typeof fetch === 'function') {
        // Загрузка header и footer уже определена в main.js
        // Для сохранения обратной совместимости оставляем аналогичный код на случай, 
        // если скрипт будет использоваться отдельно
        if (typeof loadHeaderFooter !== 'function') {
            // Загрузка header
            fetch('header.html')
                .then(response => response.text())
                .then(data => {
                    document.getElementById('header').innerHTML = data;
                    // Убираем выделение со всех пунктов меню, так как страница турнира
                    // не имеет соответствующего пункта в основном меню
                    const navLinks = document.querySelectorAll('nav a');
                    navLinks.forEach(link => link.classList.remove('active'));
                })
                .catch(error => {
                    console.error('Ошибка загрузки header:', error);
                    document.getElementById('header').innerHTML = '<div class="container"><a href="/" class="site-title">IQ Capitalist</a></div>';
                });

            // Загрузка footer
            fetch('footer.html')
                .then(response => response.text())
                .then(data => {
                    document.getElementById('footer').innerHTML = data;
                })
                .catch(error => {
                    console.error('Ошибка загрузки footer:', error);
                    document.getElementById('footer').innerHTML = '<div class="container"><p>© 2024 IQ Capitalist. Все права защищены.</p></div>';
                });
        }
    }
        
    // Загрузка данных турнира
    loadTournamentData();
});

/**
 * Загрузка данных турнира из JSON файла
 */
async function loadTournamentData() {
    try {
        // Добавляем индикатор загрузки
        showLoadingIndicator();
            
        // Получаем ID турнира из URL
        const urlParams = new URLSearchParams(window.location.search);
        const tournamentId = urlParams.get('id') || "1"; // По умолчанию турнир с ID 1
        
        const response = await fetch(`data/${tournamentId}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Сохраняем данные в глобальную переменную для доступа из других скриптов
        tournamentData = await response.json();
        
        // Удаляем индикатор загрузки
        hideLoadingIndicator();
        
        // Обновляем заголовок страницы в тегах title и h1
        updatePageTitle(tournamentId, tournamentData);
        
        // Отображаем данные турнира
        displayTournamentData(tournamentData);
        
        // Обновляем информацию о дате обновления
        updateLastUpdate(tournamentData);
        
        // Инициализируем часть с детальной статистикой, если доступна функция
        if (typeof initializePlayerStats === 'function') {
            initializePlayerStats();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных турнира:', error);
        hideLoadingIndicator();
        showErrorMessage(`Ошибка загрузки данных турнира: ${error.message}`);
    }
}

/**
 * Обновление заголовка страницы в тегах title и h1
 * @param {String} tournamentId - ID турнира
 * @param {Object} data - Данные турнира
 */
function updatePageTitle(tournamentId, data) {
    // Получаем порядковый номер турнира из данных или из URL
    const tournamentNumber = data.tournament && data.tournament.id 
        ? data.tournament.id 
        : tournamentId;
    
    // Обновляем заголовок в теге title
    document.title = `Турнир №${tournamentNumber} | IQ Capitalist`;
    
    // Обновляем заголовок на странице
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = `Турнир №${tournamentNumber}`;
    }
}

/**
 * Обновление информации о последнем обновлении
 * @param {Object} data - Данные турнира
 */
function updateLastUpdate(data) {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement && data.generated_at) {
        lastUpdateElement.textContent = `Данные обновлены: ${data.generated_at}`;
    }
}

/**
 * Генерация CSV с данными турнира
 * @param {Object} data - Данные турнира
 * @returns {String} - Содержимое CSV
 */
function generateTournamentCSV(data) {
    // Проверка наличия данных
    if (!data || !data.tournament || !data.players || !Array.isArray(data.players)) {
        console.error('Нет данных для экспорта в CSV');
        return '';
    }
    
    // Метаданные турнира для заголовка CSV
    const tournamentId = data.tournament.id || 'Н/Д';
    const tournamentDates = formatTournamentPeriod(data.tournament.start_date, data.tournament.end_date);
    const totalPlayers = data.stats?.total_players || 0;
    const totalQuestions = data.tournament?.total_questions || 0;
    const totalPrizePool = data.stats?.total_prize_pool || 0;
    
    // Добавляем метаданные в начало CSV
    const metadata = [
        `"Турнир №${tournamentId}",${tournamentDates}`,
        `"Вопросов:","${Math.round(totalQuestions).toLocaleString('ru-RU')}"`,
        `"Участников:","${Math.round(totalPlayers).toLocaleString('ru-RU')}"`,
        `"Призовой фонд:","${Math.round(totalPrizePool).toLocaleString('ru-RU')} IQC"`,
        `"Дата экспорта:","${new Date().toLocaleString('ru-RU')}"`
    ];
    
    // Пустая строка-разделитель после метаданных
    metadata.push('');
    
    // Заголовки для данных игроков
    const headers = [
        'Имя игрока', 'Уровень', 'Всего ответов', 
        'Правильные быстрые', 'Правильные средние', 'Правильные медленные',
        'Неправильные быстрые', 'Неправильные средние', 'Неправильные медленные',
        'Таймауты', 'Очки', 'Приз'
    ];
    
    const rows = [];
    // Добавляем строки с данными о каждом игроке
    data.players.forEach(player => {
        if (!player) return;
        
        const row = [
            `"${player.username || ''}"`,
            `"${player.level || ''}"`,
            player.answers || 0,
            player.correct_answers?.fast || 0,
            player.correct_answers?.medium || 0,
            player.correct_answers?.slow || 0,
            player.wrong_answers?.fast || 0,
            player.wrong_answers?.medium || 0,
            player.wrong_answers?.slow || 0,
            player.timeouts || 0,
            player.total_points || 0,
            player.prize || 0
        ];
        
        rows.push(row.join(','));
    });
    
    // Объединяем метаданные, заголовки и строки в CSV
    const csv = [...metadata, headers.join(','), ...rows].join('\n');
    return csv;
}

/**
 * Скачивание CSV с данными турнира
 */
function downloadTournamentCSV() {
    if (!tournamentData) {
        console.error('Нет данных для скачивания');
        return;
    }
    
    // Получаем ID турнира
    const tournamentId = tournamentData.tournament?.id || 
                          (new URLSearchParams(window.location.search).get('id') || '1');
    
    // Генерируем содержимое CSV
    const csvContent = generateTournamentCSV(tournamentData);
    
    // Генерируем имя файла с датой
    const date = new Date().toISOString().slice(0, 10);
    const filename = `tournament_${tournamentId}_${date}.csv`;
    
    // Скачиваем CSV
    downloadCSV(filename, csvContent);
}

/**
 * Скачивание файла CSV
 * @param {String} filename - Имя файла
 * @param {String} csvContent - Содержимое CSV
 */
function downloadCSV(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Отображение индикатора загрузки
 */
function showLoadingIndicator() {
    // Проверяем, не существует ли уже индикатор
    if (!document.getElementById('loading-indicator')) {
        document.querySelector('.container').insertAdjacentHTML('beforeend', 
            `<div id="loading-indicator" class="text-center my-5">
                <p>Загрузка данных турнира...</p>
            </div>`);
    }
}

/**
 * Скрытие индикатора загрузки
 */
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

/**
 * Показ сообщения об ошибке
 * @param {string} message - Текст сообщения
 */
function showErrorMessage(message) {
    document.querySelector('.container').insertAdjacentHTML('beforeend', 
        `<div class="error-message">
            <p>${message}</p>
            <p>Пожалуйста, попробуйте обновить страницу позже.</p>
            <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                Обновить страницу
            </button>
        </div>`);
}

/**
 * Отображение всех данных турнира
 * @param {Object} data - Данные турнира
 */
function displayTournamentData(data) {
    if (!data || !data.tournament) {
        showErrorMessage('Неверный формат данных турнира');
        return;
    }
    
    // Последовательно отображаем все секции данных
    displayTournamentInfo(data);
    displayLevelChart(data);
    displayAnswersStats(data);
    displayDetailedStats(data);

    // Анимация появления элементов
    animateElements();
}

/**
 * Анимация появления элементов
 */
function animateElements() {
    const elements = document.querySelectorAll('.tournament-info-container, .stat-card');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * Форматирование периода проведения турнира
 * @param {string} startDate - Дата начала в формате ISO
 * @param {string} endDate - Дата окончания в формате ISO
 * @returns {string} - Отформатированный период
 */
function formatTournamentPeriod(startDate, endDate) {
    if (!startDate || !endDate) {
        return 'Даты не указаны';
    }
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (!isValidDate(startDateObj) || !isValidDate(endDateObj)) {
        return 'Некорректные даты';
    }
    
    const startDay = startDateObj.getDate();
    const endDay = endDateObj.getDate();
    const startMonth = startDateObj.getMonth();
    const endMonth = endDateObj.getMonth();
    const startYear = startDateObj.getFullYear();
    const endYear = endDateObj.getFullYear();
    
    const monthNames = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    // Если годы разные
    if (startYear !== endYear) {
        return `${startDay} ${monthNames[startMonth]} ${startYear} - ${endDay} ${monthNames[endMonth]} ${endYear} года`;
    }
    
    // Если месяцы разные
    if (startMonth !== endMonth) {
        return `${startDay} ${monthNames[startMonth]} - ${endDay} ${monthNames[endMonth]} ${startYear} года`;
    }
    
    // Если только дни разные
    return `${startDay}-${endDay} ${monthNames[startMonth]} ${startYear} года`;
}

/**
 * Проверка валидности даты
 * @param {Date} date - Объект даты для проверки
 * @returns {boolean} - Результат проверки
 */
function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
}

/**
 * Форматирование числа с разделением тысяч, без дробной части
 * @param {number} num - Число для форматирования 
 * @returns {string} - Отформатированное число
 */
function formatNumber(num) {
    return typeof num === 'number' ? Math.round(num).toLocaleString('ru-RU') : 'Н/Д';
}

/**
 * Отображение общей информации о турнире
 * @param {Object} data - Данные турнира
 */
function displayTournamentInfo(data) {
    const tournament = data.tournament;
    
    // Устанавливаем период проведения
    document.getElementById('tournament-dates').textContent = 
        formatTournamentPeriod(tournament.start_date, tournament.end_date);
    
    // Устанавливаем количество вопросов (округляем до целых)
    document.getElementById('total-questions').textContent = 
        typeof tournament.total_questions === 'number' ? 
        Math.round(tournament.total_questions).toLocaleString('ru-RU') : 'Н/Д';
    
    // Устанавливаем количество участников (округляем до целых)
    const totalPlayers = data.stats && typeof data.stats.total_players === 'number' ? 
        Math.round(data.stats.total_players).toLocaleString('ru-RU') : 'Н/Д';
    document.getElementById('total-players').textContent = totalPlayers;
    
    // Устанавливаем призовой фонд (округляем до целых)
    const prizePool = data.stats && typeof data.stats.total_prize_pool === 'number' ? 
        `${Math.round(data.stats.total_prize_pool).toLocaleString('ru-RU')} IQC` : 'Н/Д';
    document.getElementById('prize-pool').textContent = prizePool;
    
    // Добавляем ссылку для скачивания CSV, если строка ещё не существует
    const csvDownloadRow = document.getElementById('csv-download-row');
    if (!csvDownloadRow) {
        const tournamentInfoContainer = document.getElementById('tournamentInfo');
        if (tournamentInfoContainer) {
            const newRow = document.createElement('div');
            newRow.className = 'info-row';
            newRow.id = 'csv-download-row';
            
            newRow.innerHTML = `
                <div class="info-label">Полные данные</div>
                <div class="info-value">
                    <a href="#" id="download-csv-link">скачать .csv</a>
                </div>
            `;
            
            tournamentInfoContainer.appendChild(newRow);
            
            // Добавляем обработчик клика на ссылку
            const downloadLink = document.getElementById('download-csv-link');
            if (downloadLink) {
                downloadLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    downloadTournamentCSV();
                });
            }
        }
    }
}

/**
 * Отображение данных об участниках по уровням
 * @param {Object} data - Данные турнира
 */
function displayLevelChart(data) {
    const legendContainer = document.getElementById('levelChartLegend');
    if (!legendContainer) return;
    
    // Очистка контейнера легенды
    legendContainer.innerHTML = '';
    
    // Проверка данных
    if (!data.stats || !data.stats.players_by_level) {
        legendContainer.innerHTML = '<p class="text-center mt-4">Нет данных для отображения</p>';
        return;
    }
    
    const levelPlayers = data.stats.players_by_level;
    
    // Правильный порядок уровней (без IQ Капиталист)
    const levelOrder = [
        'Знаток', 'Эксперт', 'Мастер', 'Босс', 'Титан', 
        'Легенда', 'Корифей', 'Гуру'
    ];
    
    // Фильтруем и сортируем уровни по правильному порядку
    const levels = levelOrder.filter(level => level in levelPlayers);
    const playerCounts = levels.map(level => levelPlayers[level]);
    
    // Получаем общее количество участников
    const totalPlayers = playerCounts.reduce((sum, count) => sum + count, 0);
    if (totalPlayers === 0) {
        legendContainer.innerHTML = '<p class="text-center mt-4">Нет данных для отображения</p>';
        return;
    }
    
    // Создаем мини-карточки для легенды
    levels.forEach((level, index) => {
        const count = playerCounts[index];
        // Округляем процент до целого числа
        const percentage = Math.round((count / totalPlayers) * 100);
        
        const legendItem = document.createElement('div');
        legendItem.className = 'level-legend-item';
        
        legendItem.innerHTML = `
            <div class="level-name">${level}</div>
            <div class="level-value">${Math.round(count)}</div>
            <div class="level-percent">${percentage}%</div>
        `;
        
        legendContainer.appendChild(legendItem);
    });
}

/**
 * Отображение статистики ответов
 * @param {Object} data - Данные турнира
 */
function displayAnswersStats(data) {
    // Проверка наличия данных
    if (!data.players || !Array.isArray(data.players) || data.players.length === 0) {
        document.getElementById('correct-answers').textContent = 'Н/Д';
        document.getElementById('wrong-answers').textContent = 'Н/Д';
        document.getElementById('timeouts').textContent = 'Н/Д';
        return;
    }
    
    // Вычисляем общие показатели
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalTimeouts = 0;
    
    data.players.forEach(player => {
        if (!player.correct_answers || !player.wrong_answers) return;
        
        // Суммируем все типы правильных и неправильных ответов
        const correct = 
            (player.correct_answers.fast || 0) + 
            (player.correct_answers.medium || 0) + 
            (player.correct_answers.slow || 0);
            
        const wrong = 
            (player.wrong_answers.fast || 0) + 
            (player.wrong_answers.medium || 0) + 
            (player.wrong_answers.slow || 0);
        
        totalCorrect += correct;
        totalWrong += wrong;
        totalTimeouts += player.timeouts || 0;
    });
    
    // Отображаем результаты (округляем до целых чисел)
    document.getElementById('correct-answers').textContent = Math.round(totalCorrect).toLocaleString('ru-RU');
    document.getElementById('wrong-answers').textContent = Math.round(totalWrong).toLocaleString('ru-RU');
    document.getElementById('timeouts').textContent = Math.round(totalTimeouts).toLocaleString('ru-RU');
}

/**
 * Отображение детальной статистики по типам ответов
 * @param {Object} data - Данные турнира
 */
function displayDetailedStats(data) {
    const tableBody = document.getElementById('detailed-stats-body');
    if (!tableBody) return;
    
    // Проверка наличия данных
    if (!data.players || !Array.isArray(data.players) || data.players.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Нет данных для отображения</td></tr>';
        return;
    }
    
    // Инициализируем счетчики
    let fastCorrect = 0;
    let mediumCorrect = 0;
    let slowCorrect = 0;
    let fastWrong = 0;
    let mediumWrong = 0;
    let slowWrong = 0;
    let timeouts = 0;
    
    // Подсчитываем статистику
    data.players.forEach(player => {
        if (!player.correct_answers || !player.wrong_answers) return;
        
        fastCorrect += player.correct_answers.fast || 0;
        mediumCorrect += player.correct_answers.medium || 0;
        slowCorrect += player.correct_answers.slow || 0;
        fastWrong += player.wrong_answers.fast || 0;
        mediumWrong += player.wrong_answers.medium || 0;
        slowWrong += player.wrong_answers.slow || 0;
        timeouts += player.timeouts || 0;
    });
    
    // Вычисляем общее количество ответов
    const totalAnswers = fastCorrect + mediumCorrect + slowCorrect + 
                         fastWrong + mediumWrong + slowWrong + timeouts;
    
    if (totalAnswers === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Нет данных для отображения</td></tr>';
        return;
    }
    
    // Округляем все числа до целых
    fastCorrect = Math.round(fastCorrect);
    mediumCorrect = Math.round(mediumCorrect);
    slowCorrect = Math.round(slowCorrect);
    fastWrong = Math.round(fastWrong);
    mediumWrong = Math.round(mediumWrong);
    slowWrong = Math.round(slowWrong);
    timeouts = Math.round(timeouts);
    const roundedTotal = fastCorrect + mediumCorrect + slowCorrect + 
                         fastWrong + mediumWrong + slowWrong + timeouts;
    
    // Создаем структуру данных для таблицы
    const statsData = [
        { 
            name: 'Быстрые правильные', 
            count: fastCorrect, 
            percent: calculatePercent(fastCorrect, roundedTotal),
            type: 'fast-correct'
        },
        { 
            name: 'Средние правильные', 
            count: mediumCorrect, 
            percent: calculatePercent(mediumCorrect, roundedTotal),
            type: 'medium-correct'
        },
        { 
            name: 'Медленные правильные', 
            count: slowCorrect, 
            percent: calculatePercent(slowCorrect, roundedTotal),
            type: 'slow-correct'
        },
        { 
            name: 'Быстрые неправильные', 
            count: fastWrong, 
            percent: calculatePercent(fastWrong, roundedTotal),
            type: 'fast-wrong'
        },
        { 
            name: 'Средние неправильные', 
            count: mediumWrong, 
            percent: calculatePercent(mediumWrong, roundedTotal),
            type: 'medium-wrong'
        },
        { 
            name: 'Медленные неправильные', 
            count: slowWrong, 
            percent: calculatePercent(slowWrong, roundedTotal),
            type: 'slow-wrong'
        },
        { 
            name: 'Таймауты', 
            count: timeouts, 
            percent: calculatePercent(timeouts, roundedTotal),
            type: 'timeout'
        },
        { 
            name: 'Всего', 
            count: roundedTotal, 
            percent: '100.0%',
            type: 'total'
        }
    ];
    
    // Генерируем HTML для таблицы
    tableBody.innerHTML = statsData.map(stat => {
        // Выделяем жирным строку "Всего"
        const fontWeight = stat.type === 'total' ? 'font-weight: bold;' : '';
        
        return `<tr data-type="${stat.type}" style="${fontWeight}">
            <td>${stat.name}</td>
            <td>${stat.count.toLocaleString('ru-RU')}</td>
            <td>${stat.percent}</td>
        </tr>`;
    }).join('');
}

/**
 * Вычисление процента от общего количества
 * @param {number} part - Часть
 * @param {number} total - Общее количество
 * @returns {string} - Отформатированный процент
 */
function calculatePercent(part, total) {
    if (total === 0) return '0.0%';
    return (part / total * 100).toFixed(1) + '%';
}
