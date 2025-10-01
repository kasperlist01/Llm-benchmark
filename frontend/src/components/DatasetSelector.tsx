import React, { useEffect, useState } from 'react';
import { UserDataset } from '../types';
import { datasetsAPI } from '../services/api';

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
  const [collapsed, setCollapsed] = useState(false);

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
    <div className="component-container">
      <h2 onClick={() => setCollapsed(!collapsed)}>
        Датасеты
        <span className={`toggle-icon ${collapsed ? 'collapsed' : ''}`}>▼</span>
      </h2>
      <div className={`component-content ${collapsed ? 'collapsed' : ''}`}>
        {loading ? (
          <div className="loading">Загрузка датасетов...</div>
        ) : (
          <div className="datasets-grid" id="datasetsGrid">
            {datasets.length === 0 ? (
              <div className="empty-datasets">
                <i className="fas fa-table fa-2x"></i>
                <p>
                  У вас пока нет загруженных датасетов. <a href="/datasets">Загрузите датасеты</a> чтобы использовать их в тестировании.
                </p>
              </div>
            ) : (
              <div className="datasets-container">
                {datasets.map((dataset) => {
                  const isSelected = selectedDatasets.includes(dataset.id);
                  const initials = dataset.name.substring(0, 2).toUpperCase();

                  return (
                    <div
                      key={dataset.id}
                      className={`dataset-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleDataset(dataset.id)}
                    >
                      <div className="dataset-icon">{initials}</div>
                      <div className="dataset-info">
                        <h3 title={dataset.name}>{dataset.name}</h3>
                        <p title={dataset.file_path || ''}>
                          {dataset.file_path ? dataset.file_path.split('/').pop() : ''}
                        </p>
                        <div className="dataset-tags">
                          <span className="stat">
                            {dataset.row_count
                              ? dataset.row_count.toLocaleString() + ' строк'
                              : 'Неизвестно строк'}
                          </span>
                          <span className="stat">Неизвестно колонок</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetSelector;
