const { Markup } = require('telegraf');

// Основное меню для всех пользователей
const mainMenu = () => {
  return Markup.keyboard([
    ['🐶 Услуги и цены', '📅 Доступное время'],
    ['📝 Записаться', '⭐ Отзывы'],
    ['❓ О нас', '📞 Контакты']
  ]).resize();
};

// Меню для администраторов
const adminMenu = () => {
  return Markup.keyboard([
    ['🐶 Услуги и цены', '📅 Доступное время'],
    ['📝 Записаться', '⭐ Отзывы'],
    ['🔧 Админ-панель']
  ]).resize();
};

// Админ-панель
const adminPanelMenu = () => {
  return Markup.keyboard([
    ['➕ Добавить слоты', '📋 Записи'],
    ['✅ Подтвердить отзывы', '➕ Добавить услугу'],
    ['◀️ Назад в меню']
  ]).resize();
};

// Клавиатура для просмотра слотов по дням
const dateSelectKeyboard = (dates) => {
  const buttons = dates.map(date => 
    Markup.button.callback(
      date.formattedDate, 
      `date_${date.value}`
    )
  );
  
  // Добавляем кнопку "Назад"
  buttons.push(Markup.button.callback('◀️ Назад', 'back_to_main'));
  
  return Markup.inlineKeyboard(buttons, { columns: 1 });
};

// Клавиатура для выбора времени в конкретный день
const timeSlotKeyboard = (slots) => {
  const buttons = slots.map(slot => 
    Markup.button.callback(
      `${new Date(slot.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`, 
      `slot_${slot._id}`
    )
  );
  
  buttons.push(Markup.button.callback('◀️ Назад к датам', 'back_to_dates'));
  
  return Markup.inlineKeyboard(buttons, { columns: 2 });
};

// Клавиатура для выбора услуг
const servicesKeyboard = (services) => {
  const buttons = services.map(service => 
    Markup.button.callback(
      `${service.name} - ${service.price}₽`, 
      `service_${service._id}`
    )
  );
  
  buttons.push(Markup.button.callback('✅ Завершить выбор', 'finish_service_selection'));
  buttons.push(Markup.button.callback('◀️ Назад', 'back_to_main'));
  
  return Markup.inlineKeyboard(buttons, { columns: 1 });
};

// Клавиатура для подтверждения/отмены действия
const confirmKeyboard = (confirmText = 'Подтвердить', cancelText = 'Отменить', confirmAction = 'confirm', cancelAction = 'cancel') => {
  return Markup.inlineKeyboard([
    Markup.button.callback(confirmText, confirmAction),
    Markup.button.callback(cancelText, cancelAction)
  ]);
};

// Клавиатура для постраничного просмотра
const paginationKeyboard = (list, page, itemsPerPage, callbackPrefix) => {
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const buttons = [];
  
  // Кнопки навигации
  if (page > 1) {
    buttons.push(Markup.button.callback('⬅️', `${callbackPrefix}_prev_${page}`));
  }
  
  buttons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'));
  
  if (page < totalPages) {
    buttons.push(Markup.button.callback('➡️', `${callbackPrefix}_next_${page}`));
  }
  
  // Кнопка "Назад"
  buttons.push(Markup.button.callback('◀️ Назад', 'back_to_main'));
  
  return Markup.inlineKeyboard([buttons]);
};

// Клавиатура рейтинга для отзывов
const ratingKeyboard = () => {
  const buttons = [];
  for (let i = 1; i <= 5; i++) {
    buttons.push(Markup.button.callback(`${i} ⭐`, `rating_${i}`));
  }
  return Markup.inlineKeyboard([buttons]);
};

// Клавиатура для работы с отзывами (для админа)
const reviewActionKeyboard = (reviewId) => {
  return Markup.inlineKeyboard([
    Markup.button.callback('✅ Одобрить', `approve_review_${reviewId}`),
    Markup.button.callback('❌ Отклонить', `reject_review_${reviewId}`)
  ]);
};

// Клавиатура для управления записью (для админа)
const appointmentActionKeyboard = (appointmentId) => {
  return Markup.inlineKeyboard([
    Markup.button.callback('✅ Подтвердить', `confirm_appointment_${appointmentId}`),
    Markup.button.callback('❌ Отменить', `cancel_appointment_${appointmentId}`)
  ]);
};

module.exports = {
  mainMenu,
  adminMenu,
  adminPanelMenu,
  dateSelectKeyboard,
  timeSlotKeyboard,
  servicesKeyboard,
  confirmKeyboard,
  paginationKeyboard,
  ratingKeyboard,
  reviewActionKeyboard,
  appointmentActionKeyboard
}; 