// Получение списка ID администраторов из .env
const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => Number(id.trim())) : [];

// Middleware для определения, является ли пользователь администратором
const setupAdmin = (ctx, next) => {
  // Проверяем, есть ли id пользователя в списке администраторов
  if (ctx.from && adminIds.includes(ctx.from.id)) {
    // Если пользователь - админ, добавляем флаг в сессию
    if (!ctx.session) ctx.session = {};
    ctx.session.isAdmin = true;
  } else if (ctx.session) {
    // Если пользователь не админ, убеждаемся, что флаг admin = false
    ctx.session.isAdmin = false;
  }

  return next();
};

// Функция middleware для защиты маршрутов администратора
const requireAdmin = (ctx, next) => {
  if (ctx.session && ctx.session.isAdmin) {
    // Пользователь - администратор, разрешаем доступ
    return next();
  } else {
    // Пользователь не администратор, отказываем в доступе
    return ctx.reply('⛔ У вас нет доступа к этой функции.');
  }
};

// Хелпер-функция для проверки, является ли пользователь администратором
const isAdmin = (userId) => {
  return adminIds.includes(Number(userId));
};

module.exports = { 
  setupAdmin, 
  requireAdmin,
  isAdmin
}; 