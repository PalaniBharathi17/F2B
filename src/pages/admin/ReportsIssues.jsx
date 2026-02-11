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
    Progress,
    List
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
    ClockCircleOutlined,
    MessageOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ReportsIssues = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const disputes = [
        {
            id: '1',
            type: 'Order Dispute',
            user: 'Sarah Smith',
            issue: 'Produce arrived damaged (Order #8821)',
            date: '2 hours ago',
            priority: 'High'
        },
        {
            id: '2',
            type: 'Verification',
            user: 'Mike Johnson',
            issue: 'Incorrect business license provided',
            date: '5 hours ago',
            priority: 'Medium'
        },
        {
            id: '3',
            type: 'System Alert',
            user: 'System',
            issue: 'Latency spikes in Eugene, OR server node',
            date: '1 day ago',
            priority: 'Low'
        }
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
                    selectedKeys={['reports']}
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
                        <Title level={3} style={{ margin: 0 }}>Reports & Support</Title>
                    </div>
                    <div className="admin-header-right">
                        <Badge dot><Button type="text" icon={<MessageOutlined style={{ fontSize: '20px' }} />} /></Badge>
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
                    <Row gutter={24}>
                        <Col span={16}>
                            <Card title="Active Disputes & Reports" className="verification-card">
                                <List
                                    itemLayout="horizontal"
                                    dataSource={disputes}
                                    renderItem={(item) => (
                                        <List.Item
                                            actions={[
                                                <Button size="small">View Detail</Button>,
                                                <Button size="small" type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }}>Resolve</Button>
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar icon={item.user === 'System' ? <SafetyCertificateOutlined /> : <UserOutlined />} />}
                                                title={
                                                    <Space>
                                                        <Text strong>{item.type}</Text>
                                                        <Tag color={item.priority === 'High' ? 'red' : item.priority === 'Medium' ? 'orange' : 'blue'}>
                                                            {item.priority} Priority
                                                        </Tag>
                                                    </Space>
                                                }
                                                description={
                                                    <div>
                                                        <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>{item.issue}</Paragraph>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            <ClockCircleOutlined /> {item.date} • Reported by: {item.user}
                                                        </Text>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card title="System Performance" className="health-card">
                                <div style={{ marginBottom: '24px' }}>
                                    <Text>Response Time (AVG)</Text>
                                    <Progress percent={92} status="active" strokeColor="#52c41a" />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <Text>Database Load</Text>
                                    <Progress percent={45} strokeColor="#722ed1" />
                                </div>
                                <div>
                                    <Text>Storage Capacity</Text>
                                    <Progress percent={68} strokeColor="#faad14" />
                                </div>
                            </Card>
                            <Card title="Resolution Summary" style={{ marginTop: '24px', borderRadius: '16px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Progress type="circle" percent={88} strokeColor="#52c41a" />
                                    <div style={{ marginTop: '16px' }}>
                                        <Title level={4}>88% Resolved</Title>
                                        <Text type="secondary">Target: 95% weekly resolution</Text>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </Layout>
    );
};

export default ReportsIssues;
