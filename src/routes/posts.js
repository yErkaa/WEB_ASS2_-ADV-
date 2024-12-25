const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/authMiddleware'); // Подключаем middleware

const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;

// Получить все посты
router.get('/get', async (req, res) => {
    try {
        console.log('Запрос на получение постов:', req.headers);
        const posts = await Post.find().populate('author', 'nickname username avatar');

        console.log('Найденные посты:', posts);
        res.json(posts);
    } catch (err) {
        console.error('Ошибка при получении постов:', err);
        res.status(500).json({ error: 'Ошибка при получении постов' });
    }
});




// Создать новый пост
router.post('/create', authMiddleware, async (req, res) => {
    console.log('Данные из запроса:', req.body);
    console.log('Пользователь из токена:', req.user);

    const { university, title, review, rating } = req.body;

    if (!university || !title || !review || !rating) {
        return res.status(400).json({ error: 'Пожалуйста, заполните все поля' });
    }

    try {
        const post = new Post({
            university,
            title,
            content: review,
            rating,
            author: req.user.id,
        });
        await post.save();
        console.log('Пост успешно создан:', post);
        res.status(201).json({ message: 'Пост успешно создан', post });
    } catch (error) {
        console.error('Ошибка создания поста:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить пост по ID
router.get('/:id', async (req, res) => {
    try {
        console.log('ID запроса:', req.params.id);
        console.log('Проверка ObjectId.isValid:', ObjectId.isValid(req.params.id));

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        res.json(post);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить пост
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true } // { new: true } возвращает обновленный объект
        );

        if (!updatedPost) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        res.json(updatedPost);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Ошибка при обновлении поста' });
    }
});

// Удалить пост
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const deletedPost = await Post.findByIdAndDelete(id);

        if (!deletedPost) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        res.json({ message: 'Пост удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
