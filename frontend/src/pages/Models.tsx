import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, Badge, Empty, Spin, Modal, Form, Input, Select, message, Row, Col, Tag, notification } from 'antd';
import { PlusOutlined, DeleteOutlined, ExperimentOutlined, ApiOutlined, CheckCircleOutlined, WarningOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { modelsAPI, settingsAPI } from '../services/api';
import { UserModel, APIIntegration } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Models: React.FC = () => {
  const [models, setModels] = useState<UserModel[]>([]);
  const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [judgeModelId, setJudgeModelId] = useState<number | null>(null);
  const [testingModel, setTestingModel] = useState<number | null>(null);
  const [editingModel, setEditingModel] = useState<UserModel | null>(null);
  const [form] = Form.useForm();
  
  useEffect(() => {
    // Configure notifications on component mount
    notification.config({
      placement: 'topRight',
      duration: 10,
      top: 80,
      getContainer: () => document.body,
    });
  }, []);

  useEffect(() => {
    loadData();
  }, []);

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
      message.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    const dataToSend = {
      name: values.name,
      description: values.description || '',
      color: values.color || '#808080',
      api_integration_id: values.api_integration_id || '0',
    };

    try {
      if (editingModel) {
        const modelIdNum = parseInt(editingModel.id.replace('custom_', ''));
        await modelsAPI.updateModel(modelIdNum, dataToSend);
        message.success('Модель успешно обновлена!');
      } else {
        await modelsAPI.addModel(dataToSend);
        message.success('Модель успешно добавлена!');
      }
      setShowModal(false);
      setEditingModel(null);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка при сохранении модели');
    }
  };

  const handleDelete = async (modelId: number) => {
    const isJudge = judgeModelId === modelId;
    const confirmMessage = isJudge
      ? 'Эта модель используется как судья. При удалении она будет автоматически удалена из настроек судьи. Продолжить?'
      : 'Вы уверены, что хотите удалить эту модель?';

    Modal.confirm({
      title: 'Подтверждение удаления',
      content: confirmMessage,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await modelsAPI.deleteModel(modelId);
          message.success('Модель успешно удалена');
          loadData();
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Ошибка при удалении модели');
        }
      },
    });
  };

  const handleTestModel = async (modelId: number) => {
    setTestingModel(modelId);
    try {
      const result = await modelsAPI.testModel(modelId);
      console.log('Test model result:', result);
      
      if (result && result.success === true) {
        const successMessage = result.message || 'Тест успешно пройден! Модель работает корректно.';
        const responseContent = result.response?.content ? `\n\nОтвет модели:\n${result.response.content}` : '';
        
        // Используем alert как самое надежное уведомление
        alert('УСПЕХ!\n\n' + successMessage + responseContent);
      } else if (result && result.success === false) {
        const errorMessage = result.message || 'Тест не пройден. Проверьте настройки API.';
        alert('ОШИБКА\n\n' + errorMessage);
      } else {
        console.warn('Unexpected result format:', result);
        alert('ПРЕДУПРЕЖДЕНИЕ\n\nТест завершен, но статус неопределен. Проверьте настройки API.');
      }
    } catch (error: any) {
      console.error('Test model error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Ошибка при тестировании модели';
      alert('❌ ОШИБКА\n\n' + errorMessage);
    } finally {
      setTestingModel(null);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>Мои модели</Title>
            <Text type="secondary">Управление вашими LLM-моделями</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setShowModal(true)}
          >
            Добавить модель
          </Button>
        </div>

        {/* Выбор модели-судьи */}
        <Card
          title={
            <Space>
              <ApiOutlined />
              <span>Модель-судья</span>
            </Space>
          }
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Выберите модель, которая будет использоваться для автоматической оценки других моделей
            </Paragraph>

            <Select
              size="large"
              style={{ width: '100%', maxWidth: 500 }}
              value={judgeModelId ? String(judgeModelId) : '0'}
              onChange={async (value) => {
                try {
                  const newJudgeModelId = value === '0' ? null : parseInt(value);
                  await settingsAPI.updateSettings({
                    judge_model_id: newJudgeModelId,
                  });
                  setJudgeModelId(newJudgeModelId);
                  message.success('Модель-судья успешно обновлена!');
                  loadData(); // Перезагружаем данные для обновления тегов
                } catch (error: any) {
                  message.error(error.response?.data?.error || 'Ошибка при обновлении модели-судьи');
                }
              }}
              placeholder="Выберите модель-судью"
            >
              <Select.Option value="0">Не выбрано</Select.Option>
              {models.map((model) => {
                const modelIdNum = parseInt(model.id.replace('custom_', ''));
                return (
                  <Select.Option key={model.id} value={String(modelIdNum)}>
                    {model.name}
                  </Select.Option>
                );
              })}
            </Select>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Только модели с настроенными API интеграциями могут выступать в роли судьи
            </Text>
          </Space>
        </Card>

        {models.length > 0 ? (
          <Row gutter={[16, 16]}>
            {models.map((model) => {
              const modelIdNum = parseInt(model.id.replace('custom_', ''));
              const isJudge = judgeModelId === modelIdNum;
              return (
                <Col xs={24} sm={12} md={8} key={model.id}>
                  <Card
                    hoverable
                    style={{ height: '100%', minHeight: '320px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '8px',
                            backgroundColor: model.color || '#808080',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 18,
                            fontWeight: 'bold',
                            flexShrink: 0,
                          }}
                        >
                          {model.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Space size={8} wrap>
                            <Text strong style={{ fontSize: 16 }}>{model.name}</Text>
                            {isJudge && (
                              <Tag color="gold" icon={<CheckCircleOutlined />}>СУДЬЯ</Tag>
                            )}
                          </Space>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              {model.api_integration?.name || 'Нет интеграции'}
                            </Text>
                          </div>
                        </div>
                      </div>

                      {model.description && (
                        <Paragraph
                          type="secondary"
                          ellipsis={{ rows: 2 }}
                          style={{ marginBottom: 0 }}
                        >
                          {model.description}
                        </Paragraph>
                      )}

                      {model.api_integration ? (
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: '6px' 
                        }}>
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Space>
                              <ApiOutlined style={{ color: '#1890ff' }} />
                              <Text strong style={{ fontSize: 12 }}>API Integration:</Text>
                            </Space>
                            <Text style={{ fontSize: 12, wordBreak: 'break-all' }}>
                              {model.api_integration.api_url}
                            </Text>
                          </Space>
                        </div>
                      ) : (
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#fff7e6', 
                          borderRadius: '6px',
                          border: '1px solid #ffd591'
                        }}>
                          <Space>
                            <WarningOutlined style={{ color: '#fa8c16' }} />
                            <Text type="warning" style={{ fontSize: 12 }}>
                              Нет API интеграции
                            </Text>
                          </Space>
                        </div>
                      )}

                      <Space style={{ width: '100%' }}>
                        {model.api_integration && (
                          <Button
                            type="default"
                            icon={<ExperimentOutlined />}
                            onClick={() => handleTestModel(modelIdNum)}
                            loading={testingModel === modelIdNum}
                            style={{ flex: 1 }}
                          >
                            Тест
                          </Button>
                        )}
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => {
                            form.setFieldsValue({
                              name: model.name,
                              description: model.description,
                              color: model.color,
                              api_integration_id: model.api_integration?.id,
                            });
                            setEditingModel(model);
                            setShowModal(true);
                          }}
                          style={{ flex: 1 }}
                        >
                          Изменить
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(modelIdNum)}
                          style={{ flex: 1 }}
                        >
                          Удалить
                        </Button>
                      </Space>
                    </Space>
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
                  <Text strong>Нет пользовательских моделей</Text>
                  <Text type="secondary">
                    Добавьте свои собственные LLM-модели, чтобы включить их в тестирование
                  </Text>
                </Space>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowModal(true)}
              >
                Добавить первую модель
              </Button>
            </Empty>
          </Card>
        )}
      </Space>

      <Modal
        title={editingModel ? 'Редактировать модель' : 'Добавить пользовательскую модель'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingModel(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ color: '#808080' }}
        >
          <Form.Item
            name="name"
            label="Название модели"
            rules={[{ required: true, message: 'Введите название модели' }]}
          >
            <Input placeholder="GPT-4, Claude-3, Llama-2..." size="large" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea
              rows={3}
              placeholder="Краткое описание этой модели"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="api_integration_id"
                label="API Интеграция"
                extra={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Если нужной интеграции нет, <a href="/settings">добавьте её в настройках</a>
                  </Text>
                }
              >
                <Select
                  placeholder="Выберите интеграцию"
                  size="large"
                  allowClear
                >
                  {integrations.map((integration) => (
                    <Select.Option key={integration.id} value={integration.id}>
                      {integration.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="color" label="Цвет">
                <Input type="color" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setShowModal(false);
                setEditingModel(null);
                form.resetFields();
              }}>
                Отмена
              </Button>
              <Button type="primary" htmlType="submit">
                {editingModel ? 'Сохранить' : 'Добавить модель'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Models;
