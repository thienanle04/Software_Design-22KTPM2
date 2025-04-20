import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ConfigProvider } from "antd";
import "@ant-design/v5-patch-for-react-19";

createRoot(document.getElementById("root")).render(
    <ConfigProvider
      theme={{
        token: {
        },
        components: {
          Segmented: {
            /* here is your component tokens */
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
);
