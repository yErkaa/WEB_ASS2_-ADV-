const universities = [
    { name: "L. N. Gumilyov Eurasian National University", address: "ул. Сатбаева 2, Алматинский район, Астана, Казахстан" },
    { name: "S. Seifullin Kazakh Agro Technical University", address: "просп. Женис 62, Астана, Казахстан" },
    { name: "Astana Medical University", address: "улица Бейбитшилик 49/A, Астана, Казахстан" },
    { name: "KAZGUU University", address: "Кургальжинское ш. 13, Астана, Казахстан" },
    { name: "Kazakh University of Economics, Finance and International Trade", address: "Ахмет Жұбанов көшесі 7, Астана, Казахстан" },
    { name: "Eurasian Institute for the Humanities", address: "4 M.Zhumabayev prospect, Астана, Казахстан" },
    { name: "Academy of Public Administration under the President of Kazakhstan", address: "пр-т. Абая 33 а, Астана, Казахстан" },
    { name: "Kazakh University of Technology and Business", address: "улица Кайыма Мухамедханов 37А, Астана, Казахстан" },
    { name: "Turan-Astana University", address: "ул. Ыкылас Дукенулы 29, Астана, Казахстан" },
    { name: "Astana IT University", address: "Mangilik El. 35 Apt.40\n" +
            "Prigorodnyy 010017 Казахстан, Астана 020000, Казахстан" }

];

let map;
let markers = [];

// Функция для инициализации карты
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 51.128, lng: 71.430 }, // Центр карты
        zoom: 12,
    });

    // Добавляем маркеры
    addMarkers(universities);

    // Слушаем изменения в выпадающем списке
    document.getElementById("universityDropdown").addEventListener("change", handleUniversityChange);
}


// Функция для добавления маркеров
function addMarkers(universities) {
    const geocoder = new google.maps.Geocoder();

    // Удаляем старые маркеры
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    universities.forEach(university => {
        console.log(`Добавляем университет: ${university.name}`);
        geocoder.geocode({ address: university.address }, (results, status) => {
            if (status === "OK") {
                const position = results[0].geometry.location;

                const marker = new google.maps.Marker({
                    map: map,
                    position: position,
                    title: university.name,
                });

                markers.push(marker);
            } else {
                console.error(`Geocode error for ${university.name}: ${status}`);
            }
        });
    });
}

// Обработка изменений в выпадающем списке
function handleUniversityChange(event) {
    const selectedUniversity = event.target.value;

    if (selectedUniversity === "all") {
        addMarkers(universities);
        map.setCenter({ lat: 51.128, lng: 71.430 });
        map.setZoom(12);
    } else {
        const university = universities.find(u => u.name === selectedUniversity);
        if (university) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: university.address }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK) {
                    const position = results[0].geometry.location;

                    // Очищаем старые маркеры
                    markers.forEach(marker => marker.setMap(null));
                    markers = [];

                    // Создаем новый маркер
                    const marker = new google.maps.Marker({
                        map: map,
                        position: position,
                        title: university.name,
                    });
                    console.log(`Координаты для ${university.name}:`, results[0].geometry.location);

                    markers.push(marker);

                    map.setCenter(position);
                    map.setZoom(14);
                } else {
                    console.error(`Geocode error for ${university.name}: ${status}`);
                }
            });
        }
    }
}
