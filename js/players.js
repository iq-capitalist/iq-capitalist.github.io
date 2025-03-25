let globalStats;
let currentSort = { column: 'capital', direction: 'desc' };
const levelOrder = [
    'IQ Капиталист', 'Гуру', 'Корифей', 'Легенда', 'Титан',
    'Босс', 'Мастер', 'Эксперт'
];

function updateLastUpdate(lastUpdate) {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.innerHTML = `Данные обновлены: ${lastUpdate} | <a href="#" onclick="downloadPlayersCSV(); return false;">Скачать csv</a>`;
    }
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
    .then(response => response.json())
    .then(data => {
        console.log('Players data loaded successfully');
        globalStats = data;  // Теперь используем единый объект data
        updateLastUpdate(data.lastUpdate);
        displayPlayers(globalStats.players || []);  // Используем players из единого файла
    })
    .catch(error => {
        console.error('Error loading data:', error);
        const playersTable = document.getElementById('playersTable');
        if (playersTable) {
            playersTable.innerHTML = `
                <p class="text-danger">Ошибка загрузки данных: ${error.message}</p>
                <p>Пожалуйста, убедитесь, что файл all_data.json существует и доступен.</p>
            `;
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
            const primaryCompare = direction === 'asc' 
                ? a[column] - b[column]
                : b[column] - a[column];
                
            if (primaryCompare === 0 && column === 'capital') {
                return b.wallet - a.wallet;
            }
            
            return primaryCompare;
        }
    });
}

function createTableHeader() {
    return `
        <thead>
            <tr>
                <th onclick="sortTable('username')">Игрок</th>
                <th class="text-end" onclick="sortTable('capital')">Капитал</th>
                <th class="text-end" onclick="sortTable('wallet')">Кошелёк</th>
                <th class="text-end" onclick="sortTable('all_questions')">Ответы</th>
            </tr>
        </thead>
    `;
}

function displayPlayers(players) {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    
    // Фильтруем игроков по поисковому запросу и добавляем фильтр по количеству ответов > 0
    const filteredPlayers = players.filter(player => 
        player.username.toLowerCase().includes(searchTerm) ||
        player.level.toLowerCase().includes(searchTerm)
    ).filter(player => player.all_questions > 0);

    let html = `<div id="lastUpdate" class="mb-4 text-gray-600"></div>`;

    // Группируем игроков по уровням
    const playersByLevel = levelOrder.reduce((acc, level) => {
        acc[level] = filteredPlayers.filter(player => player.level === level);
        return acc;
    }, {});

    // Создаем таблицу для каждого уровня
    levelOrder.forEach(level => {
        const levelPlayers = playersByLevel[level];
        if (levelPlayers && levelPlayers.length > 0) {
            const sortedPlayers = sortPlayers(levelPlayers, currentSort.column, currentSort.direction);
            
            html += `
                <div class="level-section mb-4">
                    <h2 class="level-title">${level} (${levelPlayers.length})</h2>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            ${createTableHeader()}
                            <tbody>
            `;

            sortedPlayers.forEach((player) => {
                html += `
                    <tr>
                        <td>${player.username}</td>
                        <td class="text-end">${player.capital.toLocaleString('ru-RU')}</td>
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
        }
    });

    if (Object.values(playersByLevel).every(players => players.length === 0)) {
        html += `
            <div class="text-center">
                ${searchTerm ? 'Ничего не найдено' : 'Нет данных для отображения'}
            </div>
        `;
    }

    html += `
        <div class="mt-4 text-center">
            <a href="znatoki.html" class="btn btn-primary">Перейти к таблице знатоков</a>
        </div>
    `;

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

function searchPlayers() {
    displayPlayers(globalStats.players || []);
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchPlayers);
    }
});

function generatePlayersCSV(players) {
    const headers = ['Игрок', 'Уровень', 'Капитал', 'Кошелёк', 'Ответы'];
    const csvRows = [headers.join(',')];
    
    for (const player of players) {
        const row = [
            `"${player.username}"`,
            `"${player.level}"`,
            player.capital,
            player.wallet,
            player.all_questions
        ];
        csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
}

function downloadPlayersCSV() {
    if (!globalStats || !globalStats.players) {
        console.error('Нет данных для скачивания');
        return;
    }
    
    const csv = generatePlayersCSV(globalStats.players);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const date = new Date().toISOString().slice(0,10);
    const filename = `players_${date}.csv`;
    
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
