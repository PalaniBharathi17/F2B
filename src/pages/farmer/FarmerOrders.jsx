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
    Input,
    Badge,
    Dropdown,
    Row,
    Col,
    Statistic,
    Tabs,
    message,
    Modal,
    Form,
    Select,
} from 'antd';
import {
    DashboardOutlined,
    PlusOutlined,
    UnorderedListOutlined,
    ShoppingOutlined,
    UserOutlined,
    BellOutlined,
    LogoutOutlined,
    SearchOutlined,
    MoreOutlined,
    ArrowUpOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getFarmerOrders,
    getFarmerPayoutSummary,
    getFarmerInvoice,
    updateOrderStatus,
} from '../../api/orders';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const FarmerOrders = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelTargetOrderId, setCancelTargetOrderId] = useState(null);
    const [cancelSubmitting, setCancelSubmitting] = useState(false);
    const [payoutSummary, setPayoutSummary] = useState({
        completed_orders: 0,
        pending_settlement: 0,
        total_gross: 0,
        platform_fee: 0,
        net_payout: 0,
        currency: 'INR',
    });
    const [cancelForm] = Form.useForm();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await getFarmerOrders();
            setOrdersData(data?.orders || []);
        } catch {
            setOrdersData([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPayoutSummary = async () => {
        setSummaryLoading(true);
        try {
            const data = await getFarmerPayoutSummary();
            setPayoutSummary(data?.summary || payoutSummary);
        } catch {
            setPayoutSummary({
                completed_orders: 0,
                pending_settlement: 0,
                total_gross: 0,
                platform_fee: 0,
                net_payout: 0,
                currency: 'INR',
            });
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        loadPayoutSummary();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const tableData = useMemo(() => (
        ordersData
            .filter((order) => {
                if (activeTab === 'pending') return order.status === 'pending';
                if (activeTab === 'confirmed') return order.status === 'confirmed';
                if (activeTab === 'packed') return order.status === 'packed';
                if (activeTab === 'out_for_delivery') return order.status === 'out_for_delivery';
                if (activeTab === 'completed') return order.status === 'completed';
                if (activeTab === 'cancelled') return order.status === 'cancelled';
                return true;
            })
            .filter((order) => {
                const q = query.trim().toLowerCase();
                if (!q) return true;
                return (
                    String(order.id).includes(q)
                    || (order?.buyer?.name || '').toLowerCase().includes(q)
                    || (order?.product?.crop_name || '').toLowerCase().includes(q)
                );
            })
            .map((order) => ({
                key: order.id,
                orderId: `#ORD-${order.id}`,
                date: new Date(order.created_at).toLocaleDateString(),
                createdAt: order.created_at,
                buyer: order?.buyer?.name || 'Buyer',
                items: `${order.quantity} ${order?.product?.unit || 'unit'} ${order?.product?.crop_name || 'Produce'}`,
                amount: `INR ${Number(order.total_price || 0).toFixed(2)}`,
                amountValue: Number(order.total_price || 0),
                status: order.status,
                ageHours: Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60)),
            }))
            .sort((a, b) => {
                if (sortBy === 'amount_asc') return a.amountValue - b.amountValue;
                if (sortBy === 'amount_desc') return b.amountValue - a.amountValue;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
    ), [ordersData, activeTab, query, sortBy]);

    const getActionsForStatus = (status) => {
        if (status === 'pending') {
            return [
                { key: 'confirmed', label: 'Confirm Order' },
                { key: 'cancelled', label: 'Cancel Order' },
            ];
        }
        if (status === 'confirmed') {
            return [
                { key: 'packed', label: 'Mark Packed' },
                { key: 'cancelled', label: 'Cancel Order' },
            ];
        }
        if (status === 'packed') {
            return [
                { key: 'out_for_delivery', label: 'Out For Delivery' },
                { key: 'cancelled', label: 'Cancel Order' },
            ];
        }
        if (status === 'out_for_delivery') {
            return [
                { key: 'completed', label: 'Mark Completed' },
                { key: 'cancelled', label: 'Cancel Order' },
            ];
        }
        return [];
    };

    const handleOrderAction = async (orderId, nextStatus) => {
        if (nextStatus === 'cancelled') {
            setCancelTargetOrderId(orderId);
            setCancelModalOpen(true);
            return;
        }
        try {
            await updateOrderStatus(orderId, nextStatus);
            message.success('Order updated successfully');
            await Promise.all([loadOrders(), loadPayoutSummary()]);
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update order');
        }
    };

    const handleConfirmCancel = async () => {
        try {
            const values = await cancelForm.validateFields();
            setCancelSubmitting(true);
            await updateOrderStatus(cancelTargetOrderId, 'cancelled', values.reason || '');
            message.success('Order cancelled successfully');
            setCancelModalOpen(false);
            cancelForm.resetFields();
            setCancelTargetOrderId(null);
            await Promise.all([loadOrders(), loadPayoutSummary()]);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.error || 'Failed to cancel order');
        } finally {
            setCancelSubmitting(false);
        }
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            const data = await getFarmerInvoice(orderId);
            const invoice = data?.invoice;
            if (!invoice) {
                message.error('Invoice not available');
                return;
            }
            const content = [
                `Invoice for Order #${invoice.order_id}`,
                `Status: ${invoice.status}`,
                `Product: ${invoice.product_name}`,
                `Buyer: ${invoice.buyer_name}`,
                `Quantity: ${invoice.quantity} ${invoice.unit}`,
                `Unit Price: ${invoice.currency} ${Number(invoice.unit_price || 0).toFixed(2)}`,
                `Gross Amount: ${invoice.currency} ${Number(invoice.gross_amount || 0).toFixed(2)}`,
                `Platform Fee: ${invoice.currency} ${Number(invoice.platform_fee || 0).toFixed(2)}`,
                `Net Payout: ${invoice.currency} ${Number(invoice.net_payout || 0).toFixed(2)}`,
                `Created At: ${invoice.created_at}`,
                invoice.completed_at ? `Completed At: ${invoice.completed_at}` : '',
                invoice.cancellation_reason ? `Cancellation Reason: ${invoice.cancellation_reason}` : '',
            ].filter(Boolean).join('\n');

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-order-${orderId}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to download invoice');
        }
    };

    const activeOrders = ordersData.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;
    const overdueOrders = ordersData.filter((o) => {
        const ageHours = Math.floor((Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60));
        if (o.status === 'pending') return ageHours >= 24;
        if (o.status === 'confirmed' || o.status === 'packed') return ageHours >= 48;
        if (o.status === 'out_for_delivery') return ageHours >= 72;
        return false;
    }).length;
    const totalRevenue = ordersData
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const completedCount = ordersData.filter((o) => o.status === 'completed').length;
    const orderGrowth = ordersData.length ? Math.round((completedCount / ordersData.length) * 100) : 0;

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            key: 'orderId',
            render: (text) => <Text strong style={{ color: '#13ec13' }}>{text}</Text>,
        },
        { title: 'Date', dataIndex: 'date', key: 'date' },
        { title: 'Buyer', dataIndex: 'buyer', key: 'buyer' },
        { title: 'Items', dataIndex: 'items', key: 'items' },
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
            render: (status, record) => {
                const statusConfig = {
                    completed: { color: 'success', text: 'Completed' },
                    out_for_delivery: { color: 'geekblue', text: 'Out For Delivery' },
                    packed: { color: 'cyan', text: 'Packed' },
                    confirmed: { color: 'processing', text: 'Confirmed' },
                    pending: { color: 'warning', text: 'Pending' },
                    cancelled: { color: 'error', text: 'Cancelled' },
                };
                const config = statusConfig[status] || { color: 'default', text: status };
                const isOverdue = (
                    (status === 'pending' && record.ageHours >= 24)
                    || ((status === 'confirmed' || status === 'packed') && record.ageHours >= 48)
                    || (status === 'out_for_delivery' && record.ageHours >= 72)
                );
                return (
                    <Space>
                        <Tag color={config.color}>{config.text}</Tag>
                        {isOverdue ? <Tag color="error">OVERDUE</Tag> : null}
                    </Space>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const actions = getActionsForStatus(record.status);
                return (
                    <Space>
                        <Button
                            type="text"
                            icon={<FileTextOutlined />}
                            onClick={() => handleDownloadInvoice(record.key)}
                            title="Download invoice"
                        />
                        {actions.length ? (
                            <Dropdown
                                menu={{
                                    items: actions.map((action) => ({
                                        key: action.key,
                                        label: action.label,
                                        onClick: () => handleOrderAction(record.key, action.key),
                                    })),
                                }}
                            >
                                <Button type="text" icon={<MoreOutlined />} />
                            </Dropdown>
                        ) : (
                            <Button type="text" icon={<MoreOutlined />} disabled />
                        )}
                    </Space>
                );
            },
        },
    ];

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
                <Menu theme="dark" selectedKeys={['orders']} mode="inline" items={menuItems} className="sidebar-menu" />
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
                        <Title level={3} style={{ margin: 0 }}>Order Management</Title>
                    </div>
                    <div className="header-right">
                        <Input
                            placeholder="Search orders..."
                            prefix={<SearchOutlined />}
                            className="search-input"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Select
                            value={sortBy}
                            onChange={setSortBy}
                            style={{ width: 170 }}
                            options={[
                                { value: 'latest', label: 'Newest First' },
                                { value: 'amount_desc', label: 'Amount High-Low' },
                                { value: 'amount_asc', label: 'Amount Low-High' },
                            ]}
                        />
                        <Badge count={ordersData.filter((o) => o.status === 'pending').length} offset={[-5, 5]}>
                            <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} aria-label="Notifications" />
                        </Badge>
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" src="https://i.pravatar.cc/150?img=12" style={{ cursor: 'pointer' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="dashboard-content">
                    <Row gutter={[24, 24]} className="stats-row">
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stat-card">
                                <Statistic title="Active Orders" value={activeOrders} prefix={<ShoppingOutlined style={{ color: '#faad14', marginRight: '8px' }} />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stat-card">
                                <Statistic title="Total Revenue" value={Number(totalRevenue.toFixed(2))} prefix="INR " valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stat-card">
                                <Statistic title="Order Growth" value={orderGrowth} suffix="%" prefix={<ArrowUpOutlined />} valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stat-card" loading={summaryLoading}>
                                <Statistic title="Net Payout" value={Number((payoutSummary?.net_payout || 0).toFixed(2))} prefix="INR " valueStyle={{ color: '#13ec13' }} />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Pending settlements: {payoutSummary?.pending_settlement || 0}
                                </Text>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="activity-card">
                        <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                            Overdue orders: {overdueOrders}
                        </Text>
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={[
                                { key: 'all', label: 'All Orders' },
                                { key: 'pending', label: 'Pending' },
                                { key: 'confirmed', label: 'Confirmed' },
                                { key: 'packed', label: 'Packed' },
                                { key: 'out_for_delivery', label: 'Out For Delivery' },
                                { key: 'completed', label: 'Completed' },
                                { key: 'cancelled', label: 'Cancelled' },
                            ]}
                        />
                        <Table columns={columns} dataSource={tableData} className="activity-table" loading={loading} />
                    </Card>
                </Content>
            </Layout>

            <Modal
                title="Cancel Order"
                open={cancelModalOpen}
                onCancel={() => {
                    setCancelModalOpen(false);
                    setCancelTargetOrderId(null);
                    cancelForm.resetFields();
                }}
                onOk={handleConfirmCancel}
                confirmLoading={cancelSubmitting}
                okText="Confirm Cancel"
            >
                <Form form={cancelForm} layout="vertical">
                    <Form.Item
                        label="Cancellation Reason"
                        name="reason"
                        rules={[{ required: true, message: 'Please provide a reason' }]}
                    >
                        <Input.TextArea rows={3} placeholder="Reason for cancellation" />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default FarmerOrders;
