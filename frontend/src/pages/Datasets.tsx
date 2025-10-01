import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, Empty, Spin, Modal, Form, Input, Upload, Table, message, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, EditOutlined, DatabaseOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { datasetsAPI } from '../services/api';
import { UserDataset } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Datasets: React.FC = () => {
  const [datasets, setDatasets] = useState<UserDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const [webForm] = Form.useForm();

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
    if (fileList.length === 0) {
      message.error('Пожалуйста, выберите CSV файл');
      return;
    }

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description || '');
    formData.append('csv_file', fileList[0].originFileObj as File);

    try {
      await datasetsAPI.addDataset(formData);
      message.success('Датасет успешно загружен!');
      setShowModal(false);
      form.resetFields();
      setFileList([]);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка при загрузке датасета');
    }
  };

  const handleDelete = async (datasetId: number) => {
    Modal.confirm({
      title: 'Подтверждение удаления',
      content: 'Вы уверены, что хотите удалить этот датасет?',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await datasetsAPI.deleteDataset(datasetId);
          message.success('Датасет успешно удален');
          loadData();
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Ошибка при удалении датасета');
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
      message.success('Датасет успешно создан!');
      setShowWebModal(false);
      webForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка при создании датасета');
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
            <Title level={2} style={{ marginBottom: 8 }}>Мои датасеты</Title>
            <Text type="secondary">Управление вашими датасетами для тестирования</Text>
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
                <Col xs={24} sm={12} md={8} lg={6} key={dataset.id}>
                  <Card
                    hoverable
                    style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '8px',
                            backgroundColor: '#52c41a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 20,
                            flexShrink: 0,
                          }}
                        >
                          <DatabaseOutlined />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ fontSize: 16 }}>{dataset.name}</Text>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              {dataset.description || 'Описание отсутствует'}
                            </Text>
                          </div>
                        </div>
                      </div>

                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '6px' 
                      }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Строк:</Text>
                            <Text strong>{dataset.row_count || 'N/A'}</Text>
                          </Space>
                          {dataset.file_path && (
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>Файл:</Text>
                              <Text style={{ fontSize: 12 }} ellipsis>
                                {dataset.file_path.split('/').pop()}
                              </Text>
                            </Space>
                          )}
                        </Space>
                      </div>

                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(datasetIdNum)}
                        block
                      >
                        Удалить
                      </Button>
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
                  <Text strong>Нет датасетов</Text>
                  <Text type="secondary">
                    Добавьте CSV датасеты для использования в тестировании моделей
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
        title="Добавить датасет"
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Название датасета"
            rules={[{ required: true, message: 'Введите название датасета' }]}
          >
            <Input placeholder="Например: Тестовые вопросы" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={3} placeholder="Краткое описание датасета" />
          </Form.Item>

          <Form.Item
            label="CSV файл"
            required
            extra="Загрузите CSV файл с колонками для prompts и reference answers"
          >
            <Upload
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              accept=".csv"
            >
              <Button icon={<UploadOutlined />} size="large" block>
                Выбрать файл
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setShowModal(false);
                form.resetFields();
                setFileList([]);
              }}>
                Отмена
              </Button>
              <Button type="primary" htmlType="submit">
                Загрузить датасет
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Создать датасет в браузере"
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
            label="Название датасета"
            rules={[{ required: true, message: 'Введите название датасета' }]}
          >
            <Input placeholder="Например: Тестовые вопросы" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={2} placeholder="Краткое описание датасета" />
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
                        label="Prompt (запрос)"
                        style={{ marginBottom: 12 }}
                      >
                        <TextArea rows={2} placeholder="Введите запрос..." />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'reference']}
                        label="Reference (эталон)"
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
                Создать датасет
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Datasets;
