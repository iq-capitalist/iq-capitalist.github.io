let globalStats;
let currentSort = { column: 'wallet', direction: 'desc' };
let currentPage = 1;
const itemsPerPage = 50;

function updateLastUpdate(lastUpdate) {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.innerHTML = `Данные обновлены: ${lastUpdate} | <a href="#" onclick="downloadZnatokiCSV(); return false;">Скачать csv</a>`;
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
        console.log('Znatoki data loaded successfully');
        globalStats = data;
        updateLastUpdate(data.lastUpdate);
        const filteredPlayers = (data.players || []).filter(player => player.level === 'Знаток');
        displayPlayers(filteredPlayers);
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
        if (column === 'username') {
            return direction === 'asc' 
                ? a[column].localeCompare(b[column])
                : b[column].localeCompare(a[column]);
        } else {
            const primaryCompare = direction === 'asc' 
                ? a[column] - b[column]
                : b[column] - a[column];
                
            if (primaryCompare === 0) {
                return a.username.localeCompare(b.username);
            }
            
            return primaryCompare;
        }
    });
}

function displayPlayers(players) {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    
    const filteredPlayers = players.filter(player => 
        player.username.toLowerCase().includes(searchTerm)
    );

    let html = `<div id="lastUpdate" class="mb-4 text-gray-600"></div>`;

    if (filteredPlayers && filteredPlayers.length > 0) {
        const sortedPlayers = sortPlayers(filteredPlayers, currentSort.column, currentSort.direction);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPagePlayers = sortedPlayers.slice(startIndex, endIndex);

        html += `
            <div class="level-section mb-4">
                <h2 class="level-title">Знатоки (${filteredPlayers.length})</h2>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th onclick="sortTable('username')">Игрок</th>
                                <th class="text-end" onclick="sortTable('wallet')">Кошелёк</th>
                                <th class="text-end" onclick="sortTable('all_questions')">Ответы</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        currentPagePlayers.forEach((player) => {
            html += `
                <tr>
                    <td>${player.username}</td>
                    <td class="text-end">${player.wallet.toLocaleString('ru-RU')}</td>
                    <td class="text-end">${player.all_questions.toLocaleString('ru-RU')}</td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
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
            <div class="level-section mb-4">
                <h2 class="level-title">Знатоки (0)</h2>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th onclick="sortTable('username')">Игрок</th>
                                <th class="text-end" onclick="sortTable('wallet')">Кошелёк</th>
                                <th class="text-end" onclick="sortTable('all_questions')">Ответы</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="3" class="text-center">
                                    ${searchTerm ? 'Ничего не найдено' : 'Нет данных для отображения'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
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
    const filteredPlayers = (globalStats.players || []).filter(player => player.level === 'Знаток');
    displayPlayers(filteredPlayers);
}

function changePage(page) {
    if (!globalStats || !globalStats.players) return;
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const filteredPlayers = globalStats.players
        .filter(player => player.level === 'Знаток')
        .filter(player => player.username.toLowerCase().includes(searchTerm));
    const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayPlayers(filteredPlayers);
    }
}

function searchPlayers() {
    currentPage = 1;
    const filteredPlayers = (globalStats.players || []).filter(player => player.level === 'Знаток');
    displayPlayers(filteredPlayers);
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchPlayers);
    }
});

function generateZnatokiCSV(players) {
    const filteredPlayers = players.filter(player => player.level === 'Знаток');
    
    const headers = [
        'Игрок',
        'Кошелёк',
        'Ответы'
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const player of filteredPlayers) {
        const row = [
            `"${player.username}"`,
            player.wallet,
            player.all_questions
        ];
        csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
}

function downloadZnatokiCSV() {
    if (!globalStats || !globalStats.players) {
        console.error('Нет данных для скачивания');
        return;
    }
    
    const csv = generateZnatokiCSV(globalStats.players);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const date = new Date().toISOString().slice(0,10);
    const filename = `znatoki_${date}.csv`;
    
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
