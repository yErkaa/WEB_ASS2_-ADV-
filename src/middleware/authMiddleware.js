const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Декодированные данные из токена:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        res.status(401).json({ error: 'Неверный токен' });
    }
};

module.exports = authMiddleware;
