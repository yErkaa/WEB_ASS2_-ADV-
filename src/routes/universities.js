const express = require('express');
const router = express.Router();

// Фиксированный список университетов
const universities = [
    'L. N. Gumilyov Eurasian National University',
    'S. Seifullin Kazakh Agro Technical University',
    'Astana Medical University',
    'KAZGUU University',
    'Kazakh University of Economics, Finance and International Trade',
    'Eurasian Institute for the Humanities',
    'Academy of Public Administration under the President of Kazakhstan',
    'Kazakh University of Technology and Business',
    'Turan-Astana University',
    'Astana IT University',
];


// Эндпоинт для получения списка университетов
router.get('/', (req, res) => {
    res.json(universities);
});

module.exports = router;
