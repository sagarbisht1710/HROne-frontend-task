import React from 'react';
import { Layout, Typography } from 'antd';
import SchemaBuilder from './components/SchemaBuilder';
import 'antd/dist/reset.css'; // Ant Design v5 reset (if using v5)

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#001529',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px'
        }}
      >
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          JSON Schema Builder Demo
        </Title>
      </Header>
      <Content style={{ padding: 24, background: '#f5f5f5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <SchemaBuilder />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Demo © {new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}

export default App;
