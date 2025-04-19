import React from 'react';
import { Outlet } from 'react-router-dom';
import { Breadcrumb, Layout, Menu, theme } from 'antd';

const Home = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout>
    </Layout>
  );
};
export default Home;