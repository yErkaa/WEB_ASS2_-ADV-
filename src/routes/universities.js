const express = require('express');
const router = express.Router();
const University = require('../models/University'); // Подключаем модель University

// Создать новый университет
router.post('/', async (req, res) => {
    try {
        const { name, address, coordinates, description } = req.body;
        const university = new University({ name, address, coordinates, description });
        await university.save();
        res.status(201).json({ message: 'Университет успешно создан', university });
    } catch (err) {
        console.error('Ошибка при создании университета:', err);
        res.status(500).json({ error: 'Ошибка при создании университета' });
    }
});

// Получить список всех университетов
router.get('/', async (req, res) => {
    try {
        const universities = await University.find();
        res.json(universities);
    } catch (err) {
        console.error('Ошибка при получении университетов:', err);
        res.status(500).json({ error: 'Ошибка при получении университетов' });
    }
});

// Получить университет по ID
router.get('/:id', async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        if (!university) {
            return res.status(404).json({ error: 'Университет не найден' });
        }
        res.json(university);
    } catch (err) {
        console.error('Ошибка при получении университета:', err);
        res.status(500).json({ error: 'Ошибка при получении университета' });
    }
});

// Обновить университет по ID
router.put('/:id', async (req, res) => {
    try {
        const { name, address, coordinates, description } = req.body;
        const university = await University.findByIdAndUpdate(
            req.params.id,
            { name, address, coordinates, description },
            { new: true }
        );
        if (!university) {
            return res.status(404).json({ error: 'Университет не найден' });
        }
        res.json({ message: 'Университет успешно обновлен', university });
    } catch (err) {
        console.error('Ошибка при обновлении университета:', err);
        res.status(500).json({ error: 'Ошибка при обновлении университета' });
    }
});

// Удалить университет по ID
router.delete('/:id', async (req, res) => {
    try {
        const university = await University.findByIdAndDelete(req.params.id);
        if (!university) {
            return res.status(404).json({ error: 'Университет не найден' });
        }
        res.json({ message: 'Университет успешно удален' });
    } catch (err) {
        console.error('Ошибка при удалении университета:', err);
        res.status(500).json({ error: 'Ошибка при удалении университета' });
    }
});

module.exports = router;
