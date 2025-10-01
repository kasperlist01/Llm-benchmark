import React, { ReactNode } from 'react';
import { Layout as AntLayout, BackTop } from 'antd';
import { UpOutlined } from '@ant-design/icons';
import Navbar from './Navbar';

const { Content } = AntLayout;

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AntLayout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', margin: 0, padding: 0 }}>
      <Navbar />
      <Content style={{ padding: '24px', marginTop: '64px', paddingTop: '24px' }}>
        {children}
      </Content>
      <BackTop>
        <div style={{
          height: 40,
          width: 40,
          lineHeight: '40px',
          borderRadius: '50%',
          backgroundColor: '#1890ff',
          color: '#fff',
          textAlign: 'center',
          fontSize: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <UpOutlined />
        </div>
      </BackTop>
    </AntLayout>
  );
};

export default Layout;
