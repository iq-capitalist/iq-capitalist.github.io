let globalStats;  // Данные игроков
let currentSort = { column: 'capital', direction: 'desc' };
let currentPage = 1;
const itemsPerPage = 50;

function calculateLevelsStats(players) {
    const levelsCount = players.reduce((acc, player) => {
        acc[player.level] = (acc[player.level] || 0) + 1;
        return acc;
    }, {});
    
    // Определяем порядок уровней в обратном порядке
    const levelOrder = [
        'Гуру', 'Корифей', 'Легенда', 'Титан',
        'Босс', 'Мастер', 'Эксперт', 'Знаток'
    ];
    
    // Возвращаем все уровни с количеством игроков (включая нули)
    return levelOrder.map(level => [level, levelsCount[level] || 0]);
}

function updateLastUpdate(lastUpdate) {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = `Данные обновлены: ${lastUpdate}`;
    } else {
        console.warn('Last update element not found');
    }
}

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
        console.log('Players data loaded successfully');
        globalStats = data;
        updateLastUpdate(data.lastUpdate);
        displayPlayers(globalStats.players || []);
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

function sortPlayers(players, column, direction) {
    return [...players].sort((a, b) => {
        if (column === 'username' || column === 'level') {
            return direction === 'asc' 
                ? a[column].localeCompare(b[column])
                : b[column].localeCompare(a[column]);
        } else {
            return direction === 'asc' 
                ? a[column] - b[column]
                : b[column] - a[column];
        }
    });
}

function displayPlayers(players) {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    
    // Фильтруем игроков по поисковому запросу
    const filteredPlayers = players.filter(player => 
        player.username.toLowerCase().includes(searchTerm) ||
        player.level.toLowerCase().includes(searchTerm)
    );

    // Считаем и отображаем статистику по уровням
    let levelsHtml = '';
    if (filteredPlayers && filteredPlayers.length > 0) {
        const levelsStats = calculateLevelsStats(filteredPlayers);
        const levels = levelsStats
            .map(([level, count]) => `${level}: ${count}`)
            .join(', ');
        levelsHtml = `
            <div class="mb-4 text-center text-gray-600">
                ${levels}
            </div>
        `;
    }

    let html = `
        <div id="lastUpdate" class="mb-4 text-gray-600"></div>
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

    if (filteredPlayers && filteredPlayers.length > 0) {
        const sortedPlayers = sortPlayers(filteredPlayers, currentSort.column, currentSort.direction);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPagePlayers = sortedPlayers.slice(startIndex, endIndex);

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

        const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
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
                        <td colspan="6" class="text-center">
                            ${searchTerm ? 'Ничего не найдено' : 'Нет данных для отображения'}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;
    }

    const playersTable = document.getElementById('playersTable');
    playersTable.innerHTML = html;
}

function sortTable(column) {
    currentSort = {
        column,
        direction: currentSort.column === column && currentSort.direction === 'desc' ? 'asc' : 'desc'
    };
    displayPlayers(globalStats.players || []);
}

function changePage(page) {
    if (!globalStats || !globalStats.players) return;
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const filteredPlayers = globalStats.players.filter(player => 
        player.username.toLowerCase().includes(searchTerm) ||
        player.level.toLowerCase().includes(searchTerm)
    );
    const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayPlayers(globalStats.players);
    }
}

function searchPlayers() {
    currentPage = 1; // Сбрасываем на первую страницу при поиске
    displayPlayers(globalStats.players || []);
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchPlayers);
    }
});
