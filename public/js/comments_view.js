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

    if (!postId) {
        showModalWithCancel('ID поста не указан.');
        return;
    }

    let currentUser = null;

    const loadCurrentUser = async () => {
        if (!(await checkDatabaseStatus())) return;
        try {
            const response = await fetch('http://localhost:5000/auth/user', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Не удалось получить данные пользователя');
            currentUser = await response.json();
        } catch (err) {
            console.error('Ошибка загрузки текущего пользователя:', err);
            showModalWithCancel('Не удалось загрузить информацию о текущем пользователе.');
        }
    };

    const loadPostAndComments = async () => {
        if (!(await checkDatabaseStatus())) return;

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

    commentsContainer.addEventListener('click', async (e) => {
        if (!(await checkDatabaseStatus())) return;

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
            if (!(await checkDatabaseStatus())) return;

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

    commentForm.addEventListener('submit', async (e) => {
        if (!(await checkDatabaseStatus())) return;

        e.preventDefault();
        const commentContentValue = commentContent.value.trim();

        if (!commentContentValue) {
            showModalWithCancel('Комментарий не может быть пустым.');
            return;
        }

        try {
            if (!(await checkDatabaseStatus())) return;

            const response = await fetch('http://localhost:5000/comments/create', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ post_id: postId, content: commentContentValue }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка создания комментария');
            }

            commentContent.value = '';
            showModalWithCancel('Комментарий успешно добавлен.', false, loadPostAndComments);
        } catch (err) {
            console.error('Ошибка при добавлении комментария:', err);
            showModalWithCancel('Не удалось отправить комментарий.');
        }
    });



    await loadCurrentUser();
    await loadPostAndComments();
});