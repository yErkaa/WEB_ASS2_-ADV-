const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization'); // Получаем заголовок Authorization
    console.log('Заголовок Authorization:', authHeader); // Логируем заголовок

    if (!authHeader) {
        console.log('Ошибка: Токен отсутствует');
        return res.status(401).json({ error: 'Нет токена, доступ запрещён' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Полученный токен:', token); // Логируем токен

    if (!token) {
        console.log('Ошибка: Токен отсутствует в заголовке');
        return res.status(401).json({ error: 'Нет токена, доступ запрещён' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Верифицируем токен
        console.log('Декодированные данные из токена:', decoded); // Логируем данные из токена
        req.user = decoded; // Сохраняем декодированные данные в объект запроса
        next(); // Передаём управление следующему middleware
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        res.status(401).json({ error: 'Неверный токен' });
    }
};

module.exports = authMiddleware; // Экспортируем функцию
