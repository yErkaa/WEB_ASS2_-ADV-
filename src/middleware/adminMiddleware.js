const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Доступ запрещён. Только для администраторов.' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Доступ запрещён. Только для администраторов.' });
        }

        next();
    } catch (err) {
        console.error('Ошибка проверки админа:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

module.exports = adminMiddleware;

