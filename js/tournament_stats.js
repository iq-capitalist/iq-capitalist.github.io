/**
 * Скрипт для отображения детальной статистики по участникам турнира IQ Capitalist
 * Адаптирован для работы на объединенной странице с tournament.js
 */

// Глобальные переменные
let playerStatsInitialized = false; // Флаг инициализации
let currentLevel = 'Знаток';
let currentSort = { column: 'points', direction: 'desc' };
let currentPage = 1;
const itemsPerPage = 50;

// Порядок уровней
const levelOrder = [
    'Знаток', 'Эксперт', 'Мастер', 'Босс', 'Титан',
    'Легенда', 'Гуру'
];

// Определение границ уровней
const levelRanges = {
    'Знаток': { min: 100, max: 100 },
    'Эксперт': { min: 1000, max: 1999 },
    'Мастер': { min: 2000, max: 3999 },
    'Босс': { min: 4000, max: 6999 },
    'Титан': { min: 7000, max: 10999 },
    'Легенда': { min: 11000, max: 15999 },
    'Гуру': { min: 16000, max: 22999 },
    'IQ Капиталист': { min: 23000, max: Infinity }
};

/**
 * Инициализация статистики игроков
 * Проверяет наличие DOM-элементов и вызывается только один раз
 */
function initializePlayerStats() {
    // Если уже инициализировано или нет необходимых DOM-элементов, выходим
    if (playerStatsInitialized || !document.getElementById('levelButtons')) {
        return;
    }
    
    console.log('Инициализация детальной статистики по игрокам');
    
    // Подключаем поиск с debounce для оптимизации
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchPlayers, 300));
    }
    
    // Отмечаем, что инициализация выполнена
    playerStatsInitialized = true;
    
    // Загружаем данные, если они еще не загружены
    if (typeof tournamentData !== 'undefined' && tournamentData) {
        loadPlayerStatsData(tournamentData);
    } else {
        loadPlayerStatsData();
    }
}

/**
 * Загрузка данных для статистики игроков
 * @param {Object} data - Уже загруженные данные (опционально)
 */
function loadPlayerStatsData(data) {
    // Если данные уже переданы, используем их
    if (data) {
        displayPlayerStats(data);
        return;
    }
    
    // Иначе загружаем данные самостоятельно
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id') || "1"; // По умолчанию турнир с ID 1
    
    // Показываем индикатор загрузки
    const statsTable = document.getElementById('statsTable');
    if (statsTable) {
        statsTable.innerHTML = '<p class="text-center">Загрузка данных...</p>';
    }
    
    // Загружаем данные турнира
    fetch(`data/${tournamentId}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ошибка! Статус: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayPlayerStats(data);
        })
        .catch(error => {
            console.error('Ошибка загрузки данных:', error);
            if (statsTable) {
                statsTable.innerHTML = `
                    <div class="error-message">
                        <p>Ошибка загрузки данных: ${error.message}</p>
                        <p>Пожалуйста, попробуйте обновить страницу.</p>
                    </div>
                `;
            }
        });
}

/**
 * Отображение статистики игроков
 * @param {Object} data - Данные турнира
 */
function displayPlayerStats(data) {
    // Создаем кнопки уровней
    createLevelButtons(data);
    
    // Отображаем заголовок уровня
    updateLevelHeader(data);
    
    // Отображаем таблицу с данными
    displayStatsTable(data);
}

/**
 * Создание кнопок для переключения между уровнями
 * @param {Object} data - Данные турнира
 */
function createLevelButtons(data) {
    const buttonsContainer = document.getElementById('levelButtons');
    if (!buttonsContainer) return;
    
    buttonsContainer.innerHTML = '';
    
    // Создаем кнопки для всех уровней
    for (const level of levelOrder) {
        // Проверяем, есть ли игроки на этом уровне
        const players = data.players.filter(player => player.level === level);
        const isEmpty = players.length === 0;
        
        const button = document.createElement('button');
        button.textContent = level + (isEmpty ? ' (0)' : ` (${players.length})`);
        button.className = `level-btn ${level === currentLevel ? 'active' : ''}`;
        button.onclick = () => changeLevel(level);
        
        if (isEmpty) {
            button.classList.add('empty');
            button.title = 'Нет игроков на этом уровне';
        }
        
        buttonsContainer.appendChild(button);
    }
}

/**
 * Обновление заголовка уровня
 * @param {Object} data - Данные турнира
 */
function updateLevelHeader(data) {
    const levelHeader = document.getElementById('levelHeader');
    if (!levelHeader) return;
    
    const range = levelRanges[currentLevel];
    
    // Текст с диапазоном капитала для уровня
    const maxText = currentLevel === 'Знаток' 
        ? '' 
        : (range.max === Infinity ? '+' : '-' + range.max);
    
    // Получаем количество игроков на текущем уровне
    const levelPlayers = data.players.filter(player => player.level === currentLevel);
    
    // Получаем призовой фонд для текущего уровня
    let prizeFund = 0;
    if (data.stats && data.stats.prize_by_level && data.stats.prize_by_level[currentLevel]) {
        prizeFund = data.stats.prize_by_level[currentLevel];
    }
    
    levelHeader.innerHTML = `
        <h2>Уровень ${currentLevel} (${range.min}${maxText})</h2>
        <p class="level-info">Участников: ${levelPlayers.length}. Призовой фонд: ${Math.round(prizeFund).toLocaleString('ru-RU')} IQC</p>
    `;
}

/**
 * Смена текущего уровня
 * @param {String} level - Новый уровень
 */
function changeLevel(level) {
    // Сохраняем выбранный уровень
    currentLevel = level;
    currentPage = 1; // Сбрасываем на первую страницу при смене уровня
    
    // Обновляем активную кнопку
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.startsWith(level));
    });
    
    // Обновляем заголовок уровня и таблицу данных
    if (typeof tournamentData !== 'undefined' && tournamentData) {
        updateLevelHeader(tournamentData);
        displayStatsTable(tournamentData);
    }
}

/**
 * Отображение таблицы с детальной статистикой
 * @param {Object} data - Данные турнира
 */
function displayStatsTable(data) {
    const statsTable = document.getElementById('statsTable');
    if (!statsTable) return;
    
    // Фильтруем игроков по текущему уровню
    const levelPlayers = data.players.filter(player => player.level === currentLevel);
    
    // Применяем поиск, если есть
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const filteredPlayers = searchTerm 
        ? levelPlayers.filter(player => player.username.toLowerCase().includes(searchTerm))
        : levelPlayers;
    
    // Сортируем игроков
    const sortedPlayers = sortPlayers(filteredPlayers, currentSort.column, currentSort.direction);
    
    // Применяем пагинацию
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPagePlayers = sortedPlayers.slice(startIndex, endIndex);
    
    if (currentPagePlayers.length === 0) {
        statsTable.innerHTML = `
            <div class="alert">
                <p>Нет данных для отображения. ${searchTerm ? 'Попробуйте изменить параметры поиска.' : ''}</p>
            </div>
        `;
        return;
    }
    
    // Создаем таблицу с правильными ширинами колонок
    let html = `
        <div class="table-responsive">
            <table class="stats-table" style="table-layout: fixed !important;">
                <thead>
                    <tr>
                        <th onclick="sortTable('username')" style="width: 120px;">Имя</th>
                        <th colspan="3" class="column-group">Правильные</th>
                        <th colspan="3" class="column-group">Неправильные</th>
                        <th class="column-group">X</th>
                        <th class="column-group" onclick="sortTable('answers')" style="width: 60px !important;">Всего</th>
                        <th class="column-group" onclick="sortTable('total_points')" style="width: 130px !important;">Очки</th>
                        <th class="column-group" onclick="sortTable('prize')" style="width: 80px;">Приз</th>
                    </tr>
                    <tr>
                        <th></th>
                        <th onclick="sortTable('correct_answers.fast')" class="correct-fast answer-cell" style="width: 30px !important;"></th>
                        <th onclick="sortTable('correct_answers.medium')" class="correct-medium answer-cell" style="width: 30px !important;"></th>
                        <th onclick="sortTable('correct_answers.slow')" class="correct-slow answer-cell" style="width: 30px !important;"></th>
                        <th onclick="sortTable('wrong_answers.fast')" class="wrong-fast answer-cell" style="width: 30px !important;"></th>
                        <th onclick="sortTable('wrong_answers.medium')" class="wrong-medium answer-cell" style="width: 30px !important;"></th>
                        <th onclick="sortTable('wrong_answers.slow')" class="wrong-slow answer-cell" style="width: 30px !important;"></th>
                        <th onclick="sortTable('timeouts')" class="timeout answer-cell" style="width: 30px !important;"></th>
                        <th style="width: 60px !important;"></th>
                        <th style="width: 130px !important;"></th>
                        <th style="width: 80px;"></th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Добавляем строки с данными игроков
    currentPagePlayers.forEach(player => {
        html += `
            <tr>
                <td>${player.username}</td>
                <td class="correct-fast answer-cell" style="padding-left: 2px; padding-right: 2px;">${player.correct_answers.fast}</td>
                <td class="correct-medium answer-cell" style="padding-left: 2px; padding-right: 2px;">${player.correct_answers.medium}</td>
                <td class="correct-slow answer-cell" style="padding-left: 2px; padding-right: 2px;">${player.correct_answers.slow}</td>
                <td class="wrong-fast answer-cell" style="padding-left: 2px; padding-right: 2px;">${player.wrong_answers.fast}</td>
                <td class="wrong-medium answer-cell" style="padding-left: 2px; padding-right: 2px;">${player.wrong_answers.medium}</td>
                <td class="wrong-slow answer-cell" style="padding-left: 2px; padding-right: 2px;">${player.wrong_answers.slow}</td>
                <td class="timeout answer-cell" style="padding-left: 2px; padding-right: 2px;">${player.timeouts}</td>
                <td class="total-answers" style="width: 60px !important;">${player.answers}</td>
                <td class="total-points" style="width: 130px !important;">${formatNumber(player.total_points)}</td>
                <td class="prize">${formatNumber(player.prize, true)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Добавляем пагинацию, если нужно
    const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
    if (totalPages > 1) {
        html += createPagination(totalPages);
    }
    
    statsTable.innerHTML = html;
}

/**
 * Создание HTML для пагинации
 * @param {Number} totalPages - Общее количество страниц
 * @returns {String} - HTML-код пагинации
 */
function createPagination(totalPages) {
    let paginationHtml = `
        <nav>
            <ul class="pagination">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Предыдущая</a>
                </li>
    `;
    
    // Определяем, какие страницы показывать
    const visiblePages = [];
    const delta = 2; // Количество страниц до и после текущей
    
    if (totalPages <= 7) {
        // Если страниц мало, показываем все
        for (let i = 1; i <= totalPages; i++) {
            visiblePages.push(i);
        }
    } else {
        // Всегда показываем первую страницу
        visiblePages.push(1);
        
        if (currentPage > 2) {
            // Добавляем многоточие после первой страницы, если текущая страница не 2
            if (currentPage > 3) {
                visiblePages.push('...');
            }
            
            // Страницы до текущей
            for (let i = Math.max(2, currentPage - delta); i < currentPage; i++) {
                visiblePages.push(i);
            }
        }
        
        // Текущая страница
        if (currentPage !== 1 && currentPage !== totalPages) {
            visiblePages.push(currentPage);
        }
        
        // Страницы после текущей
        for (let i = currentPage + 1; i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            visiblePages.push(i);
        }
        
        // Добавляем многоточие перед последней страницей
        if (currentPage < totalPages - 2) {
            if (currentPage < totalPages - 3) {
                visiblePages.push('...');
            }
        }
        
        // Всегда показываем последнюю страницу
        visiblePages.push(totalPages);
    }
    
    // Добавляем страницы в пагинацию
    visiblePages.forEach(page => {
        if (page === '...') {
            paginationHtml += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        } else {
            paginationHtml += `
                <li class="page-item ${page === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${page}); return false;">${page}</a>
                </li>
            `;
        }
    });
    
    paginationHtml += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Следующая</a>
                </li>
            </ul>
        </nav>
    `;
    
    return paginationHtml;
}

/**
 * Смена страницы пагинации
 * @param {Number} page - Номер страницы
 */
function changePage(page) {
    if (!tournamentData) return;
    
    const filteredPlayers = tournamentData.players
        .filter(player => player.level === currentLevel)
        .filter(player => {
            const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
            return !searchTerm || player.username.toLowerCase().includes(searchTerm);
        });
    
    const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    currentPage = page;
    displayStatsTable(tournamentData);
}

/**
 * Сортировка данных
 * @param {String} column - Колонка для сортировки
 */
function sortTable(column) {
    if (currentSort.column === column) {
        // Если та же колонка, меняем направление сортировки
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Если другая колонка, устанавливаем направление по умолчанию
        currentSort.column = column;
        currentSort.direction = column === 'username' ? 'asc' : 'desc';
    }
    
    // Сбрасываем на первую страницу при изменении сортировки
    currentPage = 1;
    
    // Обновляем таблицу
    if (tournamentData) {
        displayStatsTable(tournamentData);
    }
}

/**
 * Сортировка массива игроков
 * @param {Array} players - Массив игроков
 * @param {String} column - Колонка для сортировки
 * @param {String} direction - Направление сортировки ('asc' или 'desc')
 * @returns {Array} - Отсортированный массив
 */
function sortPlayers(players, column, direction) {
    return [...players].sort((a, b) => {
        let valueA, valueB;
        
        // Обработка вложенных свойств (например, correct_answers.fast)
        if (column.includes('.')) {
            const [parent, child] = column.split('.');
            valueA = a[parent][child];
            valueB = b[parent][child];
        } else {
            valueA = a[column];
            valueB = b[column];
        }
        
        // Сортировка строк
        if (typeof valueA === 'string') {
            const compareResult = valueA.localeCompare(valueB);
            return direction === 'asc' ? compareResult : -compareResult;
        }
        
        // Сортировка чисел
        const compareResult = valueA - valueB;
        return direction === 'asc' ? compareResult : -compareResult;
    });
}

/**
 * Поиск игроков по имени
 */
function searchPlayers() {
    // Сбрасываем на первую страницу при поиске
    currentPage = 1;
    
    // Обновляем таблицу
    if (tournamentData) {
        displayStatsTable(tournamentData);
    }
}

/**
 * Форматирование чисел для отображения
 * @param {Number} num - Число для форматирования
 * @param {Boolean} isForPrize - Флаг форматирования для приза
 * @returns {String} - Отформатированное число
 */
function formatNumber(num, isForPrize = false) {
    if (isForPrize) {
        // Для призов - только целые числа
        return Math.round(num).toLocaleString('ru-RU');
    } else {
        // Для очков - с одним знаком после запятой
        return num.toLocaleString('ru-RU', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
    }
}

/**
 * Функция debounce для оптимизации обработки часто вызываемых функций
 * @param {Function} func - Функция для debounce
 * @param {Number} delay - Задержка в миллисекундах
 * @returns {Function} - Функция с debounce
 */
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем статистику игроков, когда DOM загружен
    setTimeout(initializePlayerStats, 500); // Небольшая задержка для гарантии загрузки данных основной статистики
});

// Глобальные функции для событий onclick
window.changeLevel = changeLevel;
window.changePage = changePage;
window.sortTable = sortTable;
