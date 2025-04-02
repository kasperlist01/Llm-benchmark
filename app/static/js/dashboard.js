// app/static/js/dashboard.js
function renderDashboard(results) {
    // Calculate average scores for each model
    const modelAverages = results.map(result => {
        const avgQuantitative = result.scores.reduce((sum, score) => sum + score.quantitativeScore, 0) / result.scores.length;
        const avgQualitative = result.scores.reduce((sum, score) => sum + score.qualitativeScore, 0) / result.scores.length;
        const avgHallucination = result.scores.reduce((sum, score) => sum + score.hallucinationScore, 0) / result.scores.length;
        const avgSafety = result.scores.reduce((sum, score) => sum + score.safetyScore, 0) / result.scores.length;

        return {
            model: result.model,
            avgQuantitative,
            avgQualitative,
            avgHallucination,
            avgSafety,
            compositeScore: result.compositeScore
        };
    });

    // Find best models for each metric
    const bestOverall = [...modelAverages].sort((a, b) => b.compositeScore - a.compositeScore)[0];
    const bestQuantitative = [...modelAverages].sort((a, b) => b.avgQuantitative - a.avgQuantitative)[0];
    const bestQualitative = [...modelAverages].sort((a, b) => b.avgQualitative - a.avgQualitative)[0];
    const bestHallucination = [...modelAverages].sort((a, b) => b.avgHallucination - a.avgHallucination)[0];
    const bestSafety = [...modelAverages].sort((a, b) => b.avgSafety - a.avgSafety)[0];

    // Create dashboard HTML
    const dashboardContainer = document.getElementById('dashboardContainer');
    dashboardContainer.innerHTML = `
        <div class="dashboard">
            <h2>Performance Dashboard</h2>

            <div class="dashboard-cards">
                <div class="dashboard-card">
                    <h3>Best Overall</h3>
                    <div class="model-badge">${bestOverall.model}</div>
                    <div class="score">Score: ${bestOverall.compositeScore.toFixed(1)}</div>
                </div>

                <div class="dashboard-card">
                    <h3>Best Quantitative</h3>
                    <div class="model-badge">${bestQuantitative.model}</div>
                    <div class="score">Score: ${bestQuantitative.avgQuantitative.toFixed(1)}</div>
                </div>

                <div class="dashboard-card">
                    <h3>Best Qualitative</h3>
                    <div class="model-badge">${bestQualitative.model}</div>
                    <div class="score">Score: ${bestQualitative.avgQualitative.toFixed(1)}</div>
                </div>

                <div class="dashboard-card">
                    <h3>Best Hallucination</h3>
                    <div class="model-badge">${bestHallucination.model}</div>
                    <div class="score">Score: ${bestHallucination.avgHallucination.toFixed(1)}</div>
                </div>

                <div class="dashboard-card">
                    <h3>Best Safety</h3>
                    <div class="model-badge">${bestSafety.model}</div>
                    <div class="score">Score: ${bestSafety.avgSafety.toFixed(1)}</div>
                </div>
            </div>

            <div class="export-actions">
                <button class="export-button" id="exportCsvBtn">Export Results (CSV)</button>
                <button class="export-button" id="exportPdfBtn">Generate Report (PDF)</button>
            </div>
        </div>
    `;

    // Add event listeners for export buttons
    document.getElementById('exportCsvBtn').addEventListener('click', () => exportResults(results, 'csv'));
    document.getElementById('exportPdfBtn').addEventListener('click', () => exportResults(results, 'pdf'));
}

function exportResults(results, format) {
    fetch('/api/export-results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            format,
            results
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => {
        console.error('Error exporting results:', error);
        alert('Error exporting results. Please try again.');
    });
}
