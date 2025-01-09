document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Вы не авторизованы. Перенаправляем на страницу входа...');
        window.location.href = 'login.html';
        return;
    }

    const universitySelect = document.getElementById('university');

    try {
        const response = await fetch('http://localhost:5000/universities', {
            headers: {
                'Authorization': `Bearer ${token}`, // Передаем токен для авторизации
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить университеты');
        }

        const universities = await response.json();
        console.log('Загруженные университеты:', universities);

        universitySelect.innerHTML = ''; // Очистка существующих опций

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Выберите университет';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        universitySelect.appendChild(defaultOption);

        universities.forEach(university => {
            const option = document.createElement('option');
            option.value = university.name; // Используем название университета
            option.textContent = university.name; // Отображаем название университета
            universitySelect.appendChild(option);
        });
    } catch (err) {
        console.error('Ошибка загрузки университетов:', err);
        alert('Не удалось загрузить список университетов.');
    }

    document.getElementById('postForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const university = document.getElementById('university').value;
        const title = document.getElementById('title').value;
        const review = document.getElementById('review').value;
        const rating = parseInt(document.getElementById('rating').value, 10); // Преобразование в число

        if (!university || !title || !review || !rating) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        console.log({ university, title, review, rating }); // Для отладки

        try {
            const response = await fetch('http://localhost:5000/posts/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ university, title, review, rating }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Пост успешно создан!');
                window.location.href = 'index.html';
            } else {
                alert(`Ошибка создания поста: ${data.error}`);
            }
        } catch (err) {
            console.error('Ошибка при создании поста:', err);
            alert('Ошибка сервера. Попробуйте позже.');
        }
    });
});
