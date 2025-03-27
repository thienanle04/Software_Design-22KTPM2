import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Button, Layout, Menu, theme, Space, Avatar, Typography, Flex } from "antd";
import { LogoutOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import SideBar from "./SideBar";
import { useAuth } from "/src/context/authContext";
import TopNav from "./TopNav";

const { Header, Content, Footer } = Layout;

const AppLayout = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { logout } = useAuth();

  return (
    <Layout>
      <SideBar />

      <Layout>
        <Header style={{ background: colorBgContainer, padding: 24}}>
          <Flex align="center" style={{ height: "100%" }} gap="8px">
            <TopNav />
            <Button icon={<SearchOutlined />} shape="circle" onClick={() => console.log("Search clicked")}/>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff", alignSelf: "center" }}/>
            <Typography.Text strong>thienanle04</Typography.Text>
            <Button icon={<LogoutOutlined />} shape="circle" onClick={logout}/>
          </Flex>
        </Header>

        <Content
          style={{
            margin: "24px 16px 0px",
            padding: "24px",
            minHeight: "calc(100vh - 64px - 24px)",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>

        <Footer style={{ textAlign: "center" }}>
          VisoAI ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};
export default AppLayout;
