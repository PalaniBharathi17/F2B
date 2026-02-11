import React, { useState } from 'react';
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
    Tabs
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
    EnvironmentOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const FarmerOrders = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const ordersData = [
        {
            key: '1',
            orderId: '#ORD-7742',
            date: '2024-03-12',
            buyer: 'Whole Foods Market',
            items: '150kg Tomatoes',
            amount: '$675.00',
            status: 'processing',
        },
        {
            key: '2',
            orderId: '#ORD-7739',
            date: '2024-03-11',
            buyer: 'Alice Wong',
            items: '20 Dozen Eggs',
            amount: '$150.00',
            status: 'delivered',
        },
        {
            key: '3',
            orderId: '#ORD-7735',
            date: '2024-03-10',
            buyer: 'Bob Miller',
            items: '5kg Honey',
            amount: '$60.00',
            status: 'transit',
        },
        {
            key: '4',
            orderId: '#ORD-7731',
            date: '2024-03-09',
            buyer: 'Central Grocers',
            items: '500kg Potatoes',
            amount: '$550.00',
            status: 'delivered',
        }
    ];

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
                    delivered: { color: 'success', text: 'Delivered' },
                    processing: { color: 'warning', text: 'Processing' },
                    transit: { color: 'processing', text: 'In Transit' }
                };
                const config = statusConfig[status];
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: () => (
                <Button type="text" icon={<MoreOutlined />} />
            ),
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
                        <Title level={3} style={{ margin: 0 }}>Order Management</Title>
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
                    <Row gutter={[24, 24]} className="stats-row">
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Active Orders" value={5} prefix={<ShoppingOutlined style={{ color: '#faad14', marginRight: '8px' }} />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Total Revenue" value={14250} prefix="$" valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Order Growth" value={12} suffix="%" prefix={<ArrowUpOutlined />} valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                    </Row>

                    <Card className="activity-card">
                        <Tabs
                            defaultActiveKey="all"
                            items={[
                                { key: 'all', label: 'All Orders' },
                                { key: 'pending', label: 'Pending' },
                                { key: 'shipped', label: 'Shipped' },
                                { key: 'completed', label: 'Completed' },
                            ]}
                        />
                        <Table
                            columns={columns}
                            dataSource={ordersData}
                            className="activity-table"
                        />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default FarmerOrders;
