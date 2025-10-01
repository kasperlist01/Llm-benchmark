import React, { useEffect, useState } from 'react';
import { settingsAPI, modelsAPI } from '../services/api';
import { APIIntegration, UserModel } from '../types';
import { showNotification } from '../utils/notifications';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
  const [models, setModels] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiModal, setShowApiModal] = useState(false);
  
  const [judgeModelId, setJudgeModelId] = useState<string>('0');
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [apiFormData, setApiFormData] = useState({
    name: '',
    api_url: '',
    api_key: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showApiModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showApiModal]);

  const loadData = async () => {
    try {
      const [integrationsData, modelsData, settingsData] = await Promise.all([
        settingsAPI.getIntegrations(),
        modelsAPI.getUserModels(),
        settingsAPI.getSettings(),
      ]);
      setIntegrations(Array.isArray(integrationsData) ? integrationsData : []);
      setModels(Array.isArray(modelsData) ? modelsData : []);
      setJudgeModelId(settingsData.judge_model_id ? String(settingsData.judge_model_id) : '0');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showNotification({
        message: 'Новые пароли не совпадают',
        type: 'error',
        title: 'Ошибка',
      });
      return;
    }

    try {
      await settingsAPI.changePassword(passwordForm);
      showNotification({
        message: 'Пароль успешно обновлен!',
        type: 'success',
        title: 'Успех',
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.error || 'Ошибка при смене пароля',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const handleApiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await settingsAPI.addIntegration(apiFormData);
      showNotification({
        message: 'API интеграция успешно добавлена!',
        type: 'success',
        title: 'Успех',
      });
      setShowApiModal(false);
      setApiFormData({ name: '', api_url: '', api_key: '', description: '' });
      loadData();
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.error || 'Ошибка при добавлении интеграции',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const handleDeleteIntegration = async (integrationId: number) => {
    if (!window.confirm('Вы уверены?')) {
      return;
    }

    try {
      await settingsAPI.deleteIntegration(integrationId);
      showNotification({
        message: 'API интеграция успешно удалена',
        type: 'success',
        title: 'Успех',
      });
      loadData();
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.error || 'Ошибка при удалении интеграции',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const handleSaveJudgeModel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await settingsAPI.updateSettings({
        judge_model_id: judgeModelId === '0' ? null : parseInt(judgeModelId),
      });
      showNotification({
        message: 'Настройки модели-судьи сохранены!',
        type: 'success',
        title: 'Успех',
      });
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.error || 'Ошибка при сохранении настроек',
        type: 'error',
        title: 'Ошибка',
      });
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
    <div className="settings-container">
      <div className="settings-header">
        <i className="fas fa-cog"></i>
        <h1>Настройки пользователя</h1>
      </div>

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="settings-card">
          <h2>
            <i className="fas fa-user-circle"></i> Профиль
          </h2>
          <p>Управление личной информацией и предпочтениями</p>

          <div className="profile-avatar">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>

          <div className="profile-info">
            <h3>{user?.username || 'Username'}</h3>
            <p>ID пользователя: {user?.id || 'N/A'}</p>
          </div>

          <div className="api-integration">
            <h3>Интеграции API</h3>
            <p>Управление API-ключами и подключениями для интеграции с внешними сервисами</p>
            <button className="api-btn" onClick={() => setShowApiModal(true)}>
              <i className="fas fa-plus"></i> Добавить интеграцию
            </button>

            {integrations.length > 0 && (
              <div className="api-integrations-list">
                {integrations.map((integration) => (
                  <div key={integration.id} className="api-integration-item">
                    <div>
                      <h4>{integration.name}</h4>
                      <p>{integration.api_url}</p>
                      {integration.description && <p>{integration.description}</p>}
                    </div>
                    <div className="api-integration-actions">
                      <button
                        className="btn-small btn-delete"
                        onClick={() => handleDeleteIntegration(integration.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Card */}
        <div className="settings-card">
          <h2>
            <i className="fas fa-key"></i> Безопасность
          </h2>
          <p>Обновите пароль и управляйте настройками безопасности</p>

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="current_password">
                <i className="fas fa-lock"></i> Текущий пароль
              </label>
              <input
                type="password"
                id="current_password"
                className="form-control"
                placeholder="Введите текущий пароль"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current_password: e.target.value })
                }
                required
              />
            </div>

            <div className="form-divider"></div>

            <div className="form-group">
              <label htmlFor="new_password">
                <i className="fas fa-key"></i> Новый пароль
              </label>
              <input
                type="password"
                id="new_password"
                className="form-control"
                placeholder="Введите новый пароль"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new_password: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">
                <i className="fas fa-check-circle"></i> Подтвердите пароль
              </label>
              <input
                type="password"
                id="confirm_password"
                className="form-control"
                placeholder="Подтвердите новый пароль"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                }
                required
              />
            </div>

            <div className="password-requirements">
              <strong>Требования к паролю:</strong>
              <ul>
                <li>Не менее 6 символов</li>
                <li>Включает заглавные и строчные буквы</li>
                <li>Включает как минимум одну цифру</li>
                <li>Включает как минимум один специальный символ</li>
              </ul>
            </div>

            <div className="form-group">
              <button type="submit" className="btn btn-primary btn-submit-password">
                Изменить пароль
              </button>
            </div>
          </form>
        </div>

        {/* Judge Model Card */}
        <div className="settings-card full-width-card">
          <h2>
            <i className="fas fa-gavel"></i> Настройки модели-судьи
          </h2>
          <p>Выберите модель, которая будет использоваться для автоматической оценки других моделей</p>

          <div className="judge-model-section">
            <form onSubmit={handleSaveJudgeModel}>
              <div className="form-group">
                <label htmlFor="judge_model_id">
                  <i className="fas fa-robot"></i> Модель-судья
                </label>
                <select
                  id="judge_model_id"
                  className="form-control styled-select"
                  value={judgeModelId}
                  onChange={(e) => setJudgeModelId(e.target.value)}
                >
                  <option value="0">Не выбрано</option>
                  {models.map((model) => {
                    const modelIdNum = parseInt(model.id.replace('custom_', ''));
                    return (
                      <option key={model.id} value={modelIdNum}>
                        {model.name}
                      </option>
                    );
                  })}
                </select>
                <small className="form-text text-muted">
                  Только модели с настроенными API интеграциями могут выступать в роли судьи
                </small>
              </div>

              <div className="form-group">
                <button type="submit" className="btn btn-primary">
                  Сохранить настройки судьи
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* API Integration Modal */}
      {showApiModal && (
        <div
          className="modal"
          style={{ display: 'block' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowApiModal(false);
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2>Добавить API интеграцию</h2>
              <span className="close" onClick={() => setShowApiModal(false)}>
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={handleApiSubmit}>
                <div className="form-group">
                  <label>Название</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="OpenAI, Anthropic, Custom API..."
                    value={apiFormData.name}
                    onChange={(e) => setApiFormData({ ...apiFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>API URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://api.openai.com/v1"
                    value={apiFormData.api_url}
                    onChange={(e) => setApiFormData({ ...apiFormData, api_url: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="sk-..."
                    value={apiFormData.api_key}
                    onChange={(e) => setApiFormData({ ...apiFormData, api_key: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    className="form-control"
                    placeholder="Описание интеграции"
                    rows={3}
                    value={apiFormData.description}
                    onChange={(e) =>
                      setApiFormData({ ...apiFormData, description: e.target.value })
                    }
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Добавить интеграцию
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

export default Settings;
