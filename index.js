require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware: проверяет, подключена ли база
const checkDatabaseConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'База данных недоступна. Попробуйте позже.' });
    }
    next();
};
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 2000, // Ожидание подключения к базе - 2 секунды
    socketTimeoutMS: 4500, // Закрытие соединения при таймауте - 4.5 секунды
}).then(() => console.log('✅ MongoDB подключена'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));


// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

console.log('MONGO_URI:', MONGO_URI);

// ✅ Подключение к MongoDB (ТОЛЬКО ОДИН РАЗ)
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Быстрее определяет недоступность базы (5 сек)
    socketTimeoutMS: 4500, // Закрытие соединения при таймауте (4.5 сек)
    autoReconnect: true, // Автоматическое переподключение (опция в старых версиях)
    keepAlive: true, // Поддержка соединения
}).then(() => console.log('✅ MongoDB подключена'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Соединение с MongoDB потеряно. Пробуем переподключиться...');
    setTimeout(() => {
        mongoose.connect(process.env.MONGO_URI)
            .then(() => console.log('✅ Успешное переподключение к MongoDB'))
            .catch(err => console.error('❌ Ошибка при переподключении:', err));
    }, 5000); // Повторное подключение через 5 секунд
});

// Подключаем роуты
const authRoutes = require('./src/routes/auth');
const postsRoutes = require('./src/routes/posts');
const universitiesRoutes = require('./src/routes/universities');
const commentsRoutes = require('./src/routes/comments');
const repliesRoutes = require('./src/routes/replies');
app.use('/replies', repliesRoutes);

// Используем роуты
app.use('/auth', checkDatabaseConnection,authRoutes);
app.use('/posts', checkDatabaseConnection,postsRoutes);
app.use('/universities', checkDatabaseConnection,universitiesRoutes);
app.use('/comments', checkDatabaseConnection, commentsRoutes);

// Подключаем статические файлы
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Проверка состояния базы
app.get('/db-status', async (req, res) => {
    try {
        // Проверяем соединение с базой через команду ping
        await mongoose.connection.db.admin().ping();
        return res.json({ status: 'connected' });
    } catch (error) {
        console.error('❌ Ошибка подключения к базе:', error.message);
        return res.status(503).json({ status: 'disconnected', message: 'База данных отключена.' });
    }
});



// Основные страницы
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/html/index.html')));
app.get('/two-factor-auth', (req, res) => res.sendFile(path.join(__dirname, 'public/html/two-factor-auth.html')));

// Обработчик 404
app.use((req, res) => res.status(404).send('Страница не найдена'));

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Something went wrong!' });
});

// ✅ Запускаем сервер ОДИН раз
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
