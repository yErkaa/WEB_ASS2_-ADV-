const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log('Заголовок Authorization:', authHeader);

    if (!authHeader) {
        console.log('Ошибка: Токен отсутствует');
        return res.status(401).json({ error: 'Нет токена, доступ запрещён' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Полученный токен:', token);

    if (!token) {
        console.log('Ошибка: Токен отсутствует в заголовке');
        return res.status(401).json({ error: 'Нет токена, доступ запрещён' });
    }

    try {
        console.log('Токен перед проверкой:', token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Декодированные данные из токена:', decoded);


        const user = await User.findById(decoded.id);

        if (!user) {
            console.log('Ошибка: Пользователь не найден');
            return res.status(401).json({ error: 'Пользователь не найден' });
        }

        if (user.activeToken !== token) {
            console.log('Ошибка: Сессия истекла, пользователь разлогинен');
            return res.status(401).json({ error: 'Сессия была завершена. Войдите снова.' });
        }


        req.user = user;
        next();
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
};

module.exports = authMiddleware;
