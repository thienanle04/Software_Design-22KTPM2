import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Button,
  Layout,
  theme,
  Avatar,
  Typography,
  Flex,
} from "antd";
import {
  LogoutOutlined,
  SearchOutlined,
  UserOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import SideBar from "./SideBar";
import { useAuth } from "/src/context/AuthContext";
import TopNav from "./TopNav";

const { Header, Content, Footer } = Layout;

const AppLayout = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      <SideBar />

      <Layout>
        <Header style={{ background: colorBgContainer, padding: 24 }}>
          <Flex
            align="center"
            style={{ height: "100%" }}
            gap="8px"
            justify="end"
          >
            {isAuthenticated ? (
              <>
                <Button
                  icon={<SearchOutlined />}
                  shape="circle"
                  onClick={() => console.log("Search clicked")}
                />
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#1890ff", alignSelf: "center" }}
                />
                <Typography.Text strong>thienanle04</Typography.Text>
                <Button
                  icon={<LogoutOutlined />}
                  shape="circle"
                  onClick={logout}
                />
              </>
            ) : (
              <Button
                icon={<LoginOutlined />}
                onClick={() => navigate("/dashboard/login")}
              >
                Login
              </Button>
            )}
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
