let metricsConfig = {
    rouge: {weight: 0.4},
    semantic: {weight: 0.3},
    bertScore: {weight: 0.3}
};

function initMetricsConfiguration() {
    const rougeSlider = document.getElementById('rougeWeight');
    const semanticSlider = document.getElementById('semanticWeight');
    const bertScoreSlider = document.getElementById('bertScoreWeight');

    if (rougeSlider) {
        rougeSlider.addEventListener('input', () => {
            const newValue = parseFloat(rougeSlider.value);
            updateMetricWeightWithValidation('rouge', newValue, rougeSlider);
        });
    }

    if (semanticSlider) {
        semanticSlider.addEventListener('input', () => {
            const newValue = parseFloat(semanticSlider.value);
            updateMetricWeightWithValidation('semantic', newValue, semanticSlider);
        });
    }

    if (bertScoreSlider) {
        bertScoreSlider.addEventListener('input', () => {
            const newValue = parseFloat(bertScoreSlider.value);
            updateMetricWeightWithValidation('bertScore', newValue, bertScoreSlider);
        });
    }

    // Инициализируем отображение значений
    updateAllDisplays();
}

function updateMetricWeightWithValidation(metricKey, newValue, sliderElement) {
    // Сохраняем старое значение
    const oldValue = metricsConfig[metricKey].weight;

    // Временно устанавливаем новое значение для проверки
    metricsConfig[metricKey].weight = newValue;

    // Проверяем общую сумму
    const totalWeight = Object.values(metricsConfig).reduce((sum, config) => sum + config.weight, 0);

    // Если сумма превышает 1.0, возвращаем старое значение и блокируем изменение
    if (totalWeight > 1.0) {
        metricsConfig[metricKey].weight = oldValue;
        sliderElement.value = oldValue;
        return;
    }

    // Если все в порядке, обновляем отображение
    updateMetricDisplay(metricKey, newValue);
}

function updateMetricDisplay(metricKey, value) {
    const valueElement = document.getElementById(`${metricKey}WeightValue`);
    if (valueElement) {
        valueElement.textContent = value.toFixed(1);
    }
}

function updateAllDisplays() {
    updateMetricDisplay('rouge', metricsConfig.rouge.weight);
    updateMetricDisplay('semantic', metricsConfig.semantic.weight);
    updateMetricDisplay('bertScore', metricsConfig.bertScore.weight);
}

function showMetricsConfiguration() {
    const container = document.getElementById('metricsConfigurationContainer');
    if (container) {
        container.style.display = 'block';
    }
}

function hideMetricsConfiguration() {
    const container = document.getElementById('metricsConfigurationContainer');
    if (container) {
        container.style.display = 'none';
    }
}

function getMetricsConfiguration() {
    return {
        config: metricsConfig,
        type: 'metrics'
    };
}