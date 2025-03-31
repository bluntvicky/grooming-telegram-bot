const Service = require('../models/service');
const TimeSlot = require('../models/timeSlot');
const Appointment = require('../models/appointment');
const Review = require('../models/review');
const { mainMenu } = require('../utils/keyboards');

// Настройка обработчиков колбэков от inline-кнопок
const setupCallbacks = (bot) => {
  // Общие колбэки навигации
  bot.action('back_to_main', async (ctx) => {
    try {
      await ctx.deleteMessage();
    } catch (err) {
      console.log('Не удалось удалить сообщение:', err);
    }
    
    await ctx.reply('📜 Вернулись в главное меню:', mainMenu());
    await ctx.answerCbQuery();
  });

  // Обработка выбора даты
  bot.action(/^date_(.+)$/, async (ctx) => {
    const dateValue = ctx.match[1]; // YYYY-MM-DD
    ctx.session.selectedDate = dateValue;
    
    try {
      // Перенаправление в сцену отображения времени для выбранной даты
      ctx.scene.enter('time-slots-scene', { date: dateValue });
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Ошибка при выборе даты:', err);
      await ctx.reply('😞 Произошла ошибка при выборе даты. Пожалуйста, попробуйте еще раз.');
      await ctx.answerCbQuery('Ошибка при выборе даты');
    }
  });

  // Обработка выбора временного слота
  bot.action(/^slot_(.+)$/, async (ctx) => {
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
      
      // Если пользователь находится в процессе записи, перенаправляем на следующий шаг
      if (ctx.session.appointmentStep === 'selecting_time') {
        ctx.scene.enter('appointment-services-scene');
      } else {
        // Иначе просто показываем информацию о выбранном времени
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
      }
    } catch (err) {
      console.error('Ошибка при выборе времени:', err);
      await ctx.reply('😞 Произошла ошибка при выборе времени. Пожалуйста, попробуйте еще раз.');
      await ctx.answerCbQuery('Ошибка при выборе времени');
    }
  });

  // Обработка выбора услуги
  bot.action(/^service_(.+)$/, async (ctx) => {
    const serviceId = ctx.match[1];
    
    try {
      const service = await Service.findById(serviceId);
      
      if (!service) {
        await ctx.answerCbQuery('Услуга не найдена');
        return;
      }
      
      // Инициализируем корзину, если её ещё нет
      if (!ctx.session.cart) {
        ctx.session.cart = { services: [] };
      }
      
      // Проверяем, выбрана ли уже эта услуга
      const serviceIndex = ctx.session.cart.services.findIndex(s => s.toString() === serviceId);
      
      if (serviceIndex === -1) {
        // Если услуга ещё не в корзине, добавляем её
        ctx.session.cart.services.push(serviceId);
        await ctx.answerCbQuery(`✅ Добавлено: ${service.name}`);
      } else {
        // Если услуга уже в корзине, удаляем её
        ctx.session.cart.services.splice(serviceIndex, 1);
        await ctx.answerCbQuery(`❌ Удалено: ${service.name}`);
      }
      
      // Обновляем UI с текущим выбором услуг
      const selectedServices = await Service.find({
        _id: { $in: ctx.session.cart.services }
      });
      
      let totalPrice = 0;
      let messageText = '🛒 *Выбранные услуги:*\n\n';
      
      if (selectedServices.length === 0) {
        messageText += 'Вы пока не выбрали ни одной услуги';
      } else {
        selectedServices.forEach(service => {
          messageText += `• ${service.name} - ${service.price}₽\n`;
          totalPrice += service.price;
        });
        
        messageText += `\n*Общая стоимость:* ${totalPrice}₽`;
      }
      
      await ctx.editMessageText(messageText, {
        parse_mode: 'Markdown',
        reply_markup: ctx.callbackQuery.message.reply_markup
      });
    } catch (err) {
      console.error('Ошибка при выборе услуги:', err);
      await ctx.answerCbQuery('Ошибка при выборе услуги');
    }
  });

  // Обработка завершения выбора услуг
  bot.action('finish_service_selection', async (ctx) => {
    try {
      if (!ctx.session.cart || ctx.session.cart.services.length === 0) {
        await ctx.answerCbQuery('Пожалуйста, выберите хотя бы одну услугу');
        return;
      }
      
      // Если мы в процессе записи, переходим к следующему шагу
      if (ctx.session.appointmentStep === 'selecting_services') {
        ctx.scene.enter('appointment-contact-scene');
      } else {
        // Иначе просто показываем информацию о выбранных услугах
        const selectedServices = await Service.find({
          _id: { $in: ctx.session.cart.services }
        });
        
        let totalPrice = 0;
        let messageText = '✅ *Ваш выбор услуг:*\n\n';
        
        selectedServices.forEach(service => {
          messageText += `• ${service.name} - ${service.price}₽\n`;
          totalPrice += service.price;
        });
        
        messageText += `\n*Общая стоимость:* ${totalPrice}₽\n\n`;
        messageText += 'Хотите записаться на эти услуги?';
        
        await ctx.editMessageText(messageText, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📝 Записаться', callback_data: 'book_selected_services' }],
              [{ text: '◀️ Назад', callback_data: 'back_to_services' }]
            ]
          }
        });
      }
      
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Ошибка при завершении выбора услуг:', err);
      await ctx.answerCbQuery('Ошибка при завершении выбора услуг');
    }
  });

  // Обработка подтверждения/отклонения записи администратором
  bot.action(/^confirm_appointment_(.+)$/, async (ctx) => {
    if (!ctx.session.isAdmin) {
      await ctx.answerCbQuery('⛔ У вас нет доступа к этой функции');
      return;
    }
    
    const appointmentId = ctx.match[1];
    
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('services')
        .populate('timeSlot');
      
      if (!appointment) {
        await ctx.answerCbQuery('Запись не найдена');
        return;
      }
      
      // Обновляем статус записи
      appointment.status = 'confirmed';
      await appointment.save();
      
      // Уведомляем клиента о подтверждении записи
      try {
        await bot.telegram.sendMessage(
          appointment.user.telegramId,
          `✅ *Ваша запись подтверждена!*\n\n` +
          `Дата и время: ${new Date(appointment.timeSlot.startTime).toLocaleDateString('ru-RU')} в ${new Date(appointment.timeSlot.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n\n` +
          `Не забудьте прийти вовремя. Ждём вас и вашего питомца!`,
          { parse_mode: 'Markdown' }
        );
      } catch (notifyError) {
        console.error('Не удалось уведомить клиента:', notifyError);
      }
      
      // Обновляем сообщение в чате администратора
      await ctx.editMessageText(
        `✅ *Запись подтверждена*\n\n` +
        `👤 Клиент: ${appointment.user.name}\n` +
        `📱 Телефон: ${appointment.user.phone}\n` +
        `🐕 Порода: ${appointment.petInfo.breed}\n` +
        `📅 Дата: ${new Date(appointment.timeSlot.startTime).toLocaleDateString('ru-RU')}\n` +
        `🕒 Время: ${new Date(appointment.timeSlot.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
        { parse_mode: 'Markdown' }
      );
      
      await ctx.answerCbQuery('Запись успешно подтверждена');
    } catch (err) {
      console.error('Ошибка при подтверждении записи:', err);
      await ctx.answerCbQuery('Ошибка при подтверждении записи');
    }
  });

  bot.action(/^cancel_appointment_(.+)$/, async (ctx) => {
    if (!ctx.session.isAdmin) {
      await ctx.answerCbQuery('⛔ У вас нет доступа к этой функции');
      return;
    }
    
    const appointmentId = ctx.match[1];
    
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('timeSlot');
      
      if (!appointment) {
        await ctx.answerCbQuery('Запись не найдена');
        return;
      }
      
      // Обновляем статус записи
      appointment.status = 'cancelled';
      await appointment.save();
      
      // Освобождаем временной слот
      if (appointment.timeSlot) {
        appointment.timeSlot.isBooked = false;
        appointment.timeSlot.appointmentId = null;
        await appointment.timeSlot.save();
      }
      
      // Уведомляем клиента об отмене
      try {
        await bot.telegram.sendMessage(
          appointment.user.telegramId,
          `❌ *Ваша запись отменена*\n\n` +
          `К сожалению, ваша запись на ${new Date(appointment.timeSlot.startTime).toLocaleDateString('ru-RU')} в ${new Date(appointment.timeSlot.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} была отменена.\n\n` +
          `Для получения дополнительной информации свяжитесь с нами по телефону или запишитесь на другое время.`,
          { parse_mode: 'Markdown' }
        );
      } catch (notifyError) {
        console.error('Не удалось уведомить клиента:', notifyError);
      }
      
      // Обновляем сообщение в чате администратора
      await ctx.editMessageText(
        `❌ *Запись отменена*\n\n` +
        `👤 Клиент: ${appointment.user.name}\n` +
        `📱 Телефон: ${appointment.user.phone}\n` +
        `🐕 Порода: ${appointment.petInfo.breed}\n` +
        `📅 Дата: ${new Date(appointment.timeSlot.startTime).toLocaleDateString('ru-RU')}\n` +
        `🕒 Время: ${new Date(appointment.timeSlot.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
        { parse_mode: 'Markdown' }
      );
      
      await ctx.answerCbQuery('Запись успешно отменена');
    } catch (err) {
      console.error('Ошибка при отмене записи:', err);
      await ctx.answerCbQuery('Ошибка при отмене записи');
    }
  });

  // Обработка одобрения/отклонения отзывов администратором
  bot.action(/^approve_review_(.+)$/, async (ctx) => {
    if (!ctx.session.isAdmin) {
      await ctx.answerCbQuery('⛔ У вас нет доступа к этой функции');
      return;
    }
    
    const reviewId = ctx.match[1];
    
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        await ctx.answerCbQuery('Отзыв не найден');
        return;
      }
      
      // Одобряем отзыв
      review.approved = true;
      await review.save();
      
      // Обновляем сообщение
      await ctx.editMessageText(
        `✅ *Отзыв одобрен*\n\n` +
        `⭐ Оценка: ${review.rating}/5\n` +
        `👤 Клиент: ${review.user.name}\n` +
        `📝 Текст: ${review.text}`,
        { parse_mode: 'Markdown' }
      );
      
      // Уведомляем пользователя
      try {
        await bot.telegram.sendMessage(
          review.user.telegramId,
          `✅ Ваш отзыв был опубликован. Спасибо за обратную связь!`,
          { parse_mode: 'Markdown' }
        );
      } catch (notifyError) {
        console.error('Не удалось уведомить клиента:', notifyError);
      }
      
      await ctx.answerCbQuery('Отзыв успешно одобрен');
    } catch (err) {
      console.error('Ошибка при одобрении отзыва:', err);
      await ctx.answerCbQuery('Ошибка при одобрении отзыва');
    }
  });

  bot.action(/^reject_review_(.+)$/, async (ctx) => {
    if (!ctx.session.isAdmin) {
      await ctx.answerCbQuery('⛔ У вас нет доступа к этой функции');
      return;
    }
    
    const reviewId = ctx.match[1];
    
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        await ctx.answerCbQuery('Отзыв не найден');
        return;
      }
      
      // Удаляем отзыв
      await Review.deleteOne({ _id: reviewId });
      
      // Обновляем сообщение
      await ctx.editMessageText(
        `❌ *Отзыв отклонен и удален*\n\n` +
        `⭐ Оценка: ${review.rating}/5\n` +
        `👤 Клиент: ${review.user.name}\n` +
        `📝 Текст: ${review.text}`,
        { parse_mode: 'Markdown' }
      );
      
      await ctx.answerCbQuery('Отзыв отклонен и удален');
    } catch (err) {
      console.error('Ошибка при отклонении отзыва:', err);
      await ctx.answerCbQuery('Ошибка при отклонении отзыва');
    }
  });

  // Обработка выбора рейтинга для отзыва
  bot.action(/^rating_(\d)$/, (ctx) => {
    const rating = parseInt(ctx.match[1]);
    
    if (rating >= 1 && rating <= 5) {
      ctx.session.reviewRating = rating;
      ctx.scene.enter('review-text-scene');
      ctx.answerCbQuery(`Выбрана оценка: ${rating} ⭐`);
    } else {
      ctx.answerCbQuery('Пожалуйста, выберите оценку от 1 до 5');
    }
  });
};

module.exports = { setupCallbacks }; 