/**
 * Скрипт для страницы профиля игрока IQ Capitalist
 */

// Глобальные переменные
let playerData = null;
let tournamentsData = [];
let currentTournamentData = null;
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
        ]
    };
    
    // Опции графика
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true
            },
            y: {
                stacked: true,
                beginAtZero: true
            }
        }
    };
    
    // Создаем график
    charts.currentTournament = new Chart(ctx, {
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
}

/**
 * Создание графика статистики ответов
 */
function createAnswersStatsChart() {
    // Если нет истории турниров, скрываем секцию
    if (!playerData.tournament_history || playerData.tournament_history.length === 0) {
        document.querySelector('.chart-section:nth-of-type(2)').style.display = 'none';
        return;
    }
    
    // Получаем элемент canvas
    const ctx = document.getElementById('answersStatsChart');
    
    // Инициализируем счетчики для разных типов ответов
    let totalCorrectFast = 0;
    let totalCorrectMedium = 0;
    let totalCorrectSlow = 0;
    let totalWrongFast = 0;
    let totalWrongMedium = 0;
    let totalWrongSlow = 0;
    let totalTimeouts = 0;
    
    // Суммируем статистику по всем турнирам
    playerData.tournament_history.forEach(tournament => {
        if (tournament.correct_answers) {
            totalCorrectFast += tournament.correct_answers.fast || 0;
            totalCorrectMedium += tournament.correct_answers.medium || 0;
            totalCorrectSlow += tournament.correct_answers.slow || 0;
        }
        if (tournament.wrong_answers) {
            totalWrongFast += tournament.wrong_answers.fast || 0;
            totalWrongMedium += tournament.wrong_answers.medium || 0;
            totalWrongSlow += tournament.wrong_answers.slow || 0;
        }
        totalTimeouts += tournament.timeouts || 0;
    });
    
    // Данные для графика
    const data = {
        labels: [
            'Быстрые правильные',
            'Средние правильные',
            'Медленные правильные',
            'Быстрые неправильные',
            'Средние неправильные',
            'Медленные неправильные',
            'Таймауты'
        ],
        datasets: [{
            data: [
                totalCorrectFast,
                totalCorrectMedium,
                totalCorrectSlow,
                totalWrongFast,
                totalWrongMedium,
                totalWrongSlow,
                totalTimeouts
            ],
            backgroundColor: [
                'rgba(39, 174, 96, 0.8)',
                'rgba(46, 204, 113, 0.8)',
                'rgba(46, 204, 113, 0.6)',
                'rgba(231, 76, 60, 0.8)',
                'rgba(231, 76, 60, 0.7)',
                'rgba(231, 76, 60, 0.6)',
                'rgba(243, 156, 18, 0.7)'
            ],
            borderWidth: 1
        }]
    };
    
    // Опции графика
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right'
            }
        }
    };
    
    // Создаем график
    charts.answersStats = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: options
    });
}

/**
 * Создание графика прогресса по турнирам
 */
function createTournamentProgressChart() {
    // Если нет истории турниров, скрываем секцию
    if (!playerData.tournament_history || playerData.tournament_history.length === 0) {
        document.querySelector('.chart-section:nth-of-type(1)').style.display = 'none';
        return;
    }
    
    // Получаем элемент canvas
    const ctx = document.getElementById('tournamentProgressChart');
    
    // Сортируем историю по ID турнира (по возрастанию для графика)
    const sortedHistory = [...playerData.tournament_history].sort((a, b) => a.tournament_id - b.tournament_id);
    
    // Подготавливаем данные для графика
    const labels = sortedHistory.map(t => `Турнир ${t.tournament_id}`);
    const answers = sortedHistory.map(t => t.answers);
    const points = sortedHistory.map(t => t.total_points);
    const prizes = sortedHistory.map(t => t.prize);
    
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
                tension: 0.2,
                yAxisID: 'y'
            },
            {
                label: 'Очки',
                data: points,
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 2,
                tension: 0.2,
                yAxisID: 'y'
            },
            {
                label: 'Приз',
                data: prizes,
                backgroundColor: 'rgba(155, 89, 182, 0.2)',
                borderColor: 'rgba(155, 89, 182, 1)',
                borderWidth: 2,
                tension: 0.2,
                yAxisID: 'y1'
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
                    text: 'Ответы / Очки'
                }
            },
            y1: {
                beginAtZero: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false
                },
                title: {
                    display: true,
                    text: 'Приз (IQC)'
                }
            }
        }
    };
    
    // Создаем график
    charts.tournamentProgress = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
            
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
            
            // Загружаем данные о текущем турнире (если есть)
            return loadCurrentTournamentData();
        })
        .then(() => {
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
 * Загрузка данных о текущем турнире
 */
async function loadCurrentTournamentData() {
    try {
        // Получаем все данные (содержит информацию о текущем турнире)
        const response = await fetch('data/all_data.json');
        const allData = await response.json();
        
        // Если нет активного турнира, выходим
        if (!allData.tournament || !allData.tournament.activeTournament) {
            return;
        }
        
        // Сохраняем данные о текущем турнире
        currentTournamentData = allData.tournament;
        
        // Возвращаем успешный результат
        return true;
    } catch (error) {
        console.error('Ошибка загрузки данных о текущем турнире:', error);
        // В случае ошибки продолжаем работу без данных о текущем турнире
        return false;
    }
}

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
    
    // Получаем имя игрока для поиска
    const username = playerData.username;
    
    // Перебираем все турниры из индекса
    const promises = tournamentsData.map(async (tournament) => {
        try {
            // Загружаем данные о конкретном турнире
            const response = await fetch(`data/${tournament.id}.json`);
            const tournamentData = await response.json();
            
            // Ищем игрока в этом турнире
            const player = tournamentData.players.find(p => p.username === username);
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
 * @param {string} userId - ID игрока
 */
async function loadPlayerData(userId) {
    try {
        // Сначала загружаем all_data.json, чтобы найти игрока по имени
        const response = await fetch('data/all_data.json');
        const allData = await response.json();
        
        // Ищем игрока в списке всех игроков
        const player = allData.players.find(p => p.username === userId);
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
    
    // Заполняем основную информацию
    document.getElementById('playerName').textContent = playerData.username;
    document.getElementById('playerLevel').textContent = playerData.level;
    document.getElementById('playerCapital').textContent = formatNumber(playerData.capital);
    document.getElementById('playerWallet').textContent = formatNumber(playerData.wallet);
    document.getElementById('playerQuestions').textContent = formatNumber(playerData.all_questions);
    document.getElementById('playerBoosters').textContent = formatNumber(playerData.remaining_boosters);
    
    // Отображаем информацию о текущем турнире (если есть)
    displayCurrentTournamentData();
    
    // Создаем графики
    createTournamentProgressChart();
    createAnswersStatsChart();
    
    // Заполняем таблицу с историей турниров
    displayTournamentHistory();
}

/**
 * Отображение данных о текущем турнире
 */
function displayCurrentTournamentData() {
    const currentTournamentSection = document.getElementById('currentTournamentSection');
    
    // Проверяем наличие данных о текущем турнире
    if (!currentTournamentData || !currentTournamentData.activeTournament) {
        currentTournamentSection.style.display = 'none';
        return;
    }
    
    // Ищем игрока в текущем турнире
    let playerInTournament = null;
    let playerLevel = playerData.level;
    let levelRatings = currentTournamentData.ratings[playerLevel] || [];
    
    // Ищем игрока в рейтингах его уровня
    playerInTournament = levelRatings.find(p => p.username === playerData.username);
    
    // Если игрок не найден, скрываем секцию
    if (!playerInTournament) {
        currentTournamentSection.style.display = 'none';
        return;
    }
    
    // Обновляем данные
    document.getElementById('currentTournamentQuestions').textContent = 
        formatNumber(playerInTournament.tournament_questions || 0);
    
    document.getElementById('currentTournamentPoints').textContent = 
        formatDecimal(playerInTournament.points || 0);
    
    // Определяем место игрока
    const playerPosition = levelRatings.findIndex(p => p.username === playerData.username) + 1;
    document.getElementById('currentTournamentPlace').textContent = 
        playerPosition > 0 ? formatNumber(playerPosition) : '—';
    
    // Рассчитываем потенциальный приз
    let potentialPrize = 0;
    if (currentTournamentData.prizePools && currentTournamentData.prizePools[playerLevel]) {
        const prizePool = currentTournamentData.prizePools[playerLevel];
        const totalPoints = levelRatings.reduce((sum, p) => sum + p.points, 0);
        
        if (totalPoints > 0) {
            potentialPrize = Math.round(prizePool * (playerInTournament.points / totalPoints));
        }
    }
    document.getElementById('currentTournamentPrize').textContent = formatNumber(potentialPrize);
    
    // Создаем график для текущего турнира
    createCurrentTournamentChart(playerInTournament);
}

/**
 * Создание графика для текущего турнира
 * @param {Object} playerData - Данные игрока в текущем турнире
 */
function createCurrentTournamentChart(playerData) {
    // Получаем элемент canvas
    const ctx = document.getElementById('currentTournamentChart');
    
    // Извлекаем статистику ответов
    let correctFast = 0;
    let correctMedium = 0;
    let correctSlow = 0;
    let wrongFast = 0;
    let wrongMedium = 0;
    let wrongSlow = 0;
    let timeouts = 0;
    
    // Проверяем наличие данных о ответах
    if (playerData.tournament_answers_fast_correct !== undefined) {
        correctFast = playerData.tournament_answers_fast_correct || 0;
        correctMedium = playerData.tournament_answers_medium_correct || 0;
        correctSlow = playerData.tournament_answers_slow_correct || 0;
        wrongFast = playerData.tournament_answers_fast_wrong || 0;
        wrongMedium = playerData.tournament_answers_medium_wrong || 0;
        wrongSlow = playerData.tournament_answers_slow_wrong || 0;
        timeouts = playerData.tournament_timeouts || 0;
    }
    
    // Данные для графика
    const data = {
        labels: ['Быстрые', 'Средние', 'Медленные', 'Таймауты'],
        datasets: [
            {
                label: 'Правильные',
                data: [correctFast, correctMedium, correctSlow, 0],
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            }
            },
            {
                label: 'Неправильные',
                data: [wrongFast, wrongMedium, wrongSlow, timeouts],
                backgroundColor: 'rgba(231, 76, 60, 0.7)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1
