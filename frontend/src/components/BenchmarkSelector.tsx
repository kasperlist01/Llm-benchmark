import React, { useEffect, useState } from 'react';
import { Card, Checkbox, Space, Spin, Typography, Tag, Empty } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Benchmark } from '../types';
import { benchmarksAPI } from '../services/api';

const { Text } = Typography;

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
    <Card
      title="Тесты"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
        </div>
      ) : benchmarks.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Нет доступных тестов"
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {benchmarks.map((benchmark) => {
            const isSelected = selectedBenchmarks.includes(benchmark.id);
            return (
              <Card
                key={benchmark.id}
                size="small"
                hoverable
                onClick={() => toggleBenchmark(benchmark.id)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #52c41a' : '1px solid #d9d9d9',
                  backgroundColor: isSelected ? '#f6ffed' : '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Checkbox checked={isSelected} />
                  <div style={{ flex: 1 }}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text strong>{benchmark.name}</Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {benchmark.description}
                      </Text>
                      {benchmark.metrics && benchmark.metrics.length > 0 && (
                        <Space size={[4, 4]} wrap>
                          {benchmark.metrics.map((metric, index) => (
                            <Tag key={index} color="green" icon={<CheckCircleOutlined />}>
                              {metric}
                            </Tag>
                          ))}
                        </Space>
                      )}
                    </Space>
                  </div>
                </div>
              </Card>
            );
          })}
        </Space>
      )}
    </Card>
  );
};

export default BenchmarkSelector;
