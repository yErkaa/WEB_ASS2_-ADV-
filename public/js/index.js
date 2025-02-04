function showModalWithCancel(message, input = false, callback = null, cancelCallback = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            ${input ? '<textarea id="modalInput"></textarea>' : ''}
            <div class="modal-buttons">
                <button id="modalCancelButton" class="cancel-btn">Отмена</button>
                <button id="modalOkButton" class="ok-btn">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const modalInput = document.getElementById('modalInput');
    const cancelButton = document.getElementById('modalCancelButton');
    const okButton = document.getElementById('modalOkButton');

    cancelButton.addEventListener('click', () => {
        if (cancelCallback) cancelCallback();
        document.body.removeChild(modal);
    });

    okButton.addEventListener('click', () => {
        if (input && callback) {
            callback(modalInput.value);
        } else if (callback) {
            callback();
        }
        document.body.removeChild(modal);
    });
}

function showModalEditWithCancel(title, content, callback, cancelCallback) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <label for="modalTitle">Введите новый заголовок:</label>
            <input id="modalTitle" type="text" value="${title}" class="modal-input-title">

            <label for="modalContent">Введите новый текст поста:</label>
            <textarea id="modalContent" class="modal-input-content">${content}</textarea>

            <div class="modal-buttons">
                <button id="modalCancelButton" class="cancel-btn">Отмена</button>
                <button id="modalOkButton" class="ok-btn">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const cancelButton = document.getElementById('modalCancelButton');
    const okButton = document.getElementById('modalOkButton');

    cancelButton.addEventListener('click', () => {
        if (cancelCallback) cancelCallback();
        document.body.removeChild(modal);
    });

    okButton.addEventListener('click', () => {
        const newTitle = document.getElementById('modalTitle').value.trim();
        const newContent = document.getElementById('modalContent').value.trim();
        if (newTitle && newContent && callback) {
            callback(newTitle, newContent);
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
            showModalWithCancel('⚠️ База данных временно недоступна. Попробуйте позже.');
            return false;
        }

        return true;
    } catch (err) {
        console.error('❌ Ошибка соединения с сервером:', err);
        showModalWithCancel('⚠️ Ошибка соединения с сервером. Попробуйте позже.');
        return false;
    }
}




document.addEventListener('DOMContentLoaded', async () => {

    await checkDatabaseStatus();
    if (!(await checkDatabaseStatus())) return;
    console.log('DOM полностью загружен.');
    const token = localStorage.getItem('token');
    const adminPanelBtn = document.getElementById('adminPanelBtn');

    if (!token) {
        console.warn('Токен отсутствует. Перенаправляем на страницу входа.');
        showModalWithCancel('Вы не авторизованы. Перенаправляем на страницу входа...', false, () => {
            window.location.href = 'login.html';
        });
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/auth/user', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Ошибка получения пользователя');
        const user = await response.json();

        if (user.role === 'admin') {
            adminPanelBtn.style.display = 'block';
            adminPanelBtn.addEventListener('click', () => {
                window.location.href = 'admin.html';
            });
        }
    } catch (err) {
        console.error('Ошибка:', err);
    }

    const universityFilter = document.getElementById('universityFilter');
    const postsContainer = document.getElementById('postsContainer');
    let currentUser = null;

    const getCurrentUser = async () => {

        console.log('Загрузка информации о текущем пользователе...');
        try {

            const response = await fetch('http://localhost:5000/auth/user', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Не удалось загрузить информацию о пользователе');
            const user = await response.json();
            console.log('Информация о пользователе загружена:', user);
            if (user.role === 'admin') {
                adminPanelBtn.style.display = 'block'; // Показываем кнопку
                adminPanelBtn.addEventListener('click', () => {
                    window.location.href = 'admin.html'; // Перенаправляем на админ-панель
                });
            }
            return user;
            return await response.json();
        } catch (err) {
            console.error('Ошибка получения пользователя:', err);
            showModalWithCancel('Не удалось загрузить информацию о пользователе.');
            return null;
        }
    };


    const loadUniversities = async () => {
        console.log('Загрузка списка университетов...');

        try {

            const response = await fetch('http://localhost:5000/universities', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Ошибка загрузки университетов');
            const universities = await response.json();
            console.log('Список университетов:', universities);

            universityFilter.innerHTML = '';
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'Все университеты';
            universityFilter.appendChild(allOption);

            universities.forEach((university) => {
                const option = document.createElement('option');
                option.value = university._id;
                option.textContent = university.name;
                universityFilter.appendChild(option);
            });
        } catch (err) {
            console.error('Ошибка загрузки университетов:', err);
            showModalWithCancel('Не удалось загрузить список университетов.');
        }
    };

    const loadPosts = async (universityId = 'all') => {
        postsContainer.innerHTML = '';
        if (!(await checkDatabaseStatus())) return;
        try {

            const response = await fetch('http://localhost:5000/posts/get', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Ошибка загрузки постов');
            const posts = await response.json();

            const filteredPosts =
                universityId === 'all'
                    ? posts
                    : posts.filter((post) => post.university?._id === universityId);

            filteredPosts.forEach((post) => {
                const postElement = document.createElement('div');
                postElement.className = 'card';

                const isAuthor = post.author?._id === currentUser._id;

                postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                <p>Университет: ${post.university?.name || 'Неизвестный университет'}</p>
                <p>Автор: ${post.author?.nickname || post.author?.username || 'Неизвестный автор'}</p>
                <p>Лайков: <span class="likes-count" data-id="${post._id}">${post.likes?.length || 0}</span></p>
                <p>Комментариев: ${post.commentCount || 0}</p>
                <div class="post-buttons">
                    <button class="like-post ${post.likes?.includes(currentUser._id) ? 'liked' : ''}" data-id="${post._id}">Лайк</button>
                    <button class="comment-btn" onclick="location.href='comments_view.html?postId=${post._id}'">💬 Комментарии</button>
                    ${
                    isAuthor
                        ? `<button class="edit-post small-btn" data-id="${post._id}" data-content="${post.content}" data-title="${post.title}">✏️</button>
                           <button class="delete-post small-btn" data-id="${post._id}">❌</button>`
                        : ''
                }
                </div>
            `;
                postsContainer.appendChild(postElement);
            });


            if (filteredPosts.length === 0) {
                postsContainer.innerHTML = '<p>Постов нет.</p>';
            }
        } catch (err) {
            console.error('Ошибка загрузки постов:', err);
            showModalWithCancel('Не удалось загрузить посты.');
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

                if (!response.ok) throw new Error('Не удалось переключить лайк');
                const { likesCount, liked } = await response.json();

                e.target.classList.toggle('liked', liked);
                const likesCountElement = document.querySelector(`.likes-count[data-id="${postId}"]`);
                if (likesCountElement) likesCountElement.textContent = likesCount;
            } catch (err) {
                console.error('Ошибка при переключении лайка:', err);
                showModalWithCancel('Не удалось переключить лайк.');
            }
        }

        if (e.target.classList.contains('delete-post')) {

            const postId = e.target.dataset.id;

            showModalWithCancel('Вы уверены, что хотите удалить этот пост?', false, async () => {
                try {
                    const response = await fetch(`http://localhost:5000/posts/${postId}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (response.ok) {
                        showModalWithCancel('Пост успешно удалён.', false, loadPosts);
                    } else {
                        const error = await response.json();
                        showModalWithCancel(`Ошибка удаления поста: ${error.error}`);
                    }
                } catch (err) {
                    console.error('Ошибка при удалении поста:', err);
                    showModalWithCancel('Не удалось удалить пост.');
                }
            });
        }

        if (e.target.classList.contains('edit-post')) {
            const postId = e.target.dataset.id;
            const currentTitle = e.target.dataset.title;
            const currentContent = e.target.dataset.content;

            showModalEditWithCancel(currentTitle, currentContent, async (newTitle, newContent) => {
                try {
                    const response = await fetch(`http://localhost:5000/posts/${postId}`, {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ title: newTitle, content: newContent }),
                    });

                    if (response.ok) {
                        showModalWithCancel('Пост успешно обновлён.', false, loadPosts);
                    } else {
                        const error = await response.json();
                        showModalWithCancel(`Ошибка обновления поста: ${error.error}`);
                    }
                } catch (err) {
                    console.error('Ошибка при обновлении поста:', err);
                    showModalWithCancel('Не удалось обновить пост.');
                }
            });
        }
    });

    universityFilter.addEventListener('change', () => {
        const universityId = universityFilter.value;
        console.log(`Фильтрация по университету ID: ${universityId}`);
        loadPosts(universityId);
    });

    currentUser = await getCurrentUser();
    if (currentUser) {
        await loadUniversities();
        await loadPosts();
    }
});
