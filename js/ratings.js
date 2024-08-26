let currentLevel = 'Знаток';
let currentSort = { column: 'points', direction: 'desc' };
let globalData;
let currentPage = 1;
const itemsPerPage = 20;

function loadData() {
    console.log('Attempting to load data...');
    const timestamp = new Date().getTime();
    fetch(`data/data.json?t=${timestamp}`)
        .then(response => response.json())
        .then(data => {
            console.log('Data loaded successfully:', data);
            globalData = data;
            document.getElementById('lastUpdate').textContent = `Последнее обновление: ${data.lastUpdate}`;
            createLevelButtons(Object.keys(data.ratings));
            displayRatings(data.ratings[currentLevel]);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.getElementById('ratingTable').innerHTML = `
                <p class="text-danger">Ошибка загрузки данных: ${error.message}</p>
                <p>Пожалуйста, убедитесь, что файл data.json существует и доступен.</p>
            `;
        });
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
                    <th class="text-end" onclick="sortTable('winnings')">Выигрыш</th>
                    <th class="text-end" onclick="sortTable('remaining_boosters')">Бустеры</th>
                    <th class="text-end" onclick="sortTable('wallet')">Кошелёк</th>
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
                <td class="text-end">${player.remaining_boosters}</td>
                <td class="text-end">${player.wallet.toLocaleString('ru-RU')}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
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
    currentPage = page;
    displayRatings(globalData.ratings[currentLevel]);
}

function searchPlayers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredRatings = globalData.ratings[currentLevel].filter(player =>
        player.username.toLowerCase().includes(searchTerm)
    );
    displayRatings(filteredRatings);
}

document.getElementById('searchInput').addEventListener('input', searchPlayers);

window.onload = loadData;