document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    console.log('Токен:', token); // Логируем токен

    if (!token) {
        alert('Вы не авторизованы. Перенаправляем на страницу входа...');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/auth/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            console.log('Данные пользователя:', user); // Логируем данные пользователя

            // Обновляем отображение на странице
            document.getElementById('username').textContent = user.username; // Email
            document.getElementById('nickname').value = user.nickname || ''; // Nickname

            // Проверяем и обновляем аватар
            if (user.avatar) {
                console.log('Путь к аватару:', user.avatar); // Лог пути к аватару
                document.getElementById('avatar').src = `http://localhost:5000/${user.avatar}`;
            } else {
                document.getElementById('avatar').src = 'default-avatar.png';
            }
        } else {
            const error = await response.json();
            console.error('Ошибка при загрузке профиля:', error);
            throw new Error(error.error || 'Не удалось загрузить профиль');
        }
    } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        alert('Ошибка загрузки профиля. Перенаправляем на страницу входа...');
        window.location.href = 'login.html';
    }
});

document.getElementById('updateNicknameButton').addEventListener('click', async () => {
    const newNickname = document.getElementById('nickname').value.trim();
    const token = localStorage.getItem('token');

    if (!newNickname) {
        alert('Никнейм не может быть пустым');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/auth/user', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname: newNickname })
        });

        if (response.ok) {
            alert('Никнейм успешно обновлен');
        } else {
            const error = await response.json();
            alert(`Ошибка обновления никнейма: ${error.error}`);
        }
    } catch (err) {
        console.error('Ошибка обновления никнейма:', err);
        alert('Ошибка сервера. Попробуйте позже.');
    }
});

// Выход из аккаунта
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token'); // Удаляем токен из localStorage
    alert('Вы успешно вышли из аккаунта.');
    window.location.href = 'login.html';
});

// Удаление аккаунта
document.getElementById('deleteAccountButton').addEventListener('click', async () => {
    if (!confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить.')) {
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/auth/user', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            alert('Аккаунт успешно удалён.');
            localStorage.removeItem('token');
            window.location.href = 'register.html';
        } else {
            const error = await response.json();
            alert(`Ошибка удаления аккаунта: ${error.error}`);
        }
    } catch (err) {
        console.error('Ошибка удаления аккаунта:', err);
        alert('Не удалось удалить аккаунт.');
    }
});
