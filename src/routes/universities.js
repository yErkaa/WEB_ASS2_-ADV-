const express = require('express');
const University = require('../models/University');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, address, description } = req.body;

        if (!name || !address || !description) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        const university = new University({ name, address, description });
        await university.save();

        res.status(201).json({ message: 'Университет успешно добавлен', university });
    } catch (err) {
        console.error('Ошибка при добавлении университета:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


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

router.get('/', async (req, res) => {
    try {
        const universities = await University.find();
        res.json(universities);
    } catch (err) {
        console.error('Ошибка при получении университетов:', err);
        res.status(500).json({ error: 'Ошибка при получении университетов' });
    }
});

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
