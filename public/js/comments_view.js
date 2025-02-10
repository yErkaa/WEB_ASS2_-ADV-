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
    if (!(await checkDatabaseStatus())) return;

    const token = localStorage.getItem('token');
    if (!token) {
        showModalWithCancel('Вы не авторизованы. Перенаправляем на страницу входа...', false, () => {
            window.location.href = 'login.html';
        });
        return;
    }

    const postContainer = document.getElementById('postContainer');
    const commentsContainer = document.getElementById('commentsContainer');
    const commentForm = document.getElementById('commentForm');
    const commentContent = document.getElementById('commentContent');
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');

    document.getElementById('commentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = document.getElementById('commentContent').value.trim();

        if (!content) {
            showModalWithCancel('Комментарий не может быть пустым.');
            return;
        }

        // ✅ Получаем post_id из URL (важно!)
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('postId');

        if (!postId) {
            showModalWithCancel('Ошибка: ID поста не найден.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/comments/create', { // ✅ Отправляем post_id
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ post_id: postId, content }) // ✅ Передаём post_id в запросе
            });

            if (!response.ok) throw new Error('Ошибка при создании комментария');

            showModalWithCancel('Комментарий успешно добавлен.', false, () => location.reload());
        } catch (err) {
            console.error('Ошибка при отправке комментария:', err);
            showModalWithCancel('Не удалось отправить комментарий.');
        }
    });

    if (!postId) {
        showModalWithCancel('ID поста не указан.');
        return;
    }

    let currentUser = null;

    const loadCurrentUser = async () => {
        try {
            const response = await fetch('http://localhost:5000/auth/user', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Ошибка загрузки пользователя');
            currentUser = await response.json();
        } catch (err) {
            console.error('Ошибка загрузки пользователя:', err);
            showModalWithCancel('Не удалось загрузить информацию о текущем пользователе.');
        }
    };

    const loadPostAndComments = async () => {
        try {
            const response = await fetch(`http://localhost:5000/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Не удалось загрузить пост');

            const { post, comments } = await response.json();

            postContainer.innerHTML = `
                <h2>${post.title}</h2>
                <p>${post.content}</p>
                <p>Университет: ${post.university?.name || 'Неизвестный университет'}</p>
                <p>Автор: ${post.author.nickname || post.author.username}</p>
                <small>Создан: ${new Date(post.createdAt).toLocaleString()}</small>
            `;

            commentsContainer.innerHTML = '';
            comments.forEach((comment) => {
                const isAuthor = comment.author_id._id === currentUser._id;
                const commentCard = document.createElement('div');
                commentCard.className = 'comment-card';
                commentCard.innerHTML = `
                    <p>${comment.content}</p>
                    <p class="comment-author">Автор: ${comment.author_id.nickname || comment.author_id.username}</p>
                    <p class="comment-date">${new Date(comment.createdAt).toLocaleString()}</p>
                    <p>Лайков: <span class="likes-count" data-id="${comment._id}">${comment.likes.length}</span></p>
                    <button class="like-comment" data-id="${comment._id}">❤️</button>
                    <button class="view-replies" data-comment-id="${comment._id}" data-post-id="${postId}">
                        💬 Посмотреть ответы
                    </button>

                    ${
                    isAuthor
                        ? `<div class="comment-actions">
                                <button class="edit-btn" data-id="${comment._id}" data-content="${comment.content}">Редактировать</button>
                                <button class="delete-btn" data-id="${comment._id}">Удалить</button>
                               </div>`
                        : ''
                }
                `;
                commentsContainer.appendChild(commentCard);
            });
        } catch (err) {
            console.error('Ошибка при загрузке поста и комментариев:', err);
            showModalWithCancel('Не удалось загрузить данные.');
        }
    };

    const API_BASE_URL = 'http://localhost:5000'; // 👈 Добавляем базовый URL


    commentsContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('like-comment')) {
            const commentId = e.target.dataset.id;

            console.log(`🔥 Отправка запроса на лайк: ${API_BASE_URL}/comments/${commentId}/toggle-like`);

            try {
                const response = await fetch(`${API_BASE_URL}/comments/${commentId}/toggle-like`, { // 👈 Используем полный URL
                    method: 'POST',
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });

                if (!response.ok) {
                    const text = await response.text(); // Читаем ответ как текст, чтобы увидеть ошибку
                    throw new Error(`Ошибка сервера: ${text}`);
                }

                const { likesCount, liked } = await response.json();

                // Обновляем лайки
                const likesCountElement = document.querySelector(`.likes-count[data-id="${commentId}"]`);
                if (likesCountElement) {
                    likesCountElement.textContent = likesCount;
                }

                // Переключаем стиль кнопки
                e.target.classList.toggle('liked', liked);

                console.log(`✅ Лайк обновлен: ${likesCount} лайков`);
            } catch (err) {
                console.error('❌ Ошибка при лайке комментария:', err);
                showModalWithCancel(`Не удалось поставить лайк: ${err.message}`);
            }
        }


        if (e.target.classList.contains('view-replies')) {
            const postId = e.target.dataset.postId;
            const commentId = e.target.dataset.commentId;
            window.location.href = `replies_view.html?postId=${postId}&commentId=${commentId}`;
        }

        if (e.target.classList.contains('edit-btn')) {
            const commentId = e.target.dataset.id;
            const currentContent = e.target.dataset.content;

            showModalWithCancel('Введите новый текст комментария:', true, async (newContent) => {
                if (!newContent.trim()) {
                    showModalWithCancel('Комментарий не может быть пустым.');
                    return;
                }

                try {
                    const response = await fetch(`http://localhost:5000/comments/${commentId}`, {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ content: newContent }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Ошибка обновления комментария');
                    }

                    showModalWithCancel('Комментарий успешно обновлён.', false, loadPostAndComments);
                } catch (err) {
                    console.error('Ошибка при обновлении комментария:', err);
                    showModalWithCancel('Не удалось обновить комментарий.');
                }
            });
        }

        if (e.target.classList.contains('delete-btn')) {
            const commentId = e.target.dataset.id;

            showModalWithCancel('Вы уверены, что хотите удалить комментарий?', false, async () => {
                try {
                    const response = await fetch(`http://localhost:5000/comments/${commentId}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Не удалось удалить комментарий.');
                    }

                    showModalWithCancel('Комментарий успешно удалён.', false, loadPostAndComments);
                } catch (err) {
                    console.error('Ошибка при удалении комментария:', err);
                    showModalWithCancel('Не удалось удалить комментарий.');
                }
            });
        }
    });

    await loadCurrentUser();
    await loadPostAndComments();
});
