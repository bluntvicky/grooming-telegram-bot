const { Scenes } = require('telegraf');
const { mainMenu } = require('../utils/keyboards');

// Сцена ввода текста отзыва
const reviewTextScene = new Scenes.BaseScene('review-text-scene');

// При входе в сцену запрашиваем текст отзыва
reviewTextScene.enter(async (ctx) => {
  // Проверяем, установлен ли рейтинг
  if (!ctx.session.reviewRating) {
    await ctx.reply('Сначала нужно поставить оценку. Пожалуйста, вернитесь к выбору рейтинга.');
    return ctx.scene.enter('review-rating-scene');
  }
  
  await ctx.reply(
    '📝 *Оставить отзыв*\n\n' +
    `Вы поставили оценку: ${ctx.session.reviewRating}⭐\n\n` +
    'Теперь напишите текст вашего отзыва:',
    { parse_mode: 'Markdown' }
  );
});

// Обработка отмены ввода отзыва
reviewTextScene.command('cancel', (ctx) => {
  ctx.reply('Ввод отзыва отменен', mainMenu());
  return ctx.scene.leave();
});

// Обработка текстового сообщения как текста отзыва
reviewTextScene.on('text', async (ctx) => {
  const reviewText = ctx.message.text.trim();
  
  // Проверяем длину текста
  if (reviewText.length < 10) {
    return ctx.reply('Пожалуйста, напишите более подробный отзыв (минимум 10 символов).');
  }
  
  if (reviewText.length > 500) {
    return ctx.reply('Отзыв слишком длинный. Пожалуйста, сократите его до 500 символов.');
  }
  
  // Сохраняем текст отзыва
  ctx.session.reviewText = reviewText;
  
  // Переходим к следующему шагу - добавление фото (опционально)
  await ctx.reply(
    '📷 *Фотографии к отзыву*\n\n' +
    'Хотите прикрепить фотографии к вашему отзыву?\n\n' +
    'Вы можете отправить до 3 фотографий или пропустить этот шаг.',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Пропустить этот шаг', callback_data: 'skip_photos' }]
        ]
      }
    }
  );
  
  // Переходим к сцене добавления фото
  return ctx.scene.enter('review-photo-scene');
});

// Обработка любого другого типа сообщения
reviewTextScene.on('message', (ctx) => {
  return ctx.reply('Пожалуйста, отправьте текстовое сообщение для вашего отзыва.');
});

module.exports = { reviewTextScene }; 