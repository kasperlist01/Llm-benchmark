// app/static/js/resultsVisualization.js
let currentResults = [];
let currentMetrics = {};
let currentViewMode = 'composite';
let selectedExampleIndex = null;

function renderResultsVisualization(results, metrics) {
    currentResults = results;
    currentMetrics = metrics;

    // Create results visualization container
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    const template = document.createElement('div');
    template.className = 'results-visualization';

    // View mode controls
    template.innerHTML = `
        <div class="view-controls">
            <div class="view-modes">
                <button class="view-mode-button active" data-mode="composite">Composite Score</button>
                <button class="view-mode-button" data-mode="quantitative">Quantitative</button>
                <button class="view-mode-button" data-mode="qualitative">Qualitative</button>
                <button class="view-mode-button" data-mode="hallucination">Hallucination</button>
                <button class="view-mode-button" data-mode="safety">Safety</button>
            </div>
        </div>

        <div class="results-chart"></div>

        <div class="detailed-results">
            <h3>Detailed Comparison</h3>
            <div class="model-comparison-grid"></div>
        </div>
    `;

    resultsContainer.appendChild(template);

    // Add event listeners to view mode buttons
    const viewModeButtons = template.querySelectorAll('.view-mode-button');
    viewModeButtons.forEach(button => {
        button.addEventListener('click', () => {
            viewModeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentViewMode = button.getAttribute('data-mode');
            updateResultsChart();
        });
    });

    // Render initial results
    updateResultsChart();
    renderDetailedComparison();
}

function updateResultsChart() {
    const resultsChart = document.querySelector('.results-chart');
    resultsChart.innerHTML = '';

    // Sort results based on current view mode
    const sortedResults = [...currentResults].sort((a, b) => {
        if (currentViewMode === 'composite') {
            return b.compositeScore - a.compositeScore;
        } else {
            // Average of all benchmark scores for this specific metric
            const aScores = a.scores.reduce((sum, score) => sum + score[`${currentViewMode}Score`], 0) / a.scores.length;
            const bScores = b.scores.reduce((sum, score) => sum + score[`${currentViewMode}Score`], 0) / b.scores.length;
            return bScores - aScores;
        }
    });

    // Render bars for each model
    sortedResults.forEach((result, index) => {
        const score = currentViewMode === 'composite'
            ? result.compositeScore
            : result.scores.reduce((sum, s) => sum + s[`${currentViewMode}Score`], 0) / result.scores.length;

        const barContainer = document.createElement('div');
        barContainer.className = 'result-bar-container';

        barContainer.innerHTML = `
            <div class="model-name">${result.model}</div>
            <div class="score-bar-wrapper">
                <div class="score-bar" style="width: ${score}%; background-color: ${index === 0 ? '#4CAF50' : index === 1 ? '#2196F3' : '#9E9E9E'}">
                    <span class="score-value">${score.toFixed(1)}</span>
                </div>
            </div>
        `;

        resultsChart.appendChild(barContainer);
    });
}

function renderDetailedComparison() {
    const comparisonGrid = document.querySelector('.model-comparison-grid');
    comparisonGrid.innerHTML = '';

    if (currentResults.length === 0 || currentResults[0].scores.length === 0) {
        return;
    }

    // Sort results
    const sortedResults = [...currentResults].sort((a, b) => b.compositeScore - a.compositeScore);

    // Create header row
    const headerRow = document.createElement('div');
    headerRow.className = 'comparison-header';
    headerRow.innerHTML = `
        <div class="comparison-cell">Prompt</div>
        ${sortedResults.map(result => `<div class="comparison-cell">${result.model}</div>`).join('')}
    `;
    comparisonGrid.appendChild(headerRow);

    // Create rows for examples
    if (sortedResults[0].scores.length > 0 && sortedResults[0].scores[0].examples) {
        sortedResults[0].scores[0].examples.forEach((example, exampleIndex) => {
            const row = document.createElement('div');
            row.className = `comparison-row ${selectedExampleIndex === exampleIndex ? 'selected' : ''}`;

            let rowHtml = `<div class="comparison-cell prompt-cell">${example.prompt}</div>`;

            sortedResults.forEach(result => {
                const responseExample = result.scores[0].examples[exampleIndex];

                rowHtml += `
                    <div class="comparison-cell response-cell">
                        ${responseExample.response}
                        ${selectedExampleIndex === exampleIndex ? `
                            <div class="metrics-detail">
                                <div class="metric">
                                    <span>Accuracy:</span>
                                    <span>${responseExample.metrics.accuracy.toFixed(1)}</span>
                                </div>
                                <div class="metric">
                                    <span>Clarity:</span>
                                    <span>${responseExample.metrics.clarity.toFixed(1)}</span>
                                </div>
                                <div class="metric">
                                    <span>Relevance:</span>
                                    <span>${responseExample.metrics.relevance.toFixed(1)}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            });

            row.innerHTML = rowHtml;

            row.addEventListener('click', () => {
                if (selectedExampleIndex === exampleIndex) {
                    selectedExampleIndex = null;
                } else {
                    selectedExampleIndex = exampleIndex;
                }
                renderDetailedComparison();
            });

            comparisonGrid.appendChild(row);
        });
    }
}
