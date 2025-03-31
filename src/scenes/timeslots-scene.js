const { Scenes } = require('telegraf');
const TimeSlot = require('../models/timeSlot');
const { dateSelectKeyboard, timeSlotKeyboard, mainMenu } = require('../utils/keyboards');
const { getNextDays, getStartOfDay, getEndOfDay } = require('../utils/dateHelpers');

// Сцена просмотра доступных временных слотов
const timeSlotsScene = new Scenes.BaseScene('timeslots-scene');

// При входе в сцену показываем список доступных дат
timeSlotsScene.enter(async (ctx) => {
  try {
    // Получаем список дат на ближайшие 14 дней
    const dates = getNextDays(14);
    
    // Проверяем, есть ли доступные слоты для каждой даты
    const availableDates = [];
    
    for (const date of dates) {
      const startOfDay = getStartOfDay(date.date);
      const endOfDay = getEndOfDay(date.date);
      
      // Проверяем, есть ли хотя бы один доступный слот на эту дату
      const hasAvailableSlots = await TimeSlot.exists({
        startTime: { $gte: startOfDay, $lte: endOfDay },
        isBooked: false
      });
      
      if (hasAvailableSlots) {
        availableDates.push(date);
      }
    }
    
    if (availableDates.length === 0) {
      await ctx.reply(
        '😔 К сожалению, на ближайшие дни нет доступных записей. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону.',
        mainMenu()
      );
      return ctx.scene.leave();
    }
    
    // Отправляем список доступных дат
    await ctx.reply(
      '📅 *Выберите дату для просмотра доступного времени:*',
      {
        parse_mode: 'Markdown',
        ...dateSelectKeyboard(availableDates)
      }
    );
  } catch (err) {
    console.error('Ошибка при загрузке доступных дат:', err);
    await ctx.reply(
      '😔 Произошла ошибка при загрузке доступных дат. Пожалуйста, попробуйте позже.',
      mainMenu()
    );
    return ctx.scene.leave();
  }
});

// Обработка возврата в главное меню
timeSlotsScene.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Вернулись в главное меню', mainMenu());
  return ctx.scene.leave();
});

// Обработка выбора даты - переход к выбору времени
timeSlotsScene.action(/^date_(.+)$/, async (ctx) => {
  const dateValue = ctx.match[1]; // YYYY-MM-DD
  ctx.session.selectedDate = dateValue;
  
  try {
    const startOfDay = getStartOfDay(dateValue);
    const endOfDay = getEndOfDay(dateValue);
    
    // Получаем все доступные слоты на выбранную дату
    const availableSlots = await TimeSlot.find({
      startTime: { $gte: startOfDay, $lte: endOfDay },
      isBooked: false
    }).sort({ startTime: 1 });
    
    if (availableSlots.length === 0) {
      await ctx.answerCbQuery('На эту дату больше нет доступных записей');
      return;
    }
    
    // Форматируем дату для отображения
    const date = new Date(dateValue);
    const formattedDate = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Отправляем список доступных слотов времени
    await ctx.editMessageText(
      `🕓 *Доступное время на ${formattedDate}:*\n\n` +
      'Выберите удобное время:',
      {
        parse_mode: 'Markdown',
        ...timeSlotKeyboard(availableSlots)
      }
    );
    
    await ctx.answerCbQuery();
  } catch (err) {
    console.error('Ошибка при загрузке доступных слотов времени:', err);
    await ctx.answerCbQuery('Произошла ошибка при загрузке доступных слотов времени');
  }
});

// Обработка возврата к выбору даты
timeSlotsScene.action('back_to_dates', async (ctx) => {
  try {
    // Получаем список дат на ближайшие 14 дней
    const dates = getNextDays(14);
    
    // Проверяем, есть ли доступные слоты для каждой даты
    const availableDates = [];
    
    for (const date of dates) {
      const startOfDay = getStartOfDay(date.date);
      const endOfDay = getEndOfDay(date.date);
      
      // Проверяем, есть ли хотя бы один доступный слот на эту дату
      const hasAvailableSlots = await TimeSlot.exists({
        startTime: { $gte: startOfDay, $lte: endOfDay },
        isBooked: false
      });
      
      if (hasAvailableSlots) {
        availableDates.push(date);
      }
    }
    
    // Отправляем список доступных дат
    await ctx.editMessageText(
      '📅 *Выберите дату для просмотра доступного времени:*',
      {
        parse_mode: 'Markdown',
        ...dateSelectKeyboard(availableDates)
      }
    );
    
    await ctx.answerCbQuery();
  } catch (err) {
    console.error('Ошибка при возврате к выбору даты:', err);
    await ctx.answerCbQuery('Произошла ошибка при загрузке доступных дат');
  }
});

// Обработка выбора временного слота
timeSlotsScene.action(/^slot_(.+)$/, async (ctx) => {
  const slotId = ctx.match[1];
  
  try {
    const slot = await TimeSlot.findById(slotId);
    
    if (!slot) {
      await ctx.answerCbQuery('Выбранный слот времени не найден');
      return;
    }
    
    if (slot.isBooked) {
      await ctx.answerCbQuery('Это время уже занято. Выберите другое время.');
      return;
    }
    
    // Сохраняем выбранный слот в сессии
    ctx.session.selectedTimeSlot = slotId;
    
    // Показываем информацию о выбранном времени
    const date = new Date(slot.startTime);
    await ctx.answerCbQuery(`Вы выбрали ${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`);
    
    // Показываем опцию записи на это время
    await ctx.reply(
      `✅ Вы выбрали ${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      'Хотите записаться на это время?',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📝 Записаться', callback_data: 'book_selected_time' }],
            [{ text: '◀️ Назад', callback_data: 'back_to_dates' }]
          ]
        }
      }
    );
  } catch (err) {
    console.error('Ошибка при выборе времени:', err);
    await ctx.answerCbQuery('Произошла ошибка при выборе времени');
  }
});

// Обработка записи на выбранное время
timeSlotsScene.action('book_selected_time', async (ctx) => {
  try {
    if (!ctx.session.selectedTimeSlot) {
      await ctx.answerCbQuery('Сначала выберите время');
      return;
    }
    
    // Перенаправляем на сцену записи
    await ctx.answerCbQuery();
    ctx.scene.enter('booking-scene');
  } catch (err) {
    console.error('Ошибка при переходе к записи:', err);
    await ctx.answerCbQuery('Произошла ошибка. Пожалуйста, попробуйте ещё раз.');
  }
});

// Обработка ухода со сцены
timeSlotsScene.leave((ctx) => {
  return ctx.reply('Вы вышли из раздела просмотра доступного времени', mainMenu());
});

module.exports = { timeSlotsScene }; 