import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, Spin, Modal, Form, Input, Select, Avatar, List, Divider, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, KeyOutlined, ApiOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, SafetyOutlined, EditOutlined } from '@ant-design/icons';
import { settingsAPI, modelsAPI } from '../services/api';
import { APIIntegration, UserModel } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
  const [models, setModels] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiModal, setShowApiModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<APIIntegration | null>(null);
  const [judgeModelId, setJudgeModelId] = useState<string>('0');
  
  const [passwordForm] = Form.useForm();
  const [apiForm] = Form.useForm();
  const [judgeForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [integrationsData, modelsData, settingsData] = await Promise.all([
        settingsAPI.getIntegrations(),
        modelsAPI.getUserModels(),
        settingsAPI.getSettings(),
      ]);
      setIntegrations(Array.isArray(integrationsData) ? integrationsData : []);
      setModels(Array.isArray(modelsData) ? modelsData : []);
      const judgeId = settingsData.judge_model_id ? String(settingsData.judge_model_id) : '0';
      setJudgeModelId(judgeId);
      judgeForm.setFieldsValue({ judge_model_id: judgeId });
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: any) => {
    try {
      await settingsAPI.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      message.success('Пароль успешно обновлен!');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка при смене пароля');
    }
  };

  const handleApiSubmit = async (values: any) => {
    try {
      if (editingIntegration) {
        await settingsAPI.updateIntegration(editingIntegration.id, values);
        message.success('API интеграция успешно обновлена!');
      } else {
        await settingsAPI.addIntegration(values);
        message.success('API интеграция успешно добавлена!');
      }
      setShowApiModal(false);
      setEditingIntegration(null);
      apiForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка при сохранении интеграции');
    }
  };

  const handleDeleteIntegration = async (integrationId: number) => {
    Modal.confirm({
      title: 'Подтверждение удаления',
      content: 'Вы уверены, что хотите удалить эту API интеграцию?',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await settingsAPI.deleteIntegration(integrationId);
          message.success('API интеграция успешно удалена');
          loadData();
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Ошибка при удалении интеграции');
        }
      },
    });
  };

  const handleSaveJudgeModel = async (values: any) => {
    try {
      await settingsAPI.updateSettings({
        judge_model_id: values.judge_model_id === '0' ? null : parseInt(values.judge_model_id),
      });
      message.success('Настройки модели-судьи сохранены!');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка при сохранении настроек');
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
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>Настройки</Title>
          <Text type="secondary">Управление профилем и настройками безопасности</Text>
        </div>

        <Row gutter={[16, 16]}>
          {/* Профиль */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Профиль</span>
                </Space>
              }
              style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar
                    size={80}
                    style={{ backgroundColor: '#1890ff', fontSize: 32 }}
                  >
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                  <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                    {user?.username || 'Username'}
                  </Title>
                  <Text type="secondary">ID: {user?.id || 'N/A'}</Text>
                </div>

                <Divider />

                <div>
                  <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text strong>
                      <ApiOutlined /> API Интеграции
                    </Text>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setShowApiModal(true)}
                    >
                      Добавить
                    </Button>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Управление API-ключами для внешних сервисов
                  </Text>

                  {integrations.length > 0 ? (
                      <List
                        style={{ marginTop: 12 }}
                        dataSource={integrations}
                        renderItem={(integration) => (
                          <List.Item
                            actions={[
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  apiForm.setFieldsValue({
                                    name: integration.name,
                                    api_url: integration.api_url,
                                    api_key: integration.api_key,
                                    description: integration.description,
                                  });
                                  setEditingIntegration(integration);
                                  setShowApiModal(true);
                                }}
                              />,
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteIntegration(integration.id)}
                              />
                            ]}
                          >
                          <List.Item.Meta
                            title={<Text strong>{integration.name}</Text>}
                            description={
                              <Space direction="vertical" size={0}>
                                <Text style={{ fontSize: 12 }} type="secondary">
                                  {integration.api_url}
                                </Text>
                                {integration.description && (
                                  <Text style={{ fontSize: 12 }} type="secondary">
                                    {integration.description}
                                  </Text>
                                )}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ 
                      marginTop: 12, 
                      padding: '16px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <Text type="secondary">Нет интеграций</Text>
                    </div>
                  )}
                </div>
              </Space>
            </Card>
          </Col>

          {/* Безопасность */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <LockOutlined />
                  <span>Безопасность</span>
                </Space>
              }
              style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Обновите пароль и управляйте настройками безопасности
                </Paragraph>

                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordSubmit}
                >
                  <Form.Item
                    name="current_password"
                    label="Текущий пароль"
                    rules={[{ required: true, message: 'Введите текущий пароль' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="Введите текущий пароль"
                    />
                  </Form.Item>

                  <Form.Item
                    name="new_password"
                    label="Новый пароль"
                    rules={[
                      { required: true, message: 'Введите новый пароль' },
                      { min: 6, message: 'Минимум 6 символов' },
                    ]}
                  >
                    <Input.Password
                      prefix={<KeyOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="Введите новый пароль"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirm_password"
                    label="Подтвердите пароль"
                    dependencies={['new_password']}
                    rules={[
                      { required: true, message: 'Подтвердите новый пароль' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('new_password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Пароли не совпадают'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<SafetyOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="Подтвердите новый пароль"
                    />
                  </Form.Item>

                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f0f5ff', 
                    borderRadius: '6px',
                    border: '1px solid #d6e4ff',
                    marginBottom: 16
                  }}>
                    <Text strong style={{ fontSize: 13 }}>Требования к паролю:</Text>
                    <ul style={{ 
                      marginTop: 8, 
                      marginBottom: 0, 
                      paddingLeft: 20,
                      fontSize: 12
                    }}>
                      <li>Не менее 6 символов</li>
                      <li>Включает заглавные и строчные буквы</li>
                      <li>Включает как минимум одну цифру</li>
                    </ul>
                  </div>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" block>
                      Изменить пароль
                    </Button>
                  </Form.Item>
                </Form>
              </Space>
            </Card>
          </Col>

          {/* Модель-судья */}
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <ApiOutlined />
                  <span>Настройки модели-судьи</span>
                </Space>
              }
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Выберите модель, которая будет использоваться для автоматической оценки других моделей
                </Paragraph>

                <Form
                  form={judgeForm}
                  layout="vertical"
                  onFinish={handleSaveJudgeModel}
                  initialValues={{ judge_model_id: judgeModelId }}
                >
                  <Row gutter={16}>
                    <Col xs={24} md={16}>
                      <Form.Item
                        name="judge_model_id"
                        label="Модель-судья"
                        extra="Только модели с настроенными API интеграциями могут выступать в роли судьи"
                      >
                        <Select size="large">
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
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label=" " style={{ marginBottom: 0 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SaveOutlined />}
                          size="large"
                          block
                        >
                          Сохранить
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>

      <Modal
        title={editingIntegration ? "Редактировать API интеграцию" : "Добавить API интеграцию"}
        open={showApiModal}
        onCancel={() => {
          setShowApiModal(false);
          setEditingIntegration(null);
          apiForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={apiForm} layout="vertical" onFinish={handleApiSubmit}>
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="OpenAI, Anthropic, Custom API..." size="large" />
          </Form.Item>

          <Form.Item
            name="api_url"
            label="API URL"
            rules={[
              { required: true, message: 'Введите API URL' },
              { type: 'url', message: 'Введите корректный URL' },
            ]}
          >
            <Input placeholder="https://api.openai.com/v1" size="large" />
          </Form.Item>

          <Form.Item name="api_key" label="API Key">
            <Input.Password placeholder="sk-..." size="large" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={3} placeholder="Описание интеграции" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setShowApiModal(false);
                setEditingIntegration(null);
                apiForm.resetFields();
              }}>
                Отмена
              </Button>
              <Button type="primary" htmlType="submit">
                {editingIntegration ? 'Сохранить изменения' : 'Добавить интеграцию'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
