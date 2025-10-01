import React from 'react';
import { Card, Slider, Space, Typography } from 'antd';
import { MetricsConfig as MetricsConfigType } from '../types';

const { Text } = Typography;

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
  const metricsInfo: MetricInfo[] = [
    { key: 'quantitative', label: 'Количественные метрики', color: '#3b82f6' },
    { key: 'qualitative', label: 'Качественные метрики', color: '#8b5cf6' },
    { key: 'hallucination', label: 'Галлюцинации', color: '#ef4444' },
    { key: 'safety', label: 'Безопасность', color: '#10b981' },
  ];

  const handleWeightChange = (metric: keyof MetricsConfigType, value: number) => {
    onMetricsChange({
      ...metrics,
      [metric]: { weight: value },
    });
  };

  return (
    <Card
      title="Конфигурация метрик"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {metricsInfo.map((metricInfo) => {
          const value = metrics[metricInfo.key].weight;
          const percentage = Math.round(value * 100);

          return (
            <div key={metricInfo.key}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8
              }}>
                <Text strong>{metricInfo.label}</Text>
                <Text style={{ color: metricInfo.color, fontWeight: 600 }}>
                  {percentage}%
                </Text>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={value}
                onChange={(val) => handleWeightChange(metricInfo.key, val)}
                tooltip={{ formatter: (val) => `${Math.round((val || 0) * 100)}%` }}
                trackStyle={{ backgroundColor: metricInfo.color }}
                handleStyle={{ borderColor: metricInfo.color }}
              />
            </div>
          );
        })}
      </Space>
    </Card>
  );
};

export default MetricsConfig;
