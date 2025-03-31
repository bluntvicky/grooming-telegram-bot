require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');
const schedule = require('node-schedule');

// Импорт сцен
const { stage } = require('./scenes');

// Импорт middleware
const { setupSession } = require('./middleware/session');
const { setupAdmin } = require('./middleware/admin');

// Импорт контроллеров
const { setupCommands } = require('./controllers/commands');
const { setupCallbacks } = require('./controllers/callbacks');
const { setupAppointmentReminders } = require('./controllers/reminders');

// Инициализация бота
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Включение middleware для сессий
bot.use(session());
bot.use(setupSession);
bot.use(setupAdmin);
bot.use(stage.middleware());

// Настройка обработчиков команд и колбэков
setupCommands(bot);
setupCallbacks(bot);

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Успешное подключение к MongoDB');
  
  // Запуск планировщика напоминаний
  setupAppointmentReminders(bot);
  
  // Запуск бота
  bot.launch().then(() => {
    console.log('Бот успешно запущен');
  }).catch(err => {
    console.error('Ошибка при запуске бота:', err);
  });
}).catch(err => {
  console.error('Ошибка подключения к MongoDB:', err);
});

// Включение graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 