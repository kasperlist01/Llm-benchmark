import React, { useState } from 'react';
import { benchmarksAPI } from '../services/api';
import { showNotification } from '../utils/notifications';

interface BlindTestResults {
  testType: string;
  blindTest: {
    completedVotes: number;
    totalPairs: number;
    datasetsUsed: string[];
    models: Array<{
      id: string;
      name: string;
      totalVotes: number;
      revealed?: boolean;
    }>;
    testPairs: Array<{
      promptId: string;
      prompt: string;
      category: string;
      voted: boolean;
      revealed: boolean;
      source_info?: {
        dataset: string;
        file: string;
      };
      responses: Array<{
        position: string;
        response: string;
        modelIndex: number;
        votes: number;
      }>;
    }>;
  };
}

interface ResultsVisualizationProps {
  results: BlindTestResults | null;
}

const ResultsVisualization: React.FC<ResultsVisualizationProps> = ({ results }) => {
  const [blindTestData, setBlindTestData] = useState(results?.blindTest || null);

  if (!results || !blindTestData) {
    return (
      <div className="empty-results">
        <p>Выберите модели и тесты, затем запустите для просмотра результатов</p>
      </div>
    );
  }

  const handleVote = async (promptId: string, position: string) => {
    try {
      const updatedData = await benchmarksAPI.voteBlindTest({
        testData: blindTestData,
        promptId,
        position,
      });
      setBlindTestData(updatedData.blindTest || updatedData);
      showNotification({
        message: 'Голос записан!',
        type: 'success',
        title: 'Успех',
      });
    } catch (error) {
      console.error('Error voting:', error);
      showNotification({
        message: 'Ошибка при записи голоса',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const handleReveal = async () => {
    try {
      const updatedData = await benchmarksAPI.revealBlindTest({
        testData: blindTestData,
      });
      setBlindTestData(updatedData.blindTest || updatedData);
    } catch (error) {
      console.error('Error revealing:', error);
      showNotification({
        message: 'Ошибка при раскрытии моделей',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const progressPercentage = (blindTestData.completedVotes / blindTestData.totalPairs) * 100;
  const allVoted = blindTestData.completedVotes === blindTestData.totalPairs;

  return (
    <div className="blind-test-results">
      <div className="blind-test-header">
        <h2>Слепое тестирование</h2>
        <p className="blind-test-description">
          Сравните ответы от двух анонимных моделей и проголосуйте за ту, которую предпочитаете.
          После голосования по всем парам вы сможете узнать, какая модель какая.
        </p>
        {blindTestData.datasetsUsed && (
          <div className="datasets-used">
            <h4>
              <i className="fas fa-table"></i> Использованные датасеты:
            </h4>
            <div className="dataset-pills">
              {blindTestData.datasetsUsed.map((dataset, idx) => (
                <span key={idx} className="dataset-pill">
                  {dataset}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="blind-test-progress">
          <span id="completedVotes">{blindTestData.completedVotes}</span> из{' '}
          <span id="totalPairs">{blindTestData.totalPairs}</span> сравнений завершено
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      <div className="blind-test-pairs" id="blindTestPairs">
        {blindTestData.testPairs.map((pair, index) => (
          <div key={pair.promptId} className={`blind-test-pair ${pair.voted ? 'voted' : ''}`}>
            <div className="blind-test-prompt">
              <span className="prompt-number">{index + 1}.</span>
              <span className="prompt-text">{pair.prompt}</span>
              {pair.source_info && (
                <div className="prompt-meta">
                  <span className="prompt-source">
                    <i className="fas fa-table"></i> {pair.source_info.dataset}
                  </span>
                </div>
              )}
            </div>

            <div className="blind-test-responses">
              {pair.responses.map((response, respIdx) => (
                <div
                  key={respIdx}
                  className={`response-container ${
                    pair.voted && response.votes > 0 ? 'selected' : ''
                  } ${pair.revealed ? 'revealed' : ''}`}
                >
                  <div className="response-header">
                    <span className="response-position">
                      Ответ {response.position}
                      {pair.revealed && (
                        <span className="model-name-label">
                          {' '}
                          {blindTestData.models[response.modelIndex]?.name}
                        </span>
                      )}
                    </span>
                    {pair.voted && response.votes > 0 && (
                      <div className="vote-badge">Ваш выбор</div>
                    )}
                  </div>
                  <div className="response-content markdown-content">{response.response}</div>
                  {!pair.voted && (
                    <button
                      className="vote-button"
                      onClick={() => handleVote(pair.promptId, response.position)}
                    >
                      Голосовать за {response.position}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {allVoted && (
        <div className="blind-test-results-summary" id="blindTestSummary">
          <h3>Итоги</h3>
          <div className="results-chart" id="blindTestChart">
            {blindTestData.models.map((model, index) => {
              const percentage =
                blindTestData.totalPairs > 0
                  ? (model.totalVotes / blindTestData.totalPairs) * 100
                  : 0;

              return (
                <div key={model.id} className="result-bar-container">
                  <div className="model-name">
                    {model.revealed || blindTestData.testPairs[0]?.revealed
                      ? model.name
                      : `Модель ${index + 1}`}
                  </div>
                  <div className="score-bar-wrapper">
                    <div
                      className="score-bar"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: index === 0 ? '#4CAF50' : '#2196F3',
                      }}
                    >
                      <span className="score-value">
                        {model.totalVotes} голосов ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!blindTestData.testPairs[0]?.revealed && (
            <button id="revealModelsBtn" className="btn btn-primary" onClick={handleReveal}>
              Раскрыть модели
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsVisualization;
