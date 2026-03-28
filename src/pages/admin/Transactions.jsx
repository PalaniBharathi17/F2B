import React, { useEffect, useMemo, useState } from 'react';
import {
    Layout,
    Card,
    Table,
    Tag,
    Button,
    Avatar,
    Typography,
    Dropdown,
    Menu,
    Row,
    Col,
    Statistic,
    Modal,
    Space,
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
    ArrowUpOutlined,
    FileTextOutlined,
    DownloadOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    exportAdminTransactions,
    getAdminOverview,
    getAdminTransactionInvoice,
    getAdminTransactions,
} from '../../api/admin';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const Transactions = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [invoice, setInvoice] = useState(null);
    const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
    const [exporting, setExporting] = useState(false);
    const navigate = useNavigate();
    const { logout, user: currentUser } = useAuth();

    const loadData = async () => {
        try {
            const [tx, overview] = await Promise.all([getAdminTransactions(), getAdminOverview()]);
            setTransactions(tx?.items || []);
            setStats(overview?.stats || null);
        } catch (error) {
            setTransactions([]);
            setStats(null);
            message.error(error?.response?.data?.error || 'Failed to load transactions');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredTransactions = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        return transactions.filter((order) => {
            if (!query) return true;
            return [
                order.id,
                order.order_type,
                order?.buyer?.name,
                order?.farmer?.name,
                order?.product?.crop_name,
                order.status,
                order.dispute_status,
            ].some((value) => String(value || '').toLowerCase().includes(query));
        });
    }, [transactions, searchText]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const blob = await exportAdminTransactions();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'admin_transactions.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success('Transaction export started');
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to export transactions');
        } finally {
            setExporting(false);
        }
    };

    const handleOpenInvoice = async (orderId) => {
        try {
            setLoadingInvoiceId(orderId);
            const data = await getAdminTransactionInvoice(orderId);
            setInvoice(data?.invoice || null);
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to load invoice');
        } finally {
            setLoadingInvoiceId(null);
        }
    };

    const columns = [
        { title: 'Transaction ID', dataIndex: 'id', key: 'id', render: (value) => <Text strong>#{value}</Text> },
        { title: 'Date & Time', dataIndex: 'created_at', key: 'created_at', render: (value) => new Date(value).toLocaleString() },
        { title: 'Buyer', dataIndex: ['buyer', 'name'], key: 'buyer' },
        { title: 'Farmer', dataIndex: ['farmer', 'name'], key: 'farmer' },
        { title: 'Product', dataIndex: ['product', 'crop_name'], key: 'product' },
        {
            title: 'Type',
            dataIndex: 'order_type',
            key: 'order_type',
            render: (value) => <Tag color={value === 'bulk' ? 'purple' : value === 'harvest_request' ? 'geekblue' : 'default'}>{String(value || 'standard').replaceAll('_', ' ').toUpperCase()}</Tag>,
        },
        {
            title: 'Amount',
            dataIndex: 'total_price',
            key: 'total_price',
            render: (amount) => <Text strong style={{ color: '#13ec13' }}>INR {Number(amount || 0).toFixed(2)}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={status === 'completed' ? 'success' : status === 'cancelled' ? 'error' : 'processing'}>{String(status || '').toUpperCase()}</Tag>,
        },
        {
            title: 'Invoice',
            key: 'invoice',
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<FileTextOutlined />}
                    loading={loadingInvoiceId === record.id}
                    onClick={() => handleOpenInvoice(record.id)}
                />
            ),
        },
    ];

    const todayRevenue = stats?.today_revenue || 0;
    const totalFees = stats?.platform_fees || 0;
    const activeSettlements = stats?.active_settlements || 0;
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
                <div className="logo-section-admin"><div className="logo-icon-admin"><SafetyCertificateOutlined /></div>{!collapsed && <div><Title level={5} style={{ margin: 0, color: 'white' }}>AgriMarket</Title><Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Admin Console</Text></div>}</div>
                <Menu theme="dark" selectedKeys={['transactions']} mode="inline" items={menuItems} className="admin-menu" />
                <div className="admin-profile-section"><div className="admin-profile-card"><Avatar size={40} icon={<UserOutlined />} />{!collapsed && <div className="admin-info"><Text strong style={{ color: 'white', fontSize: '14px' }}>{currentUser?.name || 'Admin User'}</Text><Tag color="purple" style={{ fontSize: '10px', padding: '0 6px' }}>{String(currentUser?.user_type || 'admin').toUpperCase()}</Tag></div>}</div></div>
            </Sider>

            <Layout>
                <Header className="admin-header">
                    <div className="admin-header-left"><Title level={3} style={{ margin: 0 }}>Financial Transactions</Title></div>
                    <div className="admin-header-right">
                        <Input
                            placeholder="Search transactions..."
                            prefix={<SearchOutlined />}
                            style={{ width: 250, borderRadius: 8 }}
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
                        <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>Export CSV</Button>
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer', background: '#722ed1' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="admin-content">
                    <Row gutter={24} style={{ marginBottom: '24px' }}>
                        <Col xs={24} md={8}><Card className="kpi-card"><Statistic title="Today's Revenue" value={todayRevenue} prefix="INR " precision={2} /></Card></Col>
                        <Col xs={24} md={8}><Card className="kpi-card"><Statistic title="Total Platform Fees" value={totalFees} prefix="INR " valueStyle={{ color: '#722ed1' }} precision={2} /></Card></Col>
                        <Col xs={24} md={8}><Card className="kpi-card"><Statistic title="Active Settlements" value={activeSettlements} suffix={<ArrowUpOutlined />} /></Card></Col>
                    </Row>
                    <Card title="Recent Transactions" className="verification-card">
                        <Table
                            columns={columns}
                            dataSource={filteredTransactions}
                            pagination={{ pageSize: 10 }}
                            rowKey="id"
                            locale={{ emptyText: 'No transactions match the current search.' }}
                        />
                    </Card>
                </Content>
            </Layout>

            <Modal
                open={Boolean(invoice)}
                onCancel={() => setInvoice(null)}
                footer={null}
                title={invoice ? `Transaction Invoice #${invoice.order_id}` : 'Transaction invoice'}
            >
                {invoice ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text><strong>Buyer:</strong> {invoice.buyer_name}</Text>
                        <Text><strong>Farmer:</strong> {invoice.farmer_name}</Text>
                        <Text><strong>Product:</strong> {invoice.product_name}</Text>
                        <Text><strong>Order type:</strong> {String(invoice.order_type || 'standard').replaceAll('_', ' ').toUpperCase()}</Text>
                        <Text><strong>Quantity:</strong> {invoice.quantity} {invoice.unit}</Text>
                        <Text><strong>Unit price:</strong> INR {Number(invoice.unit_price || 0).toFixed(2)}</Text>
                        <Text><strong>Gross amount:</strong> INR {Number(invoice.gross_amount || 0).toFixed(2)}</Text>
                        <Text><strong>Platform fee:</strong> INR {Number(invoice.platform_fee || 0).toFixed(2)}</Text>
                        <Text><strong>Net payout:</strong> INR {Number(invoice.net_payout || 0).toFixed(2)}</Text>
                        <Text><strong>Status:</strong> {invoice.status}</Text>
                        <Text><strong>Dispute status:</strong> {invoice.dispute_status || 'none'}</Text>
                        <Text><strong>Admin review:</strong> {invoice.admin_review_status || 'open'}</Text>
                        <Text><strong>Created at:</strong> {new Date(invoice.created_at).toLocaleString()}</Text>
                        {invoice.cancellation_reason ? <Text><strong>Cancellation reason:</strong> {invoice.cancellation_reason}</Text> : null}
                    </Space>
                ) : null}
            </Modal>
        </Layout>
    );
};

export default Transactions;
