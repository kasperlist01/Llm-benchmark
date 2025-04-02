// app/static/js/benchmarkSelector.js
let allBenchmarks = [];
let selectedBenchmarks = [];
let activeCategory = 'general';

function initBenchmarkSelector() {
    // Fetch benchmarks from API
    fetch('/api/benchmarks')
        .then(response => response.json())
        .then(benchmarks => {
            allBenchmarks = benchmarks;
            renderBenchmarkCategories();
            renderBenchmarks();
        })
        .catch(error => {
            console.error('Error fetching benchmarks:', error);
        });
}

function renderBenchmarkCategories() {
    const categoriesContainer = document.getElementById('benchmarkCategories');
    categoriesContainer.innerHTML = '';

    // Get unique categories
    const categories = [...new Set(allBenchmarks.map(b => b.category))];

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

    // Filter benchmarks by active category
    const filteredBenchmarks = allBenchmarks.filter(b => b.category === activeCategory);

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
        emptyMessage.textContent = 'No benchmarks selected';
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
