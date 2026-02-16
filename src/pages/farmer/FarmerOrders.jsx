import React, { useEffect, useMemo, useState } from 'react';
import {
    Layout,
    Menu,
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
    Row,
    Col,
    Statistic,
    Tabs,
    message
} from 'antd';
import {
    DashboardOutlined,
    PlusOutlined,
    UnorderedListOutlined,
    ShoppingOutlined,
    UserOutlined,
    BellOutlined,
    LogoutOutlined,
    SearchOutlined,
    MoreOutlined,
    ArrowUpOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cancelOrder, getFarmerOrders, updateOrderStatus } from '../../api/orders';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const FarmerOrders = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await getFarmerOrders();
            setOrdersData(data?.orders || []);
        } catch {
            setOrdersData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    const tableData = useMemo(() => (
        ordersData
            .filter((order) => {
                if (activeTab === 'pending') return order.status === 'pending';
                if (activeTab === 'shipped') return order.status === 'confirmed';
                if (activeTab === 'completed') return order.status === 'completed';
                return true;
            })
            .filter((order) => {
                const q = query.trim().toLowerCase();
                if (!q) return true;
                return (
                    String(order.id).includes(q)
                    || (order?.buyer?.name || '').toLowerCase().includes(q)
                    || (order?.product?.crop_name || '').toLowerCase().includes(q)
                );
            })
            .map((order) => ({
            key: order.id,
            orderId: `#ORD-${order.id}`,
            date: new Date(order.created_at).toLocaleDateString(),
            buyer: order?.buyer?.name || 'Buyer',
            items: `${order.quantity} ${order?.product?.unit || 'unit'} ${order?.product?.crop_name || 'Produce'}`,
            amount: `₹${Number(order.total_price || 0).toFixed(2)}`,
            status: order.status,
            }))
    ), [ordersData, activeTab, query]);

    const getActionsForStatus = (status) => {
        if (status === 'pending') {
            return [
                { key: 'confirmed', label: 'Confirm Order' },
                { key: 'cancelled', label: 'Cancel Order' },
            ];
        }
        if (status === 'confirmed') {
            return [
                { key: 'completed', label: 'Mark Completed' },
                { key: 'cancelled', label: 'Cancel Order' },
            ];
        }
        return [];
    };

    const handleOrderAction = async (orderId, nextStatus) => {
        try {
            if (nextStatus === 'cancelled') {
                await cancelOrder(orderId);
            } else {
                await updateOrderStatus(orderId, nextStatus);
            }
            message.success('Order updated successfully');
            await loadOrders();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update order');
        }
    };

    const activeOrders = tableData.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
    const totalRevenue = ordersData
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const completedCount = tableData.filter((o) => o.status === 'completed').length;
    const orderGrowth = tableData.length ? Math.round((completedCount / tableData.length) * 100) : 0;

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            key: 'orderId',
            render: (text) => <Text strong style={{ color: '#13ec13' }}>{text}</Text>
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Buyer',
            dataIndex: 'buyer',
            key: 'buyer',
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusConfig = {
                    completed: { color: 'success', text: 'Completed' },
                    confirmed: { color: 'processing', text: 'Confirmed' },
                    pending: { color: 'warning', text: 'Pending' },
                    cancelled: { color: 'error', text: 'Cancelled' }
                };
                const config = statusConfig[status] || { color: 'default', text: status };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const actions = getActionsForStatus(record.status);
                if (!actions.length) {
                    return <Button type="text" icon={<MoreOutlined />} disabled />;
                }
                return (
                    <Dropdown
                        menu={{
                            items: actions.map((action) => ({
                                key: action.key,
                                label: action.label,
                                onClick: () => handleOrderAction(record.key, action.key),
                            })),
                        }}
                    >
                        <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                );
            },
        },
    ];

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
                    selectedKeys={['orders']}
                    mode="inline"
                    items={menuItems}
                    className="sidebar-menu"
                />

                <div className="user-profile-section">
                    <div className="user-profile-card">
                        <Avatar size={40} icon={<UserOutlined />} src="https://i.pravatar.cc/150?img=12" />
                        {!collapsed && (
                            <div className="user-info">
                                <Text strong style={{ color: 'white', fontSize: '14px' }}>{user?.name || 'Farmer'}</Text>
                                <Tag color="success" style={{ fontSize: '10px', padding: '0 6px' }}>PRO SELLER</Tag>
                            </div>
                        )}
                    </div>
                </div>
            </Sider>

            <Layout>
                <Header className="dashboard-header">
                    <div className="header-left">
                        <Title level={3} style={{ margin: 0 }}>Order Management</Title>
                    </div>
                    <div className="header-right">
                        <Input
                            placeholder="Search orders..."
                            prefix={<SearchOutlined />}
                            className="search-input"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Badge count={ordersData.filter((o) => o.status === 'pending').length} offset={[-5, 5]}>
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
                    <Row gutter={[24, 24]} className="stats-row">
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Active Orders" value={activeOrders} prefix={<ShoppingOutlined style={{ color: '#faad14', marginRight: '8px' }} />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Total Revenue" value={Number(totalRevenue.toFixed(2))} prefix="₹" valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Order Growth" value={orderGrowth} suffix="%" prefix={<ArrowUpOutlined />} valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                    </Row>

                    <Card className="activity-card">
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={[
                                { key: 'all', label: 'All Orders' },
                                { key: 'pending', label: 'Pending' },
                                { key: 'shipped', label: 'Shipped' },
                                { key: 'completed', label: 'Completed' },
                            ]}
                        />
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            className="activity-table"
                            loading={loading}
                        />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default FarmerOrders;
