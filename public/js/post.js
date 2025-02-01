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
        } else if (callback) {
            callback();
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
    if (!(await checkDatabaseStatus())) return;
    const token = localStorage.getItem('token');
    if (!token) {
        showModal('Вы не авторизованы. Перенаправляем на страницу входа...', false, () => {
            window.location.href = 'login.html';
        });
        return;
    }

    const universitySelect = document.getElementById('university');

    const loadUniversities = async () => {

        try {
            const response = await fetch('http://localhost:5000/universities', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Не удалось загрузить университеты');
            }

            const universities = await response.json();

            universitySelect.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Выберите университет';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            universitySelect.appendChild(defaultOption);

            universities.forEach((university) => {
                const option = document.createElement('option');
                option.value = university.name;
                option.textContent = university.name;
                universitySelect.appendChild(option);
            });
        } catch (err) {
            console.error('Ошибка загрузки университетов:', err);
            showModal('Не удалось загрузить список университетов.');
        }
    };

    document.getElementById('postForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!(await checkDatabaseStatus())) return;

        const university = document.getElementById('university').value;
        const title = document.getElementById('title').value;
        const review = document.getElementById('review').value;
        const rating = parseInt(document.getElementById('rating').value, 10);

        if (!university || !title || !review || !rating) {
            showModal('Пожалуйста, заполните все поля');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/posts/create', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ university, title, review, rating }),
            });

            if (response.ok) {
                showModal('Пост успешно создан!', false, () => {
                    window.location.href = 'index.html';
                });
            } else {
                const error = await response.json();
                showModal(`Ошибка создания поста: ${error.error}`);
            }
        } catch (err) {
            console.error('Ошибка при создании поста:', err);
            showModal('Ошибка сервера. Попробуйте позже.');
        }
    });

    await loadUniversities();
});