// app/static/js/modelComparison.js
let availableModels = [];
let selectedModels = [];
let modelCategories = {
    'standard': 'Стандартные модели',
    'custom': 'Мои пользовательские модели'
};

function initModelComparison() {
    // Fetch available models from API (now including user models)
    fetch('/api/all-models')
        .then(response => response.json())
        .then(models => {
            availableModels = models;
            renderModels();
        })
        .catch(error => {
            console.error('Ошибка при получении моделей:', error);
        });
}

function renderModels() {
    const modelsGrid = document.getElementById('modelsGrid');
    modelsGrid.innerHTML = '';

    // Group models by type (standard vs custom)
    const standardModels = availableModels.filter(model => model.type !== 'custom');
    const customModels = availableModels.filter(model => model.type === 'custom');

    // Create section for standard models
    if (standardModels.length > 0) {
        createModelSection('standard', standardModels, modelsGrid);
    }

    // Create section for custom models
    if (customModels.length > 0) {
        createModelSection('custom', customModels, modelsGrid);
    }

    updateSelectedModelsList();
}

function createModelSection(categoryKey, models, container) {
    // Create section header
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'model-section-header';
    sectionHeader.innerHTML = `<h3>${modelCategories[categoryKey]}</h3>`;
    container.appendChild(sectionHeader);

    // Create grid for this category
    const categoryGrid = document.createElement('div');
    categoryGrid.className = 'models-category-grid';
    container.appendChild(categoryGrid);

    // Add models to grid
    models.forEach(model => {
        const isSelected = selectedModels.some(m => m.id === model.id);
        const modelCard = document.createElement('div');
        modelCard.className = `model-card ${isSelected ? 'selected' : ''}`;

        // Add custom class for user models
        if (model.type === 'custom') {
            modelCard.classList.add('custom-model');
        }

        // Создаем инициалы из первых двух букв имени модели
        const initials = model.name.substring(0, 2).toUpperCase();

        modelCard.innerHTML = `
            <div class="model-icon" style="background-color: ${model.color || '#808080'}">
                ${initials}
            </div>
            <div class="model-info">
                <h3 title="${model.name}">${model.name}</h3>
                <p title="${model.provider || ''}">${model.provider || ''}</p>
                <div class="model-tags">
                    ${model.type === 'api' ? '<span class="tag api-tag">API</span>' : ''}
                    ${model.type === 'open' ? '<span class="tag open-tag">Открытая</span>' : ''}
                    ${model.type === 'custom' ? '<span class="tag custom-tag">Пользовательская</span>' : ''}
                    ${model.size ? `<span class="tag size-tag">${model.size}</span>` : ''}
                </div>
            </div>
        `;

        modelCard.addEventListener('click', () => toggleModelSelection(model));
        categoryGrid.appendChild(modelCard);
    });
}

function toggleModelSelection(model) {
    const index = selectedModels.findIndex(m => m.id === model.id);
    if (index === -1) {
        selectedModels.push(model);
    } else {
        selectedModels.splice(index, 1);
    }

    // Обновляем список совместимых бенчмарков при изменении выбранных моделей
    if (typeof filterCompatibleBenchmarks === 'function') {
        filterCompatibleBenchmarks();
        renderBenchmarkCategories();
        renderBenchmarks();
    }

    renderModels();
}

function updateSelectedModelsList() {
    const selectedModelsList = document.getElementById('selectedModelsList');
    const selectedModelsCount = document.getElementById('selectedModelsCount');

    selectedModelsCount.textContent = selectedModels.length;
    selectedModelsList.innerHTML = '';

    if (selectedModels.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-selection';
        emptyMessage.textContent = 'Модели не выбраны';
        selectedModelsList.appendChild(emptyMessage);
        return;
    }

    selectedModels.forEach(model => {
        const pill = document.createElement('div');
        pill.className = 'selected-model-pill';
        pill.innerHTML = `
            ${model.name}
            <button>&times;</button>
        `;

        pill.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleModelSelection(model);
        });

        selectedModelsList.appendChild(pill);
    });
}

function getSelectedModels() {
    return selectedModels.map(model => model.id);
}

// Добавить следующую функцию
function hasApiAccess(model) {
    return (model.type === 'api' || (model.type === 'custom' && model.api_url));
}

// Функция для проверки совместимости моделей с бенчмарками
function checkModelBenchmarkCompatibility(models, benchmarks) {
    // Проверяем, есть ли среди выбранных хотя бы одна стандартная и одна пользовательская модель
    const hasStandardModels = models.some(model => model.type !== 'custom');
    const hasCustomModels = models.some(model => model.type === 'custom');

    // Проверяем, есть ли среди выбранных бенчмарков несовместимые с типами моделей
    if (hasStandardModels && !hasCustomModels) {
        // Если только стандартные модели, но выбраны бенчмарки для пользовательских
        const hasCustomBenchmarks = benchmarks.some(benchId => {
            const bench = allBenchmarks.find(b => b.id === benchId);
            return bench && bench.model_type === 'custom';
        });

        if (hasCustomBenchmarks) {
            return {
                compatible: false,
                message: 'Выбранные бенчмарки совместимы только с пользовательскими моделями'
            };
        }
    } else if (!hasStandardModels && hasCustomModels) {
        // Если только пользовательские модели, но выбраны бенчмарки для стандартных
        const hasStandardBenchmarks = benchmarks.some(benchId => {
            const bench = allBenchmarks.find(b => b.id === benchId);
            return bench && bench.model_type === 'standard';
        });

        if (hasStandardBenchmarks) {
            return {
                compatible: false,
                message: 'Выбранные бенчмарки совместимы только со стандартными моделями'
            };
        }
    }

    // ---- SPECIAL TESTS ------------------------------------------------------
    // Check for blind test or GPT-4o evaluation
    const hasBlindTest = benchmarks.includes('blind_test');
    const hasGpt4oEval = benchmarks.includes('gpt4o_eval');

    if (hasBlindTest || hasGpt4oEval) {
        const specialTest = hasBlindTest ? 'Слепой тест' : 'GPT-4o Evaluation';

        // 1 ⟶ нельзя совмещать с другими бенчмарками
        if (benchmarks.length > 1) {
            return {
                compatible: false,
                message: `${specialTest} нельзя комбинировать с другими бенчмарками`
            };
        }

        // 2 ⟶ должно быть минимум две модели с API доступом
        const apiModels = models.filter(hasApiAccess);
        if (apiModels.length < 2) {
            return {
                compatible: false,
                message: `Выберите как минимум две модели с доступом к API для ${specialTest}`
            };
        }
    }

    return {
        compatible: true
    };
}