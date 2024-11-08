let globalData;
let globalStats;
let levelsStats;

let currentSort = { column: 'capital', direction: 'desc' };
let currentPage = 1;
const itemsPerPage = 50;

async function loadData() {
    console.log('Attempting to load data...');
    try {
        // Загружаем данные игроков
        const statsResponse = await window.fs.readFile('global_stats.json');
        const statsText = new TextDecoder().decode(statsResponse);
        globalStats = JSON.parse(statsText);
        
        // Загружаем статистику уровней
        const levelsResponse = await window.fs.readFile('data.json');
        const levelsText = new TextDecoder().decode(levelsResponse);
        levelsStats = JSON.parse(levelsText);
        
        console.log('Data loaded successfully');
        updateLastUpdate(globalStats.lastUpdate);
        displayPlayers(globalStats.players || []);
    } catch (error) {
        console.error('Error loading data:', error);
        const playersTable = document.getElementById('playersTable');
        if (playersTable) {
            playersTable.innerHTML = `
                <p class="text-danger">Ошибка загрузки данных: ${error.message}</p>
                <p>Пожалуйста, убедитесь, что файлы данных существуют и доступны.</p>
            `;
        }
    }
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
    // Добавляем статистику по уровням, если данные доступны
    let levelsHtml = '';
    if (levelsStats && levelsStats.playersByLevel) {
        const levels = Object.entries(levelsStats.playersByLevel)
            .filter(([level]) => level !== 'IQ Капиталист')
            .map(([level, count]) => `${level}: ${count}`)
            .join(' | ');
        levelsHtml = `
            <div class="mb-4 text-center text-gray-600">
                ${levels}
            </div>
        `;
    }

    let html = `
        ${levelsHtml}
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
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

    if (players && players.length > 0) {
        players.sort((a, b) => b[currentSort.column] - a[currentSort.column]);
        if (currentSort.direction === 'asc') players.reverse();

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPagePlayers = players.slice(startIndex, endIndex);

        currentPagePlayers.forEach((player) => {
            html += `
                <tr>
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
        </div>
        `;

        // Добавление пагинации
        const totalPages = Math.ceil(players.length / itemsPerPage);
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
    } else {
        html += `
                    <tr>
                        <td colspan="6" class="text-center">Нет данных для отображения</td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;
    }

    const playersTable = document.getElementById('playersTable');
    playersTable.innerHTML = html;
}

function updatePagination(currentPage, totalPlayers) {
    const totalPages = Math.ceil(totalPlayers / itemsPerPage);
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
