/**
 * Общие функции для работы с данными в проекте IQ Capitalist
 */

/**
 * Загрузка данных из единого источника
 * @param {Function} callback - Функция обратного вызова, вызываемая после загрузки данных
 */
function loadData(callback) {
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
  .then(data => callback(data))
  .catch(error => {
    console.error('Ошибка загрузки данных:', error);
    showError('playersTable', error.message);
  });
}

/**
 * Универсальная функция сортировки
 * @param {Array} players - Массив игроков для сортировки
 * @param {String} column - Колонка, по которой производится сортировка
 * @param {String} direction - Направление сортировки ('asc' или 'desc')
 * @returns {Array} - Отсортированный массив игроков
 */
function sortPlayers(players, column, direction) {
  return [...players].sort((a, b) => {
    // Текстовые поля
    if (column === 'username' || column === 'level') {
      return direction === 'asc' 
          ? a[column].localeCompare(b[column])
          : b[column].localeCompare(a[column]);
    } 
    // Числовые поля
    else {
      const primaryCompare = direction === 'asc' 
          ? a[column] - b[column]
          : b[column] - a[column];
          
      // Дополнительная сортировка по имени пользователя при равенстве основного поля
      if (primaryCompare === 0) {
        return a.username.localeCompare(b.username);
      }
      
      return primaryCompare;
    }
  });
}

/**
 * Общая функция отображения ошибок
 * @param {String} containerId - ID контейнера для отображения ошибки
 * @param {String} message - Сообщение об ошибке
 */
function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <p>Ошибка загрузки данных: ${message}</p>
        <button class="btn btn-sm btn-primary mt-2" onclick="location.reload()">
          Попробовать снова
        </button>
      </div>
    `;
  } else {
    console.error(`Контейнер ${containerId} не найден для отображения ошибки`);
  }
}

/**
 * Форматирование чисел для отображения
 * @param {Number} num - Число для форматирования
 * @returns {String} - Отформатированное число
 */
function formatNumber(num) {
  return num.toLocaleString('ru-RU');
}

/**
 * Общая функция генерации CSV
 * @param {Array} data - Массив данных
 * @param {Array} headers - Заголовки для CSV
 * @param {Function} transformRow - Функция преобразования строки данных
 * @returns {String} - Содержимое CSV
 */
function generateCSV(data, headers, transformRow) {
  const csvRows = [headers.join(',')];
  
  for (const item of data) {
    const row = transformRow(item);
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Общая функция скачивания CSV
 * @param {String} filename - Имя файла
 * @param {String} csvContent - Содержимое CSV
 */
function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Обновление информации о последнем обновлении данных
 * @param {String} lastUpdate - Дата и время последнего обновления
 * @param {String} elementId - ID элемента для обновления (по умолчанию 'lastUpdate')
 * @param {String} downloadFunction - Название функции скачивания CSV (необязательно)
 */
function updateLastUpdate(lastUpdate, elementId = 'lastUpdate', downloadFunction = null) {
  const lastUpdateElement = document.getElementById(elementId);
  if (lastUpdateElement) {
    if (downloadFunction) {
      lastUpdateElement.innerHTML = `Данные обновлены: ${lastUpdate} | <a href="#" onclick="${downloadFunction}(); return false;">Скачать csv</a>`;
    } else {
      lastUpdateElement.textContent = `Данные обновлены: ${lastUpdate}`;
    }
  } else {
    console.warn('Элемент для обновления информации не найден');
  }
}

/**
 * Простой debounce для оптимизации обработки часто вызываемых функций
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
