import React, { useEffect, useState } from 'react';
import { Card, Checkbox, Space, Spin, Typography, Tag, Empty } from 'antd';
import { ApiOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { UserModel } from '../types';
import { modelsAPI } from '../services/api';

const { Text, Link } = Typography;

interface ModelSelectorProps {
  selectedModels: UserModel[];
  onSelectionChange: (models: UserModel[]) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModels, onSelectionChange }) => {
  const [models, setModels] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [judgeModelId, setJudgeModelId] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const [modelsData, judgeModel] = await Promise.all([
        modelsAPI.getAllModels(),
        modelsAPI.getJudgeModel(),
      ]);
      setModels(Array.isArray(modelsData) ? modelsData : []);
      if (judgeModel && judgeModel.id) {
        setJudgeModelId(judgeModel.id);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (model: UserModel) => {
    const isSelected = selectedModels.some(m => m.id === model.id);
    if (isSelected) {
      onSelectionChange(selectedModels.filter((m) => m.id !== model.id));
    } else {
      onSelectionChange([...selectedModels, model]);
    }
  };

  return (
    <Card
      title="Модели"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
        </div>
      ) : models.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text>У вас пока нет добавленных моделей</Text>
              <Link href="/models">Добавьте модели</Link>
            </Space>
          }
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {models.map((model) => {
            const isSelected = selectedModels.some(m => m.id === model.id);
            const isJudgeModel = judgeModelId && model.id === judgeModelId;

            return (
              <Card
                key={model.id}
                size="small"
                hoverable
                onClick={() => toggleModel(model)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  backgroundColor: isSelected ? '#f0f5ff' : '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Checkbox checked={isSelected} />
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '6px',
                      backgroundColor: model.color || '#808080',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    {model.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text strong>{model.name}</Text>
                      {isJudgeModel && (
                        <Tag color="gold" icon={<CheckCircleOutlined />}>СУДЬЯ</Tag>
                      )}
                    </div>
                    {model.api_integration?.name && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {model.api_integration.name}
                      </Text>
                    )}
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

export default ModelSelector;
