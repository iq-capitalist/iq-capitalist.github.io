/**
 * Скрипт для страницы "Знатоки"
 * Использует общие функции из common.js
 */

// Глобальные переменные
let globalStats;
let currentSort = { column: 'wallet', direction: 'desc' };
let currentPage = 1;
const itemsPerPage = 50;

/**
 * Отображает игроков в таблице с пагинацией
 * @param {Array} players - Массив игроков для отображения
 */
function displayPlayers(players) {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    
    const filteredPlayers = players.filter(player => 
        player.username.toLowerCase().includes(searchTerm)
    ).filter(player => player.all_questions > 0);

    let html = `<div id="lastUpdate" class="mb-4 text-gray-600"></div>`;

    if (filteredPlayers && filteredPlayers.length > 0) {
        const sortedPlayers = sortPlayers(filteredPlayers, currentSort.column, currentSort.direction);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPagePlayers = sortedPlayers.slice(startIndex, endIndex);

        html += `
            <div class="level-section mb-4">
                <h2 class="level-title">Знатоки (100) ${filteredPlayers.length}</h2>
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

        const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
        if (totalPages > 1) {
            let pages = [];
            const delta = 3;

            if (currentPage <= delta) {
                for (let i = 1; i <= Math.min(delta + 2, totalPages); i++) {
                    pages.push(i);
                }
                if (totalPages > delta + 2) {
                    pages.push('...');
                    pages.push(totalPages - 1);
                    pages.push(totalPages);
                }
            } else if (currentPage > totalPages - delta) {
                pages.push(1);
                pages.push(2);
                pages.push('...');
                for (let i = totalPages - delta; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push(2);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages - 1);
                pages.push(totalPages);
            }

            html += `
                <nav>
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Предыдущая</a>
                        </li>
            `;

            pages.forEach(page => {
                if (page === '...') {
                    html += `
                        <li class="page-item disabled">
                            <span class="page-link">...</span>
                        </li>
                    `;
                } else {
                    html += `
                        <li class="page-item ${page === currentPage ? 'active' : ''}">
                            <a class="page-link" href="#" onclick="changePage(${page}); return false;">${page}</a>
                        </li>
                    `;
                }
            });

            html += `
                        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Следующая</a>
                        </li>
                    </ul>
                </nav>
            `;
        }
    } else {
        html += `
            <div class="level-section mb-4">
                <h2 class="level-title">Знатоки (100) 0</h2>
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

/**
 * Обработчик сортировки таблицы по клику на заголовок
 * @param {String} column - Колонка для сортировки
 */
function sortTable(column) {
    currentSort = {
        column,
        direction: currentSort.column === column && currentSort.direction === 'desc' ? 'asc' : 'desc'
    };
    const filteredPlayers = (globalStats.players || []).filter(player => player.level === 'Знаток');
    displayPlayers(filteredPlayers);
}

/**
 * Функция смены страницы пагинации
 * @param {Number} page - Номер страницы
 */
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

/**
 * Функция поиска игроков
 */
function searchPlayers() {
    currentPage = 1;
    const filteredPlayers = (globalStats.players || []).filter(player => player.level === 'Знаток');
    displayPlayers(filteredPlayers);
}

/**
 * Функция для скачивания CSV с данными знатоков
 */
function downloadZnatokiCSV() {
    if (!globalStats || !globalStats.players) {
        console.error('Нет данных для скачивания');
        return;
    }
    
    const filteredPlayers = globalStats.players.filter(player => player.level === 'Знаток');
    
    const headers = [
        'Игрок',
        'Кошелёк',
        'Ответы'
    ];
    
    const transformRow = (player) => [
        `"${player.username}"`,
        player.wallet,
        player.all_questions
    ];
    
    const csv = generateCSV(filteredPlayers, headers, transformRow);
    
    const date = new Date().toISOString().slice(0,10);
    const filename = `znatoki_${date}.csv`;
    
    downloadCSV(filename, csv);
}

/**
 * Инициализация страницы при загрузке DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    // Загрузка данных
    loadData(data => {
        console.log('Znatoki data loaded successfully');
        globalStats = data;
        updateLastUpdate(data.lastUpdate, 'lastUpdate', 'downloadZnatokiCSV');
        const filteredPlayers = (data.players || [])
            .filter(player => player.level === 'Знаток')
            .filter(player => player.all_questions > 0);
        displayPlayers(filteredPlayers);
    });
    
    // Подключаем поиск с debounce для оптимизации
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const debouncedSearch = debounce(searchPlayers, 300);
        searchInput.addEventListener('input', debouncedSearch);
    }
});
