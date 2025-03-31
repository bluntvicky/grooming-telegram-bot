const { mainMenu, adminMenu } = require('../utils/keyboards');
const { isAdmin } = require('../middleware/admin');

// Настройка обработчиков команд
const setupCommands = (bot) => {
  // Команда /start - начало работы с ботом
  bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    
    // Приветствие пользователя
    await ctx.reply(
      `👋 Добро пожаловать, ${firstName}!\n\n` +
      `Это бот грумминг-салона "Пушистый друг" 🐶✨\n\n` +
      `Здесь вы можете посмотреть наши услуги, цены, доступное время для записи, ` +
      `а также записаться на груминг для вашего питомца и оставить отзыв.`,
      isAdmin(userId) ? adminMenu() : mainMenu()
    );
  });

  // Команда /menu - показать главное меню
  bot.command('menu', async (ctx) => {
    const userId = ctx.from.id;
    await ctx.reply(
      '📜 Главное меню:',
      isAdmin(userId) ? adminMenu() : mainMenu()
    );
  });

  // Команда /help - помощь по использованию бота
  bot.command('help', async (ctx) => {
    await ctx.reply(
      '🔍 *Помощь по использованию бота*\n\n' +
      'Этот бот позволяет:\n' +
      '• Узнать о наших услугах и ценах\n' +
      '• Посмотреть свободное время для записи\n' +
      '• Записаться на груминг\n' +
      '• Посмотреть и оставить отзывы\n\n' +
      'Используйте кнопки меню для навигации или следующие команды:\n' +
      '/start - Запустить бота\n' +
      '/menu - Показать главное меню\n' +
      '/services - Услуги и цены\n' +
      '/booking - Записаться\n' +
      '/reviews - Отзывы\n' +
      '/contacts - Контактная информация',
      { parse_mode: 'Markdown' }
    );
  });

  // Команда /services - показать услуги и цены
  bot.command('services', (ctx) => {
    ctx.scene.enter('services-scene');
  });

  // Команда /booking - записаться на груминг
  bot.command('booking', (ctx) => {
    ctx.scene.enter('booking-scene');
  });

  // Команда /timeslots - показать доступное время
  bot.command('timeslots', (ctx) => {
    ctx.scene.enter('timeslots-scene');
  });

  // Команда /reviews - показать отзывы
  bot.command('reviews', (ctx) => {
    ctx.scene.enter('reviews-scene');
  });

  // Команда /admin - админ-панель
  bot.command('admin', (ctx) => {
    if (ctx.session && ctx.session.isAdmin) {
      ctx.scene.enter('admin-scene');
    } else {
      ctx.reply('⛔ У вас нет доступа к этой функции.');
    }
  });

  // Обработка текстовых сообщений для навигации
  bot.hears('🐶 Услуги и цены', (ctx) => {
    ctx.scene.enter('services-scene');
  });

  bot.hears('📅 Доступное время', (ctx) => {
    ctx.scene.enter('timeslots-scene');
  });

  bot.hears('📝 Записаться', (ctx) => {
    ctx.scene.enter('booking-scene');
  });

  bot.hears('⭐ Отзывы', (ctx) => {
    ctx.scene.enter('reviews-scene');
  });

  bot.hears('❓ О нас', (ctx) => {
    ctx.reply(
      '*О нашем груминг-салоне "Пушистый друг"* 🐶✨\n\n' +
      'Мы предлагаем профессиональные услуги груминга для собак всех пород и размеров!\n\n' +
      'Наши мастера-грумеры имеют многолетний опыт и сертификаты профессиональной подготовки. ' +
      'Мы используем только качественную косметику и современное оборудование.\n\n' +
      'Салон работает с 2018 года и имеет более 1000 довольных клиентов и их питомцев!\n\n' +
      'Ждем вас и вашего питомца в нашем салоне! ❤️',
      { parse_mode: 'Markdown' }
    );
  });

  bot.hears('📞 Контакты', (ctx) => {
    ctx.reply(
      '*Контактная информация* 📞\n\n' +
      '🏢 *Адрес:* ул. Пушистая, д. 15\n' +
      '📱 *Телефон:* +7 (999) 123-45-67\n' +
      '🕙 *Режим работы:* ежедневно с 10:00 до 20:00\n' +
      '🌐 *Сайт:* www.pushdog.ru\n' +
      '📧 *Email:* info@pushdog.ru\n\n' +
      '🚗 Есть бесплатная парковка для клиентов',
      { parse_mode: 'Markdown' }
    );
  });

  // Админ-меню
  bot.hears('🔧 Админ-панель', (ctx) => {
    if (ctx.session && ctx.session.isAdmin) {
      ctx.scene.enter('admin-scene');
    } else {
      ctx.reply('⛔ У вас нет доступа к этой функции.');
    }
  });
};

module.exports = { setupCommands }; 