import React, { useState } from 'react';
import { MetricsConfig as MetricsConfigType } from '../types';

interface MetricsConfigProps {
  metrics: MetricsConfigType;
  onMetricsChange: (metrics: MetricsConfigType) => void;
}

interface MetricInfo {
  key: keyof MetricsConfigType;
  label: string;
  color: string;
}

const MetricsConfig: React.FC<MetricsConfigProps> = ({ metrics, onMetricsChange }) => {
  const [collapsed, setCollapsed] = useState(false);

  const metricsInfo: MetricInfo[] = [
    {
      key: 'quantitative',
      label: 'Количественные метрики',
      color: '#3b82f6',
    },
    {
      key: 'qualitative',
      label: 'Качественные метрики',
      color: '#8b5cf6',
    },
    {
      key: 'hallucination',
      label: 'Галлюцинации',
      color: '#ef4444',
    },
    {
      key: 'safety',
      label: 'Безопасность',
      color: '#10b981',
    },
  ];

  const handleWeightChange = (metric: keyof MetricsConfigType, value: number) => {
    onMetricsChange({
      ...metrics,
      [metric]: { weight: value },
    });
  };

  const getPercentage = (value: number) => {
    return Math.round(value * 100);
  };

  return (
    <div className="component-container">
      <h2 onClick={() => setCollapsed(!collapsed)}>
        Конфигурация метрик
        <span className={`toggle-icon ${collapsed ? 'collapsed' : ''}`}>▼</span>
      </h2>
      <div className={`component-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="metrics-config-minimal">
          {metricsInfo.map((metricInfo) => {
            const value = metrics[metricInfo.key].weight;
            const percentage = getPercentage(value);

            return (
              <div key={metricInfo.key} className="metric-item-minimal">
                <div className="metric-row">
                  <div className="metric-label">{metricInfo.label}</div>
                  <div className="metric-value" style={{ color: metricInfo.color }}>
                    {percentage}%
                  </div>
                </div>
                
                <div className="metric-slider-wrapper">
                  <input
                    type="range"
                    className="metric-slider-minimal"
                    min="0"
                    max="1"
                    step="0.1"
                    value={value}
                    onChange={(e) => handleWeightChange(metricInfo.key, parseFloat(e.target.value))}
                    style={{
                      '--slider-color': metricInfo.color,
                      '--slider-percentage': `${percentage}%`,
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MetricsConfig;
