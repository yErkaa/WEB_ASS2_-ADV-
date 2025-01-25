// Функция для отображения модального окна
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

// Проверка пароля на соответствие требованиям
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

// Обработка формы регистрации
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const avatarInput = document.getElementById('avatar');
    const avatar = avatarInput.files[0];

    const passwordError = validatePassword(password);
    if (passwordError) {
        showModal(passwordError);
        return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    if (avatar) {
        formData.append('avatar', avatar);
    }

    try {
        const response = await fetch('http://localhost:5000/auth/register', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            showModal('Регистрация успешна! Перенаправляем на страницу входа...', false, () => {
                window.location.href = 'login.html';
            });
        } else {
            const error = await response.json();
            if (error.error === 'Пользователь с таким email уже зарегистрирован') {
                showModal('Пользователь с таким email уже зарегистрирован. Используйте другой email.');
            } else {
                showModal(`Ошибка регистрации: ${error.error}`);
            }
        }
    } catch (err) {
        console.error('Ошибка:', err);
        showModal('Не удалось зарегистрироваться. Попробуйте снова.');
    }
});


// Обновление имени файла при выборе
document.getElementById('avatar').addEventListener('change', function () {
    const fileName = this.files.length > 0 ? this.files[0].name : 'Файл не выбран';
    document.getElementById('file-name').textContent = fileName;
});

// Добавление функционала "глазика" для отображения пароля
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Меняем иконку в зависимости от состояния
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
});
