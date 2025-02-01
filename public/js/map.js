function showModal(message, input = false, callback = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            ${input ? '<textarea id="modalInput"></textarea>' : ''}
            <button id="modalOkButton">OK</button>
        </div>
    `;
    document.body.appendChild(modal);

    const modalInput = document.getElementById('modalInput');
    const okButton = document.getElementById('modalOkButton');
    okButton.addEventListener('click', () => {
        if (input && callback) {
            callback(modalInput.value);
        }
        document.body.removeChild(modal);
    });
}

async function checkDatabaseStatus() {
    try {
        // Устанавливаем таймаут на 2 секунды
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch('http://localhost:5000/db-status', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Ошибка соединения');

        const data = await response.json();
        if (data.status !== 'connected') {
            console.warn('⚠️ База данных отключена. Показываем предупреждение.');
            showModal('⚠️ База данных временно недоступна. Попробуйте позже.');
            return false;
        }

        return true;
    } catch (err) {
        console.error('❌ Ошибка соединения с сервером:', err);
        showModal('⚠️ Ошибка соединения с сервером. Попробуйте позже.');
        return false;
    }
}


let map;
let markers = [];


function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 51.128, lng: 71.430 },
        zoom: 12,
    });

    loadUniversitiesAndAddMarkers();

    document.getElementById("universityDropdown").addEventListener("change", handleUniversityChange);
}

async function loadUniversitiesAndAddMarkers() {
    if (!(await checkDatabaseStatus())) return;

    try {
        const response = await fetch('http://localhost:5000/universities');
        if (!response.ok) throw new Error('Ошибка загрузки университетов');
        const universities = await response.json();

        populateUniversityDropdown(universities);
        addMarkers(universities);
    } catch (err) {
        console.error('Ошибка загрузки университетов:', err);
        showModal('Не удалось загрузить список университетов.');
    }
}

function populateUniversityDropdown(universities) {

    const dropdown = document.getElementById("universityDropdown");
    dropdown.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Все университеты';
    dropdown.appendChild(allOption);

    universities.forEach(university => {
        const option = document.createElement('option');
        option.value = university.name;
        option.textContent = university.name;
        dropdown.appendChild(option);
    });

}

function addMarkers(universities) {

    const geocoder = new google.maps.Geocoder();

    markers.forEach(marker => marker.setMap(null));
    markers = [];

    universities.forEach(university => {
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

function handleUniversityChange(event) {
    const selectedUniversity = event.target.value;

    if (selectedUniversity === "all") {
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

                            markers.forEach(marker => marker.setMap(null));
                            markers = [];

                            const marker = new google.maps.Marker({
                                map: map,
                                position: position,
                                title: university.name,
                            });

                            markers.push(marker);

                            map.setCenter(position);
                            map.setZoom(14);
                        } else {
                            console.error(`Geocode error for ${university.name}: ${status}`);
                        }
                    });
                }
            })
            .catch(err => {
                console.error('Ошибка при обработке изменения университета:', err);
                showModal('Не удалось обработать изменение университета.');
            });
    }
}
