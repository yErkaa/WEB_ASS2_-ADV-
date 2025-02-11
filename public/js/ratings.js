console.log("✅ Скрипт ratings.js загружен!"); // Проверка загрузки

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('/universities/ratings');
        console.log("Ответ API /universities/ratings:", response);

        if (!response.ok) throw new Error(`Ошибка загрузки данных: ${response.statusText}`);

        const data = await response.json();
        console.log("✅ Данные рейтингов:", data);

        if (!data.length) {
            console.warn("⚠️ Нет данных для отображения графиков!");
            return;
        }

        const universityNames = data.map(u => u.name);
        const positiveCounts = data.map(u => u.positive);
        const negativeCounts = data.map(u => u.negative);

        const ctxBar = document.getElementById("barChart").getContext("2d");
        new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: universityNames,
                datasets: [
                    { label: "Положительные", data: positiveCounts, backgroundColor: "green" },
                    { label: "Отрицательные", data: negativeCounts, backgroundColor: "red" }
                ]
            },
            options: { responsive: true }
        });

        const totalPositive = positiveCounts.reduce((sum, val) => sum + val, 0);
        const totalNegative = negativeCounts.reduce((sum, val) => sum + val, 0);

        const ctxPie = document.getElementById("pieChart").getContext("2d");
        new Chart(ctxPie, {
            type: "pie",
            data: {
                labels: ["Положительные", "Отрицательные"],
                datasets: [
                    { data: [totalPositive, totalNegative], backgroundColor: ["green", "red"] }
                ]
            }
        });

    } catch (err) {
        console.error("❌ Ошибка загрузки данных рейтингов:", err);
    }
});
