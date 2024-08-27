let globalData;
let currentSort = { column: 'capital', direction: 'desc' };
let currentPage = 1;
const itemsPerPage = 20;

function loadData() {
    console.log('Attempting to load data...');
    const timestamp = new Date().getTime();
    fetch(`data/global_stats.json?t=${timestamp}`, {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Data loaded successfully:', data);
        globalData = data;
        updateLastUpdate(data.lastUpdate);
        displayPlayers(data.players);
    })
    .catch(error => {
        console.error('Error loading data:', error);
        const playersTable = document.getElementById('playersTable');
        if (playersTable) {
            playersTable.innerHTML = `
                <p class="text-danger">Ошибка загрузки данных: ${error.message}</p>
                <p>Пожалуйста, убедитесь, что файл global_stats.json существует и доступен.</p>
            `;
        } else {
            console.error('Players table element not found');
        }
    });
}

function updateLastUpdate(lastUpdate) {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = `Данные обновлены: ${lastUpdate}`;
    } else {
        console.warn('Last update element not found');
    }
}

function displayPlayers(players) {
    players.sort((a, b) => b[currentSort.column] - a[currentSort.column]);
    if (currentSort.direction === 'asc') players.reverse();

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPagePlayers = players.slice(startIndex, endIndex);

    let html = `
        <table class="table table-hover">
            <thead>
                <tr>
                    <th></th>
                    <th onclick="sortTable('username')">Игрок</th>
                    <th onclick="sortTable('level')">Уровень</th>
                    <th class="text-end" onclick="sortTable('capital')">Капитал</th>
                    <th class="text-end" onclick="sortTable('wallet')">Кошелёк</th>
                    <th class="text-end" onclick="sortTable('all_questions')">Ответы</th>
                    <th class="text-end" onclick="sortTable('remaining_boosters')">Бустеры</th>
                </tr>
            </thead>
            <tbody>
    `;

    currentPagePlayers.forEach((player, index) => {
        html += `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${player.username}</td>
                <td>${player.level}</td>
                <td class="text-end">${player.capital.toLocaleString('ru-RU')}</td>
                <td class="text-end">${player.wallet.toLocaleString('ru-RU')}</td>
                <td class="text-end">${player.all_questions.toLocaleString('ru-RU')}</td>
                <td class="text-end">${player.remaining_boosters.toLocaleString('ru-RU')}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    const playersTable = document.getElementById('playersTable');
    playersTable.innerHTML = html;

    updatePagination(players.length);
}

function updatePagination(totalPlayers) {
    const totalPages = Math.ceil(totalPlayers / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');
    let paginationHTML = '';

    // Кнопка "Предыдущая"
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Предыдущая</a>
        </li>
    `;

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Кнопка "Следующая"
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Следующая</a>
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
    displayPlayers(globalData.players);
}

function changePage(page) {
    const totalPages = Math.ceil(globalData.players.length / itemsPerPage);
    if (page < 1 || page > totalPages) {
        return;
    }
    currentPage = page;
    displayPlayers(globalData.players);
}

function searchPlayers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredPlayers = globalData.players.filter(player =>
        player.username.toLowerCase().includes(searchTerm)
    );
    displayPlayers(filteredPlayers);
}

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