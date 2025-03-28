/**
 * Скрипт для страницы отдельного турнира IQ Capitalist
 */

// Загрузка шапки и подвала
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header').innerHTML = data;
            highlightCurrentPage(); // Добавляем выделение текущей страницы в меню
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
        
    // Загрузка данных турнира
    loadTournamentData();
});

// Выделение текущей страницы в меню
function highlightCurrentPage() {
    const navLinks = document.querySelectorAll('nav a');
    // Для турнира выделяем ссылку на рейтинги
    navLinks.forEach(link => {
        if (link.getAttribute('href') === 'ratings.html') {
            link.classList.add('active');
        }
    });
}

// Загрузка данных турнира
async function loadTournamentData() {
    try {
        // Добавляем индикатор загрузки
        document.querySelector('.container').insertAdjacentHTML('beforeend', 
            `<div id="loading-indicator" class="text-center my-5">
                <p>Загрузка данных турнира...</p>
            </div>`);
            
        const response = await fetch('data/1.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Удаляем индикатор загрузки
        document.getElementById('loading-indicator').remove();
        
        displayTournamentData(data);
    } catch (error) {
        console.error('Ошибка загрузки данных турнира:', error);
        
        // Удаляем индикатор загрузки, если он есть
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();
        
        document.querySelector('.container').insertAdjacentHTML('beforeend', 
            `<div class="error-message">
                <p>Ошибка загрузки данных турнира: ${error.message}</p>
                <p>Пожалуйста, попробуйте обновить страницу позже.</p>
                <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                    Обновить страницу
                </button>
            </div>`);
    }
}

// Отображение данных турнира
function displayTournamentData(data) {
    if (!data || !data.tournament) {
        showErrorMessage('Неверный формат данных турнира');
        return;
    }
    
    displayTournamentInfo(data);
    displayLevelChart(data);
    displayAnswersStats(data);
    displayDetailedStats(data);

    // Анимация появления элементов
    animateElements();
}

// Анимация появления элементов
function animateElements() {
    const elements = document.querySelectorAll('.tournament-info, .stat-card');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Показать сообщение об ошибке
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

// Форматирование даты из ISO в читаемый формат
function formatDate(isoDate) {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.toLocaleString('ru', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year} года`;
}

// Форматирование периода проведения турнира
function formatTournamentPeriod(startDate, endDate) {
    if (!startDate || !endDate) {
        return 'Даты не указаны';
    }
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
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

// Отображение общей информации о турнире
function displayTournamentInfo(data) {
    const tournament = data.tournament;
    document.getElementById('tournament-dates').textContent = 
        formatTournamentPeriod(tournament.start_date, tournament.end_date);
    
    document.getElementById('total-questions').textContent = 
        tournament.total_questions ? tournament.total_questions.toLocaleString('ru-RU') : 'Н/Д';
    
    const totalPlayers = data.stats && data.stats.total_players ? 
        data.stats.total_players.toLocaleString('ru-RU') : 'Н/Д';
    document.getElementById('total-players').textContent = totalPlayers;
    
    const prizePool = data.stats && data.stats.total_prize_pool ? 
        `${data.stats.total_prize_pool.toLocaleString('ru-RU')} IQC` : 'Н/Д';
    document.getElementById('prize-pool').textContent = prizePool;
}

// Отображение диаграммы распределения игроков по уровням
function displayLevelChart(data) {
    if (!data.stats || !data.stats.players_by_level) {
        console.warn('Нет данных о распределении игроков по уровням');
        document.querySelector('.participants-by-level .chart-container').innerHTML = 
            '<p class="text-center mt-4">Нет данных для отображения</p>';
        return;
    }
    
    const levelPlayers = data.stats.players_by_level;
    
    // Правильный порядок уровней
    const levelOrder = [
        'Знаток', 
        'Эксперт', 
        'Мастер', 
        'Босс', 
        'Титан', 
        'Легенда', 
        'Корифей', 
        'Гуру', 
        'IQ Капиталист'
    ];
    
    // Фильтруем и сортируем уровни по правильному порядку
    const levels = levelOrder.filter(level => level in levelPlayers);
    const playerCounts = levels.map(level => levelPlayers[level]);
    
    // Цвета для уровней
    const levelColors = {
        'Знаток': '#4682B4',
        'Эксперт': '#2E8B57',
        'Мастер': '#CD853F',
        'Босс': '#8B4513',
        'Титан': '#800080',
        'Легенда': '#B8860B',
        'Корифей': '#483D8B',
        'Гуру': '#B22222',
        'IQ Капиталист': '#000000'
    };
    
    const colors = levels.map(level => levelColors[level] || '#3498db');
    
    // Добавляем стили для вертикальной легенды
    const style = document.createElement('style');
    style.textContent = `
        #levelChart + .chartjs-legend ul {
            display: flex;
            flex-direction: column !important;
            align-items: flex-start !important;
        }
        
        #levelChart + .chartjs-legend ul li {
            margin: 8px 0 !important;
            font-size: 16px !important;
        }
    `;
    document.head.appendChild(style);
    
    const ctx = document.getElementById('levelChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: levels,
            datasets: [{
                data: playerCounts,
                backgroundColor: colors,
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'start',
                    labels: {
                        font: {
                            size: 16  // Увеличенный размер шрифта
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 12,
                        generateLabels: function(chart) {
                            // Получение данных напрямую из chart
                            const data = chart.data;
                            const dataset = data.datasets[0];
                            const labels = data.labels;
                            
                            // Создаем контейнер для легенды, если его нет
                            if (!document.querySelector('#levelChart + .chartjs-legend')) {
                                const legendContainer = document.createElement('div');
                                legendContainer.className = 'chartjs-legend';
                                
                                const ul = document.createElement('ul');
                                ul.style.display = 'flex';
                                ul.style.flexDirection = 'column';
                                ul.style.listStyle = 'none';
                                ul.style.padding = '0';
                                ul.style.margin = '20px 0 0 0';
                                
                                labels.forEach((label, i) => {
                                    const li = document.createElement('li');
                                    li.style.display = 'flex';
                                    li.style.alignItems = 'center';
                                    li.style.margin = '8px 0';
                                    li.style.fontSize = '16px';
                                    
                                    const colorBox = document.createElement('span');
                                    colorBox.style.display = 'inline-block';
                                    colorBox.style.width = '14px';
                                    colorBox.style.height = '14px';
                                    colorBox.style.backgroundColor = dataset.backgroundColor[i];
                                    colorBox.style.marginRight = '8px';
                                    colorBox.style.borderRadius = '50%';
                                    
                                    const value = dataset.data[i];
                                    const total = dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round(value / total * 100);
                                    
                                    const text = document.createTextNode(`${label}: ${value} (${percentage}%)`);
                                    
                                    li.appendChild(colorBox);
                                    li.appendChild(text);
                                    ul.appendChild(li);
                                });
                                
                                legendContainer.appendChild(ul);
                                chart.canvas.parentNode.appendChild(legendContainer);
                            }
                            
                            // Возвращаем пустой массив, т.к. мы создаем легенду вручную
                            return [];
                        }
                    },
                    onClick: null  // Отключаем клики по легенде
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = data.stats.total_players || 
                                          playerCounts.reduce((a, b) => a + b, 0);
                            const percentage = Math.round(value / total * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    },
                    padding: 10,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            }
        }
    });
}

// Отображение статистики ответов
function displayAnswersStats(data) {
    if (!data.players || !Array.isArray(data.players) || data.players.length === 0) {
        console.warn('Нет данных об игроках для расчета статистики ответов');
        document.querySelector('.answers-stats .chart-container').innerHTML = 
            '<p class="text-center mt-4">Нет данных для отображения</p>';
        document.querySelector('.answers-grid').innerHTML = '';
        return;
    }
    
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalTimeouts = 0;
    
    data.players.forEach(player => {
        if (!player.correct_answers || !player.wrong_answers) return;
        
        const correct = (player.correct_answers.fast || 0) + 
                       (player.correct_answers.medium || 0) + 
                       (player.correct_answers.slow || 0);
        const wrong = (player.wrong_answers.fast || 0) + 
                     (player.wrong_answers.medium || 0) + 
                     (player.wrong_answers.slow || 0);
        
        totalCorrect += correct;
        totalWrong += wrong;
        totalTimeouts += player.timeouts || 0;
    });
    
    document.getElementById('correct-answers').textContent = totalCorrect.toLocaleString('ru-RU');
    document.getElementById('wrong-answers').textContent = totalWrong.toLocaleString('ru-RU');
    document.getElementById('timeouts').textContent = totalTimeouts.toLocaleString('ru-RU');
    
    const totalAnswers = totalCorrect + totalWrong + totalTimeouts;
    
    if (totalAnswers === 0) {
        console.warn('Нет данных о ответах');
        document.querySelector('.answers-stats .chart-container').innerHTML = 
            '<p class="text-center mt-4">Нет данных для отображения</p>';
        return;
    }
    
    // Круговая диаграмма ответов
    const ctx = document.getElementById('answersChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Правильные', 'Неправильные', 'Таймауты'],
            datasets: [{
                data: [totalCorrect, totalWrong, totalTimeouts],
                backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12'],
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = Math.round(value / totalAnswers * 100);
                            return `${label}: ${value.toLocaleString('ru-RU')} (${percentage}%)`;
                        }
                    },
                    padding: 10,
                    backgroundColor: 'rgba(0,0,0,0.8)'
                }
            }
        }
    });
}

// Отображение детальной статистики по типам ответов
function displayDetailedStats(data) {
    if (!data.players || !Array.isArray(data.players) || data.players.length === 0) {
        console.warn('Нет данных об игроках для расчета детальной статистики');
        document.getElementById('detailed-stats-body').innerHTML = 
            '<tr><td colspan="3" class="text-center">Нет данных для отображения</td></tr>';
        return;
    }
    
    let fastCorrect = 0;
    let mediumCorrect = 0;
    let slowCorrect = 0;
    let fastWrong = 0;
    let mediumWrong = 0;
    let slowWrong = 0;
    let timeouts = 0;
    
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
    
    const totalAnswers = fastCorrect + mediumCorrect + slowCorrect + 
                        fastWrong + mediumWrong + slowWrong + timeouts;
    
    if (totalAnswers === 0) {
        document.getElementById('detailed-stats-body').innerHTML = 
            '<tr><td colspan="3" class="text-center">Нет данных для отображения</td></tr>';
        return;
    }
    
    const statsData = [
        { 
            name: 'Быстрые правильные (до 40 сек)', 
            count: fastCorrect, 
            percent: (fastCorrect / totalAnswers * 100).toFixed(1) + '%',
            type: 'fast-correct'
        },
        { 
            name: 'Средние правильные (40-80 сек)', 
            count: mediumCorrect, 
            percent: (mediumCorrect / totalAnswers * 100).toFixed(1) + '%',
            type: 'medium-correct'
        },
        { 
            name: 'Медленные правильные (более 80 сек)', 
            count: slowCorrect, 
            percent: (slowCorrect / totalAnswers * 100).toFixed(1) + '%',
            type: 'slow-correct'
        },
        { 
            name: 'Быстрые неправильные', 
            count: fastWrong, 
            percent: (fastWrong / totalAnswers * 100).toFixed(1) + '%',
            type: 'fast-wrong'
        },
        { 
            name: 'Средние неправильные', 
            count: mediumWrong, 
            percent: (mediumWrong / totalAnswers * 100).toFixed(1) + '%',
            type: 'medium-wrong'
        },
        { 
            name: 'Медленные неправильные', 
            count: slowWrong, 
            percent: (slowWrong / totalAnswers * 100).toFixed(1) + '%',
            type: 'slow-wrong'
        },
        { 
            name: 'Таймауты', 
            count: timeouts, 
            percent: (timeouts / totalAnswers * 100).toFixed(1) + '%',
            type: 'timeout'
        }
    ];
    
    const tableBody = document.getElementById('detailed-stats-body');
    tableBody.innerHTML = statsData.map(stat => 
        `<tr data-type="${stat.type}">
            <td>${stat.name}</td>
            <td>${stat.count.toLocaleString('ru-RU')}</td>
            <td>${stat.percent}</td>
        </tr>`
    ).join('');
}
