const schedule = require('node-schedule');
const Appointment = require('../models/appointment');
const { formatDateTime } = require('../utils/dateHelpers');

/**
 * Настройка планировщика отправки напоминаний
 * @param {Object} bot - Экземпляр бота Telegraf
 */
const setupAppointmentReminders = (bot) => {
  // Запускаем проверку каждые 5 минут
  schedule.scheduleJob('*/5 * * * *', async () => {
    try {
      const now = new Date();
      
      // Находим все подтвержденные записи, для которых не отправлено напоминание
      // и время записи наступит через 1.5 часа или меньше
      const oneAndHalfHoursFromNow = new Date(now.getTime() + 90 * 60 * 1000); // 90 минут
      const appointments = await Appointment.find({
        status: 'confirmed',
        reminderSent: false,
      }).populate({
        path: 'timeSlot',
        match: {
          startTime: { $gt: now, $lte: oneAndHalfHoursFromNow }
        }
      }).populate('services');
      
      // Отправляем напоминания и обновляем статус
      for (const appointment of appointments) {
        // Пропускаем записи, у которых нет временного слота или временной слот не попадает в диапазон
        if (!appointment.timeSlot) continue;
        
        try {
          // Формируем список услуг для напоминания
          let servicesList = '';
          if (appointment.services && appointment.services.length > 0) {
            servicesList = appointment.services.map(service => `• ${service.name}`).join('\n');
          }
          
          // Отправляем напоминание
          await bot.telegram.sendMessage(
            appointment.user.telegramId,
            `⏰ *Напоминание о записи*\n\n` +
            `Здравствуйте, ${appointment.user.name}!\n\n` +
            `Напоминаем, что сегодня в ${new Date(appointment.timeSlot.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} ` +
            `у вас запись на груминг в наш салон "Пушистый друг".\n\n` +
            `Услуги:\n${servicesList}\n\n` +
            `🏠 Адрес: ул. Пушистая, д. 15\n` +
            `🐶 Питомец: ${appointment.petInfo.breed}\n\n` +
            `Если у вас изменились планы, пожалуйста, сообщите нам заранее по телефону +7 (999) 123-45-67.\n\n` +
            `Ждём вас и вашего питомца! 🐾`,
            { parse_mode: 'Markdown' }
          );
          
          // Отмечаем, что напоминание отправлено
          appointment.reminderSent = true;
          await appointment.save();
          
          console.log(`Отправлено напоминание для записи ID: ${appointment._id}`);
        } catch (error) {
          console.error(`Ошибка при отправке напоминания для записи ID: ${appointment._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке напоминаний:', error);
    }
  });
  
  console.log('Планировщик напоминаний запущен');
};

module.exports = { setupAppointmentReminders }; 