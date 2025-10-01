import React, { useEffect, useState } from 'react';
import { Benchmark } from '../types';
import { benchmarksAPI } from '../services/api';

interface BenchmarkSelectorProps {
  selectedBenchmarks: string[];
  onSelectionChange: (benchmarks: string[]) => void;
}

const BenchmarkSelector: React.FC<BenchmarkSelectorProps> = ({
  selectedBenchmarks,
  onSelectionChange,
}) => {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadBenchmarks();
  }, []);

  const loadBenchmarks = async () => {
    try {
      const data = await benchmarksAPI.getAll();
      setBenchmarks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading benchmarks:', error);
      setBenchmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBenchmark = (benchmarkId: string) => {
    if (selectedBenchmarks.includes(benchmarkId)) {
      onSelectionChange(selectedBenchmarks.filter((id) => id !== benchmarkId));
    } else {
      onSelectionChange([...selectedBenchmarks, benchmarkId]);
    }
  };

  return (
    <div className="component-container" id="benchmarkSelectorContainer">
      <h2 onClick={() => setCollapsed(!collapsed)}>
        Тесты
        <span className={`toggle-icon ${collapsed ? 'collapsed' : ''}`} id="benchmarkSelectorToggle">
          ▼
        </span>
      </h2>
      <div className={`component-content ${collapsed ? 'collapsed' : ''}`} id="benchmarkSelectorContent">
        {loading ? (
          <div className="loading">Загрузка тестов...</div>
        ) : (
          <div className="benchmarks-list" id="benchmarksList">
            {benchmarks.length === 0 ? (
              <div className="empty-benchmarks">
                <p>Нет доступных тестов</p>
              </div>
            ) : (
              <div className="benchmarks-scroll-container">
                {benchmarks.map((benchmark) => {
                  const isSelected = selectedBenchmarks.includes(benchmark.id);
                  return (
                    <div
                      key={benchmark.id}
                      className={`benchmark-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleBenchmark(benchmark.id)}
                    >
                      <div className="benchmark-details">
                        <h3>{benchmark.name}</h3>
                        <p>{benchmark.description}</p>
                        {benchmark.metrics && benchmark.metrics.length > 0 && (
                          <div className="benchmark-metrics">
                            {benchmark.metrics.map((metric, index) => (
                              <span key={index} className="metric-tag">
                                {metric}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BenchmarkSelector;
