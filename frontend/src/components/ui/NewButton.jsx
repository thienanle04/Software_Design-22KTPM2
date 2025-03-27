import { Button } from 'antd';
import { PlusOutlined } from "@ant-design/icons";

function NewButton() {
    return (
        <Button type="dashed" className="new-button" style={{ height:"6rem", width:"8rem", borderRadius:"10px" }} icon={<PlusOutlined style={{ fontSize: "3rem" }}/>} />
    )
}

export default NewButton;