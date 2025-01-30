const rateLimit = new Map(); // Хранилище запросов

const rateLimitMiddleware = (req, res, next) => {
    const userId = req.user.id; // Предполагается, что пользователь авторизован
    const now = Date.now();

    if (!rateLimit.has(userId)) {
        rateLimit.set(userId, []);
    }

    const timestamps = rateLimit.get(userId);

    // Удаляем старые записи (более 2 минут назад)
    const updatedTimestamps = timestamps.filter((timestamp) => now - timestamp < 2 * 60 * 1000);
    updatedTimestamps.push(now);

    rateLimit.set(userId, updatedTimestamps);

    // Проверяем лимит
    if (updatedTimestamps.length > 5) {
        return res.status(429).json({ error: 'Превышен лимит: вы можете создавать не более 5 постов за 2 минуты' });
    }

    next();
};

module.exports = rateLimitMiddleware;
