const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');

const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;

// Получить все посты
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создать новый пост
router.post('/', async (req, res) => {
    try {
        const newPost = new Post(req.body);
        await newPost.save();
        res.json(newPost);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Ошибка при создании поста' });
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
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
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
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Неверный формат ID' });
        }

        const deletedPost = await Post.findByIdAndDelete(req.params.id);

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
