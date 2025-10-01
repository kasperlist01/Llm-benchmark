import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Button, Typography, Space, Badge, Empty, Spin, Tag } from 'antd';
import { PlayCircleOutlined, ExperimentOutlined, DatabaseOutlined, CheckCircleOutlined, DragOutlined } from '@ant-design/icons';
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
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('dashboardSidebarWidth');
    return saved ? parseInt(saved) : 33.33; // По умолчанию 33.33% (8/24 колонок)
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('dashboardSidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Ограничиваем ширину между 20% и 50%
      if (newWidth >= 20 && newWidth <= 50) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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
    <div 
      ref={containerRef}
      style={{ 
        height: 'calc(100vh - 112px)', 
        overflow: 'hidden',
        position: 'relative',
        display: 'flex'
      }}
    >
      {/* Левая панель - Конфигурация */}
      <div 
        style={{ 
          width: `${sidebarWidth}%`,
          height: '100%', 
          overflowY: 'auto', 
          paddingRight: 8,
          paddingBottom: 24,
          transition: isResizing ? 'none' : 'width 0.2s ease'
        }}
      >
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
      </div>

      {/* Разделитель для изменения размера */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: 16,
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isResizing ? '#1890ff' : 'transparent',
          transition: 'background-color 0.2s',
          position: 'relative',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div
          style={{
            width: 4,
            height: 40,
            backgroundColor: isResizing ? '#fff' : '#d9d9d9',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <DragOutlined 
            style={{ 
              fontSize: 12, 
              color: isResizing ? '#1890ff' : '#999',
              transform: 'rotate(90deg)'
            }} 
          />
        </div>
      </div>

      {/* Правая панель - Результаты */}
      <div 
        style={{ 
          flex: 1,
          height: '100%', 
          overflowY: 'auto', 
          paddingLeft: 8,
          paddingBottom: 24 
        }}
      >
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
      </div>
    </div>
  );
};

export default Dashboard;
