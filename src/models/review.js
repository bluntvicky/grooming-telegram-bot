const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    telegramId: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  photos: [{
    telegramFileId: String,
    caption: String
  }],
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  approved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индекс для быстрого получения одобренных отзывов
reviewSchema.index({ approved: 1, createdAt: -1 });

// Метод для получения только одобренных отзывов
reviewSchema.statics.getApproved = function(limit = 10) {
  return this.find({ approved: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 