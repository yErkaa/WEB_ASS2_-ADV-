const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware для авторизации
const Reply = require('../models/Reply'); // 👈 Добавляем модель

const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;

router.get('/:post_id', async (req, res) => {
    try {
        const { post_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(400).json({ error: 'Неверный формат ID поста' });
        }

        if (!ObjectId.isValid(post_id)) {
            return res.status(400).json({ error: 'Неверный формат ID поста' });
        }

        const comments = await Comment.find({ post_id })
            .populate('author_id', 'nickname username avatar')
            .sort({ createdAt: -1 });

        const formattedComments = comments.map(comment => ({
            ...comment.toObject(),
            repliesCount: comment.repliesCount || 0  // ✅ Гарантируем, что поле передаётся
        }));

        res.json(formattedComments);
        res.json(comments);
    } catch (err) {
        console.error('Ошибка при получении комментариев:', err.message);
        res.status(500).json({ error: 'Ошибка при получении комментариев' });
    }
});

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

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Запрос на удаление комментария с ID:', id);

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ error: 'Комментарий не найден' });
        }

        console.log('ID пользователя из токена:', req.user.id);
        console.log('ID автора комментария:', comment.author_id.toString());

        if (comment.author_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'У вас нет прав для удаления этого комментария' });
        }

        await Comment.deleteOne({ _id: id });
        res.json({ message: 'Комментарий успешно удалён' });
    } catch (err) {
        console.error('Ошибка при удалении комментария:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/:commentId/toggle-like', authMiddleware, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;


        console.log(` Запрос на лайк комментария: /comments/${commentId}/toggle-like`);

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            console.error('❌ Ошибка: Неверный формат ID комментария');
            return res.status(400).json({ error: 'Неверный формат ID комментария' });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            console.error('❌ Ошибка: Комментарий не найден');
            return res.status(404).json({ error: 'Комментарий не найден' });
        }

        const likeIndex = comment.likes.indexOf(userId);
        if (likeIndex === -1) {
            comment.likes.push(userId);
            console.log('✅ Лайк добавлен');
        } else {
            comment.likes.splice(likeIndex, 1);
            console.log('✅ Лайк удален');
        }

        await comment.save();
        res.json({ likesCount: comment.likes.length, liked: likeIndex === -1 });

    } catch (err) {
        console.error('❌ Ошибка при лайке комментария:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/comment/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        console.log(` Запрос на загрузку комментария: ${commentId}`);


        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            console.log(`❌ Неверный формат ID: ${commentId}`);

            return res.status(400).json({ error: 'Неверный формат ID комментария' });
        }

        const comment = await Comment.findById(commentId).populate('author_id', 'nickname username avatar');

        if (!comment) {
            console.log(`⚠️ Комментарий не найден в базе: ${commentId}`);

            return res.status(404).json({ error: 'Комментарий не найден' });
        }

        console.log(`✅ Найден комментарий:`, comment);

        res.json(comment);
    } catch (err) {
        console.error('❌ Ошибка при загрузке комментария:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


module.exports = router;