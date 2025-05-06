// app/static/js/resultsVisualization.js
let currentResults = [];
let currentMetrics = {};
let currentViewMode = 'composite';
let selectedExampleIndex = null;
let blindTestData = null;
let currentTestType = 'standard';


function renderStandardResults(container) {
    const template = document.createElement('div');
    template.className = 'results-visualization';

    // View mode controls
    template.innerHTML = `
        <div class="view-controls">
            <div class="view-modes">
                <button class="view-mode-button active" data-mode="composite">Общий балл</button>
                <button class="view-mode-button" data-mode="quantitative">Количественный</button>
                <button class="view-mode-button" data-mode="qualitative">Качественный</button>
                <button class="view-mode-button" data-mode="hallucination">Галлюцинации</button>
                <button class="view-mode-button" data-mode="safety">Безопасность</button>
            </div>
        </div>

        <div class="results-chart"></div>

        <div class="detailed-results">
            <h3>Детальное сравнение</h3>
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
            <h2>Слепое тестирование</h2>
            <p class="blind-test-description">
                Сравните ответы от двух анонимных моделей и проголосуйте за ту, которую предпочитаете.
                После голосования по всем парам вы сможете узнать, какая модель какая.
            </p>
            <div class="blind-test-progress">
                <span id="completedVotes">${blindTestData.completedVotes}</span> из
                <span id="totalPairs">${blindTestData.totalPairs}</span> сравнений завершено
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(blindTestData.completedVotes / blindTestData.totalPairs) * 100}%"></div>
            </div>
        </div>

        <div class="blind-test-pairs" id="blindTestPairs">
            <!-- Test pairs will be rendered here -->
        </div>

        <div class="blind-test-results-summary" id="blindTestSummary" style="display: none;">
            <h3>Итоги</h3>
            <div class="results-chart" id="blindTestChart"></div>
            <button id="revealModelsBtn" class="reveal-models-btn">Раскрыть модели</button>
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
                        <span class="response-position">Ответ A ${pair.revealed ? `<span class="model-name-label">${blindTestData.models[pair.responses[0].modelIndex].name}</span>` : ''}</span>
                        ${pair.voted && pair.responses[0].votes > 0 ? '<div class="vote-badge">Ваш выбор</div>' : ''}
                    </div>
                    <div class="response-content">${pair.responses[0].response}</div>
                    ${!pair.voted ? `
                        <button class="vote-button" data-prompt-id="${pair.promptId}" data-position="A">
                            Голосовать за A
                        </button>
                    ` : ''}
                </div>

                <div class="response-container ${pair.voted && pair.responses[1].votes > 0 ? 'selected' : ''} ${pair.revealed ? 'revealed' : ''}">
                    <div class="response-header">
                        <span class="response-position">Ответ B ${pair.revealed ? `<span class="model-name-label">${blindTestData.models[pair.responses[1].modelIndex].name}</span>` : ''}</span>
                        ${pair.voted && pair.responses[1].votes > 0 ? '<div class="vote-badge">Ваш выбор</div>' : ''}
                    </div>
                    <div class="response-content">${pair.responses[1].response}</div>
                    ${!pair.voted ? `
                        <button class="vote-button" data-prompt-id="${pair.promptId}" data-position="B">
                            Голосовать за B
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
        console.error('Ошибка при записи голоса:', error);
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
            <div class="model-name">${model.revealed ? model.name : `Модель ${index + 1}`}</div>
            <div class="score-bar-wrapper">
                <div class="score-bar" style="width: ${percentage}%; background-color: ${index === 0 ? '#4CAF50' : '#2196F3'}">
                    <span class="score-value">${model.totalVotes} голосов (${percentage.toFixed(1)}%)</span>
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
        console.error('Ошибка при раскрытии моделей:', error);
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

        // Find the original model to get its color
        const modelId = result.modelId;
        const model = availableModels.find(m => m.id === modelId);
        const modelColor = model?.color || (index === 0 ? '#4CAF50' : index === 1 ? '#2196F3' : '#9E9E9E');

        const barContainer = document.createElement('div');
        barContainer.className = 'result-bar-container';

        barContainer.innerHTML = `
            <div class="model-name">${result.model}</div>
            <div class="score-bar-wrapper">
                <div class="score-bar" style="width: ${score}%; background-color: ${modelColor}">
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
        <div class="comparison-cell">Запрос</div>
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
                                    <span>Точность:</span>
                                    <span>${responseExample.metrics.accuracy.toFixed(1)}</span>
                                </div>
                                <div class="metric">
                                    <span>Ясность:</span>
                                    <span>${responseExample.metrics.clarity.toFixed(1)}</span>
                                </div>
                                <div class="metric">
                                    <span>Релевантность:</span>
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
    if (responseText.includes(`${modelName}'s response:`) ||
        responseText.includes(`As a ${modelName.split(' ')[0]}-based model`)) {
        // Replace the model name format with a better styled version
        return responseText.replace(
            `${modelName}'s response:`,
            `<span class="model-response-header">Ответ ${modelName}:</span>`
        );
    } else {
        // Add the model name if it doesn't exist
        return `<span class="model-response-header">Ответ ${modelName}:</span><p class="response-text">${responseText}</p>`;
    }
}
// app/static/js/resultsVisualization.js

function renderResultsVisualization(results, metrics) {
    // Store results and metrics
    currentResults = results.standardResults || results;
    currentMetrics = metrics;
    currentTestType = results.testType || 'standard';

    // If blind test, store the blind test data
    if (currentTestType === 'blind_test') {
        blindTestData = results.blindTest;
    }

    // If GPT-4o evaluation, store the evaluation data
    if (currentTestType === 'gpt4o_eval') {
        gpt4oEvalData = results.gpt4oEval;
    }

    // Create results visualization container
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    // Check which type of test to render
    if (currentTestType === 'blind_test') {
        renderBlindTestResults(resultsContainer);
    } else if (currentTestType === 'gpt4o_eval') {
        renderGpt4oEvalResults(resultsContainer);
    } else {
        renderStandardResults(resultsContainer);
    }
}

function renderGpt4oEvalResults(container) {
    const template = document.createElement('div');
    template.className = 'gpt4o-eval-results';

    // Создаем заголовок и описание
    template.innerHTML = `
        <div class="gpt4o-eval-header">
            <h2>Результаты оценки GPT-4o</h2>
            <p class="gpt4o-eval-description">
                GPT-4o оценил ответы от двух моделей на несколько запросов и определил, какая модель работает лучше.
            </p>
        </div>

        <div class="gpt4o-eval-summary">
            <h3>Общие результаты</h3>
            <div class="results-chart" id="gpt4oEvalChart"></div>
            <div class="winner-announcement" id="winnerAnnouncement"></div>
        </div>

        <div class="gpt4o-eval-details">
            <h3>Детальные оценки</h3>
            <div class="eval-pairs" id="evalPairs">
                <!-- Evaluation pairs will be rendered here -->
            </div>
        </div>
    `;

    container.appendChild(template);

    // Render the overall results chart
    renderGpt4oEvalChart();

    // Render the winner announcement
    renderWinnerAnnouncement();

    // Render detailed evaluations
    renderEvalPairs();
}

function renderGpt4oEvalChart() {
    const chartContainer = document.getElementById('gpt4oEvalChart');
    chartContainer.innerHTML = '';

    // Create bars for each model
    gpt4oEvalData.models.forEach((model, index) => {
        const maxPossibleScore = gpt4oEvalData.totalPrompts * 10; // Assuming max score is 10 per prompt
        const percentage = (model.totalScore / maxPossibleScore) * 100;

        const barContainer = document.createElement('div');
        barContainer.className = 'result-bar-container';

        barContainer.innerHTML = `
            <div class="model-name">${model.name}</div>
            <div class="score-bar-wrapper">
                <div class="score-bar" style="width: ${percentage}%; background-color: ${index === 0 ? '#4CAF50' : '#2196F3'}">
                    <span class="score-value">${model.totalScore.toFixed(1)} баллов (${model.wins} побед)</span>
                </div>
            </div>
        `;

        chartContainer.appendChild(barContainer);
    });
}

function renderWinnerAnnouncement() {
    const container = document.getElementById('winnerAnnouncement');

    // Determine overall winner
    const model0Score = gpt4oEvalData.models[0].totalScore;
    const model1Score = gpt4oEvalData.models[1].totalScore;

    let winnerName, winnerScore, loserName, loserScore;

    if (model0Score > model1Score) {
        winnerName = gpt4oEvalData.models[0].name;
        winnerScore = model0Score;
        loserName = gpt4oEvalData.models[1].name;
        loserScore = model1Score;
    } else {
        winnerName = gpt4oEvalData.models[1].name;
        winnerScore = model1Score;
        loserName = gpt4oEvalData.models[0].name;
        loserScore = model0Score;
    }

    const scoreDiff = Math.abs(model0Score - model1Score).toFixed(1);
    const percentDiff = ((Math.abs(model0Score - model1Score) / Math.min(model0Score, model1Score)) * 100).toFixed(1);

    container.innerHTML = `
        <div class="winner-card">
            <h4>Вердикт GPT-4o</h4>
            <p class="winner-text">
                <strong>${winnerName}</strong> превзошел <strong>${loserName}</strong> на
                <span class="highlight">${scoreDiff} баллов (${percentDiff}%)</span>
            </p>
            <p class="winner-note">
                Эта оценка была проведена автоматически GPT-4o по ${gpt4oEvalData.totalPrompts} различным запросам
            </p>
        </div>
    `;
}

function renderEvalPairs() {
    const pairsContainer = document.getElementById('evalPairs');
    pairsContainer.innerHTML = '';

    gpt4oEvalData.evalPairs.forEach((pair, index) => {
        const pairElement = document.createElement('div');
        pairElement.className = 'eval-pair';

        // Находим победившую модель в этой паре
        const winningModelIndex = pair.responses[0].modelName === pair.evaluation.winner ? 0 : 1;
        const losingModelIndex = 1 - winningModelIndex;

        // Создаем HTML для критериев оценки
        let criteriaScoresHtml = '';
        Object.entries(pair.evaluation.criteria_scores).forEach(([criterion, scores]) => {
            const model1Score = scores.model1;
            const model2Score = scores.model2;
            criteriaScoresHtml += `
                <div class="criterion-score">
                    <div class="criterion-name">${criterion}</div>
                    <div class="criterion-bars">
                        <div class="criterion-model">
                            <span class="model-label">${pair.responses[0].modelName}</span>
                            <div class="criterion-bar-wrapper">
                                <div class="criterion-bar" style="width: ${model1Score * 10}%; background-color: #4CAF50">
                                    ${model1Score}/10
                                </div>
                            </div>
                        </div>
                        <div class="criterion-model">
                            <span class="model-label">${pair.responses[1].modelName}</span>
                            <div class="criterion-bar-wrapper">
                                <div class="criterion-bar" style="width: ${model2Score * 10}%; background-color: #2196F3">
                                    ${model2Score}/10
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        pairElement.innerHTML = `
            <div class="eval-prompt">
                <span class="prompt-number">${index + 1}.</span>
                <span class="prompt-text">${pair.prompt}</span>
                <span class="prompt-category">${pair.category}</span>
            </div>
            
            <div class="model-responses">
                <div class="model-response ${winningModelIndex === 0 ? 'winner' : ''}">
                    <div class="response-header">
                        <span class="model-name">${pair.responses[0].modelName}</span>
                        <span class="response-score">Оценка: ${pair.responses[0].score}/10</span>
                        ${winningModelIndex === 0 ? '<span class="winner-badge">ПОБЕДИТЕЛЬ</span>' : ''}
                    </div>
                    <div class="response-content">${pair.responses[0].response}</div>
                </div>

                <div class="model-response ${winningModelIndex === 1 ? 'winner' : ''}">
                    <div class="response-header">
                        <span class="model-name">${pair.responses[1].modelName}</span>
                        <span class="response-score">Оценка: ${pair.responses[1].score}/10</span>
                        ${winningModelIndex === 1 ? '<span class="winner-badge">ПОБЕДИТЕЛЬ</span>' : ''}
                    </div>
                    <div class="response-content">${pair.responses[1].response}</div>
                </div>
            </div>

            <div class="gpt4o-evaluation">
                <div class="evaluation-header">
                    <h4>Оценка GPT-4o</h4>
                    <span class="winner-text">Победитель: <strong>${pair.evaluation.winner}</strong></span>
                </div>

                <div class="criteria-scores">
                    ${criteriaScoresHtml}
                </div>

                <div class="evaluation-reasoning">
                    <h5>Обоснование:</h5>
                    <p>${pair.evaluation.reasoning}</p>
                </div>
            </div>
        `;

        pairsContainer.appendChild(pairElement);
    });
}