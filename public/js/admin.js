document.getElementById('addUniversity').addEventListener('click', async () => {
    const name = document.getElementById('universityName').value.trim();
    const address = document.getElementById('universityAddress').value.trim();
    const description = document.getElementById('universityDescription').value.trim();
    const token = localStorage.getItem('token');

    if (!name || !address || !description) {
        alert('Заполните все поля!');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/admin/university', { // 🛠 Исправленный маршрут
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, address, description }),
        });

        if (!response.ok) throw new Error('Ошибка при добавлении университета');

        alert('Университет добавлен!');
        location.reload();
    } catch (err) {
        console.error('Ошибка при добавлении университета:', err);
        alert('Ошибка сервера');
    }
});
