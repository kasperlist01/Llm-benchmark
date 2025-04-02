// app/static/js/metricsConfiguration.js
let metricsConfig = {
    quantitative: { weight: 0.5 },
    qualitative: { weight: 0.5 },
    hallucination: { weight: 0.3 },
    safety: { weight: 0.2 }
};

function initMetricsConfiguration() {
    // Set up event listeners for metric sliders
    const quantitativeSlider = document.getElementById('quantitativeWeight');
    const qualitativeSlider = document.getElementById('qualitativeWeight');
    const hallucinationSlider = document.getElementById('hallucinationWeight');
    const safetySlider = document.getElementById('safetyWeight');

    quantitativeSlider.addEventListener('input', () => {
        updateMetricWeight('quantitative', parseFloat(quantitativeSlider.value));
    });

    qualitativeSlider.addEventListener('input', () => {
        updateMetricWeight('qualitative', parseFloat(qualitativeSlider.value));
    });

    hallucinationSlider.addEventListener('input', () => {
        updateMetricWeight('hallucination', parseFloat(hallucinationSlider.value));
    });

    safetySlider.addEventListener('input', () => {
        updateMetricWeight('safety', parseFloat(safetySlider.value));
    });
}

function updateMetricWeight(metricKey, value) {
    metricsConfig[metricKey].weight = value;

    // Update the displayed value
    document.getElementById(`${metricKey}WeightValue`).textContent = value.toFixed(1);
}

function getMetricsConfiguration() {
    return metricsConfig;
}
