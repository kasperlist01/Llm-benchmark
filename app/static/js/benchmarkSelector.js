// app/static/js/benchmarkSelector.js
let allBenchmarks = [];
let selectedBenchmarks = [];
let activeCategory = 'general';
let compatibleBenchmarks = []; // Добавлена переменная для хранения совместимых бенчмарков

function initBenchmarkSelector() {
    // Fetch benchmarks from API
    fetch('/api/benchmarks')
        .then(response => response.json())
        .then(benchmarks => {
            allBenchmarks = benchmarks;
            filterCompatibleBenchmarks(); // Добавлен вызов функции фильтрации
            renderBenchmarkCategories();
            renderBenchmarks();
        })
        .catch(error => {
            console.error('Ошибка загрузки бенчмарков:', error);
        });
}

// Добавлена новая функция для фильтрации бенчмарков по типу моделей
function filterCompatibleBenchmarks() {
    const selectedModelIds = getSelectedModels();

    // Проверяем, есть ли среди выбранных хотя бы одна стандартная и одна пользовательская модель
    const hasStandardModels = selectedModelIds.some(id => !id.startsWith('custom_'));
    const hasCustomModels = selectedModelIds.some(id => id.startsWith('custom_'));

    if (hasStandardModels && !hasCustomModels) {
        // Если выбраны только стандартные модели, показываем бенчмарки для стандартных моделей
        compatibleBenchmarks = allBenchmarks.filter(b => b.model_type === 'standard');
    } else if (!hasStandardModels && hasCustomModels) {
        // Если выбраны только пользовательские модели, показываем бенчмарки для пользовательских моделей
        compatibleBenchmarks = allBenchmarks.filter(b => b.model_type === 'custom');
    } else if (hasStandardModels && hasCustomModels) {
        // Если выбраны и те и другие, показываем только пользовательские бенчмарки
        compatibleBenchmarks = allBenchmarks.filter(b => b.model_type === 'custom');
    } else {
        // Если ничего не выбрано, показываем все бенчмарки
        compatibleBenchmarks = allBenchmarks;
    }

    // Удаляем из выбранных бенчмарков те, которые больше не совместимы
    selectedBenchmarks = selectedBenchmarks.filter(b =>
        compatibleBenchmarks.some(cb => cb.id === b.id)
    );
}

function renderBenchmarkCategories() {
    const categoriesContainer = document.getElementById('benchmarkCategories');
    categoriesContainer.innerHTML = '';

    // Get unique categories from compatible benchmarks
    const categories = [...new Set(compatibleBenchmarks.map(b => b.category))];

    // Если текущая активная категория больше не в списке, выбираем первую доступную
    if (!categories.includes(activeCategory) && categories.length > 0) {
        activeCategory = categories[0];
    }

    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `category-button ${activeCategory === category ? 'active' : ''}`;
        button.textContent = category;
        button.addEventListener('click', () => {
            activeCategory = category;
            renderBenchmarkCategories();
            renderBenchmarks();
        });

        categoriesContainer.appendChild(button);
    });
}

function renderBenchmarks() {
    const benchmarksList = document.getElementById('benchmarksList');
    benchmarksList.innerHTML = '';

    // Filter benchmarks by active category from compatible benchmarks
    const filteredBenchmarks = compatibleBenchmarks.filter(b => b.category === activeCategory);

    filteredBenchmarks.forEach(benchmark => {
        const isSelected = selectedBenchmarks.some(b => b.id === benchmark.id);
        const benchmarkItem = document.createElement('div');
        benchmarkItem.className = `benchmark-item ${isSelected ? 'selected' : ''}`;

        benchmarkItem.innerHTML = `
            <div class="benchmark-checkbox">
                ${isSelected ? '<span>✓</span>' : ''}
            </div>
            <div class="benchmark-details">
                <h3>${benchmark.name}</h3>
                <p>${benchmark.description}</p>
                <div class="benchmark-metrics">
                    ${benchmark.metrics.map(metric => `<span class="metric-tag">${metric}</span>`).join('')}
                </div>
            </div>
        `;

        benchmarkItem.addEventListener('click', () => toggleBenchmarkSelection(benchmark));
        benchmarksList.appendChild(benchmarkItem);
    });

    updateSelectedBenchmarksList();
}

function toggleBenchmarkSelection(benchmark) {
    const index = selectedBenchmarks.findIndex(b => b.id === benchmark.id);
    if (index === -1) {
        selectedBenchmarks.push(benchmark);
    } else {
        selectedBenchmarks.splice(index, 1);
    }

    renderBenchmarks();
}

function updateSelectedBenchmarksList() {
    const selectedBenchmarksList = document.getElementById('selectedBenchmarksList');
    const selectedBenchmarksCount = document.getElementById('selectedBenchmarksCount');

    selectedBenchmarksCount.textContent = selectedBenchmarks.length;
    selectedBenchmarksList.innerHTML = '';

    if (selectedBenchmarks.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-selection';
        emptyMessage.textContent = 'Бенчмарки не выбраны';
        selectedBenchmarksList.appendChild(emptyMessage);
        return;
    }

    selectedBenchmarks.forEach(benchmark => {
        const pill = document.createElement('div');
        pill.className = 'selected-benchmark-pill';
        pill.innerHTML = `
            ${benchmark.name}
            <button>&times;</button>
        `;

        pill.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBenchmarkSelection(benchmark);
        });

        selectedBenchmarksList.appendChild(pill);
    });
}

function getSelectedBenchmarks() {
    return selectedBenchmarks.map(benchmark => benchmark.id);
}