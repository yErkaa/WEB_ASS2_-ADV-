const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Заголовок обязателен'] },
    content: { type: String, required: [true, 'Содержимое обязательно'] },
    author: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
