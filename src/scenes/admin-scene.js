const { Scenes } = require('telegraf');
const { adminPanelMenu, mainMenu } = require('../utils/keyboards');
const { requireAdmin } = require('../middleware/admin');

// Сцена администраторской панели
const adminScene = new Scenes.BaseScene('admin-scene');

// Middleware для проверки, что пользователь - администратор
adminScene.use(requireAdmin);

// При входе в сцену показываем меню администратора
adminScene.enter(async (ctx) => {
  await ctx.reply(
    '🔧 *Панель администратора*\n\n' +
    'Выберите действие:',
    {
      parse_mode: 'Markdown',
      ...adminPanelMenu()
    }
  );
});

// Обработка добавления временных слотов
adminScene.hears('➕ Добавить слоты', (ctx) => {
  return ctx.scene.enter('admin-add-slots-scene');
});

// Обработка просмотра записей
adminScene.hears('📋 Записи', (ctx) => {
  return ctx.scene.enter('admin-appointments-scene');
});

// Обработка подтверждения отзывов
adminScene.hears('✅ Подтвердить отзывы', (ctx) => {
  return ctx.scene.enter('admin-reviews-scene');
});

// Обработка добавления услуги
adminScene.hears('➕ Добавить услугу', (ctx) => {
  return ctx.scene.enter('admin-add-service-scene');
});

// Обработка возврата в главное меню
adminScene.hears('◀️ Назад в меню', (ctx) => {
  ctx.reply('Вернулись в главное меню', mainMenu());
  return ctx.scene.leave();
});

// Обработка ухода со сцены
adminScene.leave((ctx) => {
  // Ничего не делаем, чтобы избежать дублирования сообщений
});

module.exports = { adminScene }; 