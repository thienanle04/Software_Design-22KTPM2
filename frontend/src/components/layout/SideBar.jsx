import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, theme, Button } from "antd";
import {
  MenuFoldOutlined,
  VideoCameraAddOutlined,
  PictureOutlined,
  HomeOutlined,
  DashboardOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import Logo from "/src/components/ui/Logo";

const { Sider } = Layout;

const menuList = [
  {
    key: "/dashboard",
    label: "Home",
    icon: <HomeOutlined />,
  },
  {
    key: "/dashboard/analysis",
    label: "Analysis",
    icon: <DashboardOutlined />,
  },
  {
    type: "divider",
  },
  {
    key: "/dashboard/tools",
    type: "group",
    label: "Tools",
  },
];

const tools = [
  {
    link: "/dashboard/tools?tool=text-to-image",
    label: "Text To Image",
    icon: <PictureOutlined />,
  },
  {
    link: "/dashboard/tools?tool=image-to-video",
    label: "Image To Video",
    icon: <VideoCameraOutlined />,
  },
  {
    link: "/dashboard/tools?tool=text-to-video",
    label: "Text To Video",
    icon: <VideoCameraAddOutlined />,
  }
]

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
        zIndex: 1,
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
        selectedKeys={[currentPath]}
        defaultOpenKeys={["dashboard"]}
        style={{ height: "wrap-content", borderRight: 0 }}
        items={menuList}
      />

      {tools.map((tool) => (
        <Button
          type="text"
          icon={tool.icon}
          block
          onClick={() => navigate(tool.link)}
          style={{ margin: "4px", padding: "0px 16px 0px 24px", justifyContent: "start", height: "40px", width: "96%" }}
          key={tool.link}
        >
          {tool.label}
        </Button>
      ))}

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
