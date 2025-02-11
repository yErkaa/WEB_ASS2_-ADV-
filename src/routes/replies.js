const express = require('express');
const Reply = require('../models/Reply');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

const router = express.Router();

router.post('/comment/:commentId/reply', authMiddleware, async (req, res) => {
    try {
        const { content, postId } = req.body;
        const { commentId } = req.params;
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({ error: 'Ответ не может быть пустым' });
        }

        if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const reply = new Reply({
            postId,
            commentId,
            authorId: userId,
            content,
        });

        await reply.save();
        res.status(201).json(reply);
    } catch (err) {
        console.error('Ошибка создания ответа:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/comment/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        console.log(`🔥 Запрос на загрузку ответов для комментария: ${commentId}`);

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const replies = await Reply.find({ commentId: new mongoose.Types.ObjectId(commentId) })
            .populate('authorId', 'nickname username avatar');

        if (!replies.length) {
            console.log(`⚠️ Ответов нет для комментария ${commentId}`);
        } else {
            console.log(`✅ Найдено ${replies.length} ответов`);
        }

        res.json(replies);
    } catch (err) {
        console.error('❌ Ошибка загрузки ответов:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});




router.post('/:replyId/toggle-like', authMiddleware, async (req, res) => {
    try {
        const { replyId } = req.params;
        const userId = req.user._id;

        const reply = await Reply.findById(replyId);
        if (!reply) return res.status(404).json({ error: 'Ответ не найден' });

        const likeIndex = reply.likes.indexOf(userId);
        if (likeIndex === -1) {
            reply.likes.push(userId);
        } else {
            reply.likes.splice(likeIndex, 1);
        }

        await reply.save();
        res.json({ likesCount: reply.likes.length, liked: likeIndex === -1 });
    } catch (err) {
        console.error('Ошибка при лайке ответа:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.put('/:replyId', authMiddleware, async (req, res) => {
    try {
        const { replyId } = req.params;
        const { content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(replyId)) {
            return res.status(400).json({ error: 'Неверный формат ID ответа' });
        }

        const reply = await Reply.findById(replyId);
        if (!reply) {
            return res.status(404).json({ error: 'Ответ не найден' });
        }

        if (reply.authorId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Вы не можете редактировать этот ответ' });
        }

        reply.content = content;
        await reply.save();

        res.json({ message: 'Ответ успешно обновлен', reply });
    } catch (err) {
        console.error('Ошибка при обновлении ответа:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.delete('/:replyId', authMiddleware, async (req, res) => {
    try {
        const { replyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(replyId)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const reply = await Reply.findById(replyId);
        if (!reply) {
            return res.status(404).json({ error: 'Ответ не найден' });
        }

        if (reply.authorId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Вы не можете удалить этот ответ' });
        }

        await Reply.deleteOne({ _id: replyId });

        res.json({ message: 'Ответ успешно удалён' });
    } catch (err) {
        console.error('Ошибка при удалении ответа:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
