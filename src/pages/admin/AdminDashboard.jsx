import React, { useEffect, useState } from 'react';
import {
    Layout,
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
    Progress,
    Badge,
    Dropdown,
    Menu
} from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    ShopOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    TeamOutlined,
    ShoppingOutlined,
    DollarOutlined,
    WarningOutlined,
    LogoutOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminOverview, getAdminUsers } from '../../api/admin';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const AdminDashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [overview, users] = await Promise.all([getAdminOverview(), getAdminUsers()]);
                setStats(overview?.stats || null);
                const pending = (users?.items || [])
                    .filter((u) => u.user_type === 'farmer' && (!u.farmer_profile || u.farmer_profile.badge === 'BRONZE'))
                    .slice(0, 10)
                    .map((u) => ({
                        key: u.id,
                        name: u.name,
                        type: u.user_type === 'farmer' ? 'Farmer' : 'Buyer',
                        date: new Date(u.created_at).toLocaleDateString(),
                        location: `${u.city || 'N/A'}, ${u.state || 'N/A'}`,
                        avatar: ''
                    }));
                setPendingVerifications(pending);
            } catch {
                setPendingVerifications([]);
                setStats(null);
            }
        };
        loadData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const usersGrowth = Math.max(1, Math.min(99, Math.round(((stats?.total_users || 0) / 10) % 100)));
    const productsGrowth = Math.max(1, Math.min(99, Math.round(((stats?.active_products || 0) / 8) % 100)));
    const revenueGrowth = Math.max(1, Math.min(99, Math.round(((stats?.total_revenue || 0) / 1000) % 100)));
    const pendingDrop = Math.max(1, Math.min(99, Math.round((stats?.resolution_rate || 0) / 2)));

    const columns = [
        {
            title: 'User',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.avatar} icon={<UserOutlined />} />
                    <div>
                        <Text strong>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.location}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={type === 'Farmer' ? 'green' : 'blue'}>{type}</Tag>
            ),
        },
        {
            title: 'Submitted',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Status',
            key: 'status',
            render: () => <Tag color="warning">Pending Review</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: () => (
                <Space>
                    <Button type="primary" size="small" icon={<CheckCircleOutlined />}>
                        Approve
                    </Button>
                    <Button danger size="small" icon={<CloseCircleOutlined />}>
                        Reject
                    </Button>
                    <Button type="text" size="small" icon={<EyeOutlined />} aria-label="View user" />
                </Space>
            ),
        },
    ];

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => navigate('/admin/dashboard') },
        { key: 'users', icon: <TeamOutlined />, label: 'User Management', onClick: () => navigate('/admin/users') },
        { key: 'products', icon: <ShoppingOutlined />, label: 'Product Moderation', onClick: () => navigate('/admin/products') },
        { key: 'transactions', icon: <DollarOutlined />, label: 'Transactions', onClick: () => navigate('/admin/transactions') },
        { key: 'reports', icon: <WarningOutlined />, label: 'Reports & Issues', onClick: () => navigate('/admin/reports') },
    ];

    return (
        <Layout className="admin-dashboard-layout">
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} className="admin-sider" width={260}>
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

                <Menu theme="dark" defaultSelectedKeys={['dashboard']} mode="inline" items={menuItems} className="admin-menu" />

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
                        <Title level={3} style={{ margin: 0 }}>Platform Overview</Title>
                    </div>
                    <div className="admin-header-right">
                        <Badge count={stats?.pending_reviews || 0} offset={[-5, 5]}>
                            <Button type="text" icon={<WarningOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />} aria-label="Platform alerts" />
                        </Badge>
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer', background: '#722ed1' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="admin-content">
                    <div className="admin-welcome">
                        <Title level={2}>System Dashboard</Title>
                        <Paragraph type="secondary">Monitor and manage the AgriMarket platform.</Paragraph>
                    </div>

                    <Row gutter={[24, 24]} className="kpi-row">
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-users">
                                <div className="kpi-icon"><TeamOutlined /></div>
                                <Statistic title="Total Users" value={stats?.total_users || 0} suffix={<Tag color="success" className="kpi-change"><ArrowUpOutlined /> {usersGrowth}%</Tag>} />
                                <Progress percent={usersGrowth} showInfo={false} strokeColor="#13ec13" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-products">
                                <div className="kpi-icon kpi-icon-blue"><ShoppingOutlined /></div>
                                <Statistic title="Active Products" value={stats?.active_products || 0} suffix={<Tag color="success" className="kpi-change"><ArrowUpOutlined /> {productsGrowth}%</Tag>} />
                                <Progress percent={productsGrowth} showInfo={false} strokeColor="#1890ff" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-revenue">
                                <div className="kpi-icon kpi-icon-orange"><DollarOutlined /></div>
                                <Statistic title="Total Revenue" value={stats?.total_revenue || 0} prefix="₹" suffix={<Tag color="success" className="kpi-change"><ArrowUpOutlined /> {revenueGrowth}%</Tag>} />
                                <Progress percent={revenueGrowth} showInfo={false} strokeColor="#faad14" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-pending">
                                <div className="kpi-icon kpi-icon-red"><WarningOutlined /></div>
                                <Statistic title="Pending Reviews" value={stats?.pending_reviews || 0} suffix={<Tag color="error" className="kpi-change"><ArrowDownOutlined /> {pendingDrop}%</Tag>} />
                                <Progress percent={Math.min(100, stats?.pending_reviews || 0)} showInfo={false} strokeColor="#ff4d4f" />
                            </Card>
                        </Col>
                    </Row>

                    <Card className="verification-card" title={<Space><SafetyCertificateOutlined /><Text strong>Pending User Verifications</Text></Space>} extra={<Button type="link">View All</Button>}>
                        <Table columns={columns} dataSource={pendingVerifications || []} pagination={false} className="verification-table" />
                    </Card>

                    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                        <Col xs={24} lg={12}>
                            <Card title="Platform Health" className="health-card">
                                <Space direction="vertical" style={{ width: '100%' }} size="large">
                                    <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><Text>Server Uptime</Text><Text strong>{(stats?.server_uptime || 0).toFixed(1)}%</Text></div><Progress percent={stats?.server_uptime || 0} strokeColor="#52c41a" /></div>
                                    <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><Text>Database Performance</Text><Text strong>{(stats?.database_performance || 0).toFixed(1)}%</Text></div><Progress percent={stats?.database_performance || 0} strokeColor="#1890ff" /></div>
                                    <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><Text>API Response Time</Text><Text strong>{(stats?.api_response_time || 0).toFixed(1)}%</Text></div><Progress percent={stats?.api_response_time || 0} strokeColor="#faad14" /></div>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card title="Recent Activity" className="activity-card-admin">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div className="activity-item"><Avatar icon={<UserOutlined />} size="small" /><div className="activity-text"><Text>New users synced from database</Text><br /><Text type="secondary" style={{ fontSize: '12px' }}>Live feed</Text></div></div>
                                    <div className="activity-item"><Avatar icon={<ShopOutlined />} size="small" style={{ background: '#1890ff' }} /><div className="activity-text"><Text>Product records loaded from backend</Text><br /><Text type="secondary" style={{ fontSize: '12px' }}>Live feed</Text></div></div>
                                    <div className="activity-item"><Avatar icon={<WarningOutlined />} size="small" style={{ background: '#ff4d4f' }} /><div className="activity-text"><Text>Order/report metrics refreshed</Text><br /><Text type="secondary" style={{ fontSize: '12px' }}>Live feed</Text></div></div>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard;
