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

// Определение границ уровней
const levelRanges = {
    'Знаток': { min: 100, max: 100 },
    'Эксперт': { min: 1000, max: 1999 },
    'Мастер': { min: 2000, max: 3999 },
    'Босс': { min: 4000, max: 6999 },
    'Титан': { min: 7000, max: 10999 },
    'Легенда': { min: 11000, max: 15999 },
    'Корифей': { min: 16000, max: 21999 },
    'Гуру': { min: 22000, max: 29999 },
    'IQ Капиталист': { min: 30000, max: Infinity }
};

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
            // Определяем вторичный параметр сортировки
            let secondaryColumn, secondaryDirection;
            
            if (currentSort.column === 'capital') {
                secondaryColumn = 'wallet';
                secondaryDirection = 'desc';
            } else if (currentSort.column === 'wallet') {
                secondaryColumn = 'capital';
                secondaryDirection = 'desc';
            } else {
                // Для других колонок оставляем без вторичной сортировки
                secondaryColumn = null;
                secondaryDirection = null;
            }
            
            const sortedPlayers = sortPlayers(
                levelPlayers, 
                currentSort.column, 
                currentSort.direction,
                secondaryColumn,
                secondaryDirection
            );
            
            // Получаем границы уровня
            const range = levelRanges[level];
            // Формируем текст с границами в скобках
            let rangeText = '';
            if (level === 'Знаток') {
                rangeText = `(${range.min})`;
            } else if (range.max === Infinity) {
                rangeText = `(${range.min}+)`;
            } else {
                rangeText = `(${range.min}-${range.max})`;
            }
            
            html += `
                <div class="level-section mb-4">
                    <h2 class="level-title">${level} ${rangeText} ${levelPlayers.length}</h2>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            ${createTableHeader()}
                            <tbody>
            `;

            sortedPlayers.forEach((player) => {
                html += `
                    <tr>
                        <td><a href="user.html?id=${player.user_id}">${player.username}</a></td>
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
    
    const headers = ['Игрок', 'Уровень', 'Капитал', 'Кошелёк', 'Ответы', 'Бустеры', 'Билеты'];
    
    const transformRow = (player) => [
        `"${player.username}"`,
        `"${player.level}"`,
        player.capital,
        player.wallet,
        player.all_questions,
        player.remaining_boosters || 0,
        player.tickets || 0
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
