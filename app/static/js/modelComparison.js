// app/static/js/modelComparison.js
let availableModels = [];
let selectedModels = [];

function initModelComparison() {
    // Fetch available models from API (now including user models)
    fetch('/api/all-models')
        .then(response => response.json())
        .then(models => {
            availableModels = models;
            renderModels();
        })
        .catch(error => {
            console.error('Error fetching models:', error);
        });
}

function renderModels() {
    const modelsGrid = document.getElementById('modelsGrid');
    modelsGrid.innerHTML = '';

    availableModels.forEach(model => {
        const isSelected = selectedModels.some(m => m.id === model.id);
        const modelCard = document.createElement('div');
        modelCard.className = `model-card ${isSelected ? 'selected' : ''}`;

        // Add custom class for user models
        if (model.type === 'custom') {
            modelCard.classList.add('custom-model');
        }

        modelCard.innerHTML = `
            <div class="model-icon" style="background-color: ${model.color}">
                ${model.name.substring(0, 2)}
            </div>
            <div class="model-info">
                <h3>${model.name}</h3>
                <p>${model.provider}</p>
                <div class="model-tags">
                    ${model.type === 'api' ? '<span class="tag api-tag">API</span>' : ''}
                    ${model.type === 'open' ? '<span class="tag open-tag">Open Source</span>' : ''}
                    ${model.type === 'custom' ? '<span class="tag custom-tag">Custom</span>' : ''}
                    ${model.size ? `<span class="tag size-tag">${model.size}</span>` : ''}
                </div>
            </div>
        `;

        modelCard.addEventListener('click', () => toggleModelSelection(model));
        modelsGrid.appendChild(modelCard);
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
        emptyMessage.textContent = 'No models selected';
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