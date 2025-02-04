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
        console.warn('⚠️ База данных отключена. Показываем предупреждение.');
        showModalWithCancel('⚠️ База данных временно недоступна. Попробуйте позже.');
        return false;
    }
}



document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(await checkDatabaseStatus())) return;

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;


    if (!username || !password) {
        alert('Введите email и пароль.');
        return;
    }


    try {
        if (!(await checkDatabaseStatus())) return;
        const response = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            showModal('Вход успешен! Перенаправляем на главную страницу...', false, () => {
                window.location.href = 'index.html';
            });
        } else {
            const error = await response.json();
            showModal(`Ошибка входа: ${error.error}`);
        }
    } catch (err) {
        console.error('Ошибка:', err);
        showModal('Не удалось войти. Попробуйте снова.');
    }
});

const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
});
