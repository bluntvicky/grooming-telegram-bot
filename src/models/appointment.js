const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: {
    telegramId: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  petInfo: {
    name: String,
    breed: {
      type: String,
      required: true
    },
    size: String,
    notes: String
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  }],
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
});

// Обновление даты изменения перед сохранением
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Виртуальное свойство для отображаемой даты и времени
appointmentSchema.virtual('formattedDateTime').get(function() {
  // Реализуется при получении данных с populating timeSlot
  if (this.timeSlot && this.timeSlot.startTime) {
    const date = this.timeSlot.startTime;
    return `${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return 'Время не указано';
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 