const { Scenes } = require('telegraf');

// Импорт сцен
const { servicesScene } = require('./services-scene');
const { timeSlotsScene } = require('./timeslots-scene');
const { bookingScene } = require('./booking-scene');
const { appointmentServicesScene } = require('./appointment-services-scene');
const { appointmentContactScene } = require('./appointment-contact-scene');
const { appointmentPetInfoScene } = require('./appointment-pet-info-scene');
const { appointmentConfirmScene } = require('./appointment-confirm-scene');
const { reviewsScene } = require('./reviews-scene');
const { reviewRatingScene } = require('./review-rating-scene');
const { reviewTextScene } = require('./review-text-scene');
const { reviewPhotoScene } = require('./review-photo-scene');
const { adminScene } = require('./admin-scene');
const { adminAddSlotsScene } = require('./admin-add-slots-scene');
const { adminAppointmentsScene } = require('./admin-appointments-scene');
const { adminReviewsScene } = require('./admin-reviews-scene');
const { adminAddServiceScene } = require('./admin-add-service-scene');

// Создаем Stage с зарегистрированными сценами
const stage = new Scenes.Stage([
  servicesScene,
  timeSlotsScene,
  bookingScene,
  appointmentServicesScene,
  appointmentContactScene,
  appointmentPetInfoScene,
  appointmentConfirmScene,
  reviewsScene,
  reviewRatingScene,
  reviewTextScene,
  reviewPhotoScene,
  adminScene,
  adminAddSlotsScene,
  adminAppointmentsScene,
  adminReviewsScene,
  adminAddServiceScene
]);

module.exports = { stage }; 