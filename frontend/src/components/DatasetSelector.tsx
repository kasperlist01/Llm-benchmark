import React, { useEffect, useState } from 'react';
import { Card, Checkbox, Space, Spin, Typography, Tag, Empty } from 'antd';
import { DatabaseOutlined, FileOutlined } from '@ant-design/icons';
import { UserDataset } from '../types';
import { datasetsAPI } from '../services/api';

const { Text, Link } = Typography;

interface DatasetSelectorProps {
  selectedDatasets: string[];
  onSelectionChange: (datasets: string[]) => void;
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

  const toggleDataset = (datasetId: string) => {
    if (selectedDatasets.includes(datasetId)) {
      onSelectionChange(selectedDatasets.filter((id) => id !== datasetId));
    } else {
      onSelectionChange([...selectedDatasets, datasetId]);
    }
  };

  return (
    <Card
      title="Датасеты"
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
              <Text>У вас пока нет загруженных датасетов</Text>
              <Link href="/datasets">Загрузите датасеты</Link>
            </Space>
          }
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {datasets.map((dataset) => {
            const isSelected = selectedDatasets.includes(dataset.id);
            return (
              <Card
                key={dataset.id}
                size="small"
                hoverable
                onClick={() => toggleDataset(dataset.id)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #fa8c16' : '1px solid #d9d9d9',
                  backgroundColor: isSelected ? '#fff7e6' : '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
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
                      {dataset.file_path && (
                        <Space size={4}>
                          <FileOutlined style={{ color: '#8c8c8c' }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dataset.file_path.split('/').pop()}
                          </Text>
                        </Space>
                      )}
                      <Space size={[4, 4]} wrap>
                        <Tag color="orange" icon={<DatabaseOutlined />}>
                          {dataset.row_count ? `${dataset.row_count.toLocaleString()} строк` : 'Неизвестно строк'}
                        </Tag>
                      </Space>
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
