document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Вы не авторизованы. Перенаправляем на страницу входа...');
        window.location.href = 'login.html';
        return;
    }

    const universitySelect = document.getElementById('university');

    try {
        // Получаем список университетов
        const response = await fetch('http://localhost:5000/universities', {
            headers: {
                'Authorization': `Bearer ${token}`, // Передаем токен для авторизации
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить университеты');
        }

        const universities = await response.json();

        // Заполняем выпадающий список университетов
        universities.forEach(university => {
            const option = document.createElement('option');
            option.value = university;
            option.textContent = university;
            universitySelect.appendChild(option);
        });
    } catch (err) {
        console.error('Ошибка загрузки университетов:', err);
        alert('Не удалось загрузить список университетов.');
    }

    // Отправка формы для создания поста
    document.getElementById('postForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const university = document.getElementById('university').value;
        const title = document.getElementById('title').value;
        const review = document.getElementById('review').value;
        const rating = document.getElementById('rating').value;

        if (!university || !title || !review || !rating) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/posts/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // Передаем токен для авторизации
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ university, title, review, rating }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Пост успешно создан!');
                window.location.href = 'index.html'; // Перенаправление
            } else {
                alert(`Ошибка создания поста: ${data.error}`);
            }
        } catch (err) {
            console.error('Ошибка при создании поста:', err);
            alert('Ошибка сервера. Попробуйте позже.');
        }
    });
});

// Добавить обработчик редактирования поста
const renderPost = (post) => {
    const postElement = document.createElement('div');
    postElement.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <p>Университет: ${post.university}</p>
        <p>Оценка: ${post.rating}</p>
        <button class="edit-post" data-id="${post._id}">Редактировать</button>
        <button class="delete-post" data-id="${post._id}">Удалить</button>
    `;
    document.body.appendChild(postElement);
};

// Обработчик кнопки "Редактировать"
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-post')) {
        const postId = e.target.dataset.id;
        const newTitle = prompt('Введите новый заголовок:');
        const newContent = prompt('Введите новый отзыв:');
        const newRating = prompt('Введите новую оценку (1-5):');

        try {
            const response = await fetch(`http://localhost:5000/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: newTitle, content: newContent, rating: newRating }),
            });

            if (response.ok) {
                alert('Пост успешно обновлён!');
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Ошибка обновления поста: ${error.error}`);
            }
        } catch (err) {
            console.error('Ошибка:', err);
            alert('Не удалось обновить пост.');
        }
    }
});

// Обработчик кнопки "Удалить"
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-post')) {
        const postId = e.target.dataset.id;

        if (!confirm('Вы уверены, что хотите удалить этот пост?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                alert('Пост успешно удалён!');
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Ошибка удаления поста: ${error.error}`);
            }
        } catch (err) {
            console.error('Ошибка:', err);
            alert('Не удалось удалить пост.');
        }
    }
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
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
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
        console.error('Ошибка:', err);
        alert('Не удалось удалить аккаунт.');
    }
});
