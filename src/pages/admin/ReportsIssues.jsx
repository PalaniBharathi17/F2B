import React, { useEffect, useMemo, useState } from 'react';
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
    Modal,
    Input,
    message,
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
    SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminOverview, getAdminReports, resolveAdminReport } from '../../api/admin';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ReportsIssues = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [actionModal, setActionModal] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { logout, user: currentUser } = useAuth();

    const loadReports = async () => {
        try {
            const [data, overview] = await Promise.all([getAdminReports(), getAdminOverview()]);
            setReports(data?.items || []);
            setStats(overview?.stats || null);
        } catch (error) {
            setReports([]);
            setStats(null);
            message.error(error?.response?.data?.error || 'Failed to load reports');
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const filteredReports = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        return reports.filter((item) => {
            if (!query) return true;
            return [
                item.id,
                item.type,
                item.issue,
                item.buyer_name,
                item.farmer_name,
                item.product_name,
                item.priority,
                item.resolution_state,
            ].some((value) => String(value || '').toLowerCase().includes(query));
        });
    }, [reports, searchText]);

    const handleResolve = async () => {
        if (!actionModal) return;
        if (actionModal.action !== 'reopen' && !resolutionNote.trim()) {
            message.error('Resolution note is required');
            return;
        }

        try {
            setSubmitting(true);
            await resolveAdminReport(actionModal.id, { action: actionModal.action, note: resolutionNote });
            message.success('Report updated');
            setActionModal(null);
            setResolutionNote('');
            await loadReports();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update report');
        } finally {
            setSubmitting(false);
        }
    };

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => navigate('/admin/dashboard') },
        { key: 'users', icon: <TeamOutlined />, label: 'User Management', onClick: () => navigate('/admin/users') },
        { key: 'products', icon: <ShoppingOutlined />, label: 'Product Moderation', onClick: () => navigate('/admin/products') },
        { key: 'transactions', icon: <DollarOutlined />, label: 'Transactions', onClick: () => navigate('/admin/transactions') },
        { key: 'reports', icon: <WarningOutlined />, label: 'Reports & Issues', onClick: () => navigate('/admin/reports') },
    ];

    const responseTime = Math.min(100, Number(stats?.resolution_rate || 0));
    const reviewLoad = Math.min(100, (reports.filter((item) => item.resolution_state !== 'Closed').length * 10));
    const settlementLoad = Math.min(100, Number(stats?.active_settlements || 0) * 5);
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
                                <Text strong style={{ color: 'white', fontSize: '14px' }}>{currentUser?.name || 'Admin User'}</Text>
                                <Tag color="purple" style={{ fontSize: '10px', padding: '0 6px' }}>{String(currentUser?.user_type || 'admin').toUpperCase()}</Tag>
                            </div>
                        )}
                    </div>
                </div>
            </Sider>

            <Layout>
                <Header className="admin-header">
                    <div className="admin-header-left"><Title level={3} style={{ margin: 0 }}>Reports & Support</Title></div>
                    <div className="admin-header-right">
                        <Input
                            placeholder="Search reports..."
                            prefix={<SearchOutlined />}
                            style={{ width: 250, borderRadius: 8 }}
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
                        <Button type="text" icon={<MessageOutlined style={{ fontSize: '20px' }} />} />
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer', background: '#722ed1' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="admin-content">
                    <Row gutter={24}>
                        <Col xs={24} lg={16}>
                            <Card title="Active Disputes & Reports" className="verification-card">
                                <List
                                    itemLayout="horizontal"
                                    dataSource={filteredReports}
                                    locale={{ emptyText: 'No reports match the current search.' }}
                                    renderItem={(item) => (
                                        <List.Item
                                            actions={[
                                                <Button size="small" key={`view-${item.id}`} onClick={() => setSelectedReport(item)}>View Detail</Button>,
                                                item.resolution_state !== 'Closed'
                                                    ? <Button size="small" type="primary" key={`resolve-${item.id}`} style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => setActionModal({ id: item.id, action: 'resolve' })}>Resolve</Button>
                                                    : <Button size="small" key={`reopen-${item.id}`} onClick={() => setActionModal({ id: item.id, action: 'reopen' })}>Reopen</Button>,
                                                item.dispute_status === 'open'
                                                    ? <Button size="small" danger key={`reject-${item.id}`} onClick={() => setActionModal({ id: item.id, action: 'reject' })}>Reject</Button>
                                                    : null,
                                            ].filter(Boolean)}
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<UserOutlined />} />}
                                                title={(
                                                    <Space>
                                                        <Text strong>{item.type}</Text>
                                                        <Tag color={item.priority === 'High' ? 'red' : item.priority === 'Medium' ? 'orange' : 'blue'}>
                                                            {item.priority} Priority
                                                        </Tag>
                                                        <Tag color={item.resolution_state === 'Closed' ? 'green' : 'gold'}>
                                                            {item.resolution_state}
                                                        </Tag>
                                                    </Space>
                                                )}
                                                description={(
                                                    <div>
                                                        <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>{item.issue}</Paragraph>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            <ClockCircleOutlined /> {new Date(item.updated_at || item.created_at).toLocaleString()} | Buyer: {item.buyer_name} | Farmer: {item.farmer_name}
                                                        </Text>
                                                        <br />
                                                        <Text type={item.sla_breached ? 'danger' : 'secondary'} style={{ fontSize: '12px' }}>
                                                            SLA: {item.elapsed_hours}h / {item.sla_hours}h | Admin state: {item.admin_review_status || 'open'}{item.sla_breached ? ' | BREACHED' : ''}
                                                        </Text>
                                                    </div>
                                                )}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card title="Queue Performance" className="health-card">
                                <div style={{ marginBottom: '24px' }}><Text>Resolution Rate</Text><Progress percent={responseTime} status="active" strokeColor="#52c41a" /></div>
                                <div style={{ marginBottom: '24px' }}><Text>Open Review Load</Text><Progress percent={reviewLoad} strokeColor="#722ed1" /></div>
                                <div><Text>Settlement Load</Text><Progress percent={settlementLoad} strokeColor="#faad14" /></div>
                            </Card>
                            <Card title="Resolution Summary" style={{ marginTop: '24px', borderRadius: '16px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Progress type="circle" percent={resolutionRate} strokeColor="#52c41a" />
                                    <div style={{ marginTop: '16px' }}>
                                        <Title level={4}>{resolutionRate.toFixed(1)}% Completed</Title>
                                        <Text type="secondary">Based on closed orders versus total orders</Text>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Content>
            </Layout>

            <Modal
                open={Boolean(selectedReport)}
                onCancel={() => setSelectedReport(null)}
                footer={null}
                title={selectedReport ? `${selectedReport.type} #${selectedReport.id}` : 'Report detail'}
            >
                {selectedReport ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text><strong>Buyer:</strong> {selectedReport.buyer_name}</Text>
                        <Text><strong>Farmer:</strong> {selectedReport.farmer_name}</Text>
                        <Text><strong>Product:</strong> {selectedReport.product_name}</Text>
                        <Text><strong>Status:</strong> {selectedReport.status}</Text>
                        <Text><strong>Dispute:</strong> {selectedReport.dispute_status || 'none'}</Text>
                        <Text><strong>Admin review:</strong> {selectedReport.admin_review_status || 'open'}</Text>
                        <Text><strong>Admin note:</strong> {selectedReport.admin_review_note || 'No note recorded'}</Text>
                        <Text><strong>SLA:</strong> {selectedReport.elapsed_hours}h elapsed of {selectedReport.sla_hours}h</Text>
                        <Paragraph style={{ marginBottom: 0 }}>{selectedReport.issue}</Paragraph>
                    </Space>
                ) : null}
            </Modal>

            <Modal
                open={Boolean(actionModal)}
                onCancel={() => {
                    if (!submitting) {
                        setActionModal(null);
                        setResolutionNote('');
                    }
                }}
                onOk={handleResolve}
                confirmLoading={submitting}
                okText={actionModal?.action === 'reopen' ? 'Reopen Report' : 'Submit Decision'}
                title={actionModal?.action === 'resolve' ? 'Resolve report' : actionModal?.action === 'reject' ? 'Reject dispute' : 'Reopen report'}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>
                        {actionModal?.action === 'resolve' ? 'Close this report and resolve any open dispute.' : null}
                        {actionModal?.action === 'reject' ? 'Close this report and reject the active dispute.' : null}
                        {actionModal?.action === 'reopen' ? 'Reopen this report for further review.' : null}
                    </Text>
                    <TextArea
                        rows={4}
                        value={resolutionNote}
                        onChange={(event) => setResolutionNote(event.target.value)}
                        placeholder={actionModal?.action === 'reopen' ? 'Optional reopen note' : 'Resolution note'}
                    />
                </Space>
            </Modal>
        </Layout>
    );
};

export default ReportsIssues;
