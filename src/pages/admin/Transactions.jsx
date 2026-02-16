import React, { useEffect, useState } from 'react';
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
    Statistic
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
    DownloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminOverview, getAdminTransactions } from '../../api/admin';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const Transactions = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [transactionData, setTransactionData] = useState([]);
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [tx, overview] = await Promise.all([getAdminTransactions(), getAdminOverview()]);
                const mapped = (tx?.items || []).map((o) => ({
                    key: o.id,
                    id: `#TRX-${o.id}`,
                    date: new Date(o.created_at).toLocaleString(),
                    buyer: o?.buyer?.name || 'Buyer',
                    farmer: o?.farmer?.name || 'Farmer',
                    amount: `₹${Number(o.total_price || 0).toFixed(2)}`,
                    fee: `₹${(Number(o.total_price || 0) * 0.05).toFixed(2)}`,
                    status: o.status === 'completed' ? 'Completed' : 'Processing'
                }));
                setTransactionData(mapped);
                setStats(overview?.stats || null);
            } catch {
                setTransactionData([]);
                setStats(null);
            }
        };
        loadData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const columns = [
        { title: 'Transaction ID', dataIndex: 'id', key: 'id', render: (text) => <Text strong>{text}</Text> },
        { title: 'Date & Time', dataIndex: 'date', key: 'date' },
        { title: 'Buyer', dataIndex: 'buyer', key: 'buyer' },
        { title: 'Farmer', dataIndex: 'farmer', key: 'farmer' },
        { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amt) => <Text strong style={{ color: '#13ec13' }}>{amt}</Text> },
        { title: 'Platform Fee (5%)', dataIndex: 'fee', key: 'fee' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'Completed' ? 'success' : 'processing'}>{status}</Tag> },
        { title: 'Invoice', key: 'invoice', render: () => <Button type="text" icon={<FileTextOutlined />} /> }
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
                <div className="admin-profile-section"><div className="admin-profile-card"><Avatar size={40} icon={<UserOutlined />} />{!collapsed && <div className="admin-info"><Text strong style={{ color: 'white', fontSize: '14px' }}>Admin User</Text><Tag color="purple" style={{ fontSize: '10px', padding: '0 6px' }}>SUPER ADMIN</Tag></div>}</div></div>
            </Sider>

            <Layout>
                <Header className="admin-header">
                    <div className="admin-header-left"><Title level={3} style={{ margin: 0 }}>Financial Transactions</Title></div>
                    <div className="admin-header-right">
                        <Button icon={<DownloadOutlined />}>Export CSV</Button>
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer', background: '#722ed1' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="admin-content">
                    <Row gutter={24} style={{ marginBottom: '24px' }}>
                        <Col span={8}><Card className="kpi-card"><Statistic title="Today's Revenue" value={todayRevenue} prefix="₹" precision={2} /></Card></Col>
                        <Col span={8}><Card className="kpi-card"><Statistic title="Total Platform Fees" value={totalFees} prefix="₹" valueStyle={{ color: '#722ed1' }} /></Card></Col>
                        <Col span={8}><Card className="kpi-card"><Statistic title="Active Settlements" value={activeSettlements} suffix={<ArrowUpOutlined />} /></Card></Col>
                    </Row>
                    <Card title="Recent Transactions" className="verification-card">
                        <Table columns={columns} dataSource={transactionData} pagination={false} />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Transactions;
