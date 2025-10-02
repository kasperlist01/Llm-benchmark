import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, Empty, Spin, Modal, Form, Input, Upload, Table, message, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, EditOutlined, DatabaseOutlined, MinusCircleOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { datasetsAPI } from '../services/api';
import { UserDataset } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Helper function for Russian plural forms
const getPluralForm = (count: number, one: string, few: string, many: string): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return many;
  }
  
  if (lastDigit === 1) {
    return one;
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  
  return many;
};

const Datasets: React.FC = () => {
  const [datasets, setDatasets] = useState<UserDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [editingDataset, setEditingDataset] = useState<UserDataset | null>(null);
  const [datasetData, setDatasetData] = useState<Array<{prompt: string; reference: string}>>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [form] = Form.useForm();
  const [webForm] = Form.useForm();
  const [editDataForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await datasetsAPI.getUserDatasets();
      setDatasets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading datasets:', error);
      message.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingDataset) {
        // Редактирование существующих вопросов
        const datasetIdNum = parseInt(editingDataset.id.replace('dataset_', ''));
        
        // Обновляем имя и описание
        await datasetsAPI.updateDataset(datasetIdNum, {
          name: values.name,
          description: values.description || '',
        });

        // Если выбран новый файл, обновляем содержимое
        if (fileList.length > 0) {
          const formData = new FormData();
          formData.append('csv_file', fileList[0].originFileObj as File);
          await datasetsAPI.updateDatasetContent(datasetIdNum, formData);
          message.success('Вопросы и их содержимое успешно обновлены!');
        } else {
          message.success('Вопросы успешно обновлены!');
        }
      } else {
        // Добавление новых вопросов
        if (fileList.length === 0) {
          message.error('Пожалуйста, выберите CSV файл');
          return;
        }

        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('description', values.description || '');
        formData.append('csv_file', fileList[0].originFileObj as File);

        await datasetsAPI.addDataset(formData);
        message.success('Вопросы успешно загружены!');
      }
      
      setShowModal(false);
      setEditingDataset(null);
      form.resetFields();
      setFileList([]);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка при сохранении вопросов');
    }
  };

  const handleDelete = async (datasetId: number) => {
    Modal.confirm({
      title: 'Подтверждение удаления',
      content: 'Вы уверены, что хотите удалить эти вопросы?',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await datasetsAPI.deleteDataset(datasetId);
          message.success('Вопросы успешно удалены');
          loadData();
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Ошибка при удалении вопросов');
        }
      },
    });
  };

  const handleWebDatasetSubmit = async (values: any) => {
    const validRows = values.rows.filter((row: any) => row?.prompt?.trim() || row?.reference?.trim());
    
    if (validRows.length === 0) {
      message.error('Добавьте хотя бы одну строку с данными');
      return;
    }

    try {
      await datasetsAPI.addDatasetFromWeb({
        name: values.name,
        description: values.description || '',
        rows: validRows,
      });
      message.success('Вопросы успешно созданы!');
      setShowWebModal(false);
      webForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка при создании вопросов');
    }
  };

  const handleEditDataSubmit = async (values: any) => {
    if (!editingDataset) return;

    const validRows = values.rows.filter((row: any) => row?.prompt?.trim() || row?.reference?.trim());
    
    if (validRows.length === 0) {
      message.error('Вопросы должны содержать хотя бы одну строку с данными');
      return;
    }

    try {
      const datasetIdNum = parseInt(editingDataset.id.replace('dataset_', ''));
      
      // Обновляем название и описание
      await datasetsAPI.updateDataset(datasetIdNum, {
        name: values.name,
        description: values.description || '',
      });
      
      // Обновляем данные
      await datasetsAPI.saveDatasetData(datasetIdNum, validRows);
      message.success('Вопросы успешно обновлены!');
      setShowEditDataModal(false);
      setEditingDataset(null);
      editDataForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка при сохранении данных');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Загрузка...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>Мои вопросы</Title>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              size="large"
              onClick={() => setShowModal(true)}
            >
              Загрузить CSV
            </Button>
            <Button
              icon={<EditOutlined />}
              size="large"
              onClick={() => setShowWebModal(true)}
            >
              Создать в браузере
            </Button>
          </Space>
        </div>

        {datasets.length > 0 ? (
          <Row gutter={[16, 16]}>
            {datasets.map((dataset) => {
              const datasetIdNum = parseInt(dataset.id.replace('dataset_', ''));
              return (
                <Col xs={24} sm={12} md={8} key={dataset.id}>
                  <Card
                    hoverable
                    style={{ 
                      height: '100%', 
                      minHeight: '280px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                    }}
                    bodyStyle={{
                      height: '100%',
                      padding: '24px',
                    }}
                    onClick={async () => {
                      setEditingDataset(dataset);
                      setLoadingData(true);
                      setShowViewModal(true);
                      try {
                        const result = await datasetsAPI.getDatasetData(datasetIdNum);
                        setDatasetData(result.data);
                      } catch (error: any) {
                        message.error(error.response?.data?.error || 'Ошибка загрузки данных');
                        setShowViewModal(false);
                      } finally {
                        setLoadingData(false);
                      }
                    }}
                  >
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Header */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 56,
                          height: 56,
                          background: '#1890ff',
                          borderRadius: '16px',
                          marginBottom: 16,
                        }}>
                          <DatabaseOutlined style={{ fontSize: 28, color: '#fff' }} />
                        </div>
                        <Title level={4} style={{ margin: 0, marginBottom: 8, fontSize: 18 }}>
                          {dataset.name}
                        </Title>
                        {dataset.description && (
                          <Text 
                            type="secondary"
                            style={{ 
                              fontSize: 13,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.6
                            }}
                          >
                            {dataset.description}
                          </Text>
                        )}
                      </div>

                      {/* Stats Badge */}
                      <div style={{ 
                        background: '#f5f5f5',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: 16,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <Text strong style={{ fontSize: 15 }}>Записей в наборе</Text>
                          <div style={{
                            background: '#1890ff',
                            color: '#fff',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            fontSize: 16,
                          }}>
                            {dataset.row_count || 0}
                          </div>
                        </div>
                        {dataset.file_path && (
                          <div style={{ 
                            paddingTop: 10, 
                            borderTop: '1px solid #f0f0f0',
                          }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                              Источник:
                            </Text>
                            <Text style={{ fontSize: 12, color: '#666', wordBreak: 'break-all' }}>
                              {dataset.file_path.split('/').pop()}
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: 8 }}>
                          <Button
                            icon={<EyeOutlined />}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setEditingDataset(dataset);
                              setLoadingData(true);
                              setShowViewModal(true);
                              try {
                                const result = await datasetsAPI.getDatasetData(datasetIdNum);
                                setDatasetData(result.data);
                              } catch (error: any) {
                                message.error(error.response?.data?.error || 'Ошибка загрузки данных');
                                setShowViewModal(false);
                              } finally {
                                setLoadingData(false);
                              }
                            }}
                            style={{ 
                              flex: 1,
                              height: 40
                            }}
                          >
                            Открыть
                          </Button>
                          <Button
                            icon={<EditOutlined />}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setEditingDataset(dataset);
                              setLoadingData(true);
                              setShowEditDataModal(true);
                              try {
                                const result = await datasetsAPI.getDatasetData(datasetIdNum);
                                setDatasetData(result.data);
                                editDataForm.setFieldsValue({ 
                                  name: dataset.name,
                                  description: dataset.description,
                                  rows: result.data 
                                });
                              } catch (error: any) {
                                message.error(error.response?.data?.error || 'Ошибка загрузки данных');
                                setShowEditDataModal(false);
                              } finally {
                                setLoadingData(false);
                              }
                            }}
                            style={{ 
                              flex: 1,
                              height: 40
                            }}
                          >
                            Изменить
                          </Button>
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(datasetIdNum);
                            }}
                            style={{ 
                              height: 40
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Card style={{ textAlign: 'center', padding: '40px 0' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size="small">
                  <Text strong>Нет вопросов</Text>
                  <Text type="secondary">
                    Добавьте CSV вопросы для использования в тестировании моделей
                  </Text>
                </Space>
              }
            >
              <Space>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setShowModal(true)}
                >
                  Загрузить CSV
                </Button>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setShowWebModal(true)}
                >
                  Создать в браузере
                </Button>
              </Space>
            </Empty>
          </Card>
        )}
      </Space>

      <Modal
        title={editingDataset ? 'Редактировать вопросы' : 'Добавить вопросы'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingDataset(null);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Например: Тестовые вопросы" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={3} placeholder="Краткое описание вопросов" />
          </Form.Item>

          <Form.Item
            label={editingDataset ? "Новый CSV файл (опционально)" : "CSV файл"}
            required={!editingDataset}
            extra={editingDataset 
              ? "Загрузите новый CSV файл для замены содержимого вопросов (оставьте пустым, чтобы сохранить текущее содержимое)"
              : "Загрузите CSV файл с колонками для prompts и reference answers"
            }
          >
            <Upload
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              accept=".csv"
            >
              <Button icon={<UploadOutlined />} size="large" block>
                {editingDataset ? 'Выбрать новый файл (опционально)' : 'Выбрать файл'}
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setShowModal(false);
                setEditingDataset(null);
                form.resetFields();
                setFileList([]);
              }}>
                Отмена
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDataset ? 'Сохранить' : 'Загрузить вопросы'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Создать вопросы в браузере"
        open={showWebModal}
        onCancel={() => {
          setShowWebModal(false);
          webForm.resetFields();
        }}
        footer={null}
        width={900}
      >
        <Form
          form={webForm}
          layout="vertical"
          onFinish={handleWebDatasetSubmit}
          initialValues={{ rows: [{ prompt: '', reference: '' }] }}
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Например: Тестовые вопросы" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={2} placeholder="Краткое описание вопросов" />
          </Form.Item>

          <Form.Item label="Данные">
            <Form.List name="rows">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      size="small"
                      style={{ marginBottom: 12 }}
                      title={`Строка ${index + 1}`}
                      extra={
                        fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            Удалить
                          </Button>
                        )
                      }
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, 'prompt']}
                        label="Вопрос"
                        style={{ marginBottom: 12 }}
                      >
                        <TextArea rows={2} placeholder="Введите вопрос..." />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'reference']}
                        label="Эталонный ответ"
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea rows={2} placeholder="Введите эталонный ответ..." />
                      </Form.Item>
                    </Card>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    block
                  >
                    Добавить строку
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setShowWebModal(false);
                webForm.resetFields();
              }}>
                Отмена
              </Button>
              <Button type="primary" htmlType="submit">
                Создать вопросы
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Редактировать данные: ${editingDataset?.name || ''}`}
        open={showEditDataModal}
        onCancel={() => {
          setShowEditDataModal(false);
          setEditingDataset(null);
          editDataForm.resetFields();
        }}
        footer={null}
        width={900}
      >
        {loadingData ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Загрузка данных...</Text>
            </div>
          </div>
        ) : (
          <Form
            form={editDataForm}
            layout="vertical"
            onFinish={handleEditDataSubmit}
          >
            <Form.Item
              name="name"
              label="Название"
              rules={[{ required: true, message: 'Введите название' }]}
            >
              <Input placeholder="Например: Тестовые вопросы" size="large" />
            </Form.Item>

            <Form.Item name="description" label="Описание">
              <TextArea rows={2} placeholder="Краткое описание вопросов" />
            </Form.Item>

            <Form.Item label={`Данные вопросов (${datasetData.length} ${getPluralForm(datasetData.length, 'строка', 'строки', 'строк')})`}>
              <Form.List name="rows">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        style={{ marginBottom: 12 }}
                        title={`Строка ${index + 1}`}
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            Удалить
                          </Button>
                        }
                      >
                        <Form.Item
                          {...field}
                          name={[field.name, 'prompt']}
                          label="Вопрос"
                          style={{ marginBottom: 12 }}
                        >
                          <TextArea rows={2} placeholder="Введите вопрос..." />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'reference']}
                          label="Эталонный ответ"
                          style={{ marginBottom: 0 }}
                        >
                          <TextArea rows={2} placeholder="Введите эталонный ответ..." />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      block
                    >
                      Добавить строку
                    </Button>
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setShowEditDataModal(false);
                  setEditingDataset(null);
                  editDataForm.resetFields();
                }}>
                  Отмена
                </Button>
                <Button type="primary" htmlType="submit">
                  Сохранить изменения
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={`Просмотр: ${editingDataset?.name || ''}`}
        open={showViewModal}
        onCancel={() => {
          setShowViewModal(false);
          setEditingDataset(null);
        }}
        footer={null}
        width={900}
      >
        {loadingData ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Загрузка данных...</Text>
            </div>
          </div>
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Text strong>Всего строк: {datasetData.length}</Text>
              {datasetData.map((row, index) => (
                <Card key={index} size="small" title={`Строка ${index + 1}`}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ color: '#1890ff' }}>Вопрос:</Text>
                      <div style={{ 
                        marginTop: 8, 
                        padding: 12, 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: 4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {row.prompt || <Text type="secondary">Пусто</Text>}
                      </div>
                    </div>
                    <div>
                      <Text strong style={{ color: '#52c41a' }}>Эталонный ответ:</Text>
                      <div style={{ 
                        marginTop: 8, 
                        padding: 12, 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: 4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {row.reference || <Text type="secondary">Пусто</Text>}
                      </div>
                    </div>
                  </Space>
                </Card>
              ))}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Datasets;
