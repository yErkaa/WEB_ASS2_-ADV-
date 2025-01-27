require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

const multer = require('multer');
app.use(express.json());
app.use(cors());

// Middleware for logging requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

console.log('MONGO_URI:', MONGO_URI);

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const authRoutes = require('./src/routes/auth');
const postsRoutes = require('./src/routes/posts');
const universitiesRoutes = require('./src/routes/universities');
const commentsRoutes = require('./src/routes/comments');


app.use('/comments', commentsRoutes);
app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);
app.use('/universities', universitiesRoutes);

// Middleware for serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for serving the main page (index.html)
app.get('/', (req, res) => {
    console.log('Serving main page');
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

// Route for serving two-factor authentication page
app.get('/two-factor-auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/two-factor-auth.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
app.use(express.static('public'));

// Обработка всех остальных маршрутов
app.get('*', (req, res) => {
    res.status(404).send('Страница не найдена');
});
