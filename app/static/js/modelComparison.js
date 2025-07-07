let availableModels = [];
let selectedModels = [];
let judgeModelId = null;

function initModelComparison() {
    fetch('/api/all-models')
        .then(response => response.json())
        .then(models => {
            availableModels = models;
            return fetch('/api/judge-model');
        })
        .then(response => response.json())
        .then(judgeModel => {
            if (judgeModel && judgeModel.id) {
                judgeModelId = judgeModel.id;
            }
            renderModels();
        })
        .catch(error => {
            console.error('Ошибка при получении моделей:', error);
            renderModels();
        });
}

function renderModels() {
    const modelsGrid = document.getElementById('modelsGrid');
    modelsGrid.innerHTML = '';

    if (availableModels.length === 0) {
        modelsGrid.innerHTML = `
            <div class="empty-models">
                <i class="fas fa-robot fa-2x"></i>
                <p>У вас пока нет добавленных моделей. <a href="/user/models">Добавьте модели</a> чтобы начать тестирование.</p>
            </div>
        `;
        return;
    }

    const modelsContainer = document.createElement('div');
    modelsContainer.className = 'models-scroll-container';
    modelsGrid.appendChild(modelsContainer);

    availableModels.forEach(model => {
        const isSelected = selectedModels.some(m => m.id === model.id);
        const modelCard = document.createElement('div');
        modelCard.className = `model-card ${isSelected ? 'selected' : ''}`;

        const initials = model.name.substring(0, 2).toUpperCase();
        const isJudgeModel = judgeModelId && model.id === judgeModelId;

        modelCard.innerHTML = `
            <div class="model-icon" style="background-color: ${model.color || '#808080'}">
                ${initials}
            </div>
            <div class="model-info">
                <h3 title="${model.name}">
                    ${model.name}
                    ${isJudgeModel ? '<span class="judge-indicator"><i class="fas fa-gavel"></i> СУДЬЯ</span>' : ''}
                </h3>
                <p title="${model.provider || ''}">${model.provider || ''}</p>
                <div class="model-tags">
                    <span class="tag custom-tag">Пользовательская</span>
                    ${model.has_api ? '<span class="tag api-tag">API</span>' : '<span class="tag no-api-tag">Нет API</span>'}
                </div>
            </div>
        `;

        modelCard.addEventListener('click', () => toggleModelSelection(model));
        modelsContainer.appendChild(modelCard);
    });

    updateSelectedModelsList();
}

function toggleModelSelection(model) {
    const index = selectedModels.findIndex(m => m.id === model.id);
    if (index === -1) {
        selectedModels.push(model);
    } else {
        selectedModels.splice(index, 1);
    }

    if (typeof filterCompatibleBenchmarks === 'function') {
        filterCompatibleBenchmarks();
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

function checkModelBenchmarkCompatibility(models, benchmarks, datasets) {
    if (!datasets || datasets.length === 0) {
        return {
            compatible: false,
            message: 'Для проведения тестирования необходимо выбрать хотя бы один датасет'
        };
    }

    const hasBlindTest = benchmarks.includes('blind_test');
    const hasJudgeEval = benchmarks.includes('judge_eval');
    const hasReferenceComparison = benchmarks.includes('reference_comparison');
    const hasMetricsComparison = benchmarks.includes('metrics_comparison');

    if (hasBlindTest || hasJudgeEval) {
        const specialTest = hasBlindTest ? 'Слепой тест' : 'Оценка судьёй';

        if (benchmarks.length > 1) {
            return {
                compatible: false,
                message: `${specialTest} нельзя комбинировать с другими тестами`
            };
        }

        const apiModels = models.filter(model => model.has_api);
        if (apiModels.length < 2) {
            return {
                compatible: false,
                message: `${specialTest} требует минимум 2 модели с доступом к API`
            };
        }

        return {
            compatible: true,
            message: `${specialTest} будет выполнен с использованием выбранных датасетов`
        };
    }

    if (hasReferenceComparison) {
        if (benchmarks.length > 1) {
            return {
                compatible: false,
                message: 'Сравнение с эталоном нельзя комбинировать с другими тестами'
            };
        }

        const apiModels = models.filter(model => model.has_api);
        if (apiModels.length === 0) {
            return {
                compatible: false,
                message: 'Сравнение с эталоном требует хотя бы одну модель с доступом к API'
            };
        }

        return {
            compatible: true,
            message: 'Сравнение с эталоном будет выполнено с использованием выбранных датасетов'
        };
    }

    if (hasMetricsComparison) {
        if (benchmarks.length > 1) {
            return {
                compatible: false,
                message: 'Сравнение по метрикам нельзя комбинировать с другими тестами'
            };
        }

        const apiModels = models.filter(model => model.has_api);
        if (apiModels.length === 0) {
            return {
                compatible: false,
                message: 'Сравнение по метрикам требует хотя бы одну модель с доступом к API'
            };
        }

        return {
            compatible: true,
            message: 'Сравнение по метрикам будет выполнено с использованием количественных метрик'
        };
    }

    return {
        compatible: true
    };
}