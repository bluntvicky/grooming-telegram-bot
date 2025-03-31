const { Scenes } = require('telegraf');
const Review = require('../models/review');
const { mainMenu, paginationKeyboard, ratingKeyboard } = require('../utils/keyboards');

// Сцена просмотра и добавления отзывов
const reviewsScene = new Scenes.BaseScene('reviews-scene');

// При входе в сцену показываем список отзывов
reviewsScene.enter(async (ctx) => {
  try {
    // Получаем отзывы (только одобренные)
    const reviews = await Review.getApproved(10);
    
    if (reviews.length === 0) {
      // Если нет отзывов, предлагаем оставить первый
      await ctx.reply(
        '⭐ *Отзывы*\n\n' +
        'У нас пока нет отзывов. Будьте первым, кто оставит отзыв о нашей работе!',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✏️ Оставить отзыв', callback_data: 'leave_review' }],
              [{ text: '◀️ Назад в меню', callback_data: 'back_to_main' }]
            ]
          }
        }
      );
    } else {
      // Показываем первую страницу отзывов
      await showReviewsPage(ctx, reviews, 1);
    }
  } catch (err) {
    console.error('Ошибка при загрузке отзывов:', err);
    await ctx.reply(
      '😔 Произошла ошибка при загрузке отзывов. Пожалуйста, попробуйте позже.',
      mainMenu()
    );
    return ctx.scene.leave();
  }
});

// Функция для отображения страницы с отзывами
async function showReviewsPage(ctx, reviews, page) {
  const itemsPerPage = 3;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const reviewsToShow = reviews.slice(startIndex, endIndex);
  
  let messageText = '⭐ *Отзывы наших клиентов*\n\n';
  
  for (const review of reviewsToShow) {
    messageText += `*${review.user.name}*: ${review.rating}⭐\n`;
    messageText += `${review.text}\n\n`;
  }
  
  // Добавляем кнопки навигации и добавления отзыва
  const keyboard = {
    inline_keyboard: [
      [{ text: '✏️ Оставить свой отзыв', callback_data: 'leave_review' }],
      ...paginationKeyboard(reviews, page, itemsPerPage, 'reviews').reply_markup.inline_keyboard
    ]
  };
  
  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(messageText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } else {
      await ctx.reply(messageText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    }
  } catch (err) {
    console.error('Ошибка при отображении страницы отзывов:', err);
  }
}

// Обработка навигации по отзывам
reviewsScene.action(/^reviews_prev_(\d+)$/, async (ctx) => {
  const currentPage = parseInt(ctx.match[1]);
  const newPage = currentPage - 1;
  
  try {
    const reviews = await Review.getApproved(20);
    await showReviewsPage(ctx, reviews, newPage);
    await ctx.answerCbQuery();
  } catch (err) {
    console.error('Ошибка при навигации по отзывам:', err);
    await ctx.answerCbQuery('Ошибка при загрузке отзывов');
  }
});

reviewsScene.action(/^reviews_next_(\d+)$/, async (ctx) => {
  const currentPage = parseInt(ctx.match[1]);
  const newPage = currentPage + 1;
  
  try {
    const reviews = await Review.getApproved(20);
    await showReviewsPage(ctx, reviews, newPage);
    await ctx.answerCbQuery();
  } catch (err) {
    console.error('Ошибка при навигации по отзывам:', err);
    await ctx.answerCbQuery('Ошибка при загрузке отзывов');
  }
});

// Обработка возврата в главное меню
reviewsScene.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Вернулись в главное меню', mainMenu());
  return ctx.scene.leave();
});

// Обработка запроса на добавление отзыва
reviewsScene.action('leave_review', async (ctx) => {
  await ctx.answerCbQuery();
  
  // Очищаем предыдущие временные данные для отзыва
  ctx.session.reviewRating = null;
  ctx.session.reviewPhotos = [];
  
  // Запрашиваем рейтинг
  await ctx.reply(
    '⭐ *Оставить отзыв*\n\n' +
    'Оцените нашу работу от 1 до 5 звезд:',
    {
      parse_mode: 'Markdown',
      ...ratingKeyboard()
    }
  );
  
  // Переходим к сцене выбора рейтинга
  await ctx.scene.enter('review-rating-scene');
});

// Обработка ухода со сцены
reviewsScene.leave((ctx) => {
  return ctx.reply('Вы вышли из раздела отзывов', mainMenu());
});

module.exports = { reviewsScene }; 