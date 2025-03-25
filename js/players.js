/**
 * Скрипт для страницы "Игроки"
 * Использует общие функции из common.js
 */

// Глобальные переменные
let globalStats;
let currentSort = { column: 'capital', direction: 'desc' };

// Порядок отображения уровней
const levelOrder = [
    'IQ Капиталист', 'Гуру', 'Корифей', 'Легенда', 'Титан',
    'Босс', 'Мастер', 'Эксперт'
];

/**
 * Создает заголовок таблицы
 * @returns {String} HTML заголовка таблицы
 */
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

/**
 * Отображает игроков в таблице
 * @param {Array} players - Массив игроков для отображения
 */
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
                        <td class="text-end">${formatNumber(player.capital)}</td>
                        <td class="text-end">${formatNumber(player.wallet)}</td>
                        <td class="text-end">${formatNumber(player.all_questions)}</td>
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

/**
 * Обработчик сортировки таблицы по клику на заголовок
 * @param {String} column - Колонка для сортировки
 */
function sortTable(column) {
    currentSort = {
        column,
        direction: currentSort.column === column && currentSort.direction === 'desc' ? 'asc' : 'desc'
    };
    displayPlayers(globalStats.players || []);
}

/**
 * Функция поиска игроков
 */
function searchPlayers() {
    displayPlayers(globalStats.players || []);
}

/**
 * Функция для скачивания CSV с данными игроков
 */
function downloadPlayersCSV() {
    if (!globalStats || !globalStats.players) {
        console.error('Нет данных для скачивания');
        return;
    }
    
    const headers = ['Игрок', 'Уровень', 'Капитал', 'Кошелёк', 'Ответы'];
    
    const transformRow = (player) => [
        `"${player.username}"`,
        `"${player.level}"`,
        player.capital,
        player.wallet,
        player.all_questions
    ];
    
    const csv = generateCSV(globalStats.players, headers, transformRow);
    
    const date = new Date().toISOString().slice(0,10);
    const filename = `players_${date}.csv`;
    
    downloadCSV(filename, csv);
}

/**
 * Инициализация страницы при загрузке DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    // Загрузка данных
    loadData(data => {
        console.log('Players data loaded successfully');
        globalStats = data;
        updateLastUpdate(data.lastUpdate, 'lastUpdate', 'downloadPlayersCSV');
        displayPlayers(globalStats.players || []);
    });
    
    // Подключаем поиск с debounce для оптимизации
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const debouncedSearch = debounce(searchPlayers, 300);
        searchInput.addEventListener('input', debouncedSearch);
    }
});
