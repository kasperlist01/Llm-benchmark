import React, { useState } from 'react';
import { Row, Col, Card, Button, Typography, Space, Badge, Empty, Spin, Tag } from 'antd';
import { PlayCircleOutlined, ExperimentOutlined, DatabaseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ModelSelector from '../components/ModelSelector';
import BenchmarkSelector from '../components/BenchmarkSelector';
import DatasetSelector from '../components/DatasetSelector';
import MetricsConfig from '../components/MetricsConfig';
import ResultsVisualization from '../components/ResultsVisualization';
import { BenchmarkRequest } from '../types';
import { benchmarksAPI } from '../services/api';
import { useDashboard } from '../contexts/DashboardContext';
import { message } from 'antd';

const { Title, Text } = Typography;

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
      message.error('Пожалуйста, выберите хотя бы одну модель и один тест');
      return;
    }

    if (selectedDatasets.length === 0) {
      message.error('Пожалуйста, выберите хотя бы один датасет для проведения тестирования');
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
      message.success('Тестирование успешно завершено');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ошибка при выполнении тестирования';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 112px)', overflow: 'hidden' }}>
      <Row gutter={16} style={{ height: '100%' }}>
        {/* Левая панель - Конфигурация */}
        <Col xs={24} lg={8} style={{ height: '100%', overflowY: 'auto', paddingBottom: 24 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
          </Space>
        </Col>

        {/* Правая панель - Результаты */}
        <Col xs={24} lg={16} style={{ height: '100%', overflowY: 'auto', paddingBottom: 24 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Title level={3} style={{ marginBottom: 8 }}>Панель тестирования</Title>
                </div>

                {/* Summary выбранных элементов */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <div>
                      <Space style={{ marginBottom: 8 }}>
                        <ExperimentOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                        <Text strong>Выбранные модели</Text>
                        <Badge 
                          count={selectedModels.length} 
                          showZero 
                          style={{ backgroundColor: '#1890ff' }} 
                        />
                      </Space>
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '6px',
                        minHeight: '60px'
                      }}>
                        {selectedModels.length === 0 ? (
                          <Text type="secondary">Модели не выбраны</Text>
                        ) : (
                          <Space wrap size={[8, 8]}>
                            {selectedModels.map((id) => (
                              <Tag key={id} color="blue">{id}</Tag>
                            ))}
                          </Space>
                        )}
                      </div>
                    </div>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <div>
                      <Space style={{ marginBottom: 8 }}>
                        <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                        <Text strong>Выбранные тесты</Text>
                        <Badge 
                          count={selectedBenchmarks.length} 
                          showZero 
                          style={{ backgroundColor: '#52c41a' }} 
                        />
                      </Space>
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '6px',
                        minHeight: '60px'
                      }}>
                        {selectedBenchmarks.length === 0 ? (
                          <Text type="secondary">Тесты не выбраны</Text>
                        ) : (
                          <Space wrap size={[8, 8]}>
                            {selectedBenchmarks.map((id) => (
                              <Tag key={id} color="green">{id}</Tag>
                            ))}
                          </Space>
                        )}
                      </div>
                    </div>
                  </Col>

                  <Col xs={24}>
                    <div>
                      <Space style={{ marginBottom: 8 }}>
                        <DatabaseOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                        <Text strong>Выбранные датасеты</Text>
                        <Badge 
                          count={selectedDatasets.length} 
                          showZero 
                          style={{ backgroundColor: '#fa8c16' }} 
                        />
                      </Space>
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '6px',
                        minHeight: '60px'
                      }}>
                        {selectedDatasets.length === 0 ? (
                          <Text type="secondary">Датасеты не выбраны</Text>
                        ) : (
                          <Space wrap size={[8, 8]}>
                            {selectedDatasets.map((id) => (
                              <Tag key={id} color="orange">{id}</Tag>
                            ))}
                          </Space>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Кнопка запуска */}
                <div style={{ textAlign: 'center' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={handleRunBenchmark}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? 'Выполнение...' : 'Запустить тестирование'}
                  </Button>
                </div>
              </Space>
            </Card>

            {/* Контейнер результатов */}
            <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    <Text strong>Выполнение тестирования</Text>
                    <br />
                    <Text type="secondary">Обработка моделей и вычисление метрик</Text>
                  </div>
                </div>
              ) : results ? (
                <ResultsVisualization results={results} />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical" size="small">
                      <Text strong>Готовы к тестированию</Text>
                      <Text type="secondary">
                        Выберите модели, тесты и датасеты, затем запустите тестирование
                      </Text>
                    </Space>
                  }
                  style={{ padding: '40px 0' }}
                />
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
