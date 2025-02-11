const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const University = require('../models/University');

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    res.json({ message: 'Добро пожаловать в админ-панель' });
});

router.post('/university', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, address, description } = req.body;
        if (!name || !address || !description) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        const newUniversity = new University({ name, address, description });
        await newUniversity.save();

        res.status(201).json({ message: 'Университет добавлен', university: newUniversity });
    } catch (err) {
        console.error('Ошибка при добавлении университета:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
