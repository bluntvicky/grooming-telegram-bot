const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  createdBy: {
    type: Number, // Telegram user ID администратора
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индекс для быстрого поиска свободных слотов
timeSlotSchema.index({ isBooked: 1, startTime: 1 });

// Виртуальное свойство - доступность слота
timeSlotSchema.virtual('isAvailable').get(function() {
  return !this.isBooked && this.startTime > new Date();
});

// Метод для проверки, не истек ли срок слота
timeSlotSchema.methods.isExpired = function() {
  return this.startTime < new Date();
};

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

module.exports = TimeSlot; 