require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Ожидание подключения к базе (5 сек)
    socketTimeoutMS: 45000, // Таймаут соединения (45 сек)
})
    .then(() => console.log('✅ MongoDB подключена'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Соединение с MongoDB потеряно. Пробуем переподключиться...');
    setTimeout(() => {
        mongoose.connect(process.env.MONGO_URI)
            .then(() => console.log('✅ Успешное переподключение к MongoDB'))
            .catch(err => console.error('❌ Ошибка при переподключении:', err));
    }, 5000);
});

mongoose.connection.on('error', err => {
    console.error('⚠️ Ошибка MongoDB:', err);
});

const checkDatabaseConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'База данных недоступна. Попробуйте позже.' });
    }
    next();
};

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

const adminRoutes = require('./src/routes/admin');
const authRoutes = require('./src/routes/auth');
const postsRoutes = require('./src/routes/posts');
const universitiesRoutes = require('./src/routes/universities');
const commentsRoutes = require('./src/routes/comments');
const repliesRoutes = require('./src/routes/replies');

app.use('/universities', universitiesRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', checkDatabaseConnection, authRoutes);
app.use('/posts', checkDatabaseConnection, postsRoutes);
app.use('/universities', checkDatabaseConnection, universitiesRoutes);
app.use('/comments', checkDatabaseConnection, commentsRoutes);
app.use('/replies', checkDatabaseConnection, repliesRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/db-status', async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        return res.json({ status: 'connected' });
    } catch (error) {
        console.error('❌ Ошибка подключения к базе:', error.message);
        return res.status(503).json({ status: 'disconnected', message: 'База данных отключена.' });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/html/index.html')));
app.get('/two-factor-auth', (req, res) => res.sendFile(path.join(__dirname, 'public/html/two-factor-auth.html')));

app.use((req, res) => res.status(404).send('Страница не найдена'));

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Что-то пошло не так!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
