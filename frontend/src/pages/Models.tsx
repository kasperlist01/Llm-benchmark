import React, { useEffect, useState } from 'react';
import { modelsAPI, settingsAPI } from '../services/api';
import { UserModel, APIIntegration } from '../types';
import { showNotification } from '../utils/notifications';

const Models: React.FC = () => {
  const [models, setModels] = useState<UserModel[]>([]);
  const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [judgeModelId, setJudgeModelId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    api_integration_id: '',
    color: '#808080',
  });

  const [testingModel, setTestingModel] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showModal]);

  const loadData = async () => {
    try {
      const [modelsData, integrationsData, settings] = await Promise.all([
        modelsAPI.getUserModels(),
        settingsAPI.getIntegrations(),
        settingsAPI.getSettings(),
      ]);
      setModels(Array.isArray(modelsData) ? modelsData : []);
      setIntegrations(Array.isArray(integrationsData) ? integrationsData : []);
      setJudgeModelId(settings.judge_model_id || null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSend = {
      name: formData.name,
      description: formData.description,
      color: formData.color,
      api_integration_id: formData.api_integration_id || '0',
    };

    try {
      await modelsAPI.addModel(dataToSend);
      showNotification({
        message: 'Модель успешно добавлена!',
        type: 'success',
        title: 'Успех',
      });
      setShowModal(false);
      setFormData({ name: '', description: '', api_integration_id: '', color: '#808080' });
      loadData();
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.error || 'Ошибка при добавлении модели',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const handleDelete = async (modelId: number) => {
    const model = models.find((m) => m.id === `custom_${modelId}`);
    const isJudge = judgeModelId === modelId;

    let confirmMessage = 'Вы уверены, что хотите удалить эту модель?';
    if (isJudge) {
      confirmMessage =
        'Эта модель используется как судья. При удалении она будет автоматически удалена из настроек судьи. Продолжить?';
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await modelsAPI.deleteModel(modelId);
      showNotification({
        message: 'Модель успешно удалена',
        type: 'success',
        title: 'Успех',
      });
      loadData();
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.error || 'Ошибка при удалении модели',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const handleTestModel = async (modelId: number) => {
    setTestingModel(modelId);
    try {
      const result = await modelsAPI.testModel(modelId);
      showNotification({
        message: result.message || 'Соединение успешно',
        type: result.success ? 'success' : 'error',
        title: result.success ? 'Соединение успешно' : 'Ошибка соединения',
      });
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.message || 'Ошибка при тестировании',
        type: 'error',
        title: 'Ошибка соединения',
      });
    } finally {
      setTestingModel(null);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="user-models-container">
      <div className="page-header">
        <h1>Мои модели</h1>
      </div>

      {models.length > 0 ? (
        <>
          <div className="models-list">
            {models.map((model) => {
              const modelIdNum = parseInt(model.id.replace('custom_', ''));
              const isJudge = judgeModelId === modelIdNum;
              return (
                <div key={model.id} className="model-card">
                  <div className="model-header">
                    <div className="model-icon" style={{ backgroundColor: model.color || '#808080' }}>
                      {model.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="model-info">
                      <h3>
                        {model.name}
                        {isJudge && (
                          <span className="judge-indicator">
                            <i className="fas fa-gavel"></i> СУДЬЯ
                          </span>
                        )}
                      </h3>
                      <p>{model.api_integration?.name || 'Нет интеграции'}</p>
                    </div>
                  </div>
                  <div className="model-details">
                    <p className="model-description">{model.description || 'Описание не предоставлено.'}</p>

                    {model.api_integration ? (
                      <>
                        <div className="model-endpoint">
                          <span className="label">API Integration:</span>
                          <span className="value">{model.api_integration.name}</span>
                        </div>
                        <div className="model-endpoint">
                          <span className="label">API Endpoint:</span>
                          <span className="value">{model.api_integration.api_url}</span>
                        </div>
                      </>
                    ) : (
                      <div className="model-endpoint no-integration">
                        <span className="label">Статус:</span>
                        <span className="value">Нет API интеграции</span>
                      </div>
                    )}
                  </div>
                  <div className="model-actions">
                    {model.api_integration ? (
                      <button
                        className="btn btn-secondary test-model-btn"
                        onClick={() => handleTestModel(modelIdNum)}
                        disabled={testingModel === modelIdNum}
                      >
                        <i className="fas fa-vial"></i>
                        {testingModel === modelIdNum ? ' Проверка...' : ' Проверить соединение'}
                      </button>
                    ) : (
                      <button className="btn btn-secondary" disabled>
                        <i className="fas fa-exclamation-triangle"></i> Нет API
                      </button>
                    )}
                    <button className="btn btn-danger" onClick={() => handleDelete(modelIdNum)}>
                      <i className="fas fa-trash-alt"></i> Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="models-footer" style={{ marginTop: '32px', textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus"></i> Добавить новую модель
            </button>
          </div>
        </>
      ) : (
        <div className="empty-models">
          <i className="fas fa-robot fa-4x"></i>
          <h3>Пока нет пользовательских моделей</h3>
          <p>Добавьте свои собственные LLM-модели, чтобы включить их в тестирование</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus"></i> Добавить первую модель
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal" style={{ display: 'block' }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowModal(false);
            document.body.classList.remove('modal-open');
          }
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Добавить пользовательскую модель</h2>
              <span className="close" onClick={() => {
                setShowModal(false);
                document.body.classList.remove('modal-open');
              }}>
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group form-group-large">
                    <label>Название модели</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="GPT-4, Claude-3, Llama-2..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    className="form-control"
                    placeholder="Краткое описание этой модели"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group form-group-large">
                    <div className="form-label-help">
                      <label>API Интеграция</label>
                      <span className="tooltip-icon" data-tooltip="Выберите API интеграцию для этой модели">
                        ?
                      </span>
                    </div>
                    <select
                      className="form-control styled-select"
                      value={formData.api_integration_id}
                      onChange={(e) => setFormData({ ...formData, api_integration_id: e.target.value })}
                    >
                      <option value="">Выберите интеграцию</option>
                      {integrations.map((integration) => (
                        <option key={integration.id} value={integration.id}>
                          {integration.name}
                        </option>
                      ))}
                    </select>
                    <small className="form-text text-muted">
                      Если нужной интеграции нет, <a href="/settings" target="_blank">добавьте её в настройках</a>
                    </small>
                  </div>
                  <div className="form-group form-group-small">
                    <div className="form-label-help">
                      <label>Цвет</label>
                      <span className="tooltip-icon" data-tooltip="Цвет для визуального отображения модели">
                        ?
                      </span>
                    </div>
                    <div className="color-picker-container">
                      <input
                        type="color"
                        className="form-control color-picker"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                      <div
                        className="color-preview"
                        id="colorPreview"
                        style={{ backgroundColor: formData.color }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Добавить модель
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Models;
