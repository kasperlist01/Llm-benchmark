let currentResults = [];
let currentMetrics = {};
let blindTestData = null;
let judgeEvalData = null;
let referenceComparisonData = null;
let currentTestType = 'none';


function renderMarkdown(text) {
    if (!text) return '';

    marked.setOptions({
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, {language: lang}).value;
                } catch (__) {
                }
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true,
        sanitize: true,
        headerIds: false
    });

    return marked.parse(text);
}

function renderReferenceComparisonResults(container) {
    const template = document.createElement('div');
    template.className = 'reference-comparison-results';

    template.innerHTML = `
        <div class="reference-comparison-header">
            <h2>Результаты сравнения с эталоном</h2>
            <p class="reference-comparison-description">
                ${referenceComparisonData.judgeModel} сравнил ответы моделей с эталонными ответами из ваших датасетов.
            </p>
            ${referenceComparisonData.datasetsUsed ? `
                <div class="datasets-used">
                    <h4><i class="fas fa-table"></i> Использованные датасеты:</h4>
                    <div class="dataset-pills">
                        ${referenceComparisonData.datasetsUsed.map(dataset => `<span class="dataset-pill">${dataset}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>

        <div class="reference-comparison-summary">
            <h3>Рейтинг моделей</h3>
            <div class="results-chart" id="referenceComparisonChart"></div>
        </div>

        <div class="reference-comparison-details">
            <h3>Детальные результаты</h3>
            <div class="reference-responses" id="referenceResponses">
            </div>
        </div>
    `;

    container.appendChild(template);

    renderReferenceComparisonChart();
    renderReferenceResponses();
}

function renderReferenceComparisonChart() {
    const chartContainer = document.getElementById('referenceComparisonChart');
    chartContainer.innerHTML = '';

    referenceComparisonData.models.forEach((model, index) => {
        const percentage = (model.averageScore / 10) * 100;

        const barContainer = document.createElement('div');
        barContainer.className = 'result-bar-container';

        barContainer.innerHTML = `
            <div class="model-name">${model.name}</div>
            <div class="score-bar-wrapper">
                <div class="score-bar" style="width: ${percentage}%; background-color: ${index === 0 ? '#4CAF50' : index === 1 ? '#2196F3' : '#FF9800'}">
                    <span class="score-value">${model.averageScore}/10 (${percentage.toFixed(1)}%)</span>
                </div>
            </div>
        `;

        chartContainer.appendChild(barContainer);
    });
}

function renderReferenceResponses() {
    const responsesContainer = document.getElementById('referenceResponses');
    responsesContainer.innerHTML = '';

    const responsesByPrompt = {};
    referenceComparisonData.models.forEach(model => {
        model.responses.forEach(response => {
            if (!responsesByPrompt[response.promptId]) {
                responsesByPrompt[response.promptId] = {
                    prompt: response.prompt,
                    referenceAnswer: response.referenceAnswer,
                    category: response.category,
                    source_info: response.source_info,
                    responses: []
                };
            }
            responsesByPrompt[response.promptId].responses.push({
                modelName: model.name,
                modelId: model.id,
                response: response.modelResponse,
                score: response.score,
                reasoning: response.reasoning
            });
        });
    });

    Object.values(responsesByPrompt).forEach((promptGroup, index) => {
        const promptElement = document.createElement('div');
        promptElement.className = 'reference-prompt-group';

        promptGroup.responses.sort((a, b) => b.score - a.score);
        const bestScore = promptGroup.responses[0].score;

        promptElement.innerHTML = `
            <div class="reference-prompt">
                <span class="prompt-number">${index + 1}.</span>
                <span class="prompt-text">${promptGroup.prompt}</span>
                <div class="prompt-meta">
                    ${promptGroup.source_info ? `
                        <span class="prompt-source">
                            <i class="fas fa-table"></i> ${promptGroup.source_info.dataset}
                        </span>
                    ` : ''}
                </div>
            </div>

            <div class="reference-answer-section">
                <h4>Эталонный ответ:</h4>
                <div class="reference-answer-content markdown-content">${renderMarkdown(promptGroup.referenceAnswer)}</div>
            </div>

            <div class="model-responses-grid">
                ${promptGroup.responses.map(response => `
                    <div class="model-response-card ${response.score === bestScore ? 'best-response' : ''}">
                        <div class="response-header">
                            <span class="model-name">${response.modelName}</span>
                            <span class="response-score">Оценка: ${response.score}/10</span>
                            ${response.score === bestScore ? '<span class="best-badge">ЛУЧШИЙ</span>' : ''}
                        </div>
                        <div class="response-content markdown-content">${renderMarkdown(response.response)}</div>
                        <div class="judge-reasoning">
                            <h5>Объяснение судьи:</h5>
                            <div class="markdown-content">${renderMarkdown(response.reasoning)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        responsesContainer.appendChild(promptElement);
    });
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
            ${blindTestData.datasetsUsed ? `
                <div class="datasets-used">
                    <h4><i class="fas fa-table"></i> Использованные датасеты:</h4>
                    <div class="dataset-pills">
                        ${blindTestData.datasetsUsed.map(dataset => `<span class="dataset-pill">${dataset}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="blind-test-progress">
                <span id="completedVotes">${blindTestData.completedVotes}</span> из
                <span id="totalPairs">${blindTestData.totalPairs}</span> сравнений завершено
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(blindTestData.completedVotes / blindTestData.totalPairs) * 100}%"></div>
            </div>
        </div>

        <div class="blind-test-pairs" id="blindTestPairs">
        </div>

        <div class="blind-test-results-summary" id="blindTestSummary" style="display: none;">
            <h3>Итоги</h3>
            <div class="results-chart" id="blindTestChart"></div>
            <button id="revealModelsBtn" class="btn btn-primary">Раскрыть модели</button>
        </div>
    `;

    container.appendChild(template);

    renderBlindTestPairs();
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
                <div class="prompt-meta">
                    ${pair.source_info ? `
                        <span class="prompt-source">
                            <i class="fas fa-table"></i> ${pair.source_info.dataset}
                        </span>
                    ` : ''}
                </div>
            </div>

            <div class="blind-test-responses">
                <div class="response-container ${pair.voted && pair.responses[0].votes > 0 ? 'selected' : ''} ${pair.revealed ? 'revealed' : ''}">
                    <div class="response-header">
                        <span class="response-position">Ответ A ${pair.revealed ? `<span class="model-name-label">${blindTestData.models[pair.responses[0].modelIndex].name}</span>` : ''}</span>
                        ${pair.voted && pair.responses[0].votes > 0 ? '<div class="vote-badge">Ваш выбор</div>' : ''}
                    </div>
                    <div class="response-content markdown-content">${renderMarkdown(pair.responses[0].response)}</div>
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
                    <div class="response-content markdown-content">${renderMarkdown(pair.responses[1].response)}</div>
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

    document.querySelectorAll('.vote-button').forEach(button => {
        button.addEventListener('click', handleVote);
    });

    const revealButton = document.getElementById('revealModelsBtn');
    if (revealButton) {
        revealButton.addEventListener('click', revealModels);
    }
}

function handleVote(event) {
    const promptId = event.target.getAttribute('data-prompt-id');
    const position = event.target.getAttribute('data-position');

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
            blindTestData = data;
            renderBlindTestPairs();
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

    if (progressElement) {
        progressElement.textContent = blindTestData.completedVotes;
        progressFill.style.width = `${(blindTestData.completedVotes / blindTestData.totalPairs) * 100}%`;
    }

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
            blindTestData = data;

            renderBlindTestPairs();
            renderBlindTestChart();

            document.getElementById('revealModelsBtn').style.display = 'none';

            blindTestData.models.forEach((model, index) => {
                document.querySelectorAll('.model-name')[index].textContent = model.name;
            });
        })
        .catch(error => {
            console.error('Ошибка при раскрытии моделей:', error);
        });
}

function renderJudgeEvalResults(container) {
    const template = document.createElement('div');
    template.className = 'judge-eval-results';

    template.innerHTML = `
        <div class="judge-eval-header">
            <h2>Результаты оценки модели-судьи</h2>
            <p class="judge-eval-description">
                ${judgeEvalData.judgeModel} оценил ответы от двух моделей на несколько запросов и определил, какая модель работает лучше.
            </p>
            ${judgeEvalData.datasetsUsed ? `
                <div class="datasets-used">
                    <h4><i class="fas fa-table"></i> Использованные датасеты:</h4>
                    <div class="dataset-pills">
                        ${judgeEvalData.datasetsUsed.map(dataset => `<span class="dataset-pill">${dataset}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>

        <div class="judge-eval-summary">
            <h3>Общие результаты</h3>
            <div class="results-chart" id="judgeEvalChart"></div>
            <div class="winner-announcement" id="winnerAnnouncement"></div>
        </div>

        <div class="judge-eval-details">
            <h3>Детальные оценки</h3>
            <div class="eval-pairs" id="evalPairs">
            </div>
        </div>
    `;

    container.appendChild(template);

    renderJudgeEvalChart();
    renderWinnerAnnouncement();
    renderEvalPairs();
}

function renderJudgeEvalChart() {
    const chartContainer = document.getElementById('judgeEvalChart');
    chartContainer.innerHTML = '';

    judgeEvalData.models.forEach((model, index) => {
        const maxPossibleScore = judgeEvalData.totalPrompts * 10;
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

    const model0Score = judgeEvalData.models[0].totalScore;
    const model1Score = judgeEvalData.models[1].totalScore;

    let winnerName, loserName;

    if (model0Score > model1Score) {
        winnerName = judgeEvalData.models[0].name;
        loserName = judgeEvalData.models[1].name;
    } else {
        winnerName = judgeEvalData.models[1].name;
        loserName = judgeEvalData.models[0].name;
    }

    const scoreDiff = Math.abs(model0Score - model1Score).toFixed(1);
    const percentDiff = ((Math.abs(model0Score - model1Score) / Math.min(model0Score, model1Score)) * 100).toFixed(1);

    container.innerHTML = `
        <div class="winner-card">
            <h4>Вердикт ${judgeEvalData.judgeModel}</h4>
            <p class="winner-text">
                <strong>${winnerName}</strong> превзошел <strong>${loserName}</strong> на
                <span class="highlight">${scoreDiff} баллов (${percentDiff}%)</span>
            </p>
            <p class="winner-note">
                Эта оценка была проведена автоматически ${judgeEvalData.judgeModel} по ${judgeEvalData.totalPrompts} различным запросам
            </p>
        </div>
    `;
}

function renderEvalPairs() {
    const pairsContainer = document.getElementById('evalPairs');
    pairsContainer.innerHTML = '';

    judgeEvalData.evalPairs.forEach((pair, index) => {
        const pairElement = document.createElement('div');
        pairElement.className = 'eval-pair';

        const winningModelIndex = pair.responses[0].modelName === pair.evaluation.winner ? 0 : 1;

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
                <div class="prompt-meta">
                    ${pair.source_info ? `
                        <span class="prompt-source">
                            <i class="fas fa-table"></i> ${pair.source_info.dataset}
                        </span>
                    ` : ''}
                </div>
            </div>
            
            <div class="model-responses">
                <div class="model-response ${winningModelIndex === 0 ? 'winner' : ''}">
                    <div class="response-header">
                        <span class="model-name">${pair.responses[0].modelName}</span>
                        <span class="response-score">Оценка: ${pair.responses[0].score}/10</span>
                        ${winningModelIndex === 0 ? '<span class="winner-badge">ПОБЕДИТЕЛЬ</span>' : ''}
                    </div>
                    <div class="response-content markdown-content">${renderMarkdown(pair.responses[0].response)}</div>
                </div>

                <div class="model-response ${winningModelIndex === 1 ? 'winner' : ''}">
                    <div class="response-header">
                        <span class="model-name">${pair.responses[1].modelName}</span>
                        <span class="response-score">Оценка: ${pair.responses[1].score}/10</span>
                        ${winningModelIndex === 1 ? '<span class="winner-badge">ПОБЕДИТЕЛЬ</span>' : ''}
                    </div>
                    <div class="response-content markdown-content">${renderMarkdown(pair.responses[1].response)}</div>
                </div>
            </div>

            <div class="judge-evaluation">
                <div class="evaluation-header">
                    <h4>Оценка ${pair.evaluation.judge_model}</h4>
                    <span class="winner-text">Победитель: <strong>${pair.evaluation.winner}</strong></span>
                </div>

                <div class="criteria-scores">
                    ${criteriaScoresHtml}
                </div>

                <div class="evaluation-reasoning">
                    <h5>Обоснование:</h5>
                    <div class="markdown-content">${renderMarkdown(pair.evaluation.reasoning)}</div>
                </div>
            </div>
        `;

        pairsContainer.appendChild(pairElement);
    });
}

function renderResultsVisualization(results, metrics) {
    currentResults = results.standardResults || results;
    currentMetrics = metrics;
    currentTestType = results.testType || 'none';

    if (currentTestType === 'blind_test') {
        blindTestData = results.blindTest;
    } else if (currentTestType === 'judge_eval') {
        judgeEvalData = results.judgeEval;
    } else if (currentTestType === 'reference_comparison') {
        referenceComparisonData = results.referenceComparison;
    } else if (currentTestType === 'metrics_comparison') {
        metricsComparisonData = results.metricsComparison;
    }

    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    if (currentTestType === 'blind_test') {
        renderBlindTestResults(resultsContainer);
    } else if (currentTestType === 'judge_eval') {
        renderJudgeEvalResults(resultsContainer);
    } else if (currentTestType === 'reference_comparison') {
        renderReferenceComparisonResults(resultsContainer);
    } else if (currentTestType === 'metrics_comparison') {
        renderMetricsComparisonResults(resultsContainer);
    } else {
        resultsContainer.innerHTML = `
            <div class="empty-results">
                <p>Выберите модели и тесты, затем запустите для просмотра результатов</p>
            </div>
        `;
    }
}

function renderMetricsComparisonResults(container) {
    const template = document.createElement('div');
    template.className = 'metrics-comparison-results';

    template.innerHTML = `
        <div class="metrics-comparison-header">
            <h2>Результаты сравнения по метрикам</h2>
            <p class="metrics-comparison-description">
                Автоматическая оценка ответов моделей с использованием количественных метрик: 
                ROUGE (точность воспроизведения), семантическое сходство и BERTScore (качество языка).
            </p>
            ${metricsComparisonData.datasetsUsed ? `
                <div class="datasets-used">
                    <h4><i class="fas fa-table"></i> Использованные датасеты:</h4>
                    <div class="dataset-pills">
                        ${metricsComparisonData.datasetsUsed.map(dataset => `<span class="dataset-pill">${dataset}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="metrics-weights-info">
                <h4><i class="fas fa-weight-hanging"></i> Веса метрик:</h4>
                <div class="weights-display">
                    <span class="weight-item">ROUGE: ${(metricsComparisonData.metricsWeights.rouge * 100).toFixed(0)}%</span>
                    <span class="weight-item">Семантика: ${(metricsComparisonData.metricsWeights.semantic * 100).toFixed(0)}%</span>
                    <span class="weight-item">BERTScore: ${(metricsComparisonData.metricsWeights.bertScore * 100).toFixed(0)}%</span>
                </div>
            </div>
        </div>

        <div class="metrics-comparison-summary">
            <h3>Рейтинг моделей</h3>
            <div class="results-chart" id="metricsComparisonChart"></div>
        </div>

        <div class="metrics-comparison-details">
            <h3>Детальные результаты</h3>
            <div class="metrics-responses" id="metricsResponses">
            </div>
        </div>
    `;

    container.appendChild(template);

    renderMetricsComparisonChart();
    renderMetricsResponses();
}

function renderMetricsComparisonChart() {
    const chartContainer = document.getElementById('metricsComparisonChart');
    chartContainer.innerHTML = '';

    metricsComparisonData.models.forEach((model, index) => {
        const percentage = (model.averageScore / 10) * 100;

        const barContainer = document.createElement('div');
        barContainer.className = 'result-bar-container';

        barContainer.innerHTML = `
            <div class="model-name">${model.name}</div>
            <div class="score-bar-wrapper">
                <div class="score-bar" style="width: ${percentage}%; background-color: ${index === 0 ? '#4CAF50' : index === 1 ? '#2196F3' : '#FF9800'}">
                    <span class="score-value">${model.averageScore}/10 (${percentage.toFixed(1)}%)</span>
                </div>
            </div>
        `;

        chartContainer.appendChild(barContainer);
    });
}

function renderMetricsResponses() {
    const responsesContainer = document.getElementById('metricsResponses');
    responsesContainer.innerHTML = '';

    const responsesByPrompt = {};
    metricsComparisonData.models.forEach(model => {
        model.responses.forEach(response => {
            if (!responsesByPrompt[response.promptId]) {
                responsesByPrompt[response.promptId] = {
                    prompt: response.prompt,
                    referenceAnswer: response.referenceAnswer,
                    category: response.category,
                    source_info: response.source_info,
                    responses: []
                };
            }
            responsesByPrompt[response.promptId].responses.push({
                modelName: model.name,
                modelId: model.id,
                response: response.modelResponse,
                weightedScore: response.weightedScore,
                metrics: response.metrics
            });
        });
    });

    Object.values(responsesByPrompt).forEach((promptGroup, index) => {
        const promptElement = document.createElement('div');
        promptElement.className = 'metrics-prompt-group';

        promptGroup.responses.sort((a, b) => b.weightedScore - a.weightedScore);
        const bestScore = promptGroup.responses[0].weightedScore;

        promptElement.innerHTML = `
            <div class="metrics-prompt">
                <span class="prompt-number">${index + 1}.</span>
                <span class="prompt-text">${promptGroup.prompt}</span>
                <div class="prompt-meta">
                    ${promptGroup.source_info ? `
                        <span class="prompt-source">
                            <i class="fas fa-table"></i> ${promptGroup.source_info.dataset}
                        </span>
                    ` : ''}
                </div>
            </div>

            <div class="reference-answer-section">
                <h4>Эталонный ответ:</h4>
                <div class="reference-answer-content markdown-content">${renderMarkdown(promptGroup.referenceAnswer)}</div>
            </div>

            <div class="model-responses-grid">
                ${promptGroup.responses.map(response => `
                    <div class="model-response-card ${response.weightedScore === bestScore ? 'best-response' : ''}">
                        <div class="response-header">
                            <span class="model-name">${response.modelName}</span>
                            <span class="response-score">Итоговый балл: ${response.weightedScore}/10</span>
                            ${response.weightedScore === bestScore ? '<span class="best-badge">ЛУЧШИЙ</span>' : ''}
                        </div>
                        
                        <div class="metrics-breakdown">
                            <div class="metric-item">
                                <span class="metric-label">ROUGE:</span>
                                <span class="metric-value">${response.metrics.rouge}</span>
                                <div class="metric-bar">
                                    <div class="metric-fill" style="width: ${response.metrics.rouge_norm * 100}%; background-color: #FF6B6B;"></div>
                                </div>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Семантика:</span>
                                <span class="metric-value">${response.metrics.semantic}</span>
                                <div class="metric-bar">
                                    <div class="metric-fill" style="width: ${response.metrics.semantic_norm * 100}%; background-color: #4ECDC4;"></div>
                                </div>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">BERTScore:</span>
                                <span class="metric-value">${response.metrics.bertScore}</span>
                                <div class="metric-bar">
                                    <div class="metric-fill" style="width: ${response.metrics.bert_norm * 100}%; background-color: #45B7D1;"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="response-content markdown-content">${renderMarkdown(response.response)}</div>
                    </div>
                `).join('')}
            </div>
        `;

        responsesContainer.appendChild(promptElement);
    });
}