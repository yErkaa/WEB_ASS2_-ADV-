require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('./src/models/User');
const Post = require('./src/models/Post');
const University = require('./src/models/University');

// Подключение к MongoDB
const MONGO_URI = process.env.MONGO_URI || 'your_mongodb_connection_string';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Функция для генерации случайного текста на русском языке
// const generateRussianText = (length) => {
//     const words = [
//         'университет', 'наука', 'образование', 'студенты', 'знания', 'исследования', 'обучение', 'преподаватели',
//         'технологии', 'практика', 'дисциплина', 'академия', 'развитие', 'факультет', 'кафедра', 'стипендия', 'диплом',
//         'экзамен', 'квалификация', 'проект', 'защита', 'учёба', 'инновации', 'успех', 'работа', 'прогресс', 'профессия'
//     ];
//     let text = '';
//     for (let i = 0; i < length; i++) {
//         text += words[Math.floor(Math.random() * words.length)] + ' ';
//     }
//     return text.trim();
// };

const seedDatabase = async () => {
    try {
        // Очищаем существующие данные
        await User.deleteMany({});
        await Post.deleteMany({});
        console.log('Существующие данные удалены');

        // // Получаем университеты из базы
        // const universities = await University.find();
        // if (universities.length === 0) {
        //     console.error('В базе данных нет университетов');
        //     return;
        // }
        //
        // // Создаём 100 пользователей
        // for (let i = 0; i < 100; i++) {
        //     const user = new User({
        //         username: faker.internet.email(),
        //         password: faker.internet.password(),
        //         avatar: faker.image.avatar(),
        //     });
        //
        //     await user.save();
        //     console.log(`Пользователь ${user.username} создан`);
        //
        //     // Для каждого пользователя создаём посты для 10 университетов
        //     for (const university of universities) {
        //         const post = new Post({
        //             title: generateRussianText(5), // Заголовок на русском
        //             content: generateRussianText(30), // Контент на русском
        //             rating: faker.number.int({ min: 1, max: 5 }), // Рейтинг
        //             author: user._id, // ID пользователя
        //             university: university._id, // ID университета
        //         });
        //
        //         await post.save();
        //         console.log(`Пост для университета ${university.name} создан`);
        //     }
        //}

        console.log('База данных успешно заполнена!');
    } catch (err) {
        console.error('Ошибка при заполнении базы данных:', err);
    } finally {
        mongoose.disconnect();
    }
};

seedDatabase();
