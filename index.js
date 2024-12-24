require('dotenv').config(); // Убедитесь, что эта строка первая
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Лог переменной для проверки
console.log('MONGO_URI:', MONGO_URI);

// Подключение к MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Маршрут проверки
app.get('/', (req, res) => {
    res.send('API работает!');
});

// Запуск сервера
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));

require('dotenv').config();
console.log('Переменные окружения:', process.env);

const postsRoutes = require('./src/routes/posts');
app.use('/posts', postsRoutes);
