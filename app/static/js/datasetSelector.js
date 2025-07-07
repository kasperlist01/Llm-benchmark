let availableDatasets = [];
let selectedDatasets = [];

function initDatasetSelector() {
    fetch('/api/user-datasets')
        .then(response => response.json())
        .then(datasets => {
            availableDatasets = datasets;
            renderDatasets();
        })
        .catch(error => {
            console.error('Ошибка при получении датасетов:', error);
            renderDatasets();
        });
}

function renderDatasets() {
    const datasetsGrid = document.getElementById('datasetsGrid');
    datasetsGrid.innerHTML = '';

    if (availableDatasets.length === 0) {
        datasetsGrid.innerHTML = `
            <div class="empty-datasets">
                <i class="fas fa-table fa-2x"></i>
                <p>У вас пока нет загруженных датасетов. <a href="/user/datasets">Загрузите датасеты</a> чтобы использовать их в тестировании.</p>
            </div>
        `;
        updateSelectedDatasetsList();
        return;
    }

    const datasetsContainer = document.createElement('div');
    datasetsContainer.className = 'datasets-container';
    datasetsGrid.appendChild(datasetsContainer);

    availableDatasets.forEach(dataset => {
        const isSelected = selectedDatasets.some(d => d.id === dataset.id);
        const datasetCard = document.createElement('div');
        datasetCard.className = `dataset-card ${isSelected ? 'selected' : ''}`;

        const initials = dataset.name.substring(0, 2).toUpperCase();

        datasetCard.innerHTML = `
            <div class="dataset-icon">
                ${initials}
            </div>
            <div class="dataset-info">
                <h3 title="${dataset.name}">${dataset.name}</h3>
                <p title="${dataset.filename || ''}">${dataset.filename || ''}</p>
                <div class="dataset-tags">
                    <span class="stat">${dataset.row_count ? dataset.row_count.toLocaleString() + ' строк' : 'Неизвестно строк'}</span>
                    <span class="stat">${dataset.column_count || 'Неизвестно'} колонок</span>
                </div>
            </div>
        `;

        datasetCard.addEventListener('click', () => toggleDatasetSelection(dataset));
        datasetsContainer.appendChild(datasetCard);
    });

    updateSelectedDatasetsList();
}

function toggleDatasetSelection(dataset) {
    const index = selectedDatasets.findIndex(d => d.id === dataset.id);
    if (index === -1) {
        selectedDatasets.push(dataset);
    } else {
        selectedDatasets.splice(index, 1);
    }

    renderDatasets();
}

function updateSelectedDatasetsList() {
    const selectedDatasetsList = document.getElementById('selectedDatasetsList');
    const selectedDatasetsCount = document.getElementById('selectedDatasetsCount');

    selectedDatasetsCount.textContent = selectedDatasets.length;
    selectedDatasetsList.innerHTML = '';

    if (selectedDatasets.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-selection';
        emptyMessage.textContent = 'Датасеты не выбраны';
        selectedDatasetsList.appendChild(emptyMessage);
        return;
    }

    selectedDatasets.forEach(dataset => {
        const pill = document.createElement('div');
        pill.className = 'selected-dataset-pill';
        pill.innerHTML = `
            ${dataset.name}
            <button>&times;</button>
        `;

        pill.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDatasetSelection(dataset);
        });

        selectedDatasetsList.appendChild(pill);
    });
}

function getSelectedDatasets() {
    return selectedDatasets.map(dataset => dataset.id);
}