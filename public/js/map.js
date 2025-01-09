let map;
let markers = [];

// Инициализация карты
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 51.128, lng: 71.430 }, // Центр карты
        zoom: 12,
    });

    // Загрузка университетов с сервера и добавление маркеров
    loadUniversitiesAndAddMarkers();

    // Слушаем изменения в выпадающем списке
    document.getElementById("universityDropdown").addEventListener("change", handleUniversityChange);
}

// Загрузка университетов с сервера
async function loadUniversitiesAndAddMarkers() {
    try {
        const response = await fetch('http://localhost:5000/universities'); // Замените URL на ваш API
        if (!response.ok) {
            throw new Error('Ошибка загрузки университетов');
        }

        const universities = await response.json();
        console.log('Загруженные университеты:', universities);

        // Заполняем выпадающий список университетов
        populateUniversityDropdown(universities);

        // Добавляем маркеры на карту
        addMarkers(universities);
    } catch (err) {
        console.error('Ошибка загрузки университетов:', err);
        alert('Не удалось загрузить список университетов.');
    }
}

// Заполнение выпадающего списка
function populateUniversityDropdown(universities) {
    const dropdown = document.getElementById("universityDropdown");
    dropdown.innerHTML = ''; // Очищаем старые опции

    // Добавляем опцию "Все университеты"
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Все университеты';
    dropdown.appendChild(allOption);

    // Добавляем университеты
    universities.forEach(university => {
        const option = document.createElement('option');
        option.value = university.name; // Используем название университета как значение
        option.textContent = university.name; // Отображаем название университета
        dropdown.appendChild(option);
    });
}

// Добавление маркеров на карту
function addMarkers(universities) {
    const geocoder = new google.maps.Geocoder();

    // Удаляем старые маркеры
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Проходимся по университетам
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
        // Показать все университеты
        loadUniversitiesAndAddMarkers();
        map.setCenter({ lat: 51.128, lng: 71.430 });
        map.setZoom(12);
    } else {
        fetch('http://localhost:5000/universities')
            .then(response => response.json())
            .then(universities => {
                const university = universities.find(u => u.name === selectedUniversity);
                if (university) {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ address: university.address }, (results, status) => {
                        if (status === google.maps.GeocoderStatus.OK) {
                            const position = results[0].geometry.location;

                            // Удаляем старые маркеры
                            markers.forEach(marker => marker.setMap(null));
                            markers = [];

                            // Добавляем новый маркер
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
            });
    }
}
