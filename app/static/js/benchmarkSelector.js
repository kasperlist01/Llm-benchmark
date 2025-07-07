let allBenchmarks = [];
let selectedBenchmarks = [];
let compatibleBenchmarks = [];

function initBenchmarkSelector() {
    fetch('/api/benchmarks')
        .then(response => response.json())
        .then(benchmarks => {
            allBenchmarks = benchmarks;
            filterCompatibleBenchmarks();
            renderBenchmarks();
        })
        .catch(error => {
            console.error('Ошибка загрузки бенчмарков:', error);
        });
}

function filterCompatibleBenchmarks() {
    const selectedModelIds = getSelectedModels();

    if (selectedModelIds.length > 0) {
        compatibleBenchmarks = allBenchmarks;
    } else {
        compatibleBenchmarks = allBenchmarks;
    }

    selectedBenchmarks = selectedBenchmarks.filter(b =>
        compatibleBenchmarks.some(cb => cb.id === b.id)
    );
}

function renderBenchmarks() {
    const benchmarksList = document.getElementById('benchmarksList');
    benchmarksList.innerHTML = '';

    if (compatibleBenchmarks.length === 0) {
        benchmarksList.innerHTML = `
            <div class="empty-benchmarks">
                <p>Нет доступных тестов</p>
            </div>
        `;
        updateSelectedBenchmarksList();
        return;
    }

    const benchmarksContainer = document.createElement('div');
    benchmarksContainer.className = 'benchmarks-scroll-container';
    benchmarksList.appendChild(benchmarksContainer);

    compatibleBenchmarks.forEach(benchmark => {
        const isSelected = selectedBenchmarks.some(b => b.id === benchmark.id);
        const benchmarkItem = document.createElement('div');
        benchmarkItem.className = `benchmark-item ${isSelected ? 'selected' : ''}`;

        benchmarkItem.innerHTML = `
            <div class="benchmark-details">
                <h3>${benchmark.name}</h3>
                <p>${benchmark.description}</p>
                <div class="benchmark-metrics">
                    ${benchmark.metrics.map(metric => `<span class="metric-tag">${metric}</span>`).join('')}
                </div>
            </div>
        `;

        benchmarkItem.addEventListener('click', () => toggleBenchmarkSelection(benchmark));
        benchmarksContainer.appendChild(benchmarkItem);
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

    updateMetricsDisplay();

    renderBenchmarks();
}

function updateMetricsDisplay() {
    const metricsComparisonSelected = selectedBenchmarks.some(b => b.id === 'metrics_comparison');

    if (typeof showMetricsConfiguration === 'function' && typeof hideMetricsConfiguration === 'function') {
        if (metricsComparisonSelected) {
            showMetricsConfiguration();
        } else {
            hideMetricsConfiguration();
        }
    }
}

function updateSelectedBenchmarksList() {
    const selectedBenchmarksList = document.getElementById('selectedBenchmarksList');
    const selectedBenchmarksCount = document.getElementById('selectedBenchmarksCount');

    selectedBenchmarksCount.textContent = selectedBenchmarks.length;
    selectedBenchmarksList.innerHTML = '';

    if (selectedBenchmarks.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-selection';
        emptyMessage.textContent = 'Тесты не выбраны';
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