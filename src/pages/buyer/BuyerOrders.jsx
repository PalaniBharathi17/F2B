import React, { useEffect, useMemo, useState } from 'react';
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
import { getBuyerOrders } from '../../api/orders';
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const BuyerOrders = () => {
    const [orderHistory, setOrderHistory] = useState([]);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const data = await getBuyerOrders();
                setOrderHistory(data?.orders || []);
            } catch {
                setOrderHistory([]);
            }
        };
        loadOrders();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    const tableData = useMemo(() => (
        orderHistory.map((order) => ({
            key: order.id,
            orderId: `#ORD-${order.id}`,
            date: new Date(order.created_at).toLocaleDateString(),
            items: `${order.quantity} ${order?.product?.unit || 'unit'} ${order?.product?.crop_name || 'Produce'}`,
            total: `₹${Number(order.total_price || 0).toFixed(2)}`,
            status: order.status,
            farmer: order?.farmer?.name || 'Farmer'
        }))
    ), [orderHistory]);

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
                if (status === 'pending') color = 'warning';
                if (status === 'cancelled') color = 'error';
                if (status === 'confirmed') color = 'processing';
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
                        dataSource={tableData}
                        pagination={false}
                    />
                </Card>
            </Content>
        </Layout>
    );
};

export default BuyerOrders;
