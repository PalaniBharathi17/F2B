import React, { useEffect, useMemo, useState } from 'react';
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
import { getFarmerAnalytics, getFarmerNotifications, getFarmerOrders } from '../../api/orders';
import { getMyListings } from '../../api/products';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const FarmerDashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [recentOrders, setRecentOrders] = useState([]);
    const [listings, setListings] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [ordersData, listingsData, analyticsData, notificationsData] = await Promise.all([
                    getFarmerOrders(),
                    getMyListings(),
                    getFarmerAnalytics(),
                    getFarmerNotifications(),
                ]);

                const orders = ordersData?.orders || [];
                const products = listingsData?.products || [];

                setRecentOrders(orders);
                setListings(products);
                setAnalytics(analyticsData?.summary || null);
                setNotifications(notificationsData?.items || []);

                const low = products
                    .filter((p) => Number(p.quantity || 0) > 0 && Number(p.quantity || 0) <= 5)
                    .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0))
                    .slice(0, 4)
                    .map((p) => ({
                        id: p.id,
                        name: p.crop_name,
                        qty: Number(p.quantity || 0),
                        unit: p.unit || 'unit'
                    }));
                setLowStockItems(low);
            } catch {
                setRecentOrders([]);
                setListings([]);
                setAnalytics(null);
                setNotifications([]);
                setLowStockItems([]);
            }
        };

        loadDashboardData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const tableData = useMemo(() => (
        recentOrders
            .filter((order) => {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                const crop = order?.product?.crop_name?.toLowerCase() || '';
                const buyer = order?.buyer?.name?.toLowerCase() || '';
                return crop.includes(q) || buyer.includes(q) || String(order.id).includes(q);
            })
            .slice(0, 8)
            .map((order) => ({
                key: order.id,
                date: new Date(order.created_at).toLocaleDateString(),
                item: order?.product?.crop_name || 'Produce',
                buyer: order?.buyer?.name || 'Buyer',
                amount: `INR ${Number(order.total_price || 0).toFixed(2)}`,
                status: order.status,
                image: order?.product?.image_url ? `http://localhost:8080${order.product.image_url}` : undefined,
            }))
    ), [recentOrders, searchQuery]);

    const totalSales = analytics?.this_month_revenue
        || recentOrders
            .filter((order) => order.status === 'completed')
            .reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const activeListings = listings.filter((p) => p.status === 'active').length;
    const pendingOrders = recentOrders.filter((order) => order.status === 'pending').length;
    const completionRate = analytics?.completion_rate || 0;
    const pendingTrend = recentOrders.length ? Math.round((pendingOrders / recentOrders.length) * 100) : 0;
    const topProduct = analytics?.top_products?.[0]?.product_name || 'No sales data yet';

    const columns = [
        { title: 'Date', dataIndex: 'date', key: 'date' },
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
        { title: 'Buyer', dataIndex: 'buyer', key: 'buyer' },
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
                    completed: { color: 'success', text: 'Completed' },
                    out_for_delivery: { color: 'geekblue', text: 'Out For Delivery' },
                    packed: { color: 'cyan', text: 'Packed' },
                    confirmed: { color: 'processing', text: 'Confirmed' },
                    pending: { color: 'warning', text: 'Pending' },
                    cancelled: { color: 'error', text: 'Cancelled' },
                };
                const config = statusConfig[status] || { color: 'default', text: status };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: () => <Button type="text" icon={<MoreOutlined />} aria-label="More actions" />,
        },
    ];

    const notificationMenuItems = notifications.length
        ? notifications.slice(0, 8).map((item) => ({
            key: item.id,
            label: (
                <div style={{ maxWidth: 320 }}>
                    <Text strong>{item.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>{item.message}</Text>
                </div>
            ),
        }))
        : [{ key: 'empty', label: <Text type="secondary">No new notifications</Text>, disabled: true }];

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => navigate('/farmer/dashboard') },
        { key: 'add-produce', icon: <PlusOutlined />, label: 'Add Produce', onClick: () => navigate('/farmer/add-produce') },
        { key: 'my-listings', icon: <UnorderedListOutlined />, label: 'My Listings', onClick: () => navigate('/farmer/listings') },
        { key: 'orders', icon: <ShoppingOutlined />, label: 'Orders', onClick: () => navigate('/farmer/orders') },
    ];

    return (
        <Layout className="farmer-dashboard-layout">
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} className="dashboard-sider" width={260}>
                <div className="logo-section">
                    <div className="logo-icon"><ShoppingOutlined /></div>
                    {!collapsed && (
                        <div>
                            <Title level={5} style={{ margin: 0, color: 'white' }}>AgriMarket</Title>
                            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Farmer Portal</Text>
                        </div>
                    )}
                </div>

                <Menu theme="dark" selectedKeys={['dashboard']} mode="inline" items={menuItems} className="sidebar-menu" />

                <div className="user-profile-section">
                    <div className="user-profile-card">
                        <Avatar size={40} icon={<UserOutlined />} src="https://i.pravatar.cc/150?img=12" />
                        {!collapsed && (
                            <div className="user-info">
                                <Text strong style={{ color: 'white', fontSize: '14px' }}>{user?.name || 'Farmer'}</Text>
                                <Tag color="success" style={{ fontSize: '10px', padding: '0 6px' }}>PRO SELLER</Tag>
                            </div>
                        )}
                    </div>
                </div>
            </Sider>

            <Layout>
                <Header className="dashboard-header">
                    <div className="header-left">
                        <Title level={3} style={{ margin: 0 }}>Dashboard Summary</Title>
                    </div>
                    <div className="header-right">
                        <Input
                            placeholder="Search orders..."
                            prefix={<SearchOutlined />}
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Dropdown menu={{ items: notificationMenuItems }} trigger={['click']}>
                            <Badge count={notifications.length || pendingOrders} offset={[-5, 5]}>
                                <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} aria-label="Notifications" />
                            </Badge>
                        </Dropdown>
                        <Button type="primary" icon={<PlusOutlined />} className="add-produce-btn" onClick={() => navigate('/farmer/add-produce')}>
                            Add New Produce
                        </Button>
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" src="https://i.pravatar.cc/150?img=12" style={{ cursor: 'pointer' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="dashboard-content">
                    <div className="welcome-section">
                        <Title level={2}>Welcome back, {user?.name || 'Farmer'}!</Title>
                        <Paragraph type="secondary">Here is what is happening with your farm today.</Paragraph>
                    </div>

                    <Row gutter={[24, 24]} className="stats-row">
                        <Col xs={24} sm={12} lg={8}>
                            <Card className="stat-card stat-card-primary">
                                <div className="stat-header">
                                    <div className="stat-icon stat-icon-primary"><ShoppingOutlined /></div>
                                    <Tag color="success" className="stat-tag"><ArrowUpOutlined /> {Math.round(completionRate)}%</Tag>
                                </div>
                                <Paragraph className="stat-label">This Month Revenue</Paragraph>
                                <Title level={2} className="stat-value">INR {totalSales.toFixed(2)}</Title>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <Card className="stat-card">
                                <div className="stat-header">
                                    <div className="stat-icon stat-icon-blue"><UnorderedListOutlined /></div>
                                    <Tag className="stat-tag-neutral">{activeListings > 0 ? 'Live' : 'No Listings'}</Tag>
                                </div>
                                <Paragraph className="stat-label">Active Listings</Paragraph>
                                <Title level={2} className="stat-value">{activeListings}</Title>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <Card className="stat-card">
                                <div className="stat-header">
                                    <div className="stat-icon stat-icon-orange"><ShoppingOutlined /></div>
                                    <Tag color="error" className="stat-tag"><ArrowDownOutlined /> {pendingTrend}%</Tag>
                                </div>
                                <Paragraph className="stat-label">Pending Orders</Paragraph>
                                <Title level={2} className="stat-value">{pendingOrders}</Title>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="activity-card" title="Recent Activity" extra={<Button type="link" onClick={() => navigate('/farmer/orders')}>View All</Button>}>
                        <Table columns={columns} dataSource={tableData} pagination={false} className="activity-table" />
                    </Card>

                    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                        <Col xs={24} lg={12}>
                            <Card title="Inventory Low Stock" className="low-stock-card">
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    {lowStockItems.map((item) => (
                                        <div className="stock-item" key={item.id}>
                                            <div className="stock-info">
                                                <div className="stock-icon"><WarningOutlined /></div>
                                                <div>
                                                    <Text strong>{item.name}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>{item.qty} {item.unit} remaining</Text>
                                                </div>
                                            </div>
                                            <Button type="link" className="restock-btn" onClick={() => navigate('/farmer/add-produce')}>Restock</Button>
                                        </div>
                                    ))}
                                    {lowStockItems.length === 0 && <Text type="secondary">No low stock items from current listings.</Text>}
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card className="insights-card">
                                <div className="insights-content">
                                    <TrophyOutlined style={{ fontSize: '48px', color: '#13ec13', marginBottom: '16px' }} />
                                    <Title level={4}>Top product: {topProduct}</Title>
                                    <Paragraph>
                                        Completion rate: {completionRate.toFixed(1)}%.
                                        Average order value: INR {Number(analytics?.average_order_value || 0).toFixed(2)}.
                                    </Paragraph>
                                    <Button type="primary" style={{ marginTop: '16px' }} onClick={() => navigate('/farmer/orders')}>Explore Insights</Button>
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
