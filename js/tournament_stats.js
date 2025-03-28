/**
 * Скрипт для страницы детальной статистики турнира IQ Capitalist
 */

// Глобальные переменные
let globalData;
let currentLevel = 'Знаток';
let currentSort = { column: 'total_points', direction: 'desc' };
let currentPage = 1;
const itemsPerPage = 50;

// Порядок уровней
const levelOrder = [
    'Знаток', 'Эксперт', 'Мастер', 'Босс', 'Титан',
    'Легенда', 'Корифей', 'Гуру', 'IQ Капиталист'
];

// Границы уровней для отображения
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
 * Инициализация страницы
 */
document.addEventListener('DOMContentLoaded', () => {
    // Загрузка данных
    loadData();

    // Подключаем поиск с debounce для оптимизации
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchPlayers, 300));
    }
});

/**
 * Функция debounce для оптимизации обработки часто вызываемых функций
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

/**
 * Загрузка данных о турнире
 */
function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id') || "1"; // По умолчанию загружаем турнир с ID 1
    
    // Показываем индикатор загрузки
    document.getElementById('statsTable').innerHTML = '<p class="text-center">Загрузка данных...</p>';
    
    // Загружаем данные турнира
    fetch(`data/${tournamentId}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ошибка! Статус: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            globalData = data;
            initializePage(data);
        })
        .catch(error => {
            console.error('Ошибка загрузки данных:', error);
            document.getElementById('statsTable').innerHTML = `
                <div class="error-message">
                    <p>Ошибка загрузки данных: ${error.message}</p>
                    <p>Пожалуйста, попробуйте обновить страницу.</p>
                </div>
            `;
        });
}

/**
 * Инициализация страницы после загрузки данных
 */
function initializePage(data) {
    // Отображаем время последнего обновления
    document.getElementById('lastUpdate').textContent = `Данные обновлены: ${data.generated_at}`;
    
    // Отображаем информацию о турнире
    displayTournamentInfo(data.tournament);
    
    // Создаем кнопки уровней
    createLevelButtons(data);
    
    // Отображаем заголовок уровня
    updateLevelHeader(data);
    
    // Отображаем таблицу с данными
    displayStatsTable(data);
}

/**
 * Отображение информации о турнире
 */
function displayTournamentInfo(tournament) {
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    
    // Форматирование дат
    const formatDate = (date) => {
        if (!(date instanceof Date)) return 'Неизвестно';
        const day = date.getDate();
        const month = date.toLocaleString('ru', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };
    
    const tournamentInfo = document.getElementById('tournamentInfo');
    tournamentInfo.innerHTML = `
        <div class="tournament-info">
            <p>Турнир №${tournament.id}. Период: ${formatDate(startDate)} - ${formatDate(endDate)}. 
               Количество вопросов: ${tournament.total_questions || 'Не указано'}</p>
        </div>
    `;
}

/**
 * Создание кнопок для переключения между уровнями
 */
function createLevelButtons(data) {
    const availableLevels = [];
    
    // Проверяем, по каким уровням есть игроки
    for (const level of levelOrder) {
        const players = data.players.filter(player => player.level === level);
        if (players.length > 0) {
            availableLevels.push(level);
        }
    }
    
    const buttonsContainer = document.getElementById('levelButtons');
    buttonsContainer.innerHTML = '';
    
    // Создаем кнопки только для уровней, по которым есть игроки
    availableLevels.forEach(level => {
        const button = document.createElement('button');
        button.textContent = level;
        button.className = `level-btn ${level === currentLevel ? 'active' : ''}`;
        button.onclick = () => changeLevel(level);
        buttonsContainer.appendChild(button);
    });
    
    // Если текущего уровня нет в доступных, выбираем первый доступный
    if (!availableLevels.includes(currentLevel) && availableLevels.length > 0) {
        currentLevel = availableLevels[0];
        const activeButton = buttonsContainer.querySelector('.level-btn:first-child');
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
}

/**
 * Обновление заголовка уровня
 */
function updateLevelHeader(data) {
    const levelHeader = document.getElementById('levelHeader');
    const range = levelRanges[currentLevel];
    
    // Текст с диапазоном капитала для уровня
    const maxText = currentLevel === 'Знаток' 
        ? '' 
        : (range.max === Infinity ? '+' : '-' + range.max);
    
    // Получаем количество игроков на текущем уровне
    const levelPlayers = data.players.filter(player => player.level === currentLevel);
    
    levelHeader.innerHTML = `
        <h2>Уровень ${currentLevel} (${range.min}${maxText})</h2>
        <p class="level-info">Участников: ${levelPlayers.length}</p>
    `;
}

/**
 * Смена текущего уровня
 */
function changeLevel(level) {
    currentLevel = level;
    currentPage = 1; // Сбрасываем на первую страницу при смене уровня
    
    // Обновляем активную кнопку
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === level);
    });
    
    // Обновляем заголовок уровня
    updateLevelHeader(globalData);
    
    // Обновляем таблицу с данными
    displayStatsTable(globalData);
}

/**
 * Отображение таблицы с детальной статистикой
 */
function displayStatsTable(data) {
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
    
    const statsTable = document.getElementById('statsTable');
    
    if (currentPagePlayers.length === 0) {
        statsTable.innerHTML = `
            <div class="alert">
                <p>Нет данных для отображения. ${searchTerm ? 'Попробуйте изменить параметры поиска.' : ''}</p>
            </div>
        `;
        return;
    }
    
    // Создаем таблицу
    let html = `
        <div class="table-responsive">
            <table class="stats-table">
                <thead>
                    <tr>
                        <th onclick="sortTable('user_id')">ID</th>
                        <th onclick="sortTable('username')">Имя пользователя</th>
                        <th onclick="sortTable('level')">Уровень</th>
                        <th colspan="3" class="column-group">Правильные ответы</th>
                        <th colspan="3" class="column-group">Неправильные ответы</th>
                        <th class="column-group">Таймауты</th>
                        <th class="column-group" onclick="sortTable('answers')">Всего ответов</th>
                        <th class="column-group" onclick="sortTable('total_points')">Очки</th>
                        <th class="column-group" onclick="sortTable('prize')">Приз (IQC)</th>
                    </tr>
                    <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th onclick="sortTable('correct_answers.fast')">Быстрые</th>
                        <th onclick="sortTable('correct_answers.medium')">Средние</th>
                        <th onclick="sortTable('correct_answers.slow')">Медленные</th>
                        <th onclick="sortTable('wrong_answers.fast')">Быстрые</th>
                        <th onclick="sortTable('wrong_answers.medium')">Средние</th>
                        <th onclick="sortTable('wrong_answers.slow')">Медленные</th>
                        <th onclick="sortTable('timeouts')"></th>
                        <th></th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Добавляем строки с данными игроков
    currentPagePlayers.forEach(player => {
        html += `
            <tr>
                <td>${player.user_id}</td>
                <td>${player.username}</td>
                <td>${player.level}</td>
                <td class="correct-fast">${player.correct_answers.fast}</td>
                <td class="correct-medium">${player.correct_answers.medium}</td>
                <td class="correct-slow">${player.correct_answers.slow}</td>
                <td class="wrong-fast">${player.wrong_answers.fast}</td>
                <td class="wrong-medium">${player.wrong_answers.medium}</td>
                <td class="wrong-slow">${player.wrong_answers.slow}</td>
                <td class="timeout">${player.timeouts}</td>
                <td class="total-answers">${player.answers}</td>
                <td class="total-points">${formatNumber(player.total_points)}</td>
                <td class="prize">${formatNumber(player.prize)}</td>
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
 */
function changePage(page) {
    const filteredPlayers = globalData.players
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
    displayStatsTable(globalData);
}

/**
 * Сортировка данных
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
    displayStatsTable(globalData);
}

/**
 * Сортировка массива игроков
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
    displayStatsTable(globalData);
}

/**
 * Форматирование чисел для отображения
 */
function formatNumber(num) {
    return num.toLocaleString('ru-RU', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
}
