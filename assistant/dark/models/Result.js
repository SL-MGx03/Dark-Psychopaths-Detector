const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  nickname: { type: String, required: true, trim: true },
  sessionId: { type: String, required: true },
  scores: {
    machiavellianism: { type: Number, required: true },
    narcissism: { type: Number, required: true },
    psychopathy: { type: Number, required: true }
  },
  report: {
    specimen_type: String,
    neural_breakdown: String,
    dark_future: String,
    summary: String
  },
  fullText: { type: String },
  answers: { type: [Number] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);
