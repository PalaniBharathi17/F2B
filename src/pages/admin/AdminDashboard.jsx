import React, { useState } from 'react';
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
    MoreOutlined,
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
import useMockData from '../../hooks/useMockData';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const AdminDashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const { data: pendingVerifications, loading: pendingLoading } = useMockData('admin');

    const columns = [
        {
            title: 'User',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.avatar} />
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
            dataIndex: 'status',
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
            {/* Sidebar */}
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
                    defaultSelectedKeys={['dashboard']}
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

            {/* Main Content */}
            <Layout>
                {/* Header */}
                <Header className="admin-header">
                    <div className="admin-header-left">
                        <Title level={3} style={{ margin: 0 }}>Platform Overview</Title>
                    </div>
                    <div className="admin-header-right">
                        <Badge count={5} offset={[-5, 5]}>
                            <Button type="text" icon={<WarningOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />} aria-label="Platform alerts" />
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

                {/* Content */}
                <Content className="admin-content">
                    {/* Welcome Section */}
                    <div className="admin-welcome">
                        <Title level={2}>System Dashboard</Title>
                        <Paragraph type="secondary">Monitor and manage the AgriMarket platform.</Paragraph>
                    </div>

                    {/* KPI Cards */}
                    <Row gutter={[24, 24]} className="kpi-row">
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-users">
                                <div className="kpi-icon">
                                    <TeamOutlined />
                                </div>
                                <Statistic
                                    title="Total Users"
                                    value={1847}
                                    suffix={
                                        <Tag color="success" className="kpi-change">
                                            <ArrowUpOutlined /> 8.2%
                                        </Tag>
                                    }
                                />
                                <Progress percent={75} showInfo={false} strokeColor="#13ec13" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-products">
                                <div className="kpi-icon kpi-icon-blue">
                                    <ShoppingOutlined />
                                </div>
                                <Statistic
                                    title="Active Products"
                                    value={5234}
                                    suffix={
                                        <Tag color="success" className="kpi-change">
                                            <ArrowUpOutlined /> 12%
                                        </Tag>
                                    }
                                />
                                <Progress percent={82} showInfo={false} strokeColor="#1890ff" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-revenue">
                                <div className="kpi-icon kpi-icon-orange">
                                    <DollarOutlined />
                                </div>
                                <Statistic
                                    title="Total Revenue"
                                    value={284500}
                                    prefix="$"
                                    suffix={
                                        <Tag color="success" className="kpi-change">
                                            <ArrowUpOutlined /> 15%
                                        </Tag>
                                    }
                                />
                                <Progress percent={68} showInfo={false} strokeColor="#faad14" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-pending">
                                <div className="kpi-icon kpi-icon-red">
                                    <WarningOutlined />
                                </div>
                                <Statistic
                                    title="Pending Reviews"
                                    value={23}
                                    suffix={
                                        <Tag color="error" className="kpi-change">
                                            <ArrowDownOutlined /> 3%
                                        </Tag>
                                    }
                                />
                                <Progress percent={45} showInfo={false} strokeColor="#ff4d4f" />
                            </Card>
                        </Col>
                    </Row>

                    {/* Pending Verifications Table */}
                    <Card
                        className="verification-card"
                        title={
                            <Space>
                                <SafetyCertificateOutlined />
                                <Text strong>Pending User Verifications</Text>
                            </Space>
                        }
                        extra={<Button type="link">View All</Button>}
                    >
                        <Table
                            columns={columns}
                            dataSource={pendingVerifications || []}
                            pagination={false}
                            className="verification-table"
                        />
                    </Card>

                    {/* Secondary Section */}
                    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                        <Col xs={24} lg={12}>
                            <Card title="Platform Health" className="health-card">
                                <Space direction="vertical" style={{ width: '100%' }} size="large">
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <Text>Server Uptime</Text>
                                            <Text strong>99.9%</Text>
                                        </div>
                                        <Progress percent={99.9} strokeColor="#52c41a" />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <Text>Database Performance</Text>
                                            <Text strong>95.2%</Text>
                                        </div>
                                        <Progress percent={95.2} strokeColor="#1890ff" />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <Text>API Response Time</Text>
                                            <Text strong>87.5%</Text>
                                        </div>
                                        <Progress percent={87.5} strokeColor="#faad14" />
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card title="Recent Activity" className="activity-card-admin">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div className="activity-item">
                                        <Avatar icon={<UserOutlined />} size="small" />
                                        <div className="activity-text">
                                            <Text>New farmer registration: <strong>Mike Johnson</strong></Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>2 minutes ago</Text>
                                        </div>
                                    </div>
                                    <div className="activity-item">
                                        <Avatar icon={<ShopOutlined />} size="small" style={{ background: '#1890ff' }} />
                                        <div className="activity-text">
                                            <Text>Product approved: <strong>Organic Honey</strong></Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>15 minutes ago</Text>
                                        </div>
                                    </div>
                                    <div className="activity-item">
                                        <Avatar icon={<WarningOutlined />} size="small" style={{ background: '#ff4d4f' }} />
                                        <div className="activity-text">
                                            <Text>Dispute reported: Order #4521</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>1 hour ago</Text>
                                        </div>
                                    </div>
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
