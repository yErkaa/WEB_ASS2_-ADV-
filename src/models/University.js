const mongoose = require('mongoose');

const UniversitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true },
    description: { type: String, default: "Описание отсутствует" },
}, { timestamps: true });

module.exports = mongoose.model('University', UniversitySchema);
