require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();


const multer = require('multer');
app.use(express.json());
app.use(cors());


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


app.get('/', (req, res) => {
    res.send('API работает!');
});


app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
