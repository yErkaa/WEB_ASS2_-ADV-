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


function validatePassword(password) {

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isValidLength = password.length >= 8;

    if (!isValidLength) {
        return 'Пароль должен быть не менее 8 символов.';
    }
    if (!hasUppercase) {
        return 'Пароль должен содержать хотя бы одну заглавную букву.';
    }
    if (!hasLowercase) {
        return 'Пароль должен содержать хотя бы одну строчную букву.';
    }
    if (!hasNumber) {
        return 'Пароль должен содержать хотя бы одну цифру.';
    }
    if (!hasSymbol) {
        return 'Пароль должен содержать хотя бы один специальный символ.';
    }

    return null;
}
document.getElementById('registerForm').setAttribute('enctype', 'multipart/form-data');

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Останавливаем стандартную отправку формы

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const avatarInput = document.getElementById('avatar');
    const avatar = avatarInput.files[0];

    if (!username || !password) {
        showModal('Имя пользователя и пароль обязательны');
        return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password); // 🔥 Теперь пароль отправляется правильно
    if (avatar) {
        formData.append('avatar', avatar);
    }

    console.log("📩 Отправляемые данные:", [...formData.entries()]); // Проверяем, что отправляется

    try {
        const response = await fetch('http://localhost:5000/auth/register', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (response.ok) {
            if (result.redirect) {
                window.location.href = result.redirect;
            } else {
                showModal('Регистрация успешна! Перенаправляем...', false, () => {
                    window.location.href = 'login.html';
                });
            }
        } else {
            showModal(`Ошибка регистрации: ${result.error}`);
        }
    } catch (err) {
        console.error('Ошибка:', err);
        showModal('Ошибка при регистрации. Попробуйте снова.');
    }
});


document.getElementById('avatar').addEventListener('change', function () {
    const fileName = this.files.length > 0 ? this.files[0].name : 'Файл не выбран';
    document.getElementById('file-name').textContent = fileName;
});

const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
});