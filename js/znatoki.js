let globalStats;
let currentSort = { column: 'capital', direction: 'desc' };

function updateLastUpdate(lastUpdate) {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.innerHTML = `Данные обновлены: ${lastUpdate} | <a href="#" onclick="downloadZnatokiCSV(); return false;">Скачать csv</a>`;
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
        const znatoki = (data.players || []).filter(player => player.level === 'Знаток');
        displayZnatoki(znatoki);
    })
    .catch(error => {
        console.error('Error loading data:', error);
        const znatkiTable = document.getElementById('znatkiTable');
        if (znatkiTable) {
            znatkiTable.innerHTML = `
                <p class="text-danger">Ошибка загрузки данных: ${error.message}</p>
                <p>Пожалуйста, убедитесь, что файл global_stats.json существует и доступен.</p>
            `;
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

function displayZnatoki(players) {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    
    // Фильтруем игроков по поисковому запросу
    const filteredPlayers = players.filter(player => 
        player.username.toLowerCase().includes(searchTerm)
    );

    let html = `<div id="lastUpdate" class="mb-4 text-gray-600"></div>`;

    if (filteredPlayers && filteredPlayers.length > 0) {
        const sortedPlayers = sortPlayers(filteredPlayers, currentSort.column, currentSort.direction);
        
        html += `
            <div class="level-section mb-4">
                <h2 class
