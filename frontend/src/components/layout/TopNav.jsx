import React, { useState } from "react";
import { Menu } from "antd";
const NavList = [];

function TopNav() {
  const [current, setCurrent] = useState("home");
  return (
    <Menu
      style={{ flex: 1, justifyContent: "center" }}
      mode="horizontal"
      selectedKeys={[current]}
      onClick={() => setCurrent(e.key)}
      items={NavList}
    />
  );
}

export default TopNav;