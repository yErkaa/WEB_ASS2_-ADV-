const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Определение схемы пользователя
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    nickname: { type: String, default: '' } // Добавлено поле для никнейма
}, { timestamps: true });


// Хэшируем пароль перед сохранением
UserSchema.pre('save', async function (next) {
    // Если поле "password" не изменено, пропускаем хэширование
    if (!this.isModified('password')) {
        return next();
    }

    // Проверяем, что пароль - это текст, а не уже хэшированный
    if (this.password.startsWith('$2a$10$')) {
        console.log('Пароль уже хэширован, пропускаем хэширование:', this.password);
        return next(); // Если пароль уже хэширован, ничего не делаем
    }

    try {
        console.log('Пароль перед хэшированием:', this.password);
        this.password = await bcrypt.hash(this.password, 10); // Хэшируем текстовый пароль
        console.log('Хэшированный пароль:', this.password);
        next();
    } catch (error) {
        next(error);
    }
});


// Обработка ошибок при сохранении
UserSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Имя пользователя уже занято'));
    } else {
        next(error);
    }
});

// Метод для проверки пароля
UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Экспорт модели
module.exports = mongoose.model('User', UserSchema);
