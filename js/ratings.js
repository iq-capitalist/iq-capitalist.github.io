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
    'Корифей': { min: 16000, max: 21999 },
    'Гуру': { min: 22000, max: 29999 },
    'IQ Капиталист': { min: 30000, max: Infinity }
};

function updateLevelHeader(level) {
    const levelHeader = document.getElementById('levelHeader');
    const range = levelRanges[level];
    const maxText = range.max === Infinity ? '+' : '-' + range.max;
    const playersCount = globalData.playersByLevel[level];
    const prizePool = globalData.prizePools[level] || 0;
    levelHeader.innerHTML = `
        <h2>Уровень ${level} (${range.min}${maxText})</h2>
        <p class="level-info">Участников: ${playersCount}. Призовой фонд: ${prizePool.toLocaleString('ru-RU')} IQC</p>
    `;
}

function isActiveTournament() {
    return globalData.activeTournament !== null && globalData.questionsAsked !== null;
}

function loadData() {
    console.log('Attempting to load data...');
    const timestamp = new Date().getTime();
    fetch(`data/data.json?t=${timestamp}`, {
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
        updateLastUpdate(data.lastUpdate);
        createLevelButtons(Object.keys(data.ratings));
        updateLevelHeader(currentLevel);

        if (isActiveTournament()) {
            if (!data.prizePools) {
                console.error('Prize pools data is missing');
                displayRatings([]);
                return;
            }

            // Рассчитываем выигрыши для всех уровней
            Object.keys(data.ratings).forEach(level => {
                if (!data.prizePools[level]) {
                    console.warn(`Prize pool not found for level ${level}`);
                }
                globalWinnings[level] = calculatePotentialWinnings(data.ratings[level], level);
            });
            displayRatings(data.ratings[currentLevel]);
        } else {
            displayRatings([]);
        }

        checkForForceUpdate(data.lastUpdate);
    })
    .catch(error => {
        console.error('Error loading data:', error);
        const ratingTable = document.getElementById('ratingTable');
        if (ratingTable) {
            ratingTable.innerHTML = `
                <p class="text-danger">Ошибка загрузки данных: ${error.message}</p>
                <p>Пожалуйста, убедитесь, что файл data.json существует и доступен.</p>
            `;
        }
    });
}

function updateLastUpdate(lastUpdate) {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = `По состоянию на ${lastUpdate}`;
    } else {
        console.warn('Last update element not found');
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
        displayRatings(globalData.ratings[currentLevel]);
    } else {
        displayRatings([]);
    }
}

function calculatePotentialWinnings(ratings, level) {
    if (!globalData.prizePools || !globalData.prizePools[level]) {
        console.error(`Prize pool not found for level ${level}`);
        return {};
    }

    const prizePool = globalData.prizePools[level];
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
    const tournamentInfoContainer = document.getElementById('tournamentInfo');
    const tableContainer = document.getElementById('ratingTable');

    if (isActiveTournament()) {
        tournamentInfoContainer.innerHTML = `
            <div class="tournament-info">
                <p>Турнир: ${globalData.activeTournament}. 
                   Задано вопросов: ${globalData.questionsAsked}. 
                   Участников: ${globalData.totalPlayers}</p>
            </div>
        `;
    } else {
        tournamentInfoContainer.innerHTML = `
            <div class="tournament-info">
                <p>На данный момент нет активного турнира</p>
            </div>
        `;
    }

    if (isActiveTournament()) {
        const winnings = globalWinnings[currentLevel];
        
        // Создаем полный список с выигрышами
        const fullRatingsList = globalData.ratings[currentLevel].map(player => ({
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
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Место</th>
                        <th onclick="sortTable('username')">Игрок</th>
                        <th class="text-end" onclick="sortTable('questionsCount')">Ответы</th>
                        <th class="text-end" onclick="sortTable('points')">Очки</th>
                        <th class="text-end" onclick="sortTable('winnings')">Выигрыш*</th>
                    </tr>
                </thead>
                <tbody>
        `;

        currentPageRatings.forEach(player => {
            html += `
                <tr>
                    <td>${player.position}</td>
                    <td>${player.username}</td>
                    <td class="text-end">${player.questionsCount}</td>
                    <td class="text-end">${player.points.toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1})}</td>
                    <td class="text-end">${player.winnings.toLocaleString('ru-RU')}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <p class="winnings-note">* потенциальный выигрыш по состоянию на момент расчёта рейтинга. Окончательный выигрыш может быть другим.</p>
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
    } else {
        tableContainer.innerHTML = '';
    }
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
    displayRatings(globalData.ratings[currentLevel]);
}
 
function changePage(page) {
    const totalPages = Math.ceil(globalData.ratings[currentLevel].length / itemsPerPage);
    if (page < 1 || page > totalPages) {
        return; // Не делаем ничего, если запрошенная страница недействительна
    }
    currentPage = page;
    displayRatings(globalData.ratings[currentLevel]);
    updatePagination(currentPage, totalPages);
}

function searchPlayers() {
    currentPage = 1; // Сбрасываем на первую страницу при поиске
    displayRatings(globalData.ratings[currentLevel]);
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
