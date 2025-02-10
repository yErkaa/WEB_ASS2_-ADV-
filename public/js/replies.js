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
        console.warn('⚠️ База данных отключена. Показываем предупреждение.');
        showModal('⚠️ База данных временно недоступна. Попробуйте позже.');
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    const commentId = urlParams.get('commentId');

    if (!(await checkDatabaseStatus())) return;

    const postContainer = document.getElementById('postContainer');
    const commentContainer = document.getElementById('commentContainer');

    const API_BASE_URL = 'http://localhost:5000';
    const token = localStorage.getItem('token');

    let currentUser = null;

    const loadCurrentUser = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/user`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Ошибка загрузки пользователя');
            currentUser = await response.json();
        } catch (err) {
            console.error('Ошибка загрузки пользователя:', err);
        }
    };

    async function loadPostAndComment() {
        try {
            console.log(`🔥 Загружаем пост ${postId} и комментарий ${commentId}`);

            // Загружаем пост
            const postRes = await fetch(`${API_BASE_URL}/posts/${postId}`);
            if (!postRes.ok) throw new Error('Ошибка загрузки поста');
            const { post } = await postRes.json();  // ✅ Извлекаем `post` из ответа

            console.log(`✅ Загружен пост:`, post);


            postContainer.innerHTML = `
                <h2>${post.title || 'Без заголовка'}</h2>
                <p>${post.content || 'Нет контента'}</p>
                <p><b>Автор поста:</b> ${post.author?.nickname || post.author?.username || 'Неизвестный автор'}</p>
            `;

            // Загружаем комментарий
            const commentRes = await fetch(`${API_BASE_URL}/comments/comment/${commentId}`);
            if (!commentRes.ok) throw new Error('Ошибка загрузки комментария');
            const comment = await commentRes.json();

            console.log(`✅ Загружен комментарий:`, comment);


            commentContainer.innerHTML = `
                <p><b>Автор комментария:</b> ${comment.author_id
                            ? (comment.author_id.nickname && comment.author_id.nickname !== ''
                                ? comment.author_id.nickname
                                : comment.author_id.username)
                            : 'Неизвестный автор'}</p>
                <p>${comment.content || 'Нет текста'}</p>
            `;



        } catch (err) {
            console.error('❌ Ошибка при загрузке поста или комментария:', err);
            showModalWithCancel('Ошибка загрузки данных. Попробуйте позже.');
        }
    }

    async function loadReplies() {
        try {
            const response = await fetch(`${API_BASE_URL}/replies/comment/${commentId}`);
            if (!response.ok) throw new Error('Ошибка загрузки ответов');
            const replies = await response.json();

            const repliesContainer = document.getElementById('repliesContainer');
            if (replies.length === 0) {
                repliesContainer.innerHTML = `<p>Пока нет ответов</p>`;
                return;
            }

            repliesContainer.innerHTML = replies.map(reply => `
                <div class="reply">
                    <p><b>${reply.authorId?.nickname && reply.authorId?.nickname !== '' ? reply.authorId?.nickname : reply.authorId?.username}</b>: ${reply.content || 'Нет текста'}</p>
                    <p>Лайков: <span class="likes-count" data-id="${reply._id}">${reply.likes?.length || 0}</span></p>
                    <button class="like-reply" data-id="${reply._id}">❤️</button>
                    ${
                        currentUser && reply.authorId?._id === currentUser._id
                            ? `<button class="edit-reply" data-id="${reply._id}" data-content="${reply.content}">✏️</button>
                                       <button class="delete-reply" data-id="${reply._id}">🗑️</button>`
                            : ''
                    }
                </div>
            `).join('');

        } catch (err) {
            console.error('❌ Ошибка при загрузке ответов:', err);
            showModalWithCancel('Ошибка загрузки ответов.');
        }
    }
    document.getElementById('sendReply').addEventListener('click', async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showModalWithCancel('Вы не авторизованы.');
                return;
            }

            const content = document.getElementById('replyInput').value.trim();
            if (!content) {
                showModalWithCancel('Ответ не может быть пустым.');
                return;
            }

            // ✅ Получаем `postId` и `commentId` из URL (они должны быть!)
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('postId');
            const commentId = urlParams.get('commentId');

            if (!postId || !commentId) {
                showModalWithCancel('Ошибка: отсутствует ID поста или комментария.');
                return;
            }

            console.log(`📌 Отправка ответа: postId=${postId}, commentId=${commentId}`);

            const response = await fetch(`${API_BASE_URL}/replies/comment/${commentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, postId }) // ✅ Передаём `postId` в запросе
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка при отправке ответа: ${errorText}`);
            }

            document.getElementById('replyInput').value = '';
            showModalWithCancel('Ответ успешно отправлен.', false, loadReplies);
        } catch (err) {
            console.error('❌ Ошибка при отправке ответа:', err);
            showModalWithCancel(`Ошибка при отправке ответа: ${err.message}`);
        }
    });



    document.addEventListener('click', async (event) => {
        const replyId = event.target.dataset.id;

        if (event.target.classList.contains('edit-reply')) {
            const currentContent = event.target.dataset.content;
            showModalWithCancel('Редактировать ответ:', true, async (newContent) => {
                if (!newContent.trim()) {
                    showModalWithCancel('Ответ не может быть пустым.');
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/replies/${replyId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ content: newContent }),
                    });

                    if (!response.ok) throw new Error('Ошибка при редактировании ответа');
                    loadReplies();
                } catch (err) {
                    console.error('Ошибка при редактировании ответа:', err);
                }
            }, null, currentContent);
        }

        if (event.target.classList.contains('delete-reply')) {
            showModalWithCancel('Вы уверены, что хотите удалить ответ?', false, async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/replies/${replyId}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (!response.ok) throw new Error('Ошибка при удалении ответа');
                    loadReplies();
                } catch (err) {
                    console.error('Ошибка при удалении ответа:', err);
                }
            });
        }

        if (event.target.classList.contains('like-reply')) {
            const replyId = event.target.getAttribute('data-id');
            const token = localStorage.getItem('token');

            try {
                const response = await fetch(`${API_BASE_URL}/replies/${replyId}/toggle-like`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Ошибка при лайке ответа');

                const data = await response.json();
                const likeCount = document.querySelector(`.likes-count[data-id="${replyId}"]`);
                if (likeCount) likeCount.textContent = data.likesCount;
            } catch (err) {
                console.error('❌ Ошибка при лайке ответа:', err);
            }
        }
    });
    await loadCurrentUser();
    await loadPostAndComment();
    await loadReplies();
});
