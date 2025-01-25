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

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        showModal('Вы не авторизованы. Перенаправляем на страницу входа...', false, () => {
            window.location.href = 'login.html';
        });
        return;
    }

    const loadUserProfile = async () => {
        try {
            const response = await fetch('http://localhost:5000/auth/user', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const user = await response.json();
                document.getElementById('username').textContent = user.username;
                document.getElementById('nickname').value = user.nickname || '';
                document.getElementById('avatar').src = user.avatar
                    ? `http://localhost:5000/${user.avatar}`
                    : 'default-avatar.png';
            } else {
                const error = await response.json();
                showModal(`Ошибка загрузки профиля: ${error.error}`);
                throw new Error(error.error || 'Не удалось загрузить профиль');
            }
        } catch (err) {
            console.error('Ошибка загрузки профиля:', err);
            showModal('Ошибка загрузки профиля. Перенаправляем на страницу входа...', false, () => {
                window.location.href = 'login.html';
            });
        }
    };

    document.getElementById('updateNicknameButton').addEventListener('click', async () => {
        const newNickname = document.getElementById('nickname').value.trim();

        if (!newNickname) {
            showModal('Никнейм не может быть пустым');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/auth/user', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nickname: newNickname }),
            });

            if (response.ok) {
                showModal('Никнейм успешно обновлен', false, loadUserProfile);
            } else {
                const error = await response.json();
                showModal(`Ошибка обновления никнейма: ${error.error}`);
            }
        } catch (err) {
            console.error('Ошибка обновления никнейма:', err);
            showModal('Ошибка сервера. Попробуйте позже.');
        }
    });

    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        showModal('Вы успешно вышли из аккаунта.', false, () => {
            window.location.href = 'login.html';
        });
    });

    document.getElementById('deleteAccountButton').addEventListener('click', () => {
        showModal('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.', false, async () => {
            try {
                const response = await fetch('http://localhost:5000/auth/user', {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    showModal('Аккаунт успешно удалён.', false, () => {
                        localStorage.removeItem('token');
                        window.location.href = 'register.html';
                    });
                } else {
                    const error = await response.json();
                    showModal(`Ошибка удаления аккаунта: ${error.error}`);
                }
            } catch (err) {
                console.error('Ошибка удаления аккаунта:', err);
                showModal('Не удалось удалить аккаунт.');
            }
        });
    });

    await loadUserProfile();
});
