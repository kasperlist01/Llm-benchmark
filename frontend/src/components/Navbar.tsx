import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  LoginOutlined,
  UserAddOutlined,
  MenuOutlined,
  RobotOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../contexts/AuthContext';

const { Header } = Layout;

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user',
      label: user?.username || 'Пользователь',
      icon: <UserOutlined />,
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Выход',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const getMenuItems = (): MenuProps['items'] => {
    if (isAuthenticated) {
      return [
        {
          key: '/',
          icon: <DashboardOutlined />,
          label: <Link to="/">Панель управления</Link>,
        },
        {
          key: '/models',
          icon: <ExperimentOutlined />,
          label: <Link to="/models">Мои модели</Link>,
        },
        {
          key: '/datasets',
          icon: <DatabaseOutlined />,
          label: <Link to="/datasets">Мои датасеты</Link>,
        },
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: <Link to="/settings">Настройки</Link>,
        },
      ];
    }
    return [
      {
        key: '/login',
        icon: <LoginOutlined />,
        label: <Link to="/login">Вход</Link>,
      },
      {
        key: '/register',
        icon: <UserAddOutlined />,
        label: <Link to="/register">Регистрация</Link>,
      },
    ];
  };

  return (
    <Header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#262626',
            display: window.innerWidth < 768 ? 'none' : 'inline'
          }}>
            Тестирование LLM
          </span>
        </Link>

        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          style={{
            flex: 1,
            border: 'none',
            backgroundColor: 'transparent',
            display: window.innerWidth < 768 ? 'none' : 'flex',
          }}
        />
      </div>

      {isAuthenticated && user && (
        <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '6px' }}>
              <Avatar style={{ backgroundColor: '#1890ff' }}>
                {user.username[0].toUpperCase()}
              </Avatar>
              <span style={{ color: '#262626' }}>{user.username}</span>
            </Space>
          </Dropdown>
        </div>
      )}

      <Button
        type="text"
        icon={<MenuOutlined />}
        style={{ display: window.innerWidth < 768 ? 'block' : 'none' }}
        onClick={() => setMobileMenuVisible(!mobileMenuVisible)}
      />
    </Header>
  );
};

export default Navbar;
