import React, { useEffect, useState } from 'react';
import {
    Layout,
    Card,
    Tag,
    Button,
    Avatar,
    Space,
    Typography,
    Dropdown,
    Menu,
    Progress,
    List,
    Row,
    Col,
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
    ClockCircleOutlined,
    MessageOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminOverview, getAdminReports } from '../../api/admin';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ReportsIssues = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [disputes, setDisputes] = useState([]);
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const loadReports = async () => {
            try {
                const [data, overview] = await Promise.all([getAdminReports(), getAdminOverview()]);
                const mapped = (data?.items || []).map((o) => ({
                    id: String(o.id),
                    type: o.type || 'Order Issue',
                    user: o.buyer_name || 'User',
                    issue: o.issue || `Order #${o.id} issue`,
                    date: new Date(o.updated_at || o.created_at).toLocaleString(),
                    priority: o.priority || 'Medium',
                    slaHours: Number(o.sla_hours || 0),
                    elapsedHours: Number(o.elapsed_hours || 0),
                    slaBreached: Boolean(o.sla_breached),
                    resolutionState: o.resolution_state || 'Open',
                }));
                setDisputes(mapped);
                setStats(overview?.stats || null);
            } catch {
                setDisputes([]);
                setStats(null);
            }
        };
        loadReports();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => navigate('/admin/dashboard') },
        { key: 'users', icon: <TeamOutlined />, label: 'User Management', onClick: () => navigate('/admin/users') },
        { key: 'products', icon: <ShoppingOutlined />, label: 'Product Moderation', onClick: () => navigate('/admin/products') },
        { key: 'transactions', icon: <DollarOutlined />, label: 'Transactions', onClick: () => navigate('/admin/transactions') },
        { key: 'reports', icon: <WarningOutlined />, label: 'Reports & Issues', onClick: () => navigate('/admin/reports') },
    ];

    const responseTime = stats?.api_response_time || 0;
    const dbLoad = 100 - (stats?.database_performance || 0);
    const storageCapacity = Math.min(100, Math.round((stats?.total_revenue || 0) / 1000));
    const resolutionRate = stats?.resolution_rate || 0;

    return (
        <Layout className="admin-dashboard-layout">
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} className="admin-sider" width={260}>
                <div className="logo-section-admin">
                    <div className="logo-icon-admin"><SafetyCertificateOutlined /></div>
                    {!collapsed && (
                        <div>
                            <Title level={5} style={{ margin: 0, color: 'white' }}>AgriMarket</Title>
                            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Admin Console</Text>
                        </div>
                    )}
                </div>
                <Menu theme="dark" selectedKeys={['reports']} mode="inline" items={menuItems} className="admin-menu" />
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
                    <div className="admin-header-left"><Title level={3} style={{ margin: 0 }}>Reports & Support</Title></div>
                    <div className="admin-header-right">
                        <Button type="text" icon={<MessageOutlined style={{ fontSize: '20px' }} />} />
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
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
                                                <Button size="small" key={`view-${item.id}`}>View Detail</Button>,
                                                <Button size="small" type="primary" key={`resolve-${item.id}`} style={{ background: '#52c41a', borderColor: '#52c41a' }}>Resolve</Button>,
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<UserOutlined />} />}
                                                title={(
                                                    <Space>
                                                        <Text strong>{item.type}</Text>
                                                        <Tag color={item.priority === 'High' ? 'red' : item.priority === 'Medium' ? 'orange' : 'blue'}>
                                                            {item.priority} Priority
                                                        </Tag>
                                                    </Space>
                                                )}
                                                description={(
                                                    <div>
                                                        <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>{item.issue}</Paragraph>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            <ClockCircleOutlined /> {item.date} | Reported by: {item.user}
                                                        </Text>
                                                        <br />
                                                        <Text type={item.slaBreached ? 'danger' : 'secondary'} style={{ fontSize: '12px' }}>
                                                            SLA: {item.elapsedHours}h / {item.slaHours}h | {item.resolutionState}{item.slaBreached ? ' | BREACHED' : ''}
                                                        </Text>
                                                    </div>
                                                )}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card title="System Performance" className="health-card">
                                <div style={{ marginBottom: '24px' }}><Text>Response Time (AVG)</Text><Progress percent={responseTime} status="active" strokeColor="#52c41a" /></div>
                                <div style={{ marginBottom: '24px' }}><Text>Database Load</Text><Progress percent={dbLoad} strokeColor="#722ed1" /></div>
                                <div><Text>Storage Capacity</Text><Progress percent={storageCapacity} strokeColor="#faad14" /></div>
                            </Card>
                            <Card title="Resolution Summary" style={{ marginTop: '24px', borderRadius: '16px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Progress type="circle" percent={resolutionRate} strokeColor="#52c41a" />
                                    <div style={{ marginTop: '16px' }}>
                                        <Title level={4}>{resolutionRate.toFixed(1)}% Resolved</Title>
                                        <Text type="secondary">Target updates with live backend metrics</Text>
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
