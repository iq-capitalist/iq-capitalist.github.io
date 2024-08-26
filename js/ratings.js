let currentLevel = 'Знаток';
let currentSort = { column: 'points', direction: 'desc' };
let globalData;
let currentPage = 1;
const itemsPerPage = 20;

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
        displayRatings(data.ratings[currentLevel]);

        // Проверка необходимости принудительного обновления
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
        } else {
            console.error('Rating table element not found');
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

function createLevelButtons(levels) {
    const buttonsContainer = document.getElementById('levelButtons');
    buttonsContainer.innerHTML = '';
    levels.forEach(level => {
        const button = document.createElement('button');
        button.textContent = level;
        button.className = `btn btn-outline-primary level-btn ${level === currentLevel ? 'active' : ''}`;
        button.onclick = () => changeLevel(level);
        buttonsContainer.appendChild(button);
    });
}

function changeLevel(level) {
    currentLevel = level;
    currentPage = 1;
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === level);
    });
    displayRatings(globalData.ratings[currentLevel]);
}

function calculatePotentialWinnings(ratings) {
    const prizePool = currentLevel === 'Знаток' ? globalData.prizePoolAma : globalData.prizePoolPro;
    const positivePointsPlayers = ratings.filter(player => player.points > 0);
    const totalPositivePoints = positivePointsPlayers.reduce((sum, player) => sum + player.points, 0);
    return ratings.map(player => {
        if (player.points <= 0) return 0;
        const share = player.points / totalPositivePoints;
        return Math.max(Math.round(prizePool * share), 0);
    });
}

function displayRatings(ratings) {
    const tableContainer = document.getElementById('ratingTable');
    const winnings = calculatePotentialWinnings(ratings);
    const ratingsWithWinnings = ratings.map((player, index) => ({...player, winnings: winnings[index]}));

    ratingsWithWinnings.sort((a, b) => b[currentSort.column] - a[currentSort.column]);
    if (currentSort.direction === 'asc') ratingsWithWinnings.reverse();

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageRatings = ratingsWithWinnings.slice(startIndex, endIndex);

    let html = `
        <table class="table table-hover">
            <thead>
                <tr>
                    <th></th>
                    <th onclick="sortTable('username')">Игрок</th>
                    <th class="text-end" onclick="sortTable('capital')">Капитал</th>
                    <th class="text-end" onclick="sortTable('points')">Очки</th>
                    <th class="text-end" onclick="sortTable('winnings')">Выигрыш*</th>
                </tr>
            </thead>
            <tbody>
    `;

    currentPageRatings.forEach((player, index) => {
        html += `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${player.username}</td>
                <td class="text-end">${player.capital.toLocaleString('ru-RU')}</td>
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

    // Добавление пагинации
    const totalPages = Math.ceil(ratingsWithWinnings.length / itemsPerPage);
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
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredRatings = globalData.ratings[currentLevel].filter(player =>
        player.username.toLowerCase().includes(searchTerm)
    );
    displayRatings(filteredRatings);
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