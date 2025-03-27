import NewButton from "/src/components/ui/NewButton.jsx";
import { Empty, Flex } from 'antd';

function MyProjects() {
    return (
        <>
        <Flex>
            <NewButton />
        </Flex>
            <Empty description="No projects found" />
        </>
    )
}

export default MyProjects;