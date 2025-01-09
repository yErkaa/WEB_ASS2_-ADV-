const mongoose = require('mongoose');

// Определение схемы для университета
const UniversitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true }, // Название университета
    address: { type: String, required: true }, // Адрес университета
    description: { type: String, default: "Описание отсутствует" }, // Краткое описание
}, { timestamps: true }); // Добавляет createdAt и updatedAt

// Экспорт модели
module.exports = mongoose.model('University', UniversitySchema);
