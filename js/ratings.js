let currentLevel = 'Знаток';
let currentSort = { column: 'points', direction: 'desc' };
let globalData;
let globalWinnings = {};
let currentPage = 1;
const itemsPerPage = 50;

const levelRanges = {
    'Знаток': { min: 100, max: 100 },
    'Эксперт': { min: 1000, max: 1999 },
    'Мастер': { min: 2000, max: 3999 },
    'Босс': { min: 4000, max: 6999 },
    'Титан': { min: 7000, max: 10999 },
    'Легенда': { min: 11000, max: 15999 },
    'Гуру': { min: 16000, max: 22999 },
    'IQ Капиталист': { min: 23000, max: Infinity }
};

function updateLevelHeader(level) {
    const levelHeader = document.getElementById('levelHeader');
    const range = levelRanges[level];
    
    // Для уровня "Знаток" показываем только минимальное значение
    const maxText = level === 'Знаток' 
        ? '' 
        : (range.max === Infinity ? '+' : '-' + range.max);
    
    const playersCount = globalData.tournament.playersByLevel[level];
    const prizePool = globalData.tournament.prizePools[level] || 0;
    levelHeader.innerHTML = `
        <h2>Уровень ${level} (${range.min}${maxText})</h2>
        <p class="level-info">Участников: ${playersCount}. Призовой фонд: ${prizePool.toLocaleString('ru-RU')} IQC</p>
    `;
}

function isActiveTournament() {
    return globalData.tournament.activeTournament !== null;
}

function toggleTournamentElements(show) {
    const elements = ['levelButtons', 'levelHeader', 'ratingTable', 'searchInput'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = show ? '' : 'none';
        }
    });
}

function loadData() {
    console.log('Attempting to load data...');
    const timestamp = new Date().getTime();
    fetch(`data/all_data.json?t=${timestamp}`, {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    .then(response => {
        const lastModified = response.headers.get('Last-Modified');
        if (lastModified) {
            localStorage.setItem('lastModified', lastModified);
        }
        return response.json();
    })
    .then(data => {
        console.log('Data loaded successfully:', data);
        globalData = data;
        
        // Обновляем заголовок с номером турнира
        updateTournamentHeader();
        
        // Обновляем информацию о времени и статистике
        updateLastUpdate(data.lastUpdate);

        // Если нет активного турнира, скрываем элементы и показываем сообщение
        if (!data.tournament.activeTournament) {
            toggleTournamentElements(false);
            const tournamentInfo = document.getElementById('tournamentInfo');
            tournamentInfo.innerHTML = `
                <div class="tournament-info">
                    <p>На данный момент нет активного турнира</p>
                </div>
            `;
            return;
        }

        // Рассчитываем потенциальные выигрыши для каждого уровня
        globalWinnings = {};
        Object.keys(data.tournament.ratings).forEach(level => {
            globalWinnings[level] = calculatePotentialWinnings(data.tournament.ratings[level], level);
        });

        // Если все в порядке, показываем интерфейс
        toggleTournamentElements(true);
        createLevelButtons(Object.keys(data.tournament.ratings));
        updateLevelHeader(currentLevel);
        displayRatings(data.tournament.ratings[currentLevel]);
        
        checkForForceUpdate(data.lastUpdate);
    })
    .catch(error => {
        console.error('Error loading data:', error);
        const ratingTable = document.getElementById('ratingTable');
        if (ratingTable) {
            ratingTable.innerHTML = `
                <p class="text-danger">Ошибка загрузки данных: ${error.message}</p>
                <p>Попробуйте обновить страницу. Если ошибка повторится, сообщите администратору.</p>
            `;
        }
    });
}

/**
 * Обновляет заголовок с номером турнира
 */
function updateTournamentHeader() {
    // Добавляем заголовок с номером турнира под основным заголовком
    if (globalData && globalData.tournament && globalData.tournament.activeTournament) {
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            // Создаем новый элемент для заголовка турнира, если его еще нет
            let tournamentTitle = document.getElementById('tournamentTitle');
            if (!tournamentTitle) {
                tournamentTitle = document.createElement('h2');
                tournamentTitle.id = 'tournamentTitle';
                tournamentTitle.className = 'level-title';
                tournamentTitle.style.fontStyle = 'normal';
                tournamentTitle.style.marginTop = '10px';
                
                // Вставляем заголовок после основного заголовка
                pageTitle.insertAdjacentElement('afterend', tournamentTitle);
            }
            
            // Обновляем текст заголовка
            tournamentTitle.textContent = `Турнир ${globalData.tournament.activeTournament}`;
        }
    }
}

/**
 * Обновление информации о последнем обновлении, времени до конца турнира и статистике
 * @param {String} lastUpdate - Дата и время последнего обновления
 */
function updateLastUpdate(lastUpdate) {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        let infoHTML = `Данные обновлены: ${lastUpdate}`;
        
        // Добавляем информацию о времени до конца турнира, если есть активный турнир
        if (globalData && globalData.tournament && globalData.tournament.activeTournament && globalData.tournament.endDate) {
            // Используем строку lastUpdate как базу для времени сервера
            const timeLeft = getTimeLeftUntilEnd(globalData.tournament.endDate, lastUpdate);
            if (timeLeft) {
                infoHTML += `<br>До конца турнира осталось: ${timeLeft}`;
            }
            
            // Добавляем статистику участников и ответов
            // Подсчитываем общее количество ответов по всем уровням
            let totalQuestions = 0;
            Object.keys(globalData.tournament.ratings).forEach(level => {
                globalData.tournament.ratings[level].forEach(player => {
                    totalQuestions += player.tournament_questions || 0;
                });
            });
            
            infoHTML += `<br>Участников: ${globalData.tournament.totalPlayers}. 
            Ответов: ${totalQuestions.toLocaleString('ru-RU')}`;
        }
        
        lastUpdateElement.innerHTML = infoHTML;
        lastUpdateElement.style.textAlign = 'left';
        lastUpdateElement.style.marginBottom = '20px';
        lastUpdateElement.style.color = 'var(--secondary-color)';
    } else {
        console.warn('Last update element not found');
    }
}

/**
 * Вычисляет и форматирует время до конца турнира,
 * используя время сервера и вычитая 3 минуты (время прекращения отправки вопросов)
 * 
 * @param {String} endDateStr - Дата и время окончания турнира
 * @param {String} serverTimeStr - Строка с текущим временем сервера
 * @returns {String|null} - Отформатированное время или null, если турнир уже закончился
 */
function getTimeLeftUntilEnd(endDateStr, serverTimeStr) {
    // Отладочная информация
    console.log('endDateStr:', endDateStr);
    console.log('serverTimeStr:', serverTimeStr);
    
    try {
        // Преобразуем строку даты окончания в UTC формат, если она не содержит 'Z' или '+' (часовой пояс)
        if (!endDateStr.includes('Z') && !endDateStr.includes('+')) {
            endDateStr = endDateStr + 'Z'; // Добавляем Z для явного указания UTC
        }
        
        // Парсим даты
        const endDate = new Date(endDateStr);
        
        // Получаем дату из строки времени сервера
        // Строка lastUpdate может быть в формате "YYYY-MM-DD HH:MM:SS UTC"
        // Нам нужно преобразовать ее в ISO формат
        let serverTime;
        if (serverTimeStr.includes('UTC')) {
            // Убираем "UTC" и заменяем его на "Z"
            serverTimeStr = serverTimeStr.replace(' UTC', 'Z');
        }
        serverTime = new Date(serverTimeStr);
        
        // Отладочная информация
        console.log('endDate:', endDate.toISOString());
        console.log('serverTime:', serverTime.toISOString());
        
        // Если не удалось распарсить даты, возвращаем null
        if (isNaN(endDate.getTime()) || isNaN(serverTime.getTime())) {
            console.warn('Некорректный формат даты после парсинга');
            return null;
        }
        
        // Вычитаем 3 минуты из времени окончания (прекращение отправки вопросов)
        const effectiveEndDate = new Date(endDate.getTime() - 3 * 60 * 1000);
        console.log('effectiveEndDate:', effectiveEndDate.toISOString());
        
        // Если эффективная дата окончания уже прошла, возвращаем null
        if (effectiveEndDate <= serverTime) {
            console.log('Турнир уже закончился или близок к завершению');
            return null;
        }
        
        // Вычисляем разницу в миллисекундах
        const timeDiff = effectiveEndDate.getTime() - serverTime.getTime();
        console.log('timeDiff (ms):', timeDiff);
        
        // Пересчитываем в дни, часы, минуты
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        console.log('Результат расчета:', days, 'дней,', hours, 'часов,', minutes, 'минут');
        
        // Формируем строку в зависимости от оставшегося времени
        if (days > 0) {
            return `${days} д. ${hours} ч. ${minutes} мин.`;
        } else if (hours > 0) {
            return `${hours} ч. ${minutes} мин.`;
        } else {
            return `${minutes} мин.`;
        }
    } catch (error) {
        console.error('Ошибка при расчете времени до конца турнира:', error);
        return null;
    }
}

function createLevelButtons(levels) {
    const buttonsContainer = document.getElementById('levelButtons');
    if (!buttonsContainer) {
        console.warn('Level buttons container not found');
        return;
    }
    buttonsContainer.innerHTML = '';
    levels.forEach(level => {
        const button = document.createElement('button');
        button.textContent = level;
        button.className = `btn btn-outline-primary level-btn ${level === currentLevel ? 'active' : ''}`;
        button.onclick = () => changeLevel(level);
        buttonsContainer.appendChild(button);
    });
}

function checkForForceUpdate(lastUpdate) {
    const storedLastUpdate = localStorage.getItem('lastUpdate');
    if (storedLastUpdate && new Date(lastUpdate) > new Date(storedLastUpdate)) {
        const forceUpdateBtn = document.createElement('button');
        forceUpdateBtn.textContent = 'Обновить данные';
        forceUpdateBtn.onclick = () => {
            localStorage.setItem('lastUpdate', lastUpdate);
            location.reload();
        };
        document.body.insertBefore(forceUpdateBtn, document.body.firstChild);
    }
    localStorage.setItem('lastUpdate', lastUpdate);
}

function changeLevel(level) {
    currentLevel = level;
    currentPage = 1;
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === level);
    });
    updateLevelHeader(level);
    if (isActiveTournament()) {
        displayRatings(globalData.tournament.ratings[currentLevel]);
    } else {
        displayRatings([]);
    }
}

function calculatePotentialWinnings(ratings, level) {
    if (!globalData.tournament.prizePools || !globalData.tournament.prizePools[level]) {
        console.error(`Prize pool not found for level ${level}`);
        return {};
    }

    const prizePool = globalData.tournament.prizePools[level];
    const positivePointsPlayers = ratings.filter(player => player.points > 0);

    if (positivePointsPlayers.length === 0) {
        return ratings.reduce((acc, player) => {
            acc[player.username] = 0;
            return acc;
        }, {});
    }

    const totalPositivePoints = positivePointsPlayers.reduce((sum, player) => sum + player.points, 0);
    
    // Создаём объект с выигрышами, где ключи - имена пользователей
    return ratings.reduce((acc, player) => {
        if (player.points <= 0) {
            acc[player.username] = 0;
        } else {
            const share = player.points / totalPositivePoints;
            acc[player.username] = Math.max(Math.round(prizePool * share), 0);
        }
        return acc;
    }, {});
}

function displayRatings(ratings) {
    if (!ratings || !Array.isArray(ratings)) {
        console.error('Invalid ratings data');
        return;
    }

    const tournamentInfoContainer = document.getElementById('tournamentInfo');
    const tableContainer = document.getElementById('ratingTable');

    // Обновляем информационный блок, если он есть
    if (tournamentInfoContainer) {
        // Очищаем блок с информацией о турнире, так как она теперь отображается в других элементах
        tournamentInfoContainer.innerHTML = '';
    }

    // Проверяем наличие данных о выигрышах
    const winnings = globalWinnings && globalWinnings[currentLevel] ? globalWinnings[currentLevel] : {};
    
    // Создаем полный список с выигрышами
    const fullRatingsList = ratings.map(player => ({
        ...player,
        winnings: winnings[player.username] || 0,
        questionsCount: player.tournament_questions || 0
    }));

    // Сортируем полный список
    const sortedFullList = [...fullRatingsList].sort((a, b) => {
        const compareResult = b[currentSort.column] - a[currentSort.column];
        return currentSort.direction === 'asc' ? -compareResult : compareResult;
    });

    // Добавляем позиции к полному отсортированному списку
    const ratingWithPositions = sortedFullList.map((player, index) => ({
        ...player,
        position: index + 1
    }));

    // Применяем поиск, если есть
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const filteredRatings = searchTerm 
        ? ratingWithPositions.filter(player => player.username.toLowerCase().includes(searchTerm))
        : ratingWithPositions;

    // Пагинация
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageRatings = filteredRatings.slice(startIndex, endIndex);

    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>#</th>
                        <th onclick="sortTable('username')">Игрок</th>
                        <th class="text-end" onclick="sortTable('questionsCount')">Ответы</th>
                        <th class="text-end" onclick="sortTable('points')">Очки</th>
                        <th class="text-end" onclick="sortTable('winnings')">💰*</th>
                    </tr>
                </thead>
                <tbody>
    `;

    currentPageRatings.forEach(player => {
        const boosterIcon = player.has_active_boosters ? ' 🚀' : '';
        html += `
            <tr>
                <td>${player.position}</td>
                <td>${player.username}${boosterIcon}</td>
                <td class="text-end">${player.questionsCount}</td>
                <td class="text-end">${player.points.toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1})}</td>
                <td class="text-end">${player.winnings.toLocaleString('ru-RU')}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <p class="winnings-note">🚀 - игрок имеет бустеры.<br>* - потенциальный выигрыш по состоянию на момент расчёта таблицы. Окончательный выигрыш может быть другим.</p>
    `;

    // Пагинация
    const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
    if (totalPages > 1) {
        html += `
            <nav>
                <ul class="pagination justify-content-center">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Предыдущая</a>
                    </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        }

        html += `
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Следующая</a>
                    </li>
                </ul>
            </nav>
        `;
    }

    tableContainer.innerHTML = html;
}

function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    let paginationHTML = '';

    // Кнопка "Предыдущая"
    const prevDisabled = currentPage === 1;
    paginationHTML += `
        <li class="page-item ${prevDisabled ? 'disabled' : ''}">
            <a class="page-link" href="#" ${prevDisabled ? '' : `onclick="changePage(${currentPage - 1})"`}>Предыдущая</a>
        </li>
    `;

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        const isCurrentPage = i === currentPage;
        paginationHTML += `
            <li class="page-item ${isCurrentPage ? 'active' : ''}">
                <a class="page-link" href="#" ${isCurrentPage ? '' : `onclick="changePage(${i})"`}>${i}</a>
            </li>
        `;
    }

    // Кнопка "Следующая"
    const nextDisabled = currentPage === totalPages;
    paginationHTML += `
        <li class="page-item ${nextDisabled ? 'disabled' : ''}">
            <a class="page-link" href="#" ${nextDisabled ? '' : `onclick="changePage(${currentPage + 1})"`}>Следующая</a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'desc';
    }
    displayRatings(globalData.tournament.ratings[currentLevel]);
}
 
function changePage(page) {
    const totalPages = Math.ceil(globalData.tournament.ratings[currentLevel].length / itemsPerPage);
    if (page < 1 || page > totalPages) {
        return; // Не делаем ничего, если запрошенная страница недействительна
    }
    currentPage = page;
    displayRatings(globalData.tournament.ratings[currentLevel]);
    updatePagination(currentPage, totalPages);
}

function searchPlayers() {
    currentPage = 1; // Сбрасываем на первую страницу при поиске
    displayRatings(globalData.tournament.ratings[currentLevel]);
}

document.getElementById('searchInput').addEventListener('input', searchPlayers);

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchPlayers);
    } else {
        console.warn('Search input element not found');
    }
});

window.onload = loadData;
