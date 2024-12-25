document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:5000/universities');
        if (!response.ok) throw new Error('Ошибка загрузки университетов');
        const universities = await response.json();

        const universitiesList = document.getElementById('universitiesList');
        universities.forEach(university => {
            const listItem = document.createElement('li');
            listItem.textContent = university;
            universitiesList.appendChild(listItem);
        });
    } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось загрузить список университетов.');
    }
});
