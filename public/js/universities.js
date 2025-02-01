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


document.addEventListener('DOMContentLoaded', async () => {
    console.log('Загрузка списка университетов...');
    if (!(await checkDatabaseStatus())) return;
    try {
        const response = await fetch('http://localhost:5000/universities');
        if (!response.ok) throw new Error(`Ошибка загрузки университетов: ${response.statusText}`);
        const universities = await response.json();
        console.log('Университеты загружены:', universities);

        const universityFilter = document.getElementById('universityFilter');
        universities.forEach(university => {
            const option = document.createElement('option');
            option.value = university._id;
            option.textContent = university.name;
            universityFilter.appendChild(option);
        });
    } catch (err) {
        console.error('Ошибка:', err);
        showModal('Не удалось загрузить список университетов.');
    }
});

