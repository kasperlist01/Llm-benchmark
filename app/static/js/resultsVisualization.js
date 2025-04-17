// app/static/js/resultsVisualization.js
let currentResults = [];
let currentMetrics = {};
let currentViewMode = 'composite';
let selectedExampleIndex = null;
let blindTestData = null;
let currentTestType = 'standard';

function renderResultsVisualization(results, metrics) {
    // Store results and metrics
    currentResults = results.standardResults || results;
    currentMetrics = metrics;
    currentTestType = results.testType || 'standard';

    // If blind test, store the blind test data
    if (currentTestType === 'blind_test') {
        blindTestData = results.blindTest;
    }

    // Create results visualization container
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    // Check which type of test to render
    if (currentTestType === 'blind_test') {
        renderBlindTestResults(resultsContainer);
    } else {
        renderStandardResults(resultsContainer);
    }
}

function renderStandardResults(container) {
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

    container.appendChild(template);

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

function renderBlindTestResults(container) {
    const template = document.createElement('div');
    template.className = 'blind-test-results';

    template.innerHTML = `
        <div class="blind-test-header">
            <h2>Blind Test Comparison</h2>
            <p class="blind-test-description">
                Compare responses from two anonymous models and vote for the one you prefer.
                After voting on all pairs, you can reveal which model is which.
            </p>
            <div class="blind-test-progress">
                <span id="completedVotes">${blindTestData.completedVotes}</span> of
                <span id="totalPairs">${blindTestData.totalPairs}</span> comparisons completed
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(blindTestData.completedVotes / blindTestData.totalPairs) * 100}%"></div>
            </div>
        </div>

        <div class="blind-test-pairs" id="blindTestPairs">
            <!-- Test pairs will be rendered here -->
        </div>

        <div class="blind-test-results-summary" id="blindTestSummary" style="display: none;">
            <h3>Results Summary</h3>
            <div class="results-chart" id="blindTestChart"></div>
            <button id="revealModelsBtn" class="reveal-models-btn">Reveal Models</button>
        </div>
    `;

    container.appendChild(template);

    // Render test pairs
    renderBlindTestPairs();

    // Check if all votes are completed to show summary
    updateBlindTestSummary();
}

function renderBlindTestPairs() {
    const pairsContainer = document.getElementById('blindTestPairs');
    pairsContainer.innerHTML = '';

    blindTestData.testPairs.forEach((pair, index) => {
        const pairElement = document.createElement('div');
        pairElement.className = `blind-test-pair ${pair.voted ? 'voted' : ''}`;
        pairElement.id = `pair-${pair.promptId}`;

        pairElement.innerHTML = `
            <div class="blind-test-prompt">
                <span class="prompt-number">${index + 1}.</span>
                <span class="prompt-text">${pair.prompt}</span>
                <span class="prompt-category">${pair.category}</span>
            </div>

            <div class="blind-test-responses">
                <div class="response-container ${pair.voted && pair.responses[0].votes > 0 ? 'selected' : ''} ${pair.revealed ? 'revealed' : ''}">
                    <div class="response-header">
                        <span class="response-position">Response A ${pair.revealed ? `<span class="model-name-label">${blindTestData.models[pair.responses[0].modelIndex].name}</span>` : ''}</span>
                        ${pair.voted && pair.responses[0].votes > 0 ? '<div class="vote-badge">Your choice</div>' : ''}
                    </div>
                    <div class="response-content">${pair.responses[0].response}</div>
                    ${!pair.voted ? `
                        <button class="vote-button" data-prompt-id="${pair.promptId}" data-position="A">
                            Vote for A
                        </button>
                    ` : ''}
                </div>

                <div class="response-container ${pair.voted && pair.responses[1].votes > 0 ? 'selected' : ''} ${pair.revealed ? 'revealed' : ''}">
                    <div class="response-header">
                        <span class="response-position">Response B ${pair.revealed ? `<span class="model-name-label">${blindTestData.models[pair.responses[1].modelIndex].name}</span>` : ''}</span>
                        ${pair.voted && pair.responses[1].votes > 0 ? '<div class="vote-badge">Your choice</div>' : ''}
                    </div>
                    <div class="response-content">${pair.responses[1].response}</div>
                    ${!pair.voted ? `
                        <button class="vote-button" data-prompt-id="${pair.promptId}" data-position="B">
                            Vote for B
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        pairsContainer.appendChild(pairElement);
    });

    // Add event listeners to vote buttons
    document.querySelectorAll('.vote-button').forEach(button => {
        button.addEventListener('click', handleVote);
    });

    // Add event listener to reveal button if it exists
    const revealButton = document.getElementById('revealModelsBtn');
    if (revealButton) {
        revealButton.addEventListener('click', revealModels);
    }
}

function handleVote(event) {
    const promptId = event.target.getAttribute('data-prompt-id');
    const position = event.target.getAttribute('data-position');

    // Send vote to server
    fetch('/api/blind-test/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            testData: blindTestData,
            promptId: promptId,
            position: position
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Update blind test data
        blindTestData = data;

        // Re-render pairs
        renderBlindTestPairs();

        // Update summary if needed
        updateBlindTestSummary();
    })
    .catch(error => {
        console.error('Error recording vote:', error);
    });
}

function updateBlindTestSummary() {
    const summaryContainer = document.getElementById('blindTestSummary');
    const progressElement = document.getElementById('completedVotes');
    const progressFill = document.querySelector('.progress-fill');

    // Update progress
    if (progressElement) {
        progressElement.textContent = blindTestData.completedVotes;
        progressFill.style.width = `${(blindTestData.completedVotes / blindTestData.totalPairs) * 100}%`;
    }

    // Show summary if all votes are completed
    if (blindTestData.completedVotes === blindTestData.totalPairs) {
        summaryContainer.style.display = 'block';
        renderBlindTestChart();
    } else {
        summaryContainer.style.display = 'none';
    }
}

function renderBlindTestChart() {
    const chartContainer = document.getElementById('blindTestChart');
    chartContainer.innerHTML = '';

    // Create bars for each model
    blindTestData.models.forEach((model, index) => {
        const percentage = blindTestData.totalPairs > 0
            ? (model.totalVotes / blindTestData.totalPairs) * 100
            : 0;

        const barContainer = document.createElement('div');
        barContainer.className = 'result-bar-container';

        barContainer.innerHTML = `
            <div class="model-name">${model.revealed ? model.name : `Model ${index + 1}`}</div>
            <div class="score-bar-wrapper">
                <div class="score-bar" style="width: ${percentage}%; background-color: ${index === 0 ? '#4CAF50' : '#2196F3'}">
                    <span class="score-value">${model.totalVotes} votes (${percentage.toFixed(1)}%)</span>
                </div>
            </div>
        `;

        chartContainer.appendChild(barContainer);
    });
}

function revealModels() {
    // Send request to reveal models
    fetch('/api/blind-test/reveal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            testData: blindTestData
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Update blind test data
        blindTestData = data;

        // Re-render everything
        renderBlindTestPairs();
        renderBlindTestChart();

        // Hide reveal button
        document.getElementById('revealModelsBtn').style.display = 'none';

        // Update model names in chart
        blindTestData.models.forEach((model, index) => {
            document.querySelectorAll('.model-name')[index].textContent = model.name;
        });
    })
    .catch(error => {
        console.error('Error revealing models:', error);
    });
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
                const responseText = responseExample.response;

                // Extract model name and response text
                const modelName = result.model;
                const formattedResponse = formatModelResponse(responseText, modelName);

                rowHtml += `
                    <div class="comparison-cell response-cell">
                        ${formattedResponse}
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

function formatModelResponse(responseText, modelName) {
    // Check if the response already contains the model name
    if (responseText.includes(`${modelName}'s response:`)) {
        // Replace the model name format with a better styled version
        return responseText.replace(
            `${modelName}'s response:`,
            `<span class="model-response-header">${modelName}'s response:</span>`
        );
    } else {
        // Add the model name if it doesn't exist
        return `<span class="model-response-header">${modelName}'s response:</span><p class="response-text">${responseText}</p>`;
    }
}