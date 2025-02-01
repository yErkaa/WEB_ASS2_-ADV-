const rateLimit = new Map();

const rateLimitMiddleware = (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();

    if (!rateLimit.has(userId)) {
        rateLimit.set(userId, []);
    }

    const timestamps = rateLimit.get(userId);

    const updatedTimestamps = timestamps.filter((timestamp) => now - timestamp < 2 * 60 * 1000);
    updatedTimestamps.push(now);

    rateLimit.set(userId, updatedTimestamps);

    if (updatedTimestamps.length > 5) {
        return res.status(429).json({ error: 'Превышен лимит: вы можете создавать не более 5 постов за 2 минуты' });
    }

    next();
};

module.exports = rateLimitMiddleware;
