function showModal(message, input = false, callback = null, delayReload = false) {
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

        if (delayReload) {
            setTimeout(() => {
                location.reload();
            }, 1000); // Делаем задержку в 1 секунду
        }
    });
}

document.getElementById('addUniversity').addEventListener('click', async () => {
    const name = document.getElementById('universityName').value.trim();
    const address = document.getElementById('universityAddress').value.trim();
    const description = document.getElementById('universityDescription').value.trim();
    const token = localStorage.getItem('token');

    if (!name || !address || !description) {
        showModal('Заполните все поля!');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/admin/university', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, address, description }),
        });

        if (!response.ok) throw new Error('Ошибка при добавлении университета');

        showModal('Университет добавлен!', false, null, true); // Добавляем задержку перед обновлением
    } catch (err) {
        console.error('Ошибка при добавлении университета:', err);
        showModal('Ошибка сервера');
    }
});
