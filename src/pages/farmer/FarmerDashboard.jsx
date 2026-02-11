import React, { useState } from 'react';
import {
    Layout,
    Menu,
    Card,
    Statistic,
    Table,
    Tag,
    Button,
    Avatar,
    Space,
    Typography,
    Row,
    Col,
    Input,
    Badge,
    Dropdown
} from 'antd';
import {
    DashboardOutlined,
    PlusOutlined,
    UnorderedListOutlined,
    ShoppingOutlined,
    UserOutlined,
    SearchOutlined,
    BellOutlined,
    LogoutOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    MoreOutlined,
    WarningOutlined,
    TrophyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useMockData from '../../hooks/useMockData';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const FarmerDashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const { data: recentOrders } = useMockData('farmer');

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Item',
            dataIndex: 'item',
            key: 'item',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.image} shape="square" size={40} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Buyer',
            dataIndex: 'buyer',
            key: 'buyer',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (text) => <Text strong>{text}</Text>,
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
                <Button type="text" icon={<MoreOutlined />} aria-label="More actions" />
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
            {/* Sidebar */}
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
                    defaultSelectedKeys={['dashboard']}
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

            {/* Main Content */}
            <Layout>
                {/* Header */}
                <Header className="dashboard-header">
                    <div className="header-left">
                        <Title level={3} style={{ margin: 0 }}>Dashboard Summary</Title>
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
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            className="add-produce-btn"
                            onClick={() => navigate('/farmer/add-produce')}
                        >
                            Add New Produce
                        </Button>
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

                {/* Content */}
                <Content className="dashboard-content">
                    {/* Welcome Section */}
                    <div className="welcome-section">
                        <Title level={2}>Welcome back, Joe!</Title>
                        <Paragraph type="secondary">Here is what is happening with your farm today.</Paragraph>
                    </div>

                    {/* Stats Cards */}
                    <Row gutter={[24, 24]} className="stats-row">
                        <Col xs={24} sm={12} lg={8}>
                            <Card className="stat-card stat-card-primary">
                                <div className="stat-header">
                                    <div className="stat-icon stat-icon-primary">
                                        <ShoppingOutlined />
                                    </div>
                                    <Tag color="success" className="stat-tag">
                                        <ArrowUpOutlined /> 12%
                                    </Tag>
                                </div>
                                <Paragraph className="stat-label">Total Sales</Paragraph>
                                <Title level={2} className="stat-value">$12,450.00</Title>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <Card className="stat-card">
                                <div className="stat-header">
                                    <div className="stat-icon stat-icon-blue">
                                        <UnorderedListOutlined />
                                    </div>
                                    <Tag className="stat-tag-neutral">Steady</Tag>
                                </div>
                                <Paragraph className="stat-label">Active Listings</Paragraph>
                                <Title level={2} className="stat-value">14</Title>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <Card className="stat-card">
                                <div className="stat-header">
                                    <div className="stat-icon stat-icon-orange">
                                        <ShoppingOutlined />
                                    </div>
                                    <Tag color="error" className="stat-tag">
                                        <ArrowDownOutlined /> 2%
                                    </Tag>
                                </div>
                                <Paragraph className="stat-label">Pending Orders</Paragraph>
                                <Title level={2} className="stat-value">5</Title>
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Activity Table */}
                    <Card className="activity-card" title="Recent Activity" extra={<Button type="link">View All</Button>}>
                        <Table
                            columns={columns}
                            dataSource={recentOrders || []}
                            pagination={false}
                            className="activity-table"
                        />
                    </Card>

                    {/* Secondary Section */}
                    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                        <Col xs={24} lg={12}>
                            <Card title="Inventory Low Stock" className="low-stock-card">
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div className="stock-item">
                                        <div className="stock-info">
                                            <div className="stock-icon">🥚</div>
                                            <div>
                                                <Text strong>Organic Eggs (Doz)</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>12 units remaining</Text>
                                            </div>
                                        </div>
                                        <Button type="link" className="restock-btn">Restock</Button>
                                    </div>
                                    <div className="stock-item">
                                        <div className="stock-info">
                                            <div className="stock-icon">🥕</div>
                                            <div>
                                                <Text strong>Heirloom Carrots</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>5kg remaining</Text>
                                            </div>
                                        </div>
                                        <Button type="link" className="restock-btn">Restock</Button>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card className="insights-card">
                                <div className="insights-content">
                                    <TrophyOutlined style={{ fontSize: '48px', color: '#13ec13', marginBottom: '16px' }} />
                                    <Title level={4}>Grow your reach!</Title>
                                    <Paragraph>
                                        Your farm is performing 20% better than average in your region.
                                        Consider listing "Bulk Seasonal Packs" to attract larger buyers.
                                    </Paragraph>
                                    <Button type="primary" style={{ marginTop: '16px' }}>Explore Insights</Button>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </Layout>
    );
};

export default FarmerDashboard;
