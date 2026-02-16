import React, { useEffect, useState } from 'react';
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
    Switch,
    message,
    Row,
    Col,
    Badge,
    Dropdown,
    Tag,
    InputNumber,
    Upload
} from 'antd';
import {
    DashboardOutlined,
    PlusOutlined,
    UnorderedListOutlined,
    ShoppingOutlined,
    UserOutlined,
    BellOutlined,
    LogoutOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createProduct } from '../../api/products';
import { getFarmerOrders } from '../../api/orders';
import { uploadImage } from '../../api/upload';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AddProduce = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [imageFile, setImageFile] = useState(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        const loadPendingOrders = async () => {
            try {
                const data = await getFarmerOrders();
                const count = (data?.orders || []).filter((o) => o.status === 'pending').length;
                setPendingOrders(count);
            } catch {
                setPendingOrders(0);
            }
        };
        loadPendingOrders();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const onFinish = async (values) => {
        setSubmitting(true);
        try {
            let imageUrl = '';
            if (imageFile) {
                const uploaded = await uploadImage(imageFile);
                imageUrl = uploaded?.url || '';
            }
            const metaLine = [
                `Category: ${values.category || 'N/A'}`,
                `Organic: ${values.organic ? 'Yes' : 'No'}`,
                `Bulk Available: ${values.bulk ? 'Yes' : 'No'}`
            ].join(' | ');
            const combinedDescription = [values.description?.trim(), metaLine].filter(Boolean).join('\n');

            await createProduct({
                crop_name: values.name,
                quantity: Number(values.quantity),
                unit: values.unit,
                price_per_unit: Number(values.price),
                description: combinedDescription,
                city: values.city || '',
                state: values.state || '',
                image_url: imageUrl,
            });
            message.success('Listing added successfully');
            navigate('/farmer/listings');
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to add listing');
        } finally {
            setSubmitting(false);
        }
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
                        <Avatar size={40} icon={<UserOutlined />} />
                        {!collapsed && (
                            <div className="user-info">
                                <Text strong style={{ color: 'white', fontSize: '14px' }}>{user?.name || 'Farmer'}</Text>
                                <Tag color="success" style={{ fontSize: '10px', padding: '0 6px' }}>ACTIVE</Tag>
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
                        <Badge count={pendingOrders} offset={[-5, 5]}>
                            <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} aria-label="Notifications" />
                        </Badge>
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }
                                ]
                            }}
                        >
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="dashboard-content">
                    <div className="welcome-section">
                        <Title level={2}>Add New Produce</Title>
                        <Paragraph type="secondary">Create a listing that will be saved to backend and PostgreSQL.</Paragraph>
                    </div>

                    <Card className="activity-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
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
                                    <Form.Item
                                        label="Quantity"
                                        name="quantity"
                                        rules={[{ required: true, message: 'Please enter quantity' }]}
                                    >
                                        <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} size="large" />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Price"
                                        name="price"
                                        rules={[{ required: true, message: 'Price is required' }]}
                                    >
                                        <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} size="large" />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Unit"
                                        name="unit"
                                        rules={[{ required: true, message: 'Unit is required' }]}
                                    >
                                        <Select size="large">
                                            <Option value="kg">kg</Option>
                                            <Option value="bunch">bunch</Option>
                                            <Option value="piece">piece</Option>
                                            <Option value="dozen">dozen</Option>
                                            <Option value="box">box</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item label="City" name="city">
                                        <Input placeholder="City" size="large" />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item label="State" name="state">
                                        <Input placeholder="State" size="large" />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item label="Description" name="description">
                                        <TextArea rows={4} placeholder="Describe your produce, harvest date, quality..." />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item label="Product Image">
                                        <Upload
                                            listType="picture"
                                            maxCount={1}
                                            beforeUpload={(file) => {
                                                setImageFile(file);
                                                return false;
                                            }}
                                            onRemove={() => setImageFile(null)}
                                        >
                                            <Button>Upload Image</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>

                                <Col xs={12} md={6}>
                                    <Form.Item label="Organic" name="organic" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                </Col>
                                <Col xs={12} md={6}>
                                    <Form.Item label="Bulk Available" name="bulk" valuePropName="checked">
                                        <Switch />
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
                                            loading={submitting}
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

export default AddProduce;
