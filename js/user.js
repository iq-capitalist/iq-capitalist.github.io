/**
 * Скрипт для страницы профиля игрока IQ Capitalist
 */

// Глобальные переменные
let playerData = null;
let tournamentsData = [];
let charts = {};

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Получаем ID игрока из URL-параметров
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    if (!userId) {
        showPlayerNotFound();
        return;
    }
    
    // Загружаем данные
    loadPlayerData(userId)
        .then(data => {
            if (!data) {
                showPlayerNotFound();
                return;
            }
            
            playerData = data;
            
            // Загружаем данные о турнирах
            return loadTournamentsIndex();
        })
        .then(tournamentsIndex => {
            if (!tournamentsIndex) {
                // Если не удалось загрузить индекс турниров, все равно показываем профиль
                displayPlayerProfile();
                return;
            }
            
            // Сохраняем индекс турниров
            tournamentsData = tournamentsIndex.tournaments;
            
            // Загружаем историю турниров игрока
            return loadPlayerTournamentHistory();
        })
        .then(() => {
            // Отображаем профиль игрока со всеми данными
            displayPlayerProfile();
        })
        .catch(error => {
            console.error('Ошибка загрузки данных:', error);
            showError();
        });
});

/**
 * Загрузка индекса турниров
 */
async function loadTournamentsIndex() {
    try {
        const response = await fetch('data/tournaments-index.json');
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки индекса турниров:', error);
        // В случае ошибки возвращаем null, но продолжаем работу
        return null;
    }
}

/**
 * Загрузка данных о турнирах, в которых участвовал игрок
 */
async function loadPlayerTournamentHistory() {
    if (!tournamentsData || tournamentsData.length === 0 || !playerData) {
        // Если нет данных о турнирах или игроке, выходим
        return;
    }
    
    // Создаем массив для хранения истории турниров игрока
    playerData.tournament_history = [];
    
    // Получаем данные для поиска игрока в турнирах
    const username = playerData.username;
    const userId = playerData.user_id;
    
    // Перебираем все турниры из индекса
    const promises = tournamentsData.map(async (tournament) => {
        // Пропускаем активные турниры
        if (tournament.status === 'active') {
            return;
        }
        
        try {
            // Загружаем данные о конкретном турнире
            const response = await fetch(`data/${tournament.id}.json`);
            const tournamentData = await response.json();
            
            // Ищем игрока в этом турнире, сначала по user_id, затем по username
            let player = tournamentData.players.find(p => p.user_id == userId);
            
            // Если по ID не нашли, пробуем найти по имени (для старых данных без ID)
            if (!player) {
                player = tournamentData.players.find(p => p.username === username);
            }
            
            if (player) {
                // Добавляем данные об этом турнире в историю игрока
                playerData.tournament_history.push({
                    tournament_id: tournament.id,
                    start_date: tournament.start_date,
                    end_date: tournament.end_date,
                    level: player.level,
                    answers: player.answers,
                    total_points: player.total_points,
                    prize: player.prize,
                    correct_answers: player.correct_answers,
                    wrong_answers: player.wrong_answers,
                    timeouts: player.timeouts
                });
            }
        } catch (error) {
            console.warn(`Ошибка загрузки данных о турнире ${tournament.id}:`, error);
            // Продолжаем работу с другими турнирами
        }
    });
    
    // Ждем загрузки всех турниров
    await Promise.all(promises);
    
    // Сортируем историю по ID турнира (по убыванию - новые сначала)
    playerData.tournament_history.sort((a, b) => b.tournament_id - a.tournament_id);
}

/**
 * Загрузка данных об игроке
 * @param {string} userId - ID игрока или имя пользователя
 */
async function loadPlayerData(userId) {
    try {
        // Загружаем all_data.json для поиска игрока
        const response = await fetch('data/all_data.json');
        const allData = await response.json();
        
        // Проверяем, является ли userId числом (ID) или строкой (имя пользователя)
        const isNumericId = !isNaN(parseInt(userId));
        
        let player;
        if (isNumericId) {
            // Ищем по числовому ID
            player = allData.players.find(p => p.user_id == userId);
        } else {
            // Если это не числовой ID, ищем по имени пользователя (для обратной совместимости)
            player = allData.players.find(p => p.username === userId);
        }
        
        if (!player) {
            return null;
        }
        
        // Если нашли игрока, возвращаем его данные
        return player;
    } catch (error) {
        console.error('Ошибка загрузки данных игрока:', error);
        throw error;
    }
}

/**
 * Отображение сообщения о том, что игрок не найден
 */
function showPlayerNotFound() {
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('playerNotFound').style.display = 'block';
}

/**
 * Отображение сообщения об ошибке
 */
function showError() {
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'block';
}

/**
 * Отображение профиля игрока
 */
function displayPlayerProfile() {
    // Скрываем индикатор загрузки
    document.getElementById('loadingIndicator').style.display = 'none';
    
    // Проверяем наличие данных об игроке
    if (!playerData) {
        showPlayerNotFound();
        return;
    }
    
    // Отображаем блок с профилем
    document.getElementById('playerProfile').style.display = 'block';
    
    // Обновляем заголовок страницы
    document.title = `${playerData.username} | IQ Capitalist`;
    
    // Обновляем заголовок на странице с именем игрока
    document.getElementById('playerNameTitle').textContent = playerData.username;
    
    // Заполняем основную информацию
    document.getElementById('playerLevel').textContent = playerData.level;
    document.getElementById('playerCapital').textContent = formatNumber(playerData.capital);
    document.getElementById('playerWallet').textContent = formatNumber(playerData.wallet);
    document.getElementById('playerQuestions').textContent = formatNumber(playerData.all_questions);
    document.getElementById('playerBoosters').textContent = formatNumber(playerData.remaining_boosters);
    
    // Создаем разделенные графики прогресса
    createAnswersProgressChart();
    createPointsProgressChart();
    createPrizesProgressChart();
    
    // Создаем график статистики ответов
    createAnswersStatsChart();
    
    // Заполняем таблицу с историей турниров
    displayTournamentHistory();
}

/**
 * Создание графика ответов по турнирам
 */
function createAnswersProgressChart() {
    // Если нет истории турниров, скрываем секцию
    if (!playerData.tournament_history || playerData.tournament_history.length === 0) {
        document.querySelector('.chart-section:nth-of-type(1)').style.display = 'none';
        return;
    }
    
    // Получаем элемент canvas
    const ctx = document.getElementById('answersProgressChart');
    
    // Сортируем историю по ID турнира (по возрастанию для графика)
    const sortedHistory = [...playerData.tournament_history].sort((a, b) => a.tournament_id - b.tournament_id);
    
    // Подготавливаем данные для графика
    const labels = sortedHistory.map(t => `Турнир ${t.tournament_id}`);
    const answers = sortedHistory.map(t => t.answers);
    
    // Данные для графика
    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Ответы',
                data: answers,
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                tension: 0.2
            }
        ]
    };
    
    // Опции графика
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Количество ответов'
                }
            }
        }
    };
    
    // Создаем график
    charts.answersProgress = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

/**
 * Создание графика очков по турнирам
 */
function createPointsProgressChart() {
    // Если нет истории турниров, скрываем секцию
    if (!playerData.tournament_history || playerData.tournament_history.length === 0) {
        document.querySelector('.chart-section:nth-of-type(2)').style.display = 'none';
        return;
    }
    
    // Получаем элемент canvas
    const ctx = document.getElementById('pointsProgressChart');
    
    // Сортируем историю по ID турнира (по возрастанию для графика)
    const sortedHistory = [...playerData.tournament_history].sort((a, b) => a.tournament_id - b.tournament_id);
    
    // Подготавливаем данные для графика
    const labels = sortedHistory.map(t => `Турнир ${t.tournament_id}`);
    const points = sortedHistory.map(t => t.total_points);
    
    // Данные для графика
    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Очки',
                data: points,
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 2,
                tension: 0.2
            }
        ]
    };
    
    // Опции графика
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Очки'
                }
            }
        }
    };
    
    // Создаем график
    charts.pointsProgress = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

/**
 * Создание графика призов по турнирам
 */
function createPrizesProgressChart() {
    // Если нет истории турниров, скрываем секцию
    if (!playerData.tournament_history || playerData.tournament_history.length === 0) {
        document.querySelector('.chart-section:nth-of-type(3)').style.display = 'none';
        return;
    }
    
    // Получаем элемент canvas
    const ctx = document.getElementById('prizesProgressChart');
    
    // Сортируем историю по ID турнира (по возрастанию для графика)
    const sortedHistory = [...playerData.tournament_history].sort((a, b) => a.tournament_id - b.tournament_id);
    
    // Подготавливаем данные для графика
    const labels = sortedHistory.map(t => `Турнир ${t.tournament_id}`);
    const prizes = sortedHistory.map(t => t.prize);
    
    // Данные для графика
    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Призы',
                data: prizes,
                backgroundColor: 'rgba(155, 89, 182, 0.2)',
                borderColor: 'rgba(155, 89, 182, 1)',
                borderWidth: 2,
                tension: 0.2
            }
        ]
    };
    
    // Опции графика
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Приз (IQC)'
                }
            }
        }
    };
    
    // Создаем график
    charts.prizesProgress = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

/**
 * Создание графика статистики ответов
 */
function createAnswersStatsChart() {
    // Если нет истории турниров, скрываем секцию
    if (!playerData.tournament_history || playerData.tournament_history.length === 0) {
        document.querySelector('.chart-section:nth-of-type(4)').style.display = 'none';
        return;
    }
    
    // Получаем элемент canvas
    const ctx = document.getElementById('answersStatsChart');
    
    // Сортируем историю по ID турнира (по возрастанию для графика)
    const sortedHistory = [...playerData.tournament_history].sort((a, b) => a.tournament_id - b.tournament_id);
    
    // Подготавливаем данные для графика
    const labels = sortedHistory.map(t => `Турнир ${t.tournament_id}`);
    
    // Получаем данные о типах ответов для каждого турнира
    const timeouts = [];
    const correctSlow = [];
    const correctMedium = [];
    const correctFast = [];
    const wrongSlow = [];
    const wrongMedium = [];
    const wrongFast = [];
    
    sortedHistory.forEach(tournament => {
        // Собираем данные (положительные значения - вверх)
        timeouts.push(tournament.timeouts || 0);
        correctSlow.push(tournament.correct_answers?.slow || 0);
        correctMedium.push(tournament.correct_answers?.medium || 0);
        correctFast.push(tournament.correct_answers?.fast || 0);
        
        // Собираем данные (негативные значения - вниз)
        wrongSlow.push(-(tournament.wrong_answers?.slow || 0));
        wrongMedium.push(-(tournament.wrong_answers?.medium || 0));
        wrongFast.push(-(tournament.wrong_answers?.fast || 0));
    });
    
    // Данные для графика - один общий стэк
    const data = {
        labels: labels,
        datasets: [
            // Положительные значения (вверх) в порядке от нуля
            {
                label: 'Таймауты',
                data: timeouts,
                backgroundColor: 'rgba(243, 156, 18, 0.7)',
                borderColor: 'rgba(243, 156, 18, 0.9)',
                borderWidth: 1,
                stack: 'Stack 0'
            },
            {
                label: 'Медленные правильные',
                data: correctSlow,
                backgroundColor: 'rgba(46, 204, 113, 0.6)',
                borderColor: 'rgba(46, 204, 113, 0.8)',
                borderWidth: 1,
                stack: 'Stack 0'
            },
            {
                label: 'Средние правильные',
                data: correctMedium,
                backgroundColor: 'rgba(46, 204, 113, 0.8)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1,
                stack: 'Stack 0'
            },
            {
                label: 'Быстрые правильные',
                data: correctFast,
                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                borderColor: 'rgba(39, 174, 96, 1)',
                borderWidth: 1,
                stack: 'Stack 0'
            },
            // Отрицательные значения (вниз) в порядке от нуля
            {
                label: 'Медленные неправильные',
                data: wrongSlow,
                backgroundColor: 'rgba(231, 76, 60, 0.6)',
                borderColor: 'rgba(231, 76, 60, 0.8)',
                borderWidth: 1,
                stack: 'Stack 0'
            },
            {
                label: 'Средние неправильные',
                data: wrongMedium,
                backgroundColor: 'rgba(231, 76, 60, 0.7)',
                borderColor: 'rgba(231, 76, 60, 0.9)',
                borderWidth: 1,
                stack: 'Stack 0'
            },
            {
                label: 'Быстрые неправильные',
                data: wrongFast,
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1,
                stack: 'Stack 0'
            }
        ]
    };
    
    // Опции графика
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Турниры'
                }
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Количество ответов'
                }
            }
        },
        plugins: {
            legend: {
                position: 'right'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.dataset.label || '';
                        const value = context.raw;
                        
                        // Для отрицательных значений показываем положительное число
                        if (value < 0) {
                            return `${label}: ${Math.abs(value)}`;
                        }
                        return `${label}: ${value}`;
                    }
                }
            }
        }
    };
    
    // Создаем график
    charts.answersStats = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
    });
}

/**
 * Отображение истории турниров
 */
function displayTournamentHistory() {
    // Получаем элемент таблицы
    const tableBody = document.getElementById('tournamentHistoryTableBody');
    
    // Если нет истории турниров, скрываем секцию
    if (!playerData.tournament_history || playerData.tournament_history.length === 0) {
        document.querySelector('.history-section').style.display = 'none';
        return;
    }
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    // Добавляем строки для каждого турнира
    playerData.tournament_history.forEach(tournament => {
        const row = document.createElement('tr');
        
        // Форматируем дату турнира
        let dateText = `#${tournament.tournament_id}`;
        if (tournament.start_date) {
            const startDate = new Date(tournament.start_date);
            if (!isNaN(startDate.getTime())) {
                dateText += ` (${startDate.toLocaleDateString('ru-RU')})`;
            }
        }
        
        row.innerHTML = `
            <td>${dateText}</td>
            <td>${tournament.level}</td>
            <td>${formatNumber(tournament.answers)}</td>
            <td>${formatDecimal(tournament.total_points)}</td>
            <td>${formatNumber(tournament.prize)}</td>
            <td>
                <button class="btn-details" onclick="showTournamentDetails(${tournament.tournament_id})">
                    Детали
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Показать детали турнира
 * @param {number} tournamentId - ID турнира
 */
function showTournamentDetails(tournamentId) {
    // Перенаправляем на страницу турнира
    window.location.href = `tournament.html?id=${tournamentId}`;
}

/**
 * Форматирование числа
 * @param {number} num - Число для форматирования
 * @returns {string} - Отформатированное число
 */
function formatNumber(num) {
    return num.toLocaleString('ru-RU');
}

/**
 * Форматирование десятичного числа
 * @param {number} num - Число для форматирования
 * @returns {string} - Отформатированное число с одним знаком после запятой
 */
function formatDecimal(num) {
    return num.toLocaleString('ru-RU', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
}

// Экспортируем функцию showTournamentDetails в глобальную область видимости
window.showTournamentDetails = showTournamentDetails;
