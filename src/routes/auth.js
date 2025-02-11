const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('JWT_SECRET не настроен в переменных окружения');
    throw new Error('JWT_SECRET не найден. Пожалуйста, настройте его в .env');
}

const upload = multer({ storage: multer.memoryStorage() });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


async function sendEmail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: `"Learning Places" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
        });
        console.log(`Email отправлен на ${to}`);
    } catch (err) {
        console.error(`Ошибка при отправке email: ${err.message}`);
        throw err;
    }
}


const verifyToken = async (req, res, next) => {
    if (!req.headers) {
        console.log('Ошибка: req.headers не определён');
        return res.status(401).json({ error: 'Ошибка сервера: заголовки не получены' });
    }

    const authHeader = req.headers['authorization'];
    console.log('Заголовок Authorization:', authHeader);

    if (!authHeader) {
        return res.status(401).json({ error: 'Нет токена, доступ запрещён' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Нет токена, доступ запрещён' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.activeToken !== token) {
            return res.status(401).json({ error: 'Сессия была завершена. Войдите снова.' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
};



router.post('/register', upload.single('avatar'), async (req, res) => {
    console.log("📩 Полученные данные (req.body):", req.body);
    console.log("📩 Полученный файл (req.file):", req.file);

    if (!req.body.password) {
        return res.status(400).json({ error: 'Пароль не был передан!' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let avatarPath = '';

    if (req.file) {
        const resizedImagePath = `uploads/resized-${Date.now()}-${req.file.originalname}`;
        await sharp(req.file.buffer)
            .resize(128, 128)
            .toFormat('png')
            .toFile(resizedImagePath);
        avatarPath = resizedImagePath.replace(/\\/g, '/');
    }

    const twoFactorCode = crypto.randomInt(100000, 999999).toString();
    const user = new User({
        username,
        password: hashedPassword,
        avatar: avatarPath,
        twoFactorCode,
        twoFactorExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await user.save();

    await sendEmail(
        user.username,
        'Ваш код для двухфакторной аутентификации',
        `Ваш код: ${twoFactorCode}`
    );

    res.status(201).json({
        message: 'Пользователь успешно зарегистрирован. Перенаправляем на страницу двухфакторной аутентификации.',
        redirect: `http://localhost:5000/two-factor-auth?email=${encodeURIComponent(user.username)}`,
    });
});




router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Неверный пароль' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        user.activeToken = token;
        await user.save();

        res.json({ token });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ error: 'Ошибка при входе' });
    }
});

router.post('/logout', verifyToken, async (req, res) => {
    try {
        req.user.activeToken = null;
        await req.user.save();
        res.json({ message: 'Вы успешно вышли из аккаунта' });
    } catch (err) {
        console.error('Ошибка при выходе:', err);
        res.status(500).json({ error: 'Ошибка при выходе' });
    }
});



router.delete('/user', authMiddleware, async (req, res) => {
    try {
        console.log('🔍 Запрос на удаление пользователя:', req.user);

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Ошибка аутентификации' });
        }

        const user = await User.findByIdAndDelete(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        console.log('✅ Пользователь успешно удалён:', user);
        res.json({ message: 'Пользователь успешно удалён' });
    } catch (err) {
        console.error('❌ Ошибка при удалении пользователя:', err.message || err);
        res.status(500).json({ error: 'Ошибка при удалении пользователя' });
    }
});



router.get('/user', verifyToken, async (req, res) => {
    try {
        console.log('🔍 Запрос на загрузку пользователя:', req.user);

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Ошибка аутентификации. Токен недействителен.' });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        if (!user.role) {
            user.role = 'user';
        }

        console.log('✅ Информация о пользователе отправлена:', user);
        res.json(user);
    } catch (err) {
        console.error('❌ Ошибка при получении информации о пользователе:', err.message || err);
        res.status(500).json({ error: 'Ошибка сервера при загрузке пользователя' });
    }
});



router.put('/user', authMiddleware, async (req, res) => {
    try {
        const { nickname } = req.body;
        if (!nickname) {
            return res.status(400).json({ error: 'Никнейм не может быть пустым' });
        }

        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        user.nickname = nickname;
        await user.save();

        res.json({ message: 'Никнейм успешно обновлен', nickname });
    } catch (err) {
        console.error('Ошибка обновления никнейма:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


router.post('/send-code', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }

        const user = await User.findOne({ username: email });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const twoFactorCode = crypto.randomInt(100000, 999999).toString();
        user.twoFactorCode = twoFactorCode;
        user.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendEmail(
            user.username,
            'Ваш код для двухфакторной аутентификации',
            `Ваш код: ${twoFactorCode}`
        );

        res.json({ message: 'Код отправлен на ваш email' });
    } catch (err) {
        console.error('Ошибка при отправке кода:', err);
        res.status(500).json({ error: 'Ошибка при отправке кода' });
    }
});

router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'Email и код обязательны.' });
        }

        const user = await User.findOne({ username: email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
        }

        if (user.twoFactorCode === code && user.twoFactorExpires > new Date()) {
            user.twoFactorCode = null;
            user.twoFactorExpires = null;

            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

            user.activeToken = token;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Код верный. Перенаправляем на главную страницу...',
                token,
                redirect: 'http://localhost:5000/html/index.html'
            });
        } else {
            return res.status(400).json({ success: false, message: 'Неверный или истёкший код.' });
        }
    } catch (err) {
        console.error('Ошибка при проверке кода:', err);
        return res.status(500).json({ success: false, message: 'Ошибка при проверке кода.' });
    }
});



module.exports = router;

