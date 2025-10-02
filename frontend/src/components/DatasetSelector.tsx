import React, { useEffect, useState } from 'react';
import { Card, Checkbox, Space, Spin, Typography, Tag, Empty } from 'antd';
import { DatabaseOutlined, FileOutlined } from '@ant-design/icons';
import { UserDataset } from '../types';
import { datasetsAPI } from '../services/api';

const { Text, Link } = Typography;

// Helper function for Russian plural forms
const getPluralForm = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'вопросов';
  }
  
  if (lastDigit === 1) {
    return 'вопрос';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'вопроса';
  }
  
  return 'вопросов';
};

interface DatasetSelectorProps {
  selectedDatasets: UserDataset[];
  onSelectionChange: (datasets: UserDataset[]) => void;
}

const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  selectedDatasets,
  onSelectionChange,
}) => {
  const [datasets, setDatasets] = useState<UserDataset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const data = await datasetsAPI.getUserDatasets();
      setDatasets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading datasets:', error);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDataset = (dataset: UserDataset) => {
    const isSelected = selectedDatasets.some(d => d.id === dataset.id);
    if (isSelected) {
      onSelectionChange(selectedDatasets.filter((d) => d.id !== dataset.id));
    } else {
      onSelectionChange([...selectedDatasets, dataset]);
    }
  };

  return (
    <Card
      title="Вопросы"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
        </div>
      ) : datasets.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text>У вас пока нет загруженных вопросов</Text>
              <Link href="/datasets">Загрузите вопросы</Link>
            </Space>
          }
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {datasets.map((dataset) => {
            const isSelected = selectedDatasets.some(d => d.id === dataset.id);
            return (
              <Card
                key={dataset.id}
                size="small"
                hoverable
                onClick={() => toggleDataset(dataset)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #fa8c16' : '1px solid #d9d9d9',
                  backgroundColor: isSelected ? '#fff7e6' : '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Checkbox checked={isSelected} />
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '6px',
                      backgroundColor: '#52c41a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    {dataset.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text strong>{dataset.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dataset.row_count ? `${dataset.row_count} ${getPluralForm(dataset.row_count)}` : 'Количество вопросов неизвестно'}
                      </Text>
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

export default DatasetSelector;
