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
            
            // Загружаем данные о турнирах (реферальные данные уже включены в playerData)
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
    document.title = `Игрок ${playerData.username} | IQ Capitalist`;
    
    // Обновляем заголовок на странице с именем игрока
    document.getElementById('playerNameTitle').textContent = `Игрок ${playerData.username}`;
    
    // Заполняем основную информацию
    document.getElementById('playerLevel').textContent = playerData.level;
    document.getElementById('playerCapital').textContent = formatNumber(playerData.capital);
    document.getElementById('playerWallet').textContent = formatNumber(playerData.wallet);
    document.getElementById('playerQuestions').textContent = formatNumber(playerData.all_questions);
    document.getElementById('playerBoosters').textContent = formatNumber(playerData.remaining_boosters);
    document.getElementById('playerTickets').textContent = formatNumber(playerData.tickets || 0);
    
    // Отображаем реферальные данные
    displayReferralData();
    
    // Отображаем данные о призах в турнирах
    displayTournamentPrizesData();
    
    // Отображаем данные о купленных монетах
    displayPurchasedCoinsData();
    
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
 * Расчет и отображение реферальных данных
 */
function displayReferralData() {
    // Получаем данные о реферальных наградах из playerData
    let totalReward20 = 0;

    // Проверяем наличие предрассчитанных реферальных данных
    if (playerData && playerData.referral_rewards20 !== undefined) {
        totalReward20 = playerData.referral_rewards20;
    }

    // Обновляем элементы на странице
    const referralRewardElement = document.getElementById('referralReward');

    if (referralRewardElement) {
        referralRewardElement.textContent = formatNumber(totalReward20);
    }
}

/**
 * Расчет и отображение данных о призах в турнирах
 */
function displayTournamentPrizesData() {
    let totalPrizes = 0;
    
    // Проверяем наличие истории турниров
    if (playerData.tournament_history && playerData.tournament_history.length > 0) {
        // Суммируем призы со всех турниров
        totalPrizes = playerData.tournament_history.reduce((sum, tournament) => {
            return sum + (tournament.prize || 0);
        }, 0);
    }
    
    // Обновляем элемент на странице
    const tournamentPrizesElement = document.getElementById('tournamentPrizes');
    if (tournamentPrizesElement) {
        tournamentPrizesElement.textContent = formatNumber(totalPrizes);
    }
}

/**
 * Отображение данных о купленных монетах
 */
function displayPurchasedCoinsData() {
    let purchasedCoins = 0;
    
    // Проверяем наличие данных о купленных монетах
    if (playerData && playerData.purchased_coins !== undefined) {
        purchasedCoins = playerData.purchased_coins;
    }
    
    // Обновляем элемент на странице
    const purchasedCoinsElement = document.getElementById('purchasedCoins');
    if (purchasedCoinsElement) {
        purchasedCoinsElement.textContent = formatNumber(purchasedCoins);
    }
}

/**
 * Вспомогательная функция для нормализации данных графика с учетом пропущенных турниров
 * @param {Array} tournamentHistory - История турниров игрока
 * @param {String} dataField - Поле для извлечения данных (например, 'answers', 'total_points', 'prize')
 * @param {Number} minTournamentId - Минимальный ID турнира
 * @param {Number} maxTournamentId - Максимальный ID турнира
 * @returns {Object} - Объект с массивами меток и данных
 */
function normalizeChartDataWithGaps(tournamentHistory, dataField, minTournamentId, maxTournamentId) {
    // Создаем объект для быстрого доступа к данным по ID турнира
    const tournamentDataById = {};
    tournamentHistory.forEach(tournament => {
        tournamentDataById[tournament.tournament_id] = tournament;
    });
    
    // Создаем полные массивы меток и данных
    const labels = [];
    const data = [];
    
    // Заполняем массивы для всех ID турниров от минимального до максимального
    for (let id = minTournamentId; id <= maxTournamentId; id++) {
        labels.push(`Турнир ${id}`);
        
        // Если у игрока есть данные по этому турниру, берем их, иначе ставим null
        if (tournamentDataById[id]) {
            data.push(tournamentDataById[id][dataField]);
        } else {
            data.push(null);
        }
    }
    
    return { labels, data };
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
    
    // Уничтожаем предыдущий график, если он существует
    if (charts.answersProgress) {
        charts.answersProgress.destroy();
    }
    
    // Находим минимальный и максимальный ID турнира из всех завершенных турниров,
    // а не только тех, в которых участвовал игрок
    const allTournamentIds = tournamentsData
        .filter(t => t.status !== 'active')
        .map(t => t.id);
    
    if (allTournamentIds.length === 0) {
        // Если нет данных о завершенных турнирах, используем только турниры игрока
        const tournamentIds = playerData.tournament_history.map(t => t.tournament_id);
        const minTournamentId = Math.min(...tournamentIds);
        const maxTournamentId = Math.max(...tournamentIds);
        
        // Нормализуем данные с учетом пропущенных турниров
        const { labels, data } = normalizeChartDataWithGaps(
            playerData.tournament_history, 
            'answers', 
            minTournamentId, 
            maxTournamentId
        );
        
        createAnswersChart(ctx, labels, data);
        return;
    }
    
    const minTournamentId = Math.min(...allTournamentIds);
    const maxTournamentId = Math.max(...allTournamentIds);
    
    // Нормализуем данные с учетом пропущенных турниров
    const { labels, data } = normalizeChartDataWithGaps(
        playerData.tournament_history, 
        'answers', 
        minTournamentId, 
        maxTournamentId
    );
    
    createAnswersChart(ctx, labels, data);
}

/**
 * Вспомогательная функция для создания графика ответов
 */
function createAnswersChart(ctx, labels, data) {
    // Данные для графика
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Ответы',
                data: data,
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
        spanGaps: false, // Не соединять точки с null или undefined значениями
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
        data: chartData,
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
    
    // Уничтожаем предыдущий график, если он существует
    if (charts.pointsProgress) {
        charts.pointsProgress.destroy();
    }
    
    // Находим минимальный и максимальный ID турнира из всех завершенных турниров,
    // а не только тех, в которых участвовал игрок
    const allTournamentIds = tournamentsData
        .filter(t => t.status !== 'active')
        .map(t => t.id);
    
    if (allTournamentIds.length === 0) {
        // Если нет данных о завершенных турнирах, используем только турниры игрока
        const tournamentIds = playerData.tournament_history.map(t => t.tournament_id);
        const minTournamentId = Math.min(...tournamentIds);
        const maxTournamentId = Math.max(...tournamentIds);
        
        // Нормализуем данные с учетом пропущенных турниров
        const { labels, data } = normalizeChartDataWithGaps(
            playerData.tournament_history, 
            'total_points', 
            minTournamentId, 
            maxTournamentId
        );
        
        createPointsChart(ctx, labels, data);
        return;
    }
    
    const minTournamentId = Math.min(...allTournamentIds);
    const maxTournamentId = Math.max(...allTournamentIds);
    
    // Нормализуем данные с учетом пропущенных турниров
    const { labels, data } = normalizeChartDataWithGaps(
        playerData.tournament_history, 
        'total_points', 
        minTournamentId, 
        maxTournamentId
    );
    
    createPointsChart(ctx, labels, data);
}

/**
 * Вспомогательная функция для создания графика очков
 */
function createPointsChart(ctx, labels, data) {
    // Данные для графика
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Очки',
                data: data,
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
        spanGaps: false, // Не соединять точки с null или undefined значениями
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
        data: chartData,
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
    
    // Уничтожаем предыдущий график, если он существует
    if (charts.prizesProgress) {
        charts.prizesProgress.destroy();
    }
    
    // Находим минимальный и максимальный ID турнира из всех завершенных турниров,
    // а не только тех, в которых участвовал игрок
    const allTournamentIds = tournamentsData
        .filter(t => t.status !== 'active')
        .map(t => t.id);
    
    if (allTournamentIds.length === 0) {
        // Если нет данных о завершенных турнирах, используем только турниры игрока
        const tournamentIds = playerData.tournament_history.map(t => t.tournament_id);
        const minTournamentId = Math.min(...tournamentIds);
        const maxTournamentId = Math.max(...tournamentIds);
        
        // Нормализуем данные с учетом пропущенных турниров
        const { labels, data } = normalizeChartDataWithGaps(
            playerData.tournament_history, 
            'prize', 
            minTournamentId, 
            maxTournamentId
        );
        
        createPrizesChart(ctx, labels, data);
        return;
    }
    
    const minTournamentId = Math.min(...allTournamentIds);
    const maxTournamentId = Math.max(...allTournamentIds);
    
    // Нормализуем данные с учетом пропущенных турниров
    const { labels, data } = normalizeChartDataWithGaps(
        playerData.tournament_history, 
        'prize', 
        minTournamentId, 
        maxTournamentId
    );
    
    createPrizesChart(ctx, labels, data);
}

/**
 * Вспомогательная функция для создания графика призов
 */
function createPrizesChart(ctx, labels, data) {
    // Данные для графика
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Призы',
                data: data,
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
        spanGaps: false, // Не соединять точки с null или undefined значениями
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
        data: chartData,
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
    
    // Уничтожаем предыдущий график, если он существует
    if (charts.answersStats) {
        charts.answersStats.destroy();
    }
    
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
    
    // Находим минимальный и максимальный ID турнира из всех завершенных турниров
    const allTournamentIds = tournamentsData
        .filter(t => t.status !== 'active')
        .map(t => t.id);
    
    // Если нет данных о завершенных турнирах, используем только турниры игрока
    let minTournamentId, maxTournamentId;
    if (allTournamentIds.length === 0) {
        const playerTournamentIds = playerData.tournament_history.map(t => t.tournament_id);
        minTournamentId = Math.min(...playerTournamentIds);
        maxTournamentId = Math.max(...playerTournamentIds);
    } else {
        minTournamentId = Math.min(...allTournamentIds);
        maxTournamentId = Math.max(...allTournamentIds);
    }
    
    // Создаем объект для быстрого доступа к данным по ID турнира
    const tournamentDataById = {};
    playerData.tournament_history.forEach(tournament => {
        tournamentDataById[tournament.tournament_id] = tournament;
    });
    
    // Добавляем строки для всех турниров (включая пропущенные)
    for (let id = minTournamentId; id <= maxTournamentId; id++) {
        const row = document.createElement('tr');
        
        // Проверяем, участвовал ли игрок в этом турнире
        if (tournamentDataById[id]) {
            // Если участвовал, показываем полные данные
            const tournament = tournamentDataById[id];
            row.innerHTML = `
                <td>Турнир ${id}</td>
                <td>${tournament.level}</td>
                <td>${formatNumber(tournament.answers)}</td>
                <td>${formatDecimal(tournament.total_points)}</td>
                <td>${formatNumber(tournament.prize)}</td>
            `;
        } else {
            // Если не участвовал, показываем только номер турнира и пустые ячейки
            row.innerHTML = `
                <td>Турнир ${id}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            // Добавляем класс для стилизации пропущенных турниров
            row.classList.add('missed-tournament');
        }
        
        tableBody.appendChild(row);
    }
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
