const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const User = require('../models/User');
const sharp = require('sharp');
const fs = require('fs');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;


if (!JWT_SECRET) {
    console.error('JWT_SECRET не настроен в переменных окружения');
    throw new Error('JWT_SECRET не найден. Пожалуйста, настройте его в .env');
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
    },
});
const upload = multer({ storage });


const verifyToken = (authHeader) => {
    if (!authHeader) throw new Error('Нет токена, доступ запрещён');
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET);
};


router.post('/register', upload.single('avatar'), async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let avatarPath = '';
        if (req.file) {
            const resizedImagePath = `uploads/resized-${req.file.filename}`;
            await sharp(req.file.path)
                .resize(128, 128)
                .toFormat('png')
                .toFile(resizedImagePath);

            fs.unlinkSync(req.file.path);
            avatarPath = resizedImagePath.replace(/\\/g, '/');
        }

        const user = new User({
            username: username.trim(),
            password: hashedPassword,
            avatar: avatarPath,
        });

        await user.save();
        res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
    } catch (err) {
        console.error('Ошибка при регистрации:', err);

        // Проверяем ошибку дублирующегося значения
        if (err.message === 'Имя пользователя уже занято') {
            return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
        }

        res.status(500).json({ error: 'Ошибка при регистрации' });
    }
});





router.post('/login', async (req, res) => {
    try {
        console.log('Данные из тела запроса:', req.body);

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            console.log('Пользователь не найден:', username);
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Совпадение паролей:', isMatch);

        if (!isMatch) {
            return res.status(400).json({ error: 'Неверный пароль' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Сгенерированный токен:', token);
        res.json({ token });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ error: 'Ошибка при входе' });
    }
});


router.delete('/user', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        const decoded = verifyToken(authHeader);

        const user = await User.findByIdAndDelete(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        console.log('Пользователь успешно удалён:', user);
        res.json({ message: 'Пользователь успешно удалён' });
    } catch (err) {
        console.error('Ошибка при удалении пользователя:', err.message || err);
        res.status(500).json({ error: err.message || 'Ошибка при удалении пользователя' });
    }
});


router.get('/user', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        const decoded = verifyToken(authHeader);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        console.log('Информация о пользователе отправлена:', user);
        res.json(user);
    } catch (err) {
        console.error('Ошибка при получении информации о пользователе:', err.message || err);
        res.status(500).json({ error: err.message || 'Ошибка сервера' });
    }
});


router.put('/user', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        const decoded = verifyToken(authHeader);
        const { nickname } = req.body;

        if (!nickname) {
            return res.status(400).json({ error: 'Никнейм не может быть пустым' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            { nickname },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        console.log('Никнейм успешно обновлен:', updatedUser);
        res.json({ message: 'Никнейм успешно обновлен', user: updatedUser });
    } catch (err) {
        console.error('Ошибка обновления никнейма:', err.message || err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


module.exports = router;