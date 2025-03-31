const { Scenes } = require('telegraf');
const Review = require('../models/review');
const { mainMenu } = require('../utils/keyboards');

// Сцена добавления фотографий к отзыву
const reviewPhotoScene = new Scenes.BaseScene('review-photo-scene');

// Проверка на наличие всех необходимых данных
reviewPhotoScene.enter(async (ctx) => {
  if (!ctx.session.reviewRating || !ctx.session.reviewText) {
    await ctx.reply('Произошла ошибка. Пожалуйста, начните процесс добавления отзыва заново.');
    return ctx.scene.leave();
  }
  
  // Инициализируем массив для хранения фотографий, если его еще нет
  if (!ctx.session.reviewPhotos) {
    ctx.session.reviewPhotos = [];
  }
});

// Обработка отмены ввода отзыва
reviewPhotoScene.command('cancel', (ctx) => {
  ctx.reply('Ввод отзыва отменен', mainMenu());
  return ctx.scene.leave();
});

// Обработка пропуска добавления фотографий
reviewPhotoScene.action('skip_photos', async (ctx) => {
  await ctx.answerCbQuery();
  return saveReview(ctx);
});

// Обработка загрузки фотографий
reviewPhotoScene.on('photo', async (ctx) => {
  try {
    // Получаем информацию о фото (берем максимальный размер)
    const photoInfo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photoInfo.file_id;
    
    // Добавляем информацию о фото в массив
    ctx.session.reviewPhotos.push({
      telegramFileId: fileId,
      caption: ctx.message.caption || ''
    });
    
    // Проверяем количество добавленных фото
    const photoCount = ctx.session.reviewPhotos.length;
    
    if (photoCount >= 3) {
      await ctx.reply('Достигнуто максимальное количество фотографий (3).');
      return saveReview(ctx);
    } else {
      // Уведомляем пользователя и предлагаем добавить еще фото
      await ctx.reply(
        `✅ Фотография ${photoCount} из 3 добавлена!\n\n` +
        'Вы можете добавить еще фотографии или завершить добавление отзыва.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Завершить и сохранить отзыв', callback_data: 'finish_review' }]
            ]
          }
        }
      );
    }
  } catch (err) {
    console.error('Ошибка при обработке фотографии:', err);
    await ctx.reply('Произошла ошибка при обработке фотографии. Пожалуйста, попробуйте еще раз.');
  }
});

// Обработка завершения добавления отзыва
reviewPhotoScene.action('finish_review', async (ctx) => {
  await ctx.answerCbQuery();
  return saveReview(ctx);
});

// Обработка текстовых сообщений
reviewPhotoScene.on('text', (ctx) => {
  return ctx.reply(
    'Пожалуйста, отправьте фотографию или нажмите кнопку "Пропустить этот шаг", если не хотите добавлять фото.',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Пропустить этот шаг', callback_data: 'skip_photos' }]
        ]
      }
    }
  );
});

// Обработка любых других типов сообщений
reviewPhotoScene.on('message', (ctx) => {
  return ctx.reply(
    'Пожалуйста, отправьте фотографию или нажмите кнопку "Пропустить этот шаг".',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Пропустить этот шаг', callback_data: 'skip_photos' }]
        ]
      }
    }
  );
});

// Функция для сохранения отзыва
async function saveReview(ctx) {
  try {
    // Создаем новый отзыв в базе данных
    const newReview = new Review({
      user: {
        telegramId: ctx.from.id,
        name: ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : '')
      },
      text: ctx.session.reviewText,
      rating: ctx.session.reviewRating,
      photos: ctx.session.reviewPhotos,
      approved: false // По умолчанию отзывы требуют одобрения администратором
    });
    
    await newReview.save();
    
    // Уведомляем пользователя
    await ctx.reply(
      '✅ *Спасибо за ваш отзыв!*\n\n' +
      'Ваш отзыв будет опубликован после проверки администратором.\n\n' +
      'Мы ценим ваше мнение и стремимся стать еще лучше!',
      {
        parse_mode: 'Markdown',
        ...mainMenu()
      }
    );
    
    // Уведомляем администраторов о новом отзыве
    const adminIds = process.env.ADMIN_IDS.split(',').map(id => Number(id.trim()));
    
    for (const adminId of adminIds) {
      try {
        await ctx.telegram.sendMessage(
          adminId,
          `📢 *Поступил новый отзыв!*\n\n` +
          `⭐ Оценка: ${newReview.rating}/5\n` +
          `👤 Клиент: ${newReview.user.name}\n` +
          `📝 Текст: ${newReview.text}\n\n` +
          `${newReview.photos.length > 0 ? '📷 К отзыву прикреплены фотографии.' : ''}`,
          { parse_mode: 'Markdown' }
        );
      } catch (notifyError) {
        console.error(`Не удалось уведомить администратора ${adminId}:`, notifyError);
      }
    }
    
    // Очищаем данные отзыва в сессии
    ctx.session.reviewRating = null;
    ctx.session.reviewText = null;
    ctx.session.reviewPhotos = [];
    
    return ctx.scene.leave();
  } catch (err) {
    console.error('Ошибка при сохранении отзыва:', err);
    await ctx.reply(
      '😔 Произошла ошибка при сохранении отзыва. Пожалуйста, попробуйте позже.',
      mainMenu()
    );
    return ctx.scene.leave();
  }
}

module.exports = { reviewPhotoScene }; 