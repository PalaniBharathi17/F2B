import React, { useState } from 'react';
import {
    Layout,
    Menu,
    Card,
    Button,
    Avatar,
    Space,
    Typography,
    Input,
    Select,
    Form,
    Upload,
    Switch,
    message,
    Row,
    Col,
    Badge,
    Dropdown
} from 'antd';
import {
    DashboardOutlined,
    PlusOutlined,
    UnorderedListOutlined,
    ShoppingOutlined,
    UserOutlined,
    BellOutlined,
    LogoutOutlined,
    InboxOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AddProduce = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const onFinish = (values) => {
        console.log('Success:', values);
        message.success('Listing added successfully!');
        navigate('/farmer/listings');
    };

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/farmer/dashboard')
        },
        {
            key: 'add-produce',
            icon: <PlusOutlined />,
            label: 'Add Produce',
            onClick: () => navigate('/farmer/add-produce')
        },
        {
            key: 'my-listings',
            icon: <UnorderedListOutlined />,
            label: 'My Listings',
            onClick: () => navigate('/farmer/listings')
        },
        {
            key: 'orders',
            icon: <ShoppingOutlined />,
            label: 'Orders',
            onClick: () => navigate('/farmer/orders')
        },
    ];

    return (
        <Layout className="farmer-dashboard-layout">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                className="dashboard-sider"
                width={260}
            >
                <div className="logo-section">
                    <div className="logo-icon">
                        <ShoppingOutlined />
                    </div>
                    {!collapsed && (
                        <div>
                            <Title level={5} style={{ margin: 0, color: 'white' }}>AgriMarket</Title>
                            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Farmer Portal</Text>
                        </div>
                    )}
                </div>

                <Menu
                    theme="dark"
                    selectedKeys={['add-produce']}
                    mode="inline"
                    items={menuItems}
                    className="sidebar-menu"
                />

                <div className="user-profile-section">
                    <div className="user-profile-card">
                        <Avatar size={40} icon={<UserOutlined />} src="https://i.pravatar.cc/150?img=12" />
                        {!collapsed && (
                            <div className="user-info">
                                <Text strong style={{ color: 'white', fontSize: '14px' }}>Farmer Joe</Text>
                                <Tag color="success" style={{ fontSize: '10px', padding: '0 6px' }}>PRO SELLER</Tag>
                            </div>
                        )}
                    </div>
                </div>
            </Sider>

            <Layout>
                <Header className="dashboard-header">
                    <div className="header-left">
                        <Title level={3} style={{ margin: 0 }}>Create New Listing</Title>
                    </div>
                    <div className="header-right">
                        <Input
                            placeholder="Search orders..."
                            prefix={<SearchOutlined />}
                            className="search-input"
                        />
                        <Badge count={3} offset={[-5, 5]}>
                            <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} aria-label="Notifications" />
                        </Badge>
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }
                                ]
                            }}
                        >
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" src="https://i.pravatar.cc/150?img=12" style={{ cursor: 'pointer' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="dashboard-content">
                    <div className="welcome-section">
                        <Title level={2}>Add New Produce</Title>
                        <Paragraph type="secondary">Fill in the details to list your fresh produce on the marketplace.</Paragraph>
                    </div>

                    <Card className="activity-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{
                                unit: 'kg',
                                organic: true
                            }}
                        >
                            <Row gutter={24}>
                                <Col span={24}>
                                    <Form.Item
                                        label="Produce Name"
                                        name="name"
                                        rules={[{ required: true, message: 'Please enter produce name' }]}
                                    >
                                        <Input placeholder="e.g. Organic Red Tomatoes" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Category"
                                        name="category"
                                        rules={[{ required: true, message: 'Please select a category' }]}
                                    >
                                        <Select placeholder="Select category" size="large">
                                            <Option value="vegetables">Vegetables</Option>
                                            <Option value="fruits">Fruits</Option>
                                            <Option value="grains">Grains</Option>
                                            <Option value="dairy">Dairy & Eggs</Option>
                                            <Option value="honey">Honey & Preserves</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Price & Unit">
                                        <Space.Compact style={{ width: '100%' }}>
                                            <Form.Item
                                                name="price"
                                                noStyle
                                                rules={[{ required: true, message: 'Price is required' }]}
                                            >
                                                <Input prefix="$" placeholder="Price" size="large" style={{ width: '60%' }} />
                                            </Form.Item>
                                            <Form.Item
                                                name="unit"
                                                noStyle
                                            >
                                                <Select size="large" style={{ width: '40%' }}>
                                                    <Option value="kg">per kg</Option>
                                                    <Option value="bunch">per bunch</Option>
                                                    <Option value="piece">per piece</Option>
                                                    <Option value="dozen">per dozen</Option>
                                                    <Option value="box">per box</Option>
                                                </Select>
                                            </Form.Item>
                                        </Space.Compact>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Description" name="description">
                                        <TextArea rows={4} placeholder="Describe your produce, harvest date, quality..." />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Produce Images">
                                        <Upload.Dragger name="files" action="/upload.do" listType="picture" multiple={false}>
                                            <p className="ant-upload-drag-icon">
                                                <InboxOutlined style={{ color: '#13ec13' }} />
                                            </p>
                                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                            <p className="ant-upload-hint">Support for a single image upload. Max size 5MB.</p>
                                        </Upload.Dragger>
                                    </Form.Item>
                                </Col>
                                <Col xs={12} md={6}>
                                    <Form.Item label="Organic" name="organic" valuePropName="checked">
                                        <Switch activeBg="#13ec13" />
                                    </Form.Item>
                                </Col>
                                <Col xs={12} md={6}>
                                    <Form.Item label="Bulk Available" name="bulk" valuePropName="checked">
                                        <Switch activeBg="#13ec13" />
                                    </Form.Item>
                                </Col>
                                <Col span={24} style={{ marginTop: '24px' }}>
                                    <Space size="middle">
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            size="large"
                                            className="add-produce-btn"
                                            style={{ padding: '0 40px' }}
                                        >
                                            Save Listing
                                        </Button>
                                        <Button size="large" onClick={() => navigate('/farmer/dashboard')}>
                                            Cancel
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

// Mock Tag component since it was used in previous pages
const Tag = ({ color, children, style }) => (
    <span style={{
        backgroundColor: color === 'success' ? '#f6ffed' : '#f5f5f5',
        color: color === 'success' ? '#52c41a' : 'rgba(0,0,0,0.65)',
        border: `1px solid ${color === 'success' ? '#b7eb8f' : '#d9d9d9'}`,
        borderRadius: '4px',
        padding: '0 8px',
        fontSize: '12px',
        display: 'inline-block',
        ...style
    }}>
        {children}
    </span>
);

export default AddProduce;
