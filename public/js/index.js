document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Вы не авторизованы. Перенаправляем на страницу входа...');
        window.location.href = 'login.html';
        return;
    }
    console.log('Токен:', token);

    const universityFilter = document.getElementById('universityFilter');
    const postsContainer = document.getElementById('postsContainer');
    let currentUser = null;

    // Получаем текущего пользователя
    const getCurrentUser = async () => {
        try {
            const response = await fetch('http://localhost:5000/auth/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Не удалось загрузить информацию о пользователе');
            }
        } catch (err) {
            console.error('Ошибка получения пользователя:', err);
            alert('Ошибка получения пользователя.');
            return null;
        }
    };

    // Загружаем список университетов
    const loadUniversities = async () => {
        try {
            const response = await fetch('http://localhost:5000/universities', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Ошибка загрузки университетов');
            const universities = await response.json();

            // Добавляем опцию для всех университетов
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'Все университеты';
            universityFilter.appendChild(allOption);

            // Заполняем выпадающий список
            universities.forEach(university => {
                const option = document.createElement('option');
                option.value = university;
                option.textContent = university;
                universityFilter.appendChild(option);
            });
        } catch (err) {
            console.error('Ошибка загрузки университетов:', err);
            alert('Не удалось загрузить список университетов.');
        }
    };

    // Загружаем посты
    const loadPosts = async (university = 'all') => {
        postsContainer.innerHTML = ''; // Очищаем контейнер перед загрузкой
        try {
            const response = await fetch('http://localhost:5000/posts/get', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Ошибка загрузки постов');
            const posts = await response.json();

            // Фильтруем посты, если выбран конкретный университет
            const filteredPosts = university === 'all'
                ? posts
                : posts.filter(post => post.university === university);

            // Добавляем посты на страницу
            filteredPosts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';

                // Используем никнейм или email автора
                const authorName = post.author.nickname || post.author.username;

                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <p>${post.content}</p>
                    <p>Университет: ${post.university}</p>
                    <p>Оценка: ${post.rating}</p>
                    <p>Автор: ${authorName}</p>
                    ${
                    post.author._id === currentUser._id
                        ? `<button class="edit-post" data-id="${post._id}">Редактировать</button>
                               <button class="delete-post" data-id="${post._id}">Удалить</button>`
                        : ''
                }
                `;
                postsContainer.appendChild(postElement);
            });

            if (filteredPosts.length === 0) {
                postsContainer.innerHTML = '<p>Постов нет.</p>';
            }
        } catch (err) {
            console.error('Ошибка загрузки постов:', err);
            alert('Не удалось загрузить посты.');
        }
    };

    // Событие для изменения фильтра по университету
    universityFilter.addEventListener('change', () => {
        const selectedUniversity = universityFilter.value;
        loadPosts(selectedUniversity);
    });

    // Событие для редактирования и удаления постов
    document.addEventListener('click', async (e) => {
        const postId = e.target.dataset.id;

        if (e.target.classList.contains('edit-post')) {
            const newTitle = prompt('Введите новый заголовок:');
            const newContent = prompt('Введите новый отзыв:');
            const newRating = prompt('Введите новую оценку (1-5):');
            try {
                const response = await fetch(`http://localhost:5000/posts/${postId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title: newTitle, content: newContent, rating: newRating })
                });
                if (response.ok) {
                    alert('Пост успешно обновлён!');
                    loadPosts(universityFilter.value); // Перезагружаем посты
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
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    alert('Пост успешно удалён!');
                    loadPosts(universityFilter.value); // Перезагружаем посты
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

    // Загружаем университеты и посты при загрузке страницы
    currentUser = await getCurrentUser();
    await loadUniversities();
    await loadPosts();
});
