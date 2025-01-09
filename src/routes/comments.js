const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware для авторизации

const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;

// Получение всех комментариев к посту
router.get('/:post_id', async (req, res) => {
    try {
        const { post_id } = req.params;

        if (!ObjectId.isValid(post_id)) {
            return res.status(400).json({ error: 'Неверный формат ID поста' });
        }

        const comments = await Comment.find({ post_id })
            .populate('author_id', 'nickname username avatar') // Подгружаем данные автора
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (err) {
        console.error('Ошибка при получении комментариев:', err.message);
        res.status(500).json({ error: 'Ошибка при получении комментариев' });
    }
});

// Создание нового комментария
router.post('/create', authMiddleware, async (req, res) => {
    const { post_id, content } = req.body;

    if (!post_id || !content) {
        console.error('Ошибка: отсутствуют обязательные данные.');
        return res.status(400).json({ error: 'Пожалуйста, заполните все поля' });
    }

    try {
        const post = await Post.findById(post_id);
        if (!post) {
            console.error('Ошибка: Пост не найден.');
            return res.status(404).json({ error: 'Пост не найден' });
        }

        const comment = new Comment({
            post_id,
            content,
            author_id: req.user.id,
        });

        await comment.save();
        console.log('Комментарий успешно создан:', comment);
        res.status(201).json({ message: 'Комментарий успешно создан', comment });
    } catch (err) {
        console.error('Ошибка при создании комментария:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// Обновление комментария
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Неверный формат ID комментария' });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ error: 'Комментарий не найден' });
        }

        if (comment.author_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Вы не можете редактировать этот комментарий' });
        }

        comment.content = content;
        await comment.save();

        res.json({ message: 'Комментарий успешно обновлен', comment });
    } catch (err) {
        console.error('Ошибка при обновлении комментария:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление комментария
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ error: 'Комментарий не найден' });
        }

        // Проверяем, что пользователь является автором комментария
        if (comment.author_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'У вас нет прав для удаления этого комментария' });
        }

        // Удаляем комментарий
        await Comment.deleteOne({ _id: id });

        res.json({ message: 'Комментарий успешно удалён' });
    } catch (err) {
        console.error('Ошибка при удалении комментария:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
