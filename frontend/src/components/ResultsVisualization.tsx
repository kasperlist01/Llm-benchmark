import React, { useState } from 'react';
import { Card, Button, Typography, Space, Progress, Tag, Radio, Alert, Divider, Table, Collapse } from 'antd';
import { TrophyOutlined, DatabaseOutlined, CheckCircleOutlined, EyeOutlined, BarChartOutlined, StarOutlined } from '@ant-design/icons';
import { benchmarksAPI } from '../services/api';
import { message } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ResultsVisualizationProps {
  results: any;
}

const ResultsVisualization: React.FC<ResultsVisualizationProps> = ({ results }) => {
  const [blindTestData, setBlindTestData] = useState(results?.blindTest || null);

  if (!results) {
    return null;
  }

  // Render different views based on test type
  if (results.testType === 'metrics_comparison' && results.metricsComparison) {
    return <MetricsComparisonView data={results.metricsComparison} />;
  }

  if (results.testType === 'judge_eval' && results.judgeEval) {
    return <JudgeEvalView data={results.judgeEval} />;
  }

  if (results.testType === 'reference_comparison' && results.referenceComparison) {
    return <ReferenceComparisonView data={results.referenceComparison} />;
  }

  if (results.testType === 'blind_test' && results.blindTest) {
    return <BlindTestView results={results} blindTestData={blindTestData} setBlindTestData={setBlindTestData} />;
  }

  return null;
};

// Metrics Comparison View
const MetricsComparisonView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Title level={3}>
          <BarChartOutlined /> Сравнение по метрикам
        </Title>
        <Paragraph type="secondary">
          Результаты автоматической оценки моделей на основе метрик качества
        </Paragraph>
        
        {data.datasetsUsed && data.datasetsUsed.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong><DatabaseOutlined /> Использованные датасеты:</Text>
            <div style={{ marginTop: 8 }}>
              <Space size={[8, 8]} wrap>
                {data.datasetsUsed.map((dataset: string, idx: number) => (
                  <Tag key={idx} color="orange">{dataset}</Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Card>

      {data.models.map((model: any, idx: number) => (
        <Card
          key={model.id}
          title={
            <Space>
              <Tag color={idx === 0 ? 'gold' : 'blue'}>#{idx + 1}</Tag>
              <Text strong>{model.name}</Text>
              <Tag color="green">{model.averageScore.toFixed(2)} баллов</Tag>
            </Space>
          }
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <Collapse>
            {model.responses.map((resp: any, respIdx: number) => (
              <Panel 
                header={
                  <Space>
                    <Text>Вопрос {respIdx + 1}</Text>
                    <Tag color="blue">{resp.weightedScore} баллов</Tag>
                  </Space>
                }
                key={respIdx}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Вопрос:</Text>
                    <Paragraph style={{ marginTop: 8 }}>{resp.prompt}</Paragraph>
                  </div>
                  
                  <div>
                    <Text strong>Ответ модели:</Text>
                    <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{resp.modelResponse}</Paragraph>
                  </div>
                  
                  <div>
                    <Text strong>Эталонный ответ:</Text>
                    <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{resp.referenceAnswer}</Paragraph>
                  </div>
                  
                  <div>
                    <Text strong>Метрики:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text>ROUGE: </Text>
                          <Progress percent={Number((resp.metrics.rouge * 100).toFixed(1))} size="small" />
                        </div>
                        <div>
                          <Text>Semantic: </Text>
                          <Progress percent={Number((resp.metrics.semantic * 100).toFixed(1))} size="small" />
                        </div>
                        <div>
                          <Text>BERT Score: </Text>
                          <Progress percent={Number((resp.metrics.bertScore * 100).toFixed(1))} size="small" />
                        </div>
                      </Space>
                    </div>
                  </div>
                </Space>
              </Panel>
            ))}
          </Collapse>
        </Card>
      ))}
    </Space>
  );
};

// Judge Evaluation View
const JudgeEvalView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Title level={3}>
          <StarOutlined /> Оценка судьёй
        </Title>
        <Paragraph type="secondary">
          Модель-судья: <Tag color="gold">{data.judgeModel}</Tag>
        </Paragraph>
        
        {data.datasetsUsed && data.datasetsUsed.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong><DatabaseOutlined /> Использованные датасеты:</Text>
            <div style={{ marginTop: 8 }}>
              <Space size={[8, 8]} wrap>
                {data.datasetsUsed.map((dataset: string, idx: number) => (
                  <Tag key={idx} color="orange">{dataset}</Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Card>

      <Card 
        title={<><TrophyOutlined /> Итоговые результаты</>}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {data.models.map((model: any, idx: number) => (
            <div key={model.id}>
              <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>{model.name}</Text>
                <Space>
                  <Tag color="blue">{model.totalScore} баллов</Tag>
                  <Tag color="green">{model.wins} побед</Tag>
                </Space>
              </Space>
              <Progress 
                percent={Number(((model.totalScore / (data.totalPrompts * 10)) * 100).toFixed(1))} 
                strokeColor={idx === 0 ? '#52c41a' : '#1890ff'}
              />
            </div>
          ))}
        </Space>
      </Card>

      {data.evalPairs.map((pair: any, idx: number) => (
        <Card
          key={idx}
          title={<Text>Сравнение {idx + 1}</Text>}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Вопрос:</Text>
              <Paragraph style={{ marginTop: 8 }}>{pair.prompt}</Paragraph>
            </div>

            {pair.responses.map((resp: any, respIdx: number) => (
              <Card
                key={respIdx}
                size="small"
                title={
                  <Space>
                    <Text strong>{resp.modelName}</Text>
                    <Tag color={resp.score >= 5 ? 'green' : 'orange'}>{resp.score}/10</Tag>
                  </Space>
                }
                style={{ 
                  backgroundColor: pair.evaluation.winner === resp.modelName ? '#f6ffed' : '#fafafa',
                  border: pair.evaluation.winner === resp.modelName ? '2px solid #52c41a' : '1px solid #d9d9d9'
                }}
              >
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{resp.response}</Paragraph>
              </Card>
            ))}

            <Card size="small" title="Оценка судьи" style={{ backgroundColor: '#f0f5ff' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text><Text strong>Победитель:</Text> {pair.evaluation.winner}</Text>
                <div>
                  <Text strong>Обоснование:</Text>
                  <Paragraph style={{ marginTop: 8 }}>{pair.evaluation.reasoning}</Paragraph>
                </div>
              </Space>
            </Card>
          </Space>
        </Card>
      ))}
    </Space>
  );
};

// Reference Comparison View
const ReferenceComparisonView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Title level={3}>
          <CheckCircleOutlined /> Сравнение с эталоном
        </Title>
        <Paragraph type="secondary">
          Модель-судья: <Tag color="gold">{data.judgeModel}</Tag>
        </Paragraph>
        
        {data.datasetsUsed && data.datasetsUsed.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong><DatabaseOutlined /> Использованные датасеты:</Text>
            <div style={{ marginTop: 8 }}>
              <Space size={[8, 8]} wrap>
                {data.datasetsUsed.map((dataset: string, idx: number) => (
                  <Tag key={idx} color="orange">{dataset}</Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Card>

      {data.models.map((model: any, idx: number) => (
        <Card
          key={model.id}
          title={
            <Space>
              <Tag color={idx === 0 ? 'gold' : 'blue'}>#{idx + 1}</Tag>
              <Text strong>{model.name}</Text>
              <Tag color="green">{model.averageScore.toFixed(2)}/10</Tag>
            </Space>
          }
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <Collapse>
            {model.responses.map((resp: any, respIdx: number) => (
              <Panel 
                header={
                  <Space>
                    <Text>Вопрос {respIdx + 1}</Text>
                    <Tag color={resp.score >= 7 ? 'green' : resp.score >= 4 ? 'orange' : 'red'}>
                      {resp.score}/10
                    </Tag>
                  </Space>
                }
                key={respIdx}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Вопрос:</Text>
                    <Paragraph style={{ marginTop: 8 }}>{resp.prompt}</Paragraph>
                  </div>
                  
                  <div>
                    <Text strong>Ответ модели:</Text>
                    <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{resp.modelResponse}</Paragraph>
                  </div>
                  
                  <div>
                    <Text strong>Эталонный ответ:</Text>
                    <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{resp.referenceAnswer}</Paragraph>
                  </div>
                  
                  <Card size="small" title="Оценка судьи" style={{ backgroundColor: '#f0f5ff' }}>
                    <Paragraph>{resp.reasoning}</Paragraph>
                  </Card>
                </Space>
              </Panel>
            ))}
          </Collapse>
        </Card>
      ))}
    </Space>
  );
};

// Blind Test View
const BlindTestView: React.FC<{ results: any; blindTestData: any; setBlindTestData: any }> = ({ 
  results, 
  blindTestData, 
  setBlindTestData 
}) => {
  if (!blindTestData) {
    return null;
  }

  const handleVote = async (promptId: string, position: string) => {
    try {
      const updatedData = await benchmarksAPI.voteBlindTest({
        testData: blindTestData,
        promptId,
        position,
      });
      setBlindTestData(updatedData.blindTest || updatedData);
      message.success('Голос записан!');
    } catch (error) {
      console.error('Error voting:', error);
      message.error('Ошибка при записи голоса');
    }
  };

  const handleReveal = async () => {
    try {
      const updatedData = await benchmarksAPI.revealBlindTest({
        testData: blindTestData,
      });
      setBlindTestData(updatedData.blindTest || updatedData);
      message.success('Модели раскрыты!');
    } catch (error) {
      console.error('Error revealing:', error);
      message.error('Ошибка при раскрытии моделей');
    }
  };

  const progressPercentage = (blindTestData.completedVotes / blindTestData.totalPairs) * 100;
  const allVoted = blindTestData.completedVotes === blindTestData.totalPairs;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 8 }}>Слепое тестирование</Title>
            <Paragraph type="secondary">
              Сравните ответы от двух анонимных моделей и проголосуйте за ту, которую предпочитаете.
              После голосования по всем парам вы сможете узнать, какая модель какая.
            </Paragraph>
          </div>

          {blindTestData.datasetsUsed && blindTestData.datasetsUsed.length > 0 && (
            <div>
              <Text strong>
                <DatabaseOutlined /> Использованные датасеты:
              </Text>
              <div style={{ marginTop: 8 }}>
                <Space size={[8, 8]} wrap>
                  {blindTestData.datasetsUsed.map((dataset: string, idx: number) => (
                    <Tag key={idx} color="orange">{dataset}</Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}

          <div>
            <div style={{ marginBottom: 8 }}>
              <Text>
                <Text strong>{blindTestData.completedVotes}</Text> из{' '}
                <Text strong>{blindTestData.totalPairs}</Text> сравнений завершено
              </Text>
            </div>
            <Progress
              percent={Number(progressPercentage.toFixed(1))}
              status={allVoted ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        </Space>
      </Card>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {blindTestData.testPairs.map((pair: any, index: number) => (
          <Card
            key={pair.promptId}
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: pair.voted ? '2px solid #52c41a' : '1px solid #d9d9d9',
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Space>
                  <Tag color="blue">{index + 1}</Tag>
                  {pair.voted && <Tag color="success" icon={<CheckCircleOutlined />}>Проголосовано</Tag>}
                </Space>
                <Paragraph strong style={{ marginTop: 8, marginBottom: 4, fontSize: 15 }}>
                  {pair.prompt}
                </Paragraph>
                {pair.source_info && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <DatabaseOutlined /> {pair.source_info.dataset}
                  </Text>
                )}
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Radio.Group
                value={pair.responses.find((r: any) => r.votes > 0)?.position}
                disabled={pair.voted}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {pair.responses.map((response: any, respIdx: number) => (
                    <Card
                      key={respIdx}
                      size="small"
                      style={{
                        backgroundColor: pair.voted && response.votes > 0 ? '#f6ffed' : '#fafafa',
                        border: pair.voted && response.votes > 0 ? '1px solid #b7eb8f' : '1px solid #d9d9d9',
                      }}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>
                            Ответ {response.position}
                            {pair.revealed && (
                              <Text type="secondary" style={{ marginLeft: 8 }}>
                                ({blindTestData.models[response.modelIndex]?.name})
                              </Text>
                            )}
                          </Text>
                          {pair.voted && response.votes > 0 && (
                            <Tag color="success" icon={<CheckCircleOutlined />}>Ваш выбор</Tag>
                          )}
                        </div>
                        <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                          {response.response}
                        </Paragraph>
                        {!pair.voted && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleVote(pair.promptId, response.position)}
                          >
                            Голосовать за {response.position}
                          </Button>
                        )}
                      </Space>
                    </Card>
                  ))}
                </Space>
              </Radio.Group>
            </Space>
          </Card>
        ))}
      </Space>

      {allVoted && (
        <Card
          title={
            <Space>
              <TrophyOutlined />
              <span>Итоги</span>
            </Space>
          }
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {blindTestData.models.map((model: any, index: number) => {
              const percentage =
                blindTestData.totalPairs > 0
                  ? (model.totalVotes / blindTestData.totalPairs) * 100
                  : 0;

              return (
                <div key={model.id}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>
                      {model.revealed || blindTestData.testPairs[0]?.revealed
                        ? model.name
                        : `Модель ${index + 1}`}
                    </Text>
                  </div>
                  <Progress
                    percent={Number(percentage.toFixed(1))}
                    format={() => `${model.totalVotes} голосов (${percentage.toFixed(1)}%)`}
                    strokeColor={index === 0 ? '#52c41a' : '#1890ff'}
                  />
                </div>
              );
            })}

            {!blindTestData.testPairs[0]?.revealed && (
              <Button
                type="primary"
                icon={<EyeOutlined />}
                size="large"
                onClick={handleReveal}
                block
              >
                Раскрыть модели
              </Button>
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
};

export default ResultsVisualization;
