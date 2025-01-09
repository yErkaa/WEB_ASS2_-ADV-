document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            alert('Вход успешен! Перенаправляем на профиль...');
            window.location.href = 'profile.html';
        } else {
            const error = await response.json();
            alert(`Ошибка входа: ${error.error}`);
        }
    } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось войти. Попробуйте снова.');
    }
});
