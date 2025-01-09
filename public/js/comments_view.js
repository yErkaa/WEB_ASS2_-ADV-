document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Вы не авторизованы. Перенаправляем на страницу входа...');
        window.location.href = 'login.html';
        return;
    }

    const postContainer = document.getElementById('postContainer');
    const commentsContainer = document.getElementById('commentsContainer');
    const commentForm = document.getElementById('commentForm');
    const commentContent = document.getElementById('commentContent');

    // Получаем postId из URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');

    if (!postId) {
        alert('ID поста не указан.');
        return;
    }

    // Загрузка текущего пользователя
    const getCurrentUser = async () => {
        try {
            const response = await fetch('http://localhost:5000/auth/user', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Не удалось получить пользователя');
            return await response.json();
        } catch (err) {
            console.error('Ошибка при получении пользователя:', err);
            alert('Ошибка при получении пользователя.');
            return null;
        }
    };

    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    // Загрузка поста и комментариев
    const loadPostAndComments = async () => {
        try {
            const response = await fetch(`http://localhost:5000/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Не удалось загрузить пост');

            const { post, comments } = await response.json();

            const formattedDate = new Date(post.createdAt).toLocaleString();
            // Отображение поста
            postContainer.innerHTML = `
                <h2>${post.title}</h2>
                <p>${post.content}</p>
                <p>Университет: ${post.university.name}</p>
                <p>Автор: ${post.author.nickname || post.author.username}</p>
                <small>Создан: ${formattedDate}</small>
            `;

            // Отображение комментариев
            commentsContainer.innerHTML = '';
            comments.forEach((comment) => {
                const isAuthor = comment.author_id._id === currentUser._id;
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <p>${comment.content}</p>
                    <p>Автор: ${comment.author_id.nickname || comment.author_id.username}</p>
                    <small>${new Date(comment.createdAt).toLocaleString()}</small>
                    ${
                    isAuthor
                        ? `
                                <button class="edit-comment" data-id="${comment._id}">Редактировать</button>
                                <button class="delete-comment" data-id="${comment._id}">Удалить</button>
                              `
                        : ''
                }
                `;
                commentsContainer.appendChild(commentElement);
            });
        } catch (err) {
            console.error('Ошибка при загрузке поста и комментариев:', err);
            alert('Не удалось загрузить пост.');
        }
    };

    // Отправка комментария
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const commentContentValue = commentContent.value.trim();

        if (!commentContentValue) {
            alert('Комментарий не может быть пустым.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/comments/create', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ post_id: postId, content: commentContentValue }),
            });

            if (!response.ok) throw new Error('Не удалось отправить комментарий');

            commentContent.value = ''; // Очищаем поле ввода
            await loadPostAndComments(); // Обновляем список комментариев
        } catch (err) {
            console.error('Ошибка при добавлении комментария:', err);
            alert('Не удалось отправить комментарий.');
        }
    });

    // Обработка кнопок редактирования и удаления
    commentsContainer.addEventListener('click', async (e) => {
        const commentId = e.target.dataset.id;

        if (e.target.classList.contains('edit-comment')) {
            const newContent = prompt('Введите новый текст комментария:');
            if (!newContent) return;

            try {
                const response = await fetch(`http://localhost:5000/comments/${commentId}`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content: newContent }),
                });

                if (!response.ok) throw new Error('Не удалось обновить комментарий');
                await loadPostAndComments(); // Обновляем комментарии
            } catch (err) {
                console.error('Ошибка при обновлении комментария:', err);
                alert('Не удалось обновить комментарий.');
            }
        } else if (e.target.classList.contains('delete-comment')) {
            if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return;

            try {
                const response = await fetch(`http://localhost:5000/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Не удалось удалить комментарий');
                await loadPostAndComments(); // Обновляем комментарии
            } catch (err) {
                console.error('Ошибка при удалении комментария:', err);
                alert('Не удалось удалить комментарий.');
            }
        }
    });

    // Загрузка поста и комментариев при открытии страницы
    await loadPostAndComments();
});
