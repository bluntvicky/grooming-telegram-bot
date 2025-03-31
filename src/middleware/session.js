// Middleware для инициализации сессии пользователя
const setupSession = (ctx, next) => {
  // Если сессия не инициализирована, создаем её
  if (!ctx.session) {
    ctx.session = {};
  }
  
  // Если данные пользователя не инициализированы, инициализируем их
  if (!ctx.session.user) {
    ctx.session.user = {
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      isRegistered: false,
      phone: null,
      petInfo: {}
    };
  }
  
  // Если корзина не инициализирована, инициализируем её
  if (!ctx.session.cart) {
    ctx.session.cart = {
      services: [],
      selectedTimeSlot: null
    };
  }

  // Для отслеживания шагов в сценариях
  if (!ctx.session.appointmentStep) {
    ctx.session.appointmentStep = null;
  }

  // Для хранения выбранных опций в формах
  if (!ctx.session.formData) {
    ctx.session.formData = {};
  }

  // Для временного хранения фотографий при добавлении отзыва
  if (!ctx.session.reviewPhotos) {
    ctx.session.reviewPhotos = [];
  }

  return next();
};

module.exports = { setupSession }; 