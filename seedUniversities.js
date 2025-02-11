require('dotenv').config();
const mongoose = require('mongoose');
const University = require('./src/models/University');

const MONGO_URI = process.env.MONGO_URI;

const universities = [
    {
        name: "L. N. Gumilyov Eurasian National University",
        description: "Крупнейший вуз Казахстана, предлагающий широкий спектр программ от гуманитарных до технических наук.",
        address: "ул. Сатбаева 2, Астана 010000"
    },
    {
        name: "S. Seifullin Kazakh Agro Technical University",
        description: "Ведущий сельскохозяйственный университет страны, фокусирующийся на агротехнологиях и инновациях.",
        address: "просп. Женис 62, Астана 010000"
    },
    {
        name: "Astana Medical University",
        description: "Специализируется на подготовке высококвалифицированных специалистов в области медицины и здравоохранения.",
        address: "улица Бейбитшилик 49/A, Астана 010000"
    },
    {
        name: "KAZGUU University",
        description: "Известен своими юридическими и экономическими программами, а также международными партнёрствами.",
        address: "Кургальжинское ш. 13, Астана 010000"
    },
    {
        name: "Kazakh University of Economics, Finance and International Trade",
        description: "Основной центр подготовки специалистов в области экономики, финансов и международной торговли.",
        address: "Ахмет Жұбанов көшесі 7, Астана 010000"
    },
    {
        name: "Eurasian Institute for the Humanities",
        description: "Предлагает программы в гуманитарных науках, включая историю, философию и международные отношения.",
        address: "4 M.Zhumabayev prospect, Астана 010000"
    },
    {
        name: "Academy of Public Administration under the President of Kazakhstan",
        description: "Образовательное учреждение, занимающееся подготовкой государственных служащих высокого уровня.",
        address: "пр-т. Абая 33 а, Астана 010000"
    },
    {
        name: "Kazakh University of Technology and Business",
        description: "Университет, специализирующийся на бизнесе, IT и современных технологиях.",
        address: "улица Кайыма Мухамедханов 37А, Астана 010000"
    },
    {
        name: "Turan-Astana University",
        description: "Фокусируется на подготовке специалистов в области бизнеса, права и гуманитарных наук.",
        address: "ул. Ыкылас Дукенулы 29, Астана 010000"
    },
    {
        name: "Astana IT University",
        description: "Современный университет, обучающий будущих специалистов в области информационных технологий и инноваций.",
        address: "просп. Мангилик Ел, С1, Астана 010000"
    }
];


const seedUniversities = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Подключение к MongoDB установлено.');

        await University.deleteMany();
        console.log('Коллекция Universities очищена.');

        await University.insertMany(universities);
        console.log('Университеты успешно добавлены в базу данных.');

        mongoose.connection.close();
        console.log('Подключение к MongoDB закрыто.');
    } catch (error) {
        console.error('Ошибка при заполнении базы данных:', error);
        mongoose.connection.close();
    }
};

seedUniversities();
