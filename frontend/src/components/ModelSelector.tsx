import React, { useEffect, useState } from 'react';
import { UserModel } from '../types';
import { modelsAPI } from '../services/api';

interface ModelSelectorProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModels, onSelectionChange }) => {
  const [models, setModels] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
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

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter((id) => id !== modelId));
    } else {
      onSelectionChange([...selectedModels, modelId]);
    }
  };

  return (
    <div className="component-container" id="modelComparisonContainer">
      <h2 onClick={() => setCollapsed(!collapsed)}>
        Модели
        <span className={`toggle-icon ${collapsed ? 'collapsed' : ''}`}>▼</span>
      </h2>
      <div className={`component-content ${collapsed ? 'collapsed' : ''}`} id="modelComparisonContent">
        {loading ? (
          <div className="loading">Загрузка моделей...</div>
        ) : (
          <div className="models-grid" id="modelsGrid">
            {models.length === 0 ? (
              <div className="empty-models">
                <i className="fas fa-robot fa-2x"></i>
                <p>
                  У вас пока нет добавленных моделей. <a href="/models">Добавьте модели</a> чтобы начать тестирование.
                </p>
              </div>
            ) : (
              <div className="models-scroll-container">
                {models.map((model) => {
                  const isSelected = selectedModels.includes(model.id);
                  const initials = model.name.substring(0, 2).toUpperCase();
                  const isJudgeModel = judgeModelId && model.id === judgeModelId;

                  return (
                    <div
                      key={model.id}
                      className={`model-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleModel(model.id)}
                    >
                      <div
                        className="model-icon"
                        style={{ backgroundColor: model.color || '#808080' }}
                      >
                        {initials}
                      </div>
                      <div className="model-info">
                        <h3 title={model.name}>
                          {model.name}
                          {isJudgeModel && (
                            <span className="judge-indicator">
                              <i className="fas fa-gavel"></i> СУДЬЯ
                            </span>
                          )}
                        </h3>
                        <p title={model.api_integration?.name || ''}>
                          {model.api_integration?.name || ''}
                        </p>
                        <div className="model-tags">
                          <span className="tag custom-tag">Пользовательская</span>
                          {model.api_url || model.api_integration ? (
                            <span className="tag api-tag">API</span>
                          ) : (
                            <span className="tag no-api-tag">Нет API</span>
                          )}
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

export default ModelSelector;
