const { Scenes } = require('telegraf');
const Service = require('../models/service');
const { servicesKeyboard, mainMenu } = require('../utils/keyboards');

// Сцена просмотра услуг и цен
const servicesScene = new Scenes.BaseScene('services-scene');

servicesScene.enter(async (ctx) => {
  try {
    // Получаем все доступные услуги
    const services = await Service.find({ available: true })
      .sort({ price: 1 });
    
    if (services.length === 0) {
      await ctx.reply(
        '😔 К сожалению, в данный момент нет доступных услуг. Пожалуйста, попробуйте позже.',
        mainMenu()
      );
      return ctx.scene.leave();
    }
    
    await ctx.reply(
      '🐶 *Наши услуги и цены*\n\n' +
      'Выберите услугу, чтобы узнать подробнее:',
      {
        parse_mode: 'Markdown',
        ...servicesKeyboard(services)
      }
    );
  } catch (err) {
    console.error('Ошибка при загрузке услуг:', err);
    await ctx.reply(
      '😔 Произошла ошибка при загрузке услуг. Пожалуйста, попробуйте позже.',
      mainMenu()
    );
    return ctx.scene.leave();
  }
});

// Обработка возврата в главное меню
servicesScene.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Вернулись в главное меню', mainMenu());
  return ctx.scene.leave();
});

// Обработка детальной информации об услуге
servicesScene.action(/^service_(.+)$/, async (ctx) => {
  const serviceId = ctx.match[1];
  
  try {
    const service = await Service.findById(serviceId);
    
    if (!service) {
      await ctx.answerCbQuery('Услуга не найдена');
      return;
    }
    
    // Формируем сообщение с детальной информацией об услуге
    let message = `*${service.name}*\n\n`;
    message += `${service.description}\n\n`;
    message += `💰 *Цена:* ${service.price}₽\n`;
    message += `⏱ *Длительность:* ${service.duration} мин.\n\n`;
    
    if (service.imageUrl) {
      // Если есть изображение, отправляем фото с описанием
      await ctx.replyWithPhoto(
        service.imageUrl,
        {
          caption: message,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📝 Записаться на эту услугу', callback_data: `book_service_${service._id}` }],
              [{ text: '◀️ Назад к списку услуг', callback_data: 'back_to_services' }]
            ]
          }
        }
      );
    } else {
      // Иначе просто отправляем текст
      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📝 Записаться на эту услугу', callback_data: `book_service_${service._id}` }],
              [{ text: '◀️ Назад к списку услуг', callback_data: 'back_to_services' }]
            ]
          }
        }
      );
    }
    
    await ctx.answerCbQuery();
  } catch (err) {
    console.error('Ошибка при получении информации об услуге:', err);
    await ctx.answerCbQuery('Произошла ошибка при получении информации об услуге');
  }
});

// Возврат к списку услуг
servicesScene.action('back_to_services', async (ctx) => {
  try {
    // Получаем все доступные услуги
    const services = await Service.find({ available: true })
      .sort({ price: 1 });
    
    await ctx.editMessageText(
      '🐶 *Наши услуги и цены*\n\n' +
      'Выберите услугу, чтобы узнать подробнее:',
      {
        parse_mode: 'Markdown',
        reply_markup: servicesKeyboard(services).reply_markup
      }
    );
    
    await ctx.answerCbQuery();
  } catch (err) {
    console.error('Ошибка при возврате к списку услуг:', err);
    await ctx.answerCbQuery('Произошла ошибка при загрузке списка услуг');
  }
});

// Запись на конкретную услугу
servicesScene.action(/^book_service_(.+)$/, async (ctx) => {
  const serviceId = ctx.match[1];
  
  try {
    // Добавляем услугу в корзину
    if (!ctx.session.cart) {
      ctx.session.cart = { services: [] };
    }
    
    // Очищаем предыдущие выбранные услуги и добавляем новую
    ctx.session.cart.services = [serviceId];
    
    // Перенаправляем на сцену записи
    await ctx.answerCbQuery('Услуга добавлена в запись');
    ctx.scene.enter('booking-scene');
  } catch (err) {
    console.error('Ошибка при добавлении услуги в запись:', err);
    await ctx.answerCbQuery('Произошла ошибка при добавлении услуги');
  }
});

// Обработка ухода со сцены
servicesScene.leave((ctx) => {
  return ctx.reply('Вы вышли из раздела услуг', mainMenu());
});

module.exports = { servicesScene }; 