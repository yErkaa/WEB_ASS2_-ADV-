document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ Скрипт ratings.js загружен!");

    let barChart, detailedChart, pieChart; // 👈 Глобальные переменные для графиков
    const select = document.getElementById("universityFilter");


    try {
        const response = await fetch("http://localhost:5000/universities/ratings");
        if (!response.ok) throw new Error("Ошибка загрузки данных");

        const universities = await response.json();
        console.log("✅ Данные университетов:", universities);

        const postsResponse = await fetch("http://localhost:5000/posts/get");
        if (!postsResponse.ok) throw new Error("Ошибка загрузки постов");

        const posts = await postsResponse.json();
        console.log("✅ Данные постов:", posts);

        select.innerHTML = "";

        universities.forEach(u => {
            const option = document.createElement("option");
            option.value = u._id;
            option.textContent = u.name;
            select.appendChild(option);
        });


        // 📊 Средний рейтинг университетов
        function calculateAvgRatings() {
            return universities.map(u => {
                const ratings = posts.filter(p => p.university?._id === u._id || p.university === u._id);
                const avg = ratings.length ? (ratings.reduce((sum, p) => sum + p.rating, 0) / ratings.length).toFixed(1) : 0;
                return avg;
            });
        }

        const maxLabelLength = 15; // Максимальная длина названия
        const shortenedLabels = universities.map(u =>
            u.name.length > maxLabelLength ? u.name.substring(0, maxLabelLength) + "..." : u.name
        );
        const fullLabels = universities.map(u => u.name); // Полные названия для тултипов
        let avgRatings = calculateAvgRatings();

        function createBarChart() {
            if (barChart) barChart.destroy(); // Уничтожаем старый график перед созданием нового

            barChart = new Chart(document.getElementById("barChart"), {
                type: "bar",
                data: {
                    labels: shortenedLabels, // Сокращенные названия университетов
                    datasets: [{
                        label: "Средний рейтинг",
                        data: avgRatings,
                        backgroundColor: "rgba(40, 167, 69, 0.8)",
                        borderColor: "rgba(40, 167, 69, 1)",
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: function(tooltipItem) {
                                    return fullLabels[tooltipItem[0].dataIndex]; // Полное название университета
                                }
                            }
                        },
                        datalabels: {
                            anchor: 'end', // Подпись сверху колонок
                            align: 'top',
                            formatter: (value) => value, // Показываем число
                            color: 'black',
                            font: {
                                weight: 'bold',
                                size: 12
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    size: 10 // Уменьшаем шрифт подписей оси X
                                },
                                callback: function(value, index) {
                                    return shortenedLabels[index]; // Показываем сокращенные названия
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 5,
                            stepSize: 1,

                        }
                    }
                },
                plugins: [ChartDataLabels] // Включаем плагин для отображения подписей
            });
        }


        // 📊 График оценок 1-5
        function createDetailedChart() {
            if (detailedChart) detailedChart.destroy();

            detailedChart = new Chart(document.getElementById("detailedChart"), {
                type: "bar",
                data: {
                    labels: ["1⭐", "2⭐", "3⭐", "4⭐", "5⭐"],
                    datasets: [{ label: "Количество отзывов", data: [0, 0, 0, 0, 0], backgroundColor: "rgba(40, 167, 69, 0.8)" }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        }

        // 🔄 Функция обновления по университету
        function updateDetailedChart(universityId) {
            const reviews = posts.filter(p => p.university?._id === universityId || p.university === universityId);
            const ratingsCount = [0, 0, 0, 0, 0];

            reviews.forEach(p => ratingsCount[p.rating - 1]++);

            detailedChart.data.datasets[0].data = ratingsCount;
            detailedChart.update();
        }
        function createPieChart() {
            if (pieChart) pieChart.destroy();

            pieChart = new Chart(document.getElementById("pieChart"), {
                type: "doughnut",
                data: {
                    labels: ["Положительные", "Отрицательные"],
                    datasets: [{
                        data: [
                            posts.filter(p => p.rating >= 4).length,
                            posts.filter(p => p.rating <= 2).length
                        ],
                        backgroundColor: ["rgba(40, 167, 69, 0.8)", "rgba(220, 53, 69, 0.8)"],
                        borderColor: ["rgba(40, 167, 69, 1)", "rgba(220, 53, 69, 1)"],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "top",
                            labels: {
                                font: { size: 12 }
                            }
                        }
                    }
                }
            });
        }

        createBarChart();
        createDetailedChart();
        createPieChart();


// 📌 По умолчанию выбираем первый университет
        if (universities.length > 0) {
            select.value = universities[0]._id; // Устанавливаем первый университет
            updateDetailedChart(universities[0]._id); // Загружаем данные для него
        }


        // ✅ По умолчанию показываем первый университет
        if (universities.length > 0) {
            updateDetailedChart(universities[0]._id);
        }
        // 📌 Обновляем данные при смене университета
        select.addEventListener("change", () => {
            updateDetailedChart(select.value);
        });

        console.log("📊 Средние рейтинги университетов:", avgRatings);


    } catch (error) {
        console.error("❌ Ошибка загрузки данных рейтингов:", error);
    }
});
