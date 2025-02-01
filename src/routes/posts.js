const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const University = require('../models/University');
const authMiddleware = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;

router.get('/get', async (req, res) => {
    try {

        const allPosts = await Post.find()
            .populate('author', 'nickname username avatar')
            .populate('university', 'name address description')
            .sort({ createdAt: -1 });
        const postsWithComments = await Promise.all(
            allPosts.map(async (post) => {
                const commentCount = await Comment.countDocuments({ post_id: post._id });
                return {
                    ...post.toObject(),
                    commentCount,
                    likes: post.likes || [],
                };
            })
        );

        res.json(postsWithComments);
    } catch (err) {
        console.error('Ошибка при получении постов:', err);
        res.status(500).json({ error: 'Ошибка при получении постов' });
    }
});

router.post('/create', authMiddleware, rateLimitMiddleware, async (req, res) => {
    const { university, title, review, rating } = req.body;

    if (!university || !title || !review || !rating) {
        return res.status(400).json({ error: 'Пожалуйста, заполните все поля' });
    }

    try {
        const universityDoc = await University.findOne({ name: university });
        if (!universityDoc) {
            return res.status(404).json({ error: 'Университет не найден' });
        }

        const post = new Post({
            university: universityDoc._id,
            title,
            content: review,
            rating,
            author: req.user.id,
        });

        await post.save();
        res.status(201).json({ message: 'Пост успешно создан', post });
    } catch (error) {
        console.error('Ошибка создания поста:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const post = await Post.findById(id)
            .populate('author', 'nickname username avatar')
            .populate('university', 'name address description');

        if (!post) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        const comments = await Comment.find({ post_id: id })
            .populate('author_id', 'nickname username avatar')
            .sort({ createdAt: -1 });

        res.json({ post, comments });
    } catch (err) {
        console.error('Ошибка при получении поста:', err);
        res.status(500).json({ error: 'Ошибка при получении поста' });
    }
});

router.post('/:id/toggle-like', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        const hasLiked = Array.isArray(post.likes) && post.likes.includes(userId);
        if (hasLiked) {
            post.likes = post.likes.filter((like) => like.toString() !== userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.json({ message: hasLiked ? 'Лайк удалён' : 'Лайк добавлен', likesCount: post.likes.length });
    } catch (err) {
        console.error('Ошибка при переключении лайка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        if (req.body.university) {
            const university = await University.findOne({ name: req.body.university });
            if (!university) {
                return res.status(404).json({ error: 'Указанный университет не найден' });
            }
            req.body.university = university._id;
        }

        const updatedPost = await Post.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        }).populate('author', 'nickname username avatar').populate('university', 'name address description');

        if (!updatedPost) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        res.json(updatedPost);
    } catch (err) {
        console.error('Ошибка при обновлении поста:', err);
        res.status(400).json({ error: 'Ошибка при обновлении поста' });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'У вас нет прав для удаления этого поста' });
        }

        await post.deleteOne();
        res.json({ message: 'Пост успешно удалён' });
    } catch (err) {
        console.error('Ошибка при удалении поста:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
