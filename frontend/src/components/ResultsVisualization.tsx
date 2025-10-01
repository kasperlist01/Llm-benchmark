import React, { useState } from 'react';
import { Card, Button, Typography, Space, Progress, Tag, Radio, Alert, Divider } from 'antd';
import { TrophyOutlined, DatabaseOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { benchmarksAPI } from '../services/api';
import { message } from 'antd';

const { Title, Text, Paragraph } = Typography;

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
                  {blindTestData.datasetsUsed.map((dataset, idx) => (
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
        {blindTestData.testPairs.map((pair, index) => (
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
                value={pair.responses.find(r => r.votes > 0)?.position}
                disabled={pair.voted}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {pair.responses.map((response, respIdx) => (
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
            {blindTestData.models.map((model, index) => {
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
