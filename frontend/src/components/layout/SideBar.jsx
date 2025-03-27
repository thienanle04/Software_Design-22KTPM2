import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, theme, Button } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import Logo from "/src/components/ui/Logo";

const { Sider } = Layout;

const menuList = [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
    link: "/",
    children: [
      {
        key: "/",
        label: "My Projects",
        link: <Link to="/">My Projects</Link>,
      },
      {
        key: "/analysis",
        label: "Analysis",
        link: <Link to="/analysis">Analysis</Link>,
      },
    ],
  },
  {
    key: "profile",
    icon: <UserOutlined />,
    label: "Profile",
    link: <Link to="/profile">Profile</Link>,
  },
];

function SideBar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [width, setWidth] = React.useState("200px");
  const [collapsed, setCollapsed] = useState(false); // Track collapse state
  const [isMobile, setIsMobile] = useState(false); // Track mobile view state

  // Handle the breakpoint change
  const onBreakpoint = (broken) => {
    setIsMobile(broken); // Update state based on screen size
    if (broken) {
      setCollapsed(true);
      setWidth("100%");
    } else {
      setCollapsed(false);
      setWidth("200px");
    }
  };

  // Handle the collapse action
  const onCollapse = (collapsed, type) => {
    setCollapsed(collapsed);
    if (type === "clickTrigger") {
      setCollapsed(collapsed);
    }
  };

  return (
    <Sider
      width={width}
      style={{
        background: colorBgContainer,
        transition: "width 0.5s ease",
        icon: <MenuFoldOutlined />,
      }}
      breakpoint="md"
      collapsedWidth="0"
      collapsed={collapsed}
      onBreakpoint={onBreakpoint}
      onCollapse={onCollapse}
      zeroWidthTriggerStyle={{
        top: 10,
        right: -48,
        borderRadius: "5px",
        transition: "right 0.3s ease",
      }}
    >
      <Logo />

      <Menu
        onSelect={({ key }) => navigate(key)}
        mode="inline"
        defaultSelectedKeys={[currentPath]}
        defaultOpenKeys={["dashboard"]}
        style={{ height: "wrap-content", borderRight: 0 }}
        items={menuList}
      />

      {isMobile && (
        <Button
          type="primary"
          icon={<MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed, "clickTrigger")}
          style={{
            position: "absolute",
            bottom: "auto",
            right: 10,
            height: "40px",
            width: "40px",
            borderRadius: "5px 0 0 5px",
            background: "#000",
            transition: "all 0.3s ease",
          }}
        />
      )}
    </Sider>
  );
}

export default SideBar;
