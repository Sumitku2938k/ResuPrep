const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['tech', 'business', 'creative', 'fresher'],
      default: 'tech',
    },
    previewConfig: {
      accentColor: { type: String, default: '#2563EB' },
      layout: { type: String, default: 'modern' },
      fontFamily: { type: String, default: 'Plus Jakarta Sans' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);
