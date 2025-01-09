document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Вы не авторизованы. Перенаправляем на страницу входа...');
        window.location.href = 'login.html';
        return;
    }
    console.log('Токен загружен.');

    const universityFilter = document.getElementById('universityFilter');
    const postsContainer = document.getElementById('postsContainer');
    let currentUser = null;

    // Получение текущего пользователя
    const getCurrentUser = async () => {
        try {
            const response = await fetch('http://localhost:5000/auth/user', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const user = await response.json();
                console.log('Пользователь авторизован.');
                return user;
            } else {
                throw new Error('Не удалось загрузить информацию о пользователе');
            }
        } catch (err) {
            console.error('Ошибка получения пользователя.');
            alert('Ошибка получения пользователя.');
            return null;
        }
    };

    // Загрузка университетов
    const loadUniversities = async () => {
        try {
            const response = await fetch('http://localhost:5000/universities', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Ошибка загрузки университетов');
            const universities = await response.json();

            console.log('Университеты успешно загружены.');

            universityFilter.innerHTML = '';

            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'Все университеты';
            universityFilter.appendChild(allOption);

            universities.forEach((university) => {
                const option = document.createElement('option');
                option.value = university._id; // Используем ID университета
                option.textContent = university.name;
                universityFilter.appendChild(option);
            });
        } catch (err) {
            console.error('Ошибка загрузки университетов.');
            alert('Не удалось загрузить список университетов.');
        }
    };

    // Загрузка постов
    const loadPosts = async (universityId = 'all') => {
        postsContainer.innerHTML = ''; // Очищаем контейнер с постами
        try {
            const response = await fetch('http://localhost:5000/posts/get', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Ошибка загрузки постов');
            const posts = await response.json();

            console.log('Посты успешно загружены.');

            const filteredPosts = universityId === 'all' ? posts : posts.filter((post) => post.university?._id === universityId);

            filteredPosts.forEach((post) => {
                const postElement = document.createElement('div');
                postElement.className = 'post';

                const authorName = post.author?.nickname || post.author?.username || 'Неизвестный автор';
                const universityName = post.university?.name || 'Неизвестный университет';
                const universityAddress = post.university?.address || 'Адрес не указан';
                const universityDescription = post.university?.description || 'Описание отсутствует';

                postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                <p>Университет: ${universityName}</p>
                <p>Адрес: ${universityAddress}</p>
                <p>Описание: ${universityDescription}</p>
                <p>Оценка: ${post.rating}</p>
                <p>Автор: ${authorName}</p>
                <p>Комментарии: ${post.commentCount || 0}</p>
                <p>Лайков: <span class="likes-count" data-id="${post._id}">${post.likes ? post.likes.length : 0}</span></p>
                <button class="like-post" data-id="${post._id}">
                    ${post.likes && post.likes.includes(currentUser._id) ? 'Убрать лайк' : 'Лайкнуть'}
                </button>



                ${
                    post.author && post.author._id === currentUser._id
                        ? `<button class="edit-post" data-id="${post._id}">Редактировать</button>
                           <button class="delete-post" data-id="${post._id}">Удалить</button>`
                        : ''
                }
                <button onclick="location.href='comments_view.html?postId=${post._id}'">Комментарии</button>
                <p><small>Создан: ${new Date(post.createdAt).toLocaleString()}</small></p>
            `;
                postsContainer.appendChild(postElement);
            });


            if (filteredPosts.length === 0) {
                postsContainer.innerHTML = '<p>Постов нет.</p>';
            }
        } catch (err) {
            console.error('Ошибка загрузки постов.');
            alert('Не удалось загрузить посты.');
        }
    };

    postsContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('like-post')) {
            const postId = e.target.dataset.id;

            try {
                const response = await fetch(`http://localhost:5000/posts/${postId}/toggle-like`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error('Ошибка при переключении лайка');

                const { likesCount, message } = await response.json();
                alert(message);

                // Обновляем количество лайков и текст кнопки
                const likesCountElement = document.querySelector(`.likes-count[data-id="${postId}"]`);
                likesCountElement.textContent = likesCount;

                e.target.textContent = message === 'Лайк добавлен' ? 'Убрать лайк' : 'Лайкнуть';
            } catch (err) {
                console.error('Ошибка при переключении лайка:', err);
                alert('Не удалось переключить лайк.');
            }
        }
    });




    // Обработка изменения выбора университета
    universityFilter.addEventListener('change', () => {
        const selectedUniversityId = universityFilter.value;
        loadPosts(selectedUniversityId);
    });

    postsContainer.addEventListener('click', async (e) => {
        const postId = e.target.dataset.id;

        if (e.target.classList.contains('edit-post')) {
            const newTitle = prompt('Введите новый заголовок:');
            const newContent = prompt('Введите новый отзыв:');
            const newRating = prompt('Введите новую оценку (1-5):');
            try {
                const response = await fetch(`http://localhost:5000/posts/${postId}`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: newTitle, content: newContent, rating: newRating }),
                });
                if (response.ok) {
                    alert('Пост успешно обновлён!');
                    loadPosts(universityFilter.value);
                } else {
                    const error = await response.json();
                    alert(`Ошибка обновления поста: ${error.error}`);
                }
            } catch (err) {
                console.error('Ошибка:', err);
                alert('Не удалось обновить пост.');
            }
        } else if (e.target.classList.contains('delete-post')) {
            if (!confirm('Вы уверены, что хотите удалить этот пост?')) return;
            try {
                const response = await fetch(`http://localhost:5000/posts/${postId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    alert('Пост успешно удалён!');
                    loadPosts(universityFilter.value);
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

    currentUser = await getCurrentUser();
    if (currentUser) {
        await loadUniversities();
        await loadPosts();
    }
});
