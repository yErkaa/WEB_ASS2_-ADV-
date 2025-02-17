const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    nickname: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },  // Добавлено поле role
    activeToken: { type: String, default: null },
    twoFactorCode: { type: String, default: null },
    twoFactorExpires: { type: Date, default: null }
}, { timestamps: true });


UserSchema.pre('save', async function (next) {

    if (!this.isModified('password')) {
        return next();
    }

    if (this.password.startsWith('$2a$10$')) {
        console.log('Пароль уже хэширован, пропускаем хэширование:', this.password);
        return next();
    }

    try {
        console.log('Пароль перед хэшированием:', this.password);
        this.password = await bcrypt.hash(this.password, 10);
        console.log('Хэшированный пароль:', this.password);
        next();
    } catch (error) {
        next(error);
    }
});


UserSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Имя пользователя уже занято'));
    } else {
        next(error);
    }
});


UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};


module.exports = mongoose.model('User', UserSchema);