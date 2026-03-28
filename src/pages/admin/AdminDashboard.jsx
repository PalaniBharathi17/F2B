import React, { useEffect, useMemo, useState } from 'react';
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
    Badge,
    Dropdown,
    Menu,
    Progress,
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
    CheckCircleOutlined,
    CloseCircleOutlined,
    ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getAdminNoveltyAnalytics,
    getAdminOverview,
    getAdminHarvestRequests,
    getAdminProducts,
    getAdminReports,
    getAdminUsers,
    updateAdminUserVerification,
} from '../../api/admin';
import { getAdminVerificationDocuments, reviewVerificationDocument } from '../../api/users';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const AdminDashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [stats, setStats] = useState(null);
    const [novelty, setNovelty] = useState(null);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [reports, setReports] = useState([]);
    const [harvestRequests, setHarvestRequests] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [verifyingUserId, setVerifyingUserId] = useState(null);
    const navigate = useNavigate();
    const { logout, user: currentUser } = useAuth();

    const loadData = async () => {
        try {
            const [overview, usersData, noveltyData, productsData, reportsData, harvestData, documentData] = await Promise.all([
                getAdminOverview(),
                getAdminUsers(),
                getAdminNoveltyAnalytics(),
                getAdminProducts(),
                getAdminReports(),
                getAdminHarvestRequests(),
                getAdminVerificationDocuments(),
            ]);
            setStats(overview?.stats || null);
            setUsers(usersData?.items || []);
            setNovelty(noveltyData?.analytics || null);
            setProducts(productsData?.items || []);
            setReports(reportsData?.items || []);
            setHarvestRequests(harvestData?.items || []);
            setDocuments(documentData?.items || []);
        } catch (error) {
            setStats(null);
            setUsers([]);
            setNovelty(null);
            setProducts([]);
            setReports([]);
            setHarvestRequests([]);
            setDocuments([]);
            message.error(error?.response?.data?.error || 'Failed to load admin dashboard');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const pendingUsers = useMemo(
        () => users.filter((user) => user.user_type === 'farmer' && user.verification_status === 'pending'),
        [users],
    );
    const pendingProducts = useMemo(
        () => products.filter((product) => product.status === 'pending_review'),
        [products],
    );
    const openReports = useMemo(
        () => reports.filter((report) => report.resolution_state !== 'Closed'),
        [reports],
    );

    const handleVerify = async (userId, verificationStatus, note) => {
        try {
            setVerifyingUserId(userId);
            await updateAdminUserVerification(userId, { verification_status: verificationStatus, note });
            message.success(`Farmer ${verificationStatus}`);
            await loadData();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update verification');
        } finally {
            setVerifyingUserId(null);
        }
    };

    const handleDocumentReview = async (documentId, status) => {
        try {
            await reviewVerificationDocument(documentId, { status, note: `Document ${status} by admin` });
            message.success(`Document ${status}`);
            await loadData();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to review document');
        }
    };

    const columns = [
        {
            title: 'Farmer',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <Text strong>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.city || 'N/A'}, {record.state || 'N/A'}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Submitted',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (value) => new Date(value).toLocaleDateString(),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => <Tag color="warning">{record.verification_status?.toUpperCase?.() || 'PENDING'}</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        loading={verifyingUserId === record.id}
                        onClick={() => handleVerify(record.id, 'verified', 'Verified by admin')}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        loading={verifyingUserId === record.id}
                        onClick={() => handleVerify(record.id, 'rejected', 'Rejected by admin')}
                    >
                        Reject
                    </Button>
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

                <Menu theme="dark" selectedKeys={['dashboard']} mode="inline" items={menuItems} className="admin-menu" />

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
                    <div className="admin-header-left">
                        <Title level={3} style={{ margin: 0 }}>Platform Operations</Title>
                    </div>
                    <div className="admin-header-right">
                        <Badge count={stats?.pending_reviews || 0} offset={[-5, 5]}>
                            <Button
                                type="text"
                                icon={<WarningOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />}
                                aria-label="Platform alerts"
                                onClick={() => navigate('/admin/reports')}
                            />
                        </Badge>
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer', background: '#722ed1' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="admin-content">
                    <div className="admin-welcome">
                        <Title level={2}>Operations Dashboard</Title>
                        <Paragraph type="secondary">Track live queues, marketplace health, and moderation workload.</Paragraph>
                    </div>

                    <Row gutter={[24, 24]} className="kpi-row">
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-users">
                                <Statistic title="Total Users" value={stats?.total_users || 0} />
                                <Text type="secondary">Farmers and buyers currently on platform</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-products">
                                <Statistic title="Pending Farmer Checks" value={pendingUsers.length} />
                                <Text type="secondary">Awaiting account verification</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-revenue">
                                <Statistic title="Pending Listings" value={pendingProducts.length} />
                                <Text type="secondary">Products waiting for moderation</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-pending">
                                <Statistic title="Open Reports" value={openReports.length} />
                                <Text type="secondary">Issues that still need a decision</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-products">
                                <Statistic title="Bulk Orders" value={stats?.bulk_order_count || 0} />
                                <Text type="secondary">Revenue: INR {Number(stats?.bulk_order_revenue || 0).toFixed(2)}</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="kpi-card kpi-card-products">
                                <Statistic title="Harvest Queue" value={stats?.harvest_open_count || 0} />
                                <Text type="secondary">Ready to convert: {stats?.harvest_ready_count || 0}</Text>
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        className="verification-card"
                        title={<Space><SafetyCertificateOutlined /><Text strong>Pending Farmer Verifications</Text></Space>}
                        extra={<Button type="link" onClick={() => navigate('/admin/users')}>Open Queue</Button>}
                    >
                        <Table
                            columns={columns}
                            dataSource={pendingUsers.slice(0, 8)}
                            rowKey="id"
                            pagination={false}
                            className="verification-table"
                            locale={{ emptyText: 'No pending farmer verifications.' }}
                        />
                    </Card>

                    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                        <Col xs={24} lg={12}>
                            <Card title="Marketplace Throughput" className="health-card">
                                <Space direction="vertical" style={{ width: '100%' }} size="large">
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <Text>Revenue Completed</Text>
                                            <Text strong>INR {Number(stats?.total_revenue || 0).toFixed(2)}</Text>
                                        </div>
                                        <Progress percent={Math.min(100, Number(stats?.resolution_rate || 0))} strokeColor="#52c41a" />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <Text>Today Revenue</Text>
                                            <Text strong>INR {Number(stats?.today_revenue || 0).toFixed(2)}</Text>
                                        </div>
                                        <Progress percent={Math.min(100, Number(stats?.active_settlements || 0) * 5)} strokeColor="#1890ff" />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <Text>Platform Fees</Text>
                                            <Text strong>INR {Number(stats?.platform_fees || 0).toFixed(2)}</Text>
                                        </div>
                                        <Progress percent={Math.min(100, Number(stats?.platform_fees || 0) / 10)} strokeColor="#faad14" />
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card title="Queue Shortcuts" className="activity-card-admin">
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <Button block onClick={() => navigate('/admin/users')}>
                                        Review User Management <ArrowRightOutlined />
                                    </Button>
                                    <Button block onClick={() => navigate('/admin/products')}>
                                        Moderate Product Listings <ArrowRightOutlined />
                                    </Button>
                                    <Button block onClick={() => navigate('/admin/reports')}>
                                        Resolve Reports and Disputes <ArrowRightOutlined />
                                    </Button>
                                    <Button block onClick={() => navigate('/admin/transactions')}>
                                        Export and Audit Transactions <ArrowRightOutlined />
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                        <Col xs={24} lg={14}>
                            <Card title="Novelty Configuration Snapshot" className="health-card">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={12}>
                                        <Statistic title="Trust Alpha" value={Number(novelty?.config?.trust_alpha || 0)} precision={2} />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Statistic title="Avg Trust Score" value={Number(novelty?.trust?.average_trust_score || 0)} precision={2} />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Statistic title="Freshness Avg" value={Number(novelty?.freshness?.average_freshness_score || 0)} precision={2} />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Statistic title="Equity Health" value={Number(novelty?.fairness?.equity_health_score || 0)} suffix="%" precision={2} />
                                    </Col>
                                </Row>
                                <div style={{ marginTop: '16px' }}>
                                    <Text type="secondary">
                                        Trust badges: GOLD {novelty?.trust?.gold_farmers || 0}, SILVER {novelty?.trust?.silver_farmers || 0}, BRONZE {novelty?.trust?.bronze_farmers || 0}
                                    </Text>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} lg={10}>
                            <Card title="Recommendations" className="activity-card-admin">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {(novelty?.recommendations || []).map((item, index) => (
                                        <Card key={`${index}-${item}`} size="small">
                                            <Text>{item}</Text>
                                        </Card>
                                    ))}
                                    {(!novelty?.recommendations || novelty.recommendations.length === 0) ? (
                                        <Text type="secondary">No recommendations available.</Text>
                                    ) : null}
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                    <Card title="Recent Harvest Requests" className="verification-card" style={{ marginTop: '24px' }}>
                        <Table
                            rowKey="id"
                            pagination={false}
                            dataSource={harvestRequests.slice(0, 6)}
                            locale={{ emptyText: 'No harvest requests available.' }}
                            columns={[
                                { title: 'Request', key: 'id', render: (_, record) => <Text strong>#{record.id}</Text> },
                                { title: 'Buyer', dataIndex: 'buyer_name', key: 'buyer_name' },
                                { title: 'Farmer', dataIndex: 'farmer_name', key: 'farmer_name' },
                                { title: 'Product', dataIndex: 'product_name', key: 'product_name' },
                                { title: 'Quantity', key: 'quantity', render: (_, record) => `${record.requested_quantity} ${record.unit}` },
                                { title: 'Preferred', dataIndex: 'preferred_harvest_date', key: 'preferred_harvest_date', render: (value) => new Date(value).toLocaleDateString() },
                                { title: 'Status', dataIndex: 'status', key: 'status', render: (value) => <Tag color={value === 'ready' ? 'success' : value === 'rejected' ? 'error' : value === 'completed' ? 'blue' : 'warning'}>{String(value || '').toUpperCase()}</Tag> },
                            ]}
                        />
                    </Card>
                    <Card title="Verification Documents" className="verification-card" style={{ marginTop: '24px' }}>
                        <Table
                            rowKey="id"
                            pagination={false}
                            dataSource={documents.slice(0, 6)}
                            locale={{ emptyText: 'No verification documents uploaded.' }}
                            columns={[
                                { title: 'Farmer', dataIndex: ['user', 'name'], key: 'user' },
                                { title: 'Type', dataIndex: 'document_type', key: 'document_type' },
                                { title: 'Status', dataIndex: 'status', key: 'status', render: (value) => <Tag color={value === 'approved' ? 'success' : value === 'rejected' ? 'error' : 'warning'}>{String(value || '').toUpperCase()}</Tag> },
                                { title: 'Uploaded', dataIndex: 'created_at', key: 'created_at', render: (value) => new Date(value).toLocaleDateString() },
                                {
                                    title: 'Actions',
                                    key: 'actions',
                                    render: (_, record) => (
                                        <Space>
                                            <Button size="small" onClick={() => handleDocumentReview(record.id, 'approved')}>Approve</Button>
                                            <Button size="small" danger onClick={() => handleDocumentReview(record.id, 'rejected')}>Reject</Button>
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard;
