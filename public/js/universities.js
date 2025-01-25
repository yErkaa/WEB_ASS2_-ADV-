// Функция для отображения модального окна
function showModal(message, input = false, callback = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            ${input ? '<textarea id="modalInput"></textarea>' : ''}
            <button id="modalOkButton">OK</button>
        </div>
    `;
    document.body.appendChild(modal);

    const modalInput = document.getElementById('modalInput');
    const okButton = document.getElementById('modalOkButton');
    okButton.addEventListener('click', () => {
        if (input && callback) {
            callback(modalInput.value);
        }
        document.body.removeChild(modal);
    });
}

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
        showModal('Не удалось загрузить список университетов.');
    }
});
