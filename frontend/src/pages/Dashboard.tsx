import React, { useState } from 'react';
import ModelSelector from '../components/ModelSelector';
import BenchmarkSelector from '../components/BenchmarkSelector';
import DatasetSelector from '../components/DatasetSelector';
import MetricsConfig from '../components/MetricsConfig';
import ResultsVisualization from '../components/ResultsVisualization';
import { BenchmarkRequest } from '../types';
import { benchmarksAPI } from '../services/api';
import { showNotification } from '../utils/notifications';
import { useDashboard } from '../contexts/DashboardContext';

const Dashboard: React.FC = () => {
  const {
    selectedModels,
    setSelectedModels,
    selectedBenchmarks,
    setSelectedBenchmarks,
    selectedDatasets,
    setSelectedDatasets,
    metrics,
    setMetrics,
    results,
    setResults,
  } = useDashboard();
  
  const [loading, setLoading] = useState(false);

  const handleRunBenchmark = async () => {
    if (selectedModels.length === 0 || selectedBenchmarks.length === 0) {
      showNotification({
        message: 'Пожалуйста, выберите хотя бы одну модель и один тест',
        type: 'error',
        title: 'Неполная конфигурация',
      });
      return;
    }

    if (selectedDatasets.length === 0) {
      showNotification({
        message: 'Пожалуйста, выберите хотя бы один датасет для проведения тестирования',
        type: 'error',
        title: 'Датасеты не выбраны',
      });
      return;
    }

    setLoading(true);
    setResults(null);

    const request: BenchmarkRequest = {
      selectedModels,
      selectedBenchmarks,
      selectedDatasets,
      metrics,
    };

    try {
      const result = await benchmarksAPI.runBenchmark(request);
      setResults(result);
      showNotification({
        message: 'Тестирование успешно завершено',
        type: 'success',
        title: 'Успех',
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Ошибка при выполнении тестирования';
      showNotification({
        message: errorMessage,
        type: 'error',
        title: 'Ошибка тестирования',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="configuration-panel">
        <ModelSelector
          selectedModels={selectedModels}
          onSelectionChange={setSelectedModels}
        />
        <BenchmarkSelector
          selectedBenchmarks={selectedBenchmarks}
          onSelectionChange={setSelectedBenchmarks}
        />
        <DatasetSelector
          selectedDatasets={selectedDatasets}
          onSelectionChange={setSelectedDatasets}
        />
        <MetricsConfig metrics={metrics} onMetricsChange={setMetrics} />
      </div>

      <div className="results-panel">
        <div className="results-panel-header">
          <h2>Панель тестирования</h2>

          <div className="results-selection-summary">
            <div className="selection-group">
              <h3>
                <i className="fas fa-cubes"></i>
                Выбранные модели
                <span className="count-badge">{selectedModels.length}</span>
              </h3>
              <div className="selected-models-list">
                {selectedModels.length === 0 ? (
                  <p className="empty-selection">Модели не выбраны</p>
                ) : (
                  <ul>
                    {selectedModels.map((id) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="selection-group">
              <h3>
                <i className="fas fa-tasks"></i>
                Выбранные тесты
                <span className="count-badge">{selectedBenchmarks.length}</span>
              </h3>
              <div className="selected-benchmarks-list">
                {selectedBenchmarks.length === 0 ? (
                  <p className="empty-selection">Тесты не выбраны</p>
                ) : (
                  <ul>
                    {selectedBenchmarks.map((id) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="results-selection-summary">
            <div className="selection-group">
              <h3>
                <i className="fas fa-table"></i>
                Выбранные датасеты
                <span className="count-badge">{selectedDatasets.length}</span>
              </h3>
              <div className="selected-datasets-list">
                {selectedDatasets.length === 0 ? (
                  <p className="empty-selection">Датасеты не выбраны</p>
                ) : (
                  <ul>
                    {selectedDatasets.map((id) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="run-controls">
            <button
              className="btn btn-primary"
              onClick={handleRunBenchmark}
              disabled={loading}
            >
              <i className="fas fa-play"></i>
              {loading ? 'Выполнение...' : 'Запустить тестирование'}
            </button>
          </div>
        </div>

        <div id="resultsContainer">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <div className="loading-text">Выполнение тестирования</div>
              <div className="loading-details">
                Обработка моделей и вычисление метрик
              </div>
            </div>
          ) : results ? (
            <ResultsVisualization results={results} />
          ) : (
            <div className="empty-results">
              <i className="fas fa-chart-line"></i>
              <h3>Готовы к тестированию</h3>
              <p>
                Выберите модели, тесты и датасеты, затем запустите тестирование для
                просмотра результатов
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
