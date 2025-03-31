const { Scenes } = require('telegraf');
const TimeSlot = require('../models/timeSlot');
const { adminPanelMenu, confirmKeyboard } = require('../utils/keyboards');
const { requireAdmin } = require('../middleware/admin');
const { formatDate, addMinutes, getStartOfDay, getEndOfDay } = require('../utils/dateHelpers');

// Сцена добавления временных слотов администратором
const adminAddSlotsScene = new Scenes.BaseScene('admin-add-slots-scene');

// Middleware для проверки, что пользователь - администратор
adminAddSlotsScene.use(requireAdmin);

// Шаги добавления слотов
// 1. Выбор даты
// 2. Выбор начала рабочего дня
// 3. Выбор конца рабочего дня
// 4. Выбор длительности временных слотов
// 5. Подтверждение и создание слотов

// При входе в сцену запрашиваем дату
adminAddSlotsScene.enter(async (ctx) => {
  // Инициализируем данные формы
  ctx.session.formData = {
    slotDate: null,
    startTime: null,
    endTime: null,
    slotDuration: 60 // Длительность слота по умолчанию - 60 минут
  };
  
  await ctx.reply(
    '➕ *Добавление временных слотов*\n\n' +
    'Введите дату в формате ДД.ММ.ГГГГ (например, 01.01.2024):',
    { parse_mode: 'Markdown' }
  );
});

// Обработка отмены
adminAddSlotsScene.command('cancel', (ctx) => {
  ctx.reply('Добавление слотов отменено', adminPanelMenu());
  return ctx.scene.leave();
});

// Обработка ввода даты
adminAddSlotsScene.on('text', async (ctx) => {
  // Если уже указана дата и время начала, обрабатываем как время окончания
  if (ctx.session.formData.slotDate && ctx.session.formData.startTime && !ctx.session.formData.endTime) {
    return handleEndTimeInput(ctx);
  }
  
  // Если уже указана дата, обрабатываем как время начала
  if (ctx.session.formData.slotDate && !ctx.session.formData.startTime) {
    return handleStartTimeInput(ctx);
  }
  
  // Обработка ввода даты
  const dateText = ctx.message.text.trim();
  const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  const match = dateText.match(dateRegex);
  
  if (!match) {
    return ctx.reply('Неверный формат даты. Пожалуйста, введите дату в формате ДД.ММ.ГГГГ (например, 01.01.2024):');
  }
  
  const day = parseInt(match[1]);
  const month = parseInt(match[2]) - 1; // В JavaScript месяцы от 0 до 11
  const year = parseInt(match[3]);
  
  const date = new Date(year, month, day);
  
  // Проверяем, корректная ли дата
  if (isNaN(date.getTime())) {
    return ctx.reply('Неверная дата. Пожалуйста, введите корректную дату в формате ДД.ММ.ГГГГ:');
  }
  
  // Проверяем, не прошедшая ли дата
  if (date < new Date()) {
    return ctx.reply('Нельзя добавить слоты на прошедшую дату. Пожалуйста, введите дату в будущем:');
  }
  
  // Сохраняем дату
  ctx.session.formData.slotDate = date;
  
  // Запрашиваем время начала рабочего дня
  await ctx.reply(
    `📅 Выбрана дата: ${formatDate(date)}\n\n` +
    'Введите время начала рабочего дня в формате ЧЧ:ММ (например, 09:00):'
  );
});

// Обработка ввода времени начала рабочего дня
async function handleStartTimeInput(ctx) {
  const timeText = ctx.message.text.trim();
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeText.match(timeRegex);
  
  if (!match) {
    return ctx.reply('Неверный формат времени. Пожалуйста, введите время в формате ЧЧ:ММ (например, 09:00):');
  }
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  
  // Проверяем корректность времени
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return ctx.reply('Неверное время. Пожалуйста, введите корректное время в формате ЧЧ:ММ:');
  }
  
  // Создаем дату со временем начала
  const startDate = new Date(ctx.session.formData.slotDate);
  startDate.setHours(hours, minutes, 0, 0);
  
  // Сохраняем время начала
  ctx.session.formData.startTime = startDate;
  
  // Запрашиваем время окончания рабочего дня
  await ctx.reply(
    `⏰ Время начала: ${startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n\n` +
    'Введите время окончания рабочего дня в формате ЧЧ:ММ (например, 18:00):'
  );
}

// Обработка ввода времени окончания рабочего дня
async function handleEndTimeInput(ctx) {
  const timeText = ctx.message.text.trim();
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeText.match(timeRegex);
  
  if (!match) {
    return ctx.reply('Неверный формат времени. Пожалуйста, введите время в формате ЧЧ:ММ (например, 18:00):');
  }
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  
  // Проверяем корректность времени
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return ctx.reply('Неверное время. Пожалуйста, введите корректное время в формате ЧЧ:ММ:');
  }
  
  // Создаем дату со временем окончания
  const endDate = new Date(ctx.session.formData.slotDate);
  endDate.setHours(hours, minutes, 0, 0);
  
  // Проверяем, что время окончания позже времени начала
  if (endDate <= ctx.session.formData.startTime) {
    return ctx.reply('Время окончания должно быть позже времени начала. Пожалуйста, введите корректное время:');
  }
  
  // Сохраняем время окончания
  ctx.session.formData.endTime = endDate;
  
  // Запрашиваем длительность временных слотов
  await ctx.reply(
    `⏰ Время окончания: ${endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n\n` +
    'Выберите длительность временных слотов (в минутах):',
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '30 мин', callback_data: 'slot_duration_30' },
            { text: '45 мин', callback_data: 'slot_duration_45' },
            { text: '60 мин', callback_data: 'slot_duration_60' }
          ],
          [
            { text: '90 мин', callback_data: 'slot_duration_90' },
            { text: '120 мин', callback_data: 'slot_duration_120' }
          ]
        ]
      }
    }
  );
}

// Обработка выбора длительности слота
adminAddSlotsScene.action(/^slot_duration_(\d+)$/, async (ctx) => {
  const duration = parseInt(ctx.match[1]);
  
  // Сохраняем длительность слота
  ctx.session.formData.slotDuration = duration;
  
  await ctx.answerCbQuery();
  
  // Формируем предварительную информацию о слотах для подтверждения
  const { slotDate, startTime, endTime, slotDuration } = ctx.session.formData;
  
  // Рассчитываем количество слотов
  const totalMinutes = (endTime - startTime) / (1000 * 60);
  const slotCount = Math.floor(totalMinutes / slotDuration);
  
  await ctx.reply(
    `📋 *Предварительная информация о слотах*\n\n` +
    `📅 Дата: ${formatDate(slotDate)}\n` +
    `⏰ Время работы: с ${startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} ` +
    `до ${endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n` +
    `⏱ Длительность слота: ${slotDuration} мин.\n` +
    `🔢 Количество слотов: ${slotCount}\n\n` +
    `Подтвердите создание временных слотов:`,
    {
      parse_mode: 'Markdown',
      ...confirmKeyboard('✅ Подтвердить', '❌ Отменить', 'confirm_slots', 'cancel_slots')
    }
  );
});

// Обработка подтверждения создания слотов
adminAddSlotsScene.action('confirm_slots', async (ctx) => {
  const { slotDate, startTime, endTime, slotDuration } = ctx.session.formData;
  
  try {
    await ctx.answerCbQuery();
    
    // Проверяем, существуют ли уже слоты на эту дату
    const dateStart = getStartOfDay(slotDate);
    const dateEnd = getEndOfDay(slotDate);
    
    const existingSlots = await TimeSlot.exists({
      startTime: { $gte: dateStart, $lte: dateEnd }
    });
    
    if (existingSlots) {
      await ctx.reply(
        '⚠️ На эту дату уже существуют временные слоты. Хотите добавить новые слоты?',
        confirmKeyboard('✅ Да, добавить', '❌ Отменить', 'add_more_slots', 'cancel_slots')
      );
      return;
    }
    
    // Создаем слоты
    return createTimeSlots(ctx);
  } catch (err) {
    console.error('Ошибка при проверке существующих слотов:', err);
    await ctx.reply('Произошла ошибка при создании слотов. Пожалуйста, попробуйте позже.');
    return ctx.scene.leave();
  }
});

// Обработка подтверждения добавления слотов к существующим
adminAddSlotsScene.action('add_more_slots', async (ctx) => {
  await ctx.answerCbQuery();
  return createTimeSlots(ctx);
});

// Обработка отмены создания слотов
adminAddSlotsScene.action('cancel_slots', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('❌ Создание слотов отменено', adminPanelMenu());
  return ctx.scene.leave();
});

// Функция для создания временных слотов
async function createTimeSlots(ctx) {
  const { slotDate, startTime, endTime, slotDuration } = ctx.session.formData;
  
  try {
    // Создаем массив для хранения слотов
    const slots = [];
    
    // Рассчитываем время начала каждого слота
    let currentSlotStart = new Date(startTime);
    
    while (currentSlotStart.getTime() + slotDuration * 60 * 1000 <= endTime.getTime()) {
      // Время окончания текущего слота
      const currentSlotEnd = addMinutes(currentSlotStart, slotDuration);
      
      // Создаем новый временной слот
      slots.push({
        date: new Date(slotDate),
        startTime: new Date(currentSlotStart),
        endTime: new Date(currentSlotEnd),
        isBooked: false,
        createdBy: ctx.from.id
      });
      
      // Переходим к следующему слоту
      currentSlotStart = new Date(currentSlotEnd);
    }
    
    // Сохраняем слоты в базу данных
    await TimeSlot.insertMany(slots);
    
    // Уведомляем администратора
    await ctx.reply(
      `✅ Успешно создано ${slots.length} временных слотов на ${formatDate(slotDate)}!`,
      adminPanelMenu()
    );
    
    return ctx.scene.leave();
  } catch (err) {
    console.error('Ошибка при создании временных слотов:', err);
    await ctx.reply('Произошла ошибка при создании слотов. Пожалуйста, попробуйте позже.');
    return ctx.scene.leave();
  }
}

module.exports = { adminAddSlotsScene }; 