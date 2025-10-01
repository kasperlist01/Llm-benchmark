import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Card, Typography, Space, message } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      await login({
        username: values.username,
        password: values.password,
        remember_me: values.remember || false,
      });
      message.success('Вход выполнен успешно');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка входа. Проверьте имя пользователя и пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      padding: '24px',
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <RobotOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={2} style={{ marginBottom: 8 }}>Вход в систему</Title>
            <Text type="secondary">Введите ваши учетные данные</Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Введите имя пользователя' },
                { min: 3, message: 'Минимум 3 символа' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Имя пользователя"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Введите пароль' },
                { min: 6, message: 'Минимум 6 символов' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Пароль"
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Запомнить меня</Checkbox>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 42 }}
              >
                Войти
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Нет аккаунта? <Link to="/register" style={{ color: '#1890ff' }}>Зарегистрируйтесь</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
