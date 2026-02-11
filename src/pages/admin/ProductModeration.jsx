import React, { useState } from 'react';
import {
    Layout,
    Card,
    Table,
    Tag,
    Button,
    Avatar,
    Space,
    Typography,
    Input,
    Badge,
    Dropdown,
    Menu,
    Row,
    Col,
    Image
} from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    TeamOutlined,
    ShoppingOutlined,
    DollarOutlined,
    WarningOutlined,
    LogoutOutlined,
    SafetyCertificateOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ProductModeration = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const productQueue = [
        {
            key: '1',
            name: 'Organic Honey',
            farmer: 'Bees & Bloom',
            category: 'Preserves',
            price: '$12.00/jar',
            date: '2024-03-12',
            image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&h=200&fit=crop'
        },
        {
            key: '2',
            name: 'Bulk Carrots (50kg)',
            farmer: 'Hillside Farm',
            category: 'Vegetables',
            price: '$40.00',
            date: '2024-03-12',
            image: 'https://images.unsplash.com/photo-1590822111281-73345880bc99?w=200&h=200&fit=crop'
        },
        {
            key: '3',
            name: 'Fresh Goat Milk',
            farmer: 'Dairy Delights',
            category: 'Dairy',
            price: '$5.50/L',
            date: '2024-03-11',
            image: 'https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=200&h=200&fit=crop'
        }
    ];

    const columns = [
        {
            title: 'Product',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space size="middle">
                    <Image src={record.image} width={60} style={{ borderRadius: '8px' }} />
                    <div>
                        <Text strong>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>ID: #PROD-{record.key}23</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Farmer',
            dataIndex: 'farmer',
            key: 'farmer',
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (cat) => <Tag color="blue">{cat}</Tag>
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
        },
        {
            title: 'Submitted',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: () => (
                <Space>
                    <Button type="primary" size="small" icon={<CheckCircleOutlined />} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Approve</Button>
                    <Button danger size="small" icon={<CloseCircleOutlined />}>Reject</Button>
                    <Button type="text" size="small" icon={<EyeOutlined />} />
                </Space>
            ),
        },
    ];

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/admin/dashboard')
        },
        {
            key: 'users',
            icon: <TeamOutlined />,
            label: 'User Management',
            onClick: () => navigate('/admin/users')
        },
        {
            key: 'products',
            icon: <ShoppingOutlined />,
            label: 'Product Moderation',
            onClick: () => navigate('/admin/products')
        },
        {
            key: 'transactions',
            icon: <DollarOutlined />,
            label: 'Transactions',
            onClick: () => navigate('/admin/transactions')
        },
        {
            key: 'reports',
            icon: <WarningOutlined />,
            label: 'Reports & Issues',
            onClick: () => navigate('/admin/reports')
        },
    ];

    return (
        <Layout className="admin-dashboard-layout">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                className="admin-sider"
                width={260}
            >
                <div className="logo-section-admin">
                    <div className="logo-icon-admin">
                        <SafetyCertificateOutlined />
                    </div>
                    {!collapsed && (
                        <div>
                            <Title level={5} style={{ margin: 0, color: 'white' }}>AgriMarket</Title>
                            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Admin Console</Text>
                        </div>
                    )}
                </div>

                <Menu
                    theme="dark"
                    selectedKeys={['products']}
                    mode="inline"
                    items={menuItems}
                    className="admin-menu"
                />

                <div className="admin-profile-section">
                    <div className="admin-profile-card">
                        <Avatar size={40} icon={<UserOutlined />} />
                        {!collapsed && (
                            <div className="admin-info">
                                <Text strong style={{ color: 'white', fontSize: '14px' }}>Admin User</Text>
                                <Tag color="purple" style={{ fontSize: '10px', padding: '0 6px' }}>SUPER ADMIN</Tag>
                            </div>
                        )}
                    </div>
                </div>
            </Sider>

            <Layout>
                <Header className="admin-header">
                    <div className="admin-header-left">
                        <Title level={3} style={{ margin: 0 }}>Product Moderation</Title>
                    </div>
                    <div className="admin-header-right">
                        <Input
                            placeholder="Search listings..."
                            prefix={<SearchOutlined />}
                            style={{ width: 250, borderRadius: 8 }}
                        />
                        <Badge count={23} offset={[-5, 5]}>
                            <Button type="text" icon={<ShoppingOutlined style={{ fontSize: '20px' }} />} />
                        </Badge>
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }
                                ]
                            }}
                        >
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer', background: '#722ed1' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="admin-content">
                    <div className="admin-welcome">
                        <Title level={2}>Approval Queue</Title>
                        <Paragraph type="secondary">Review new listings before they go live on the marketplace.</Paragraph>
                    </div>

                    <Card className="verification-card">
                        <Table
                            columns={columns}
                            dataSource={productQueue}
                            className="verification-table"
                        />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default ProductModeration;
