require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Подключение multer для обработки форм
const multer = require('multer');
app.use(express.json());
app.use(cors()); // Разрешаем все CORS-запросы

// Настройка статической папки для загрузок
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Лог переменных
console.log('MONGO_URI:', MONGO_URI);

// Подключение к MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Подключение маршрутов
const authRoutes = require('./src/routes/auth');
const postsRoutes = require('./src/routes/posts');
const universitiesRoutes = require('./src/routes/universities');

app.use('/auth', authRoutes); // Маршруты для авторизации
app.use('/posts', postsRoutes); // Маршруты для постов
app.use('/universities', universitiesRoutes); // Маршруты для университетов

// Проверочный маршрут
app.get('/', (req, res) => {
    res.send('API работает!');
});

// Запуск сервера
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
