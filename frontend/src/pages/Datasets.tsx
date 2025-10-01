import React, { useEffect, useState } from 'react';
import { datasetsAPI } from '../services/api';
import { UserDataset } from '../types';
import { showNotification } from '../utils/notifications';

const Datasets: React.FC = () => {
  const [datasets, setDatasets] = useState<UserDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    csv_file: null as File | null,
  });

  const [webDatasetData, setWebDatasetData] = useState({
    name: '',
    description: '',
    rows: [{ prompt: '', reference: '' }] as Array<{ prompt: string; reference: string }>,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showModal || showWebModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showModal, showWebModal]);

  const loadData = async () => {
    try {
      const data = await datasetsAPI.getUserDatasets();
      setDatasets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, csv_file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.csv_file) {
      showNotification({
        message: 'Пожалуйста, выберите CSV файл',
        type: 'error',
        title: 'Ошибка',
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('csv_file', formData.csv_file);

    try {
      await datasetsAPI.addDataset(formDataToSend);
      showNotification({
        message: 'Датасет успешно загружен!',
        type: 'success',
        title: 'Успех',
      });
      setShowModal(false);
      setFormData({ name: '', description: '', csv_file: null });
      loadData();
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.error || 'Ошибка при загрузке датасета',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const handleDelete = async (datasetId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот датасет?')) {
      return;
    }

    try {
      await datasetsAPI.deleteDataset(datasetId);
      showNotification({
        message: 'Датасет успешно удален',
        type: 'success',
        title: 'Успех',
      });
      loadData();
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.error || 'Ошибка при удалении датасета',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const handleWebDatasetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!webDatasetData.name) {
      showNotification({
        message: 'Пожалуйста, укажите название датасета',
        type: 'error',
        title: 'Ошибка',
      });
      return;
    }

    const validRows = webDatasetData.rows.filter(row => row.prompt.trim() !== '' || row.reference.trim() !== '');
    
    if (validRows.length === 0) {
      showNotification({
        message: 'Добавьте хотя бы одну строку с данными',
        type: 'error',
        title: 'Ошибка',
      });
      return;
    }

    try {
      await datasetsAPI.addDatasetFromWeb({
        name: webDatasetData.name,
        description: webDatasetData.description,
        rows: validRows,
      });
      showNotification({
        message: 'Датасет успешно создан!',
        type: 'success',
        title: 'Успех',
      });
      setShowWebModal(false);
      setWebDatasetData({
        name: '',
        description: '',
        rows: [{ prompt: '', reference: '' }],
      });
      loadData();
    } catch (error: any) {
      showNotification({
        message: error.response?.data?.error || 'Ошибка при создании датасета',
        type: 'error',
        title: 'Ошибка',
      });
    }
  };

  const addRow = () => {
    setWebDatasetData({
      ...webDatasetData,
      rows: [...webDatasetData.rows, { prompt: '', reference: '' }],
    });
  };

  const removeRow = (index: number) => {
    if (webDatasetData.rows.length > 1) {
      const newRows = webDatasetData.rows.filter((_, i) => i !== index);
      setWebDatasetData({ ...webDatasetData, rows: newRows });
    }
  };

  const updateRow = (index: number, field: 'prompt' | 'reference', value: string) => {
    const newRows = [...webDatasetData.rows];
    newRows[index][field] = value;
    setWebDatasetData({ ...webDatasetData, rows: newRows });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
        <h1>Мои датасеты</h1>
      </div>

      {datasets.length > 0 ? (
        <>
          <div className="models-list">
            {datasets.map((dataset) => {
              const datasetIdNum = parseInt(dataset.id.replace('dataset_', ''));
              return (
                <div key={dataset.id} className="model-card">
                  <div className="model-header">
                    <div className="model-icon" style={{ backgroundColor: '#4CAF50' }}>
                      <i className="fas fa-table"></i>
                    </div>
                    <div className="model-info">
                      <h3>{dataset.name}</h3>
                      <p>{dataset.description || 'Описание отсутствует'}</p>
                    </div>
                  </div>
                  <div className="model-details">
                    <div className="model-endpoint">
                      <span className="label">Строк:</span>
                      <span className="value">{dataset.row_count || 'N/A'}</span>
                    </div>
                    {dataset.file_path && (
                      <div className="model-endpoint">
                        <span className="label">Файл:</span>
                        <span className="value">{dataset.file_path.split('/').pop()}</span>
                      </div>
                    )}
                  </div>
                  <div className="model-actions">
                    <button className="btn btn-danger" onClick={() => handleDelete(datasetIdNum)}>
                      <i className="fas fa-trash-alt"></i> Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="models-footer" style={{ marginTop: '32px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <i className="fas fa-file-upload"></i> Загрузить CSV
            </button>
            <button className="btn btn-secondary" onClick={() => setShowWebModal(true)}>
              <i className="fas fa-edit"></i> Создать в браузере
            </button>
          </div>
        </>
      ) : (
        <div className="empty-models">
          <i className="fas fa-table fa-4x"></i>
          <h3>Пока нет датасетов</h3>
          <p>Добавьте CSV датасеты для использования в тестировании моделей</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <i className="fas fa-file-upload"></i> Загрузить CSV
            </button>
            <button className="btn btn-secondary" onClick={() => setShowWebModal(true)}>
              <i className="fas fa-edit"></i> Создать в браузере
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal" style={{ display: 'block' }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowModal(false);
          }
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Добавить датасет</h2>
              <span className="close" onClick={() => setShowModal(false)}>
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Название датасета</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Например: Тестовые вопросы"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    className="form-control"
                    placeholder="Краткое описание датасета"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>CSV файл</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".csv"
                    onChange={handleFileChange}
                    required
                  />
                  <small className="form-text text-muted">
                    Загрузите CSV файл с колонками для prompts и reference answers
                  </small>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Загрузить датасет
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showWebModal && (
        <div
          className="modal modal-large"
          style={{ display: 'block' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWebModal(false);
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2>Создать датасет в браузере</h2>
              <span className="close" onClick={() => setShowWebModal(false)}>
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={handleWebDatasetSubmit}>
                <div className="form-group">
                  <label>Название датасета</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Например: Тестовые вопросы"
                    value={webDatasetData.name}
                    onChange={(e) =>
                      setWebDatasetData({ ...webDatasetData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    className="form-control"
                    placeholder="Краткое описание датасета"
                    rows={2}
                    value={webDatasetData.description}
                    onChange={(e) =>
                      setWebDatasetData({ ...webDatasetData, description: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Данные</label>
                  <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>#</th>
                          <th style={{ width: '42%' }}>Prompt (запрос)</th>
                          <th style={{ width: '42%' }}>Reference (эталон)</th>
                          <th style={{ width: '11%' }}>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webDatasetData.rows.map((row, index) => (
                          <tr key={index}>
                            <td style={{ textAlign: 'center' }}>{index + 1}</td>
                            <td>
                              <textarea
                                className="form-control"
                                value={row.prompt}
                                onChange={(e) => updateRow(index, 'prompt', e.target.value)}
                                placeholder="Введите запрос..."
                                rows={2}
                                style={{ width: '100%', resize: 'vertical' }}
                              />
                            </td>
                            <td>
                              <textarea
                                className="form-control"
                                value={row.reference}
                                onChange={(e) => updateRow(index, 'reference', e.target.value)}
                                placeholder="Введите эталонный ответ..."
                                rows={2}
                                style={{ width: '100%', resize: 'vertical' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-danger btn-small"
                                onClick={() => removeRow(index)}
                                disabled={webDatasetData.rows.length === 1}
                                title="Удалить строку"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <button type="button" className="btn btn-secondary" onClick={addRow}>
                    <i className="fas fa-plus"></i> Добавить строку
                  </button>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Создать датасет
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

export default Datasets;
