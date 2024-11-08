let globalStats;  // Данные игроков
let levelsStats;  // Статистика по уровням
let currentSort = { column: 'capital', direction: 'desc' };
let currentPage = 1;
const itemsPerPage = 20;

function loadData() {
    console.log('Attempting to load data...');
    const timestamp = new Date().getTime();
    const fetchOptions = {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    };

    // Загружаем данные игроков
    fetch(`data/global_stats.json?t=${timestamp}`, fetchOptions)
        .then(response => response.json())
        .then(data => {
            console.log('Players data loaded successfully');
            globalStats = data;
            
            // Загружаем статистику по уровням
            return fetch(`data/data.json?t=${timestamp}`, fetchOptions);
        })
        .then(response => response.json())
        .then(data => {
            console.log('Levels data loaded successfully');
            levelsStats = data;
            displayPlayers(globalStats.players || []);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            const playersTable = document.getElementById('playersTable');
            if (playersTable) {
                playersTable.innerHTML = `
                    <p class="text-danger">Ошибка загрузки данных: ${error.message}</p>
                    <p>Пожалуйста, убедитесь, что файлы данных существуют и доступны.</p>
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
    // Добавляем статистику по уровням
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
        const sortedPlayers = sortPlayers(players, currentSort.column, currentSort.direction);
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

function sortTable(column) {
    currentSort = {
        column,
        direction: currentSort.column === column && currentSort.direction === 'desc' ? 'asc' : 'desc'
    };
    displayPlayers(globalStats.players || []);
}

function changePage(page) {
    if (!globalStats || !globalStats.players) return;
    const totalPages = Math.ceil(globalStats.players.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayPlayers(globalStats.players);
    }
}

document.addEventListener('DOMContentLoaded', loadData);
