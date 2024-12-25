document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const avatarInput = document.getElementById('avatar');
    const avatar = avatarInput.files[0];

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    if (avatar) {
        formData.append('avatar', avatar);
    }

    try {
        const response = await fetch('http://localhost:5000/auth/register', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            alert('Регистрация успешна! Перенаправляем на страницу входа...');
            window.location.href = 'login.html';
        } else {
            const error = await response.json();
            alert(`Ошибка регистрации: ${error.error}`);
        }
    } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось зарегистрироваться. Попробуйте снова.');
    }
});
