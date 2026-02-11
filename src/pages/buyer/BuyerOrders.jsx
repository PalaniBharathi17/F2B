import React from 'react';
import {
    Layout,
    Card,
    Button,
    Input,
    Tag,
    Badge,
    Avatar,
    Space,
    Typography,
    Dropdown,
    Table
} from 'antd';
import {
    SearchOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    ShopOutlined,
    EyeOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const BuyerOrders = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const orderHistory = [
        {
            key: '1',
            orderId: '#ORD-8821',
            date: '2024-03-11',
            items: 'Organic Tomatoes, Fresh Spinach',
            total: '$45.50',
            status: 'delivered',
            farmer: 'Green Valley Farm'
        },
        {
            key: '2',
            orderId: '#ORD-8815',
            date: '2024-03-08',
            items: 'Artisan Honey (2 jars)',
            total: '$24.00',
            status: 'processing',
            farmer: 'Bees & Bloom'
        },
        {
            key: '3',
            orderId: '#ORD-8798',
            date: '2024-03-01',
            items: 'Sweet Corn (24 pieces)',
            total: '$36.00',
            status: 'delivered',
            farmer: 'Sunny Acres'
        }
    ];

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            key: 'orderId',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Farmer',
            dataIndex: 'farmer',
            key: 'farmer',
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            ellipsis: true
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (text) => <Text strong style={{ color: '#13ec13' }}>{text}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'success';
                if (status === 'processing') color = 'warning';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: () => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} />
                    <Button type="text" icon={<FileTextOutlined />} />
                </Space>
            ),
        }
    ];

    return (
        <Layout className="buyer-dashboard-layout">
            <Header className="buyer-header">
                <div className="header-content-buyer">
                    <div className="logo-buyer" onClick={() => navigate('/buyer/dashboard')} style={{ cursor: 'pointer' }}>
                        <ShopOutlined style={{ fontSize: '28px', color: '#13ec13' }} />
                        <Title level={4} style={{ margin: 0 }}>AgriMarket</Title>
                    </div>

                    <div className="search-bar-buyer">
                        <Input
                            size="large"
                            placeholder="Search orders..."
                            prefix={<SearchOutlined style={{ color: '#13ec13' }} />}
                            className="main-search"
                        />
                    </div>

                    <div className="header-actions-buyer">
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/browse')}>Browse</Button>
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/farmers')}>Farmers</Button>
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/orders')}>Orders</Button>
                        <Badge count={3} offset={[-5, 5]}>
                            <Button
                                type="text"
                                icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />}
                                className="cart-btn"
                                onClick={() => navigate('/buyer/cart')}
                            />
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
                </div>
            </Header>

            <Content className="buyer-content">
                <div className="content-header">
                    <div>
                        <Title level={2}>Order History</Title>
                        <Paragraph type="secondary">Track your current and past purchases.</Paragraph>
                    </div>
                </div>

                <Card className="product-card" style={{ padding: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={orderHistory}
                        pagination={false}
                    />
                </Card>
            </Content>
        </Layout>
    );
};

export default BuyerOrders;
