// Функции-помощники для работы с датами и временем

/**
 * Форматирует дату в человекочитаемый вид
 * @param {Date} date - Дата для форматирования
 * @returns {string} Форматированная дата
 */
const formatDate = (date) => {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Форматирует время в человекочитаемый вид
 * @param {Date} date - Дата для форматирования времени
 * @returns {string} Форматированное время
 */
const formatTime = (date) => {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Форматирует дату и время в человекочитаемый вид
 * @param {Date} date - Дата для форматирования
 * @returns {string} Форматированная дата и время
 */
const formatDateTime = (date) => {
  return `${formatDate(date)} в ${formatTime(date)}`;
};

/**
 * Получает список дат на ближайшие N дней
 * @param {number} days - Количество дней для генерации
 * @returns {Array} Массив объектов с датами
 */
const getNextDays = (days = 14) => {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    result.push({
      value: date.toISOString().split('T')[0], // YYYY-MM-DD
      formattedDate: formatDate(date),
      date: date
    });
  }
  
  return result;
};

/**
 * Получает начало дня (00:00:00) для указанной даты
 * @param {Date|string} date - Дата или строка с датой
 * @returns {Date} Дата с временем 00:00:00
 */
const getStartOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Получает конец дня (23:59:59) для указанной даты
 * @param {Date|string} date - Дата или строка с датой
 * @returns {Date} Дата с временем 23:59:59
 */
const getEndOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Проверяет, является ли дата прошедшей
 * @param {Date} date - Дата для проверки
 * @returns {boolean} true если дата в прошлом
 */
const isPastDate = (date) => {
  return new Date(date) < new Date();
};

/**
 * Добавляет указанное количество минут к дате
 * @param {Date} date - Исходная дата
 * @param {number} minutes - Количество минут для добавления
 * @returns {Date} Новая дата
 */
const addMinutes = (date, minutes) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  getNextDays,
  getStartOfDay,
  getEndOfDay,
  isPastDate,
  addMinutes
}; 