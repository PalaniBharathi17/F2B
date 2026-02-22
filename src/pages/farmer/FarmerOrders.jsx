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
    DatePicker,
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
    getFarmerDisputes,
    updateOrderStatus,
    updateOrderStatusDetailed,
    getFarmerReviews,
    getOrderStatusHistory,
    openDispute,
    resolveDispute,
    rejectDispute,
    getFarmerWeeklySummary,
    getFarmerMonthlySummary,
    exportFarmerReport,
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
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [scheduleTargetOrderId, setScheduleTargetOrderId] = useState(null);
    const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [actionOrderId, setActionOrderId] = useState(null);
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [disputeAction, setDisputeAction] = useState('');
    const [disputeTargetOrderId, setDisputeTargetOrderId] = useState(null);
    const [disputeSubmitting, setDisputeSubmitting] = useState(false);
    const [reviewItems, setReviewItems] = useState([]);
    const [disputeItems, setDisputeItems] = useState([]);
    const [weeklySummary, setWeeklySummary] = useState(null);
    const [monthlySummary, setMonthlySummary] = useState(null);
    const [exportingType, setExportingType] = useState('');
    const [payoutSummary, setPayoutSummary] = useState({
        completed_orders: 0,
        pending_settlement: 0,
        total_gross: 0,
        platform_fee: 0,
        net_payout: 0,
        currency: 'INR',
    });
    const [cancelForm] = Form.useForm();
    const [scheduleForm] = Form.useForm();
    const [disputeForm] = Form.useForm();
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

    const loadReviewsAndDisputes = async () => {
        try {
            const [reviewsData, disputesData] = await Promise.all([
                getFarmerReviews({ page: 1, limit: 5 }),
                getFarmerDisputes({ page: 1, limit: 5 }),
            ]);
            setReviewItems(reviewsData?.items || []);
            setDisputeItems(disputesData?.orders || []);
        } catch {
            setReviewItems([]);
            setDisputeItems([]);
        }
    };

    const loadPeriodSummaries = async () => {
        try {
            const [weeklyData, monthlyData] = await Promise.all([
                getFarmerWeeklySummary(),
                getFarmerMonthlySummary(),
            ]);
            setWeeklySummary(weeklyData?.summary || null);
            setMonthlySummary(monthlyData?.summary || null);
        } catch {
            setWeeklySummary(null);
            setMonthlySummary(null);
        }
    };

    useEffect(() => {
        loadOrders();
        loadPayoutSummary();
        loadReviewsAndDisputes();
        loadPeriodSummaries();
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
                deliveryDate: order.delivery_date,
                deliverySlot: order.delivery_slot,
                disputeStatus: order.dispute_status || 'none',
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
                { key: 'schedule_confirm', label: 'Schedule + Confirm' },
                { key: 'confirmed', label: 'Confirm Order Only' },
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
        if (actionOrderId === orderId) return;
        if (nextStatus === 'schedule_confirm') {
            handleOpenSchedule(orderId);
            return;
        }
        if (nextStatus === 'cancelled') {
            setCancelTargetOrderId(orderId);
            setCancelModalOpen(true);
            return;
        }
        try {
            setActionOrderId(orderId);
            await updateOrderStatus(orderId, nextStatus);
            message.success('Order updated successfully');
            await Promise.all([loadOrders(), loadPayoutSummary()]);
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update order');
        } finally {
            setActionOrderId(null);
        }
    };

    const handleConfirmCancel = async () => {
        try {
            const values = await cancelForm.validateFields();
            setCancelSubmitting(true);
            await updateOrderStatusDetailed(cancelTargetOrderId, {
                status: 'cancelled',
                cancellation_reason: values.reason || '',
                cancellation_type: values.category || '',
                cancellation_note: values.note || '',
            });
            message.success('Order cancelled successfully');
            setCancelModalOpen(false);
            cancelForm.resetFields();
            setCancelTargetOrderId(null);
            await Promise.all([loadOrders(), loadPayoutSummary(), loadReviewsAndDisputes()]);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.error || 'Failed to cancel order');
        } finally {
            setCancelSubmitting(false);
        }
    };

    const handleOpenSchedule = (orderId) => {
        setScheduleTargetOrderId(orderId);
        setScheduleModalOpen(true);
    };

    const handleSaveSchedule = async () => {
        try {
            const values = await scheduleForm.validateFields();
            setScheduleSubmitting(true);
            setActionOrderId(scheduleTargetOrderId);
            await updateOrderStatusDetailed(scheduleTargetOrderId, {
                status: 'confirmed',
                delivery_slot: values.deliverySlot,
                delivery_date: values.deliveryDate?.toISOString(),
            });
            message.success('Delivery schedule saved');
            setScheduleModalOpen(false);
            setScheduleTargetOrderId(null);
            scheduleForm.resetFields();
            await loadOrders();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.error || 'Failed to save schedule');
        } finally {
            setScheduleSubmitting(false);
            setActionOrderId(null);
        }
    };

    const handleViewHistory = async (orderId) => {
        try {
            setHistoryModalOpen(true);
            setHistoryLoading(true);
            const data = await getOrderStatusHistory(orderId, { page: 1, limit: 50 });
            setHistoryItems(data?.logs || []);
        } catch {
            setHistoryItems([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const openDisputeModal = (orderId, action) => {
        setDisputeTargetOrderId(orderId);
        setDisputeAction(action);
        disputeForm.resetFields();
        setDisputeModalOpen(true);
    };

    const handleSubmitDisputeAction = async () => {
        try {
            const values = await disputeForm.validateFields();
            setDisputeSubmitting(true);
            setActionOrderId(disputeTargetOrderId);
            if (disputeAction === 'open') {
                await openDispute(disputeTargetOrderId, values.note || '');
            } else if (disputeAction === 'resolve') {
                await resolveDispute(disputeTargetOrderId, values.note || '');
            } else if (disputeAction === 'reject') {
                await rejectDispute(disputeTargetOrderId, values.note || '');
            }
            message.success(`Dispute ${disputeAction}d successfully`);
            setDisputeModalOpen(false);
            setDisputeTargetOrderId(null);
            setDisputeAction('');
            disputeForm.resetFields();
            await Promise.all([loadOrders(), loadReviewsAndDisputes()]);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.error || 'Failed to update dispute');
        } finally {
            setDisputeSubmitting(false);
            setActionOrderId(null);
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

    const handleExportReport = async (type) => {
        try {
            setExportingType(type);
            const response = await exportFarmerReport(type);
            const disposition = response.headers?.['content-disposition'] || '';
            const match = disposition.match(/filename="?([^"]+)"?/i);
            const filename = match?.[1] || `farmer_${type}_report.csv`;
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            message.success('Report exported');
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to export report');
        } finally {
            setExportingType('');
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
            title: 'Delivery',
            key: 'delivery',
            render: (_, record) => {
                if (!record.deliveryDate && !record.deliverySlot) return <Text type="secondary">-</Text>;
                return (
                    <Text>
                        {record.deliveryDate ? new Date(record.deliveryDate).toLocaleDateString() : '-'}
                        {record.deliverySlot ? ` (${record.deliverySlot})` : ''}
                    </Text>
                );
            },
        },
        {
            title: 'Dispute',
            dataIndex: 'disputeStatus',
            key: 'disputeStatus',
            render: (value) => {
                if (!value || value === 'none') return <Tag>NONE</Tag>;
                const color = value === 'open' ? 'error' : (value === 'resolved' ? 'success' : 'default');
                return <Tag color={color}>{String(value).toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const actions = getActionsForStatus(record.status);
                return (
                    <Space>
                        <Button type="text" onClick={() => handleViewHistory(record.key)} title="View status history">History</Button>
                        {record.status === 'completed' && record.disputeStatus === 'none' ? (
                            <Button
                                type="text"
                                loading={actionOrderId === record.key}
                                onClick={() => openDisputeModal(record.key, 'open')}
                                title="Raise dispute"
                            >
                                Dispute
                            </Button>
                        ) : null}
                        {record.disputeStatus === 'open' ? (
                            <>
                                <Button
                                    type="text"
                                    loading={actionOrderId === record.key}
                                    onClick={() => openDisputeModal(record.key, 'resolve')}
                                    title="Resolve dispute"
                                >
                                    Resolve
                                </Button>
                                <Button
                                    type="text"
                                    loading={actionOrderId === record.key}
                                    onClick={() => openDisputeModal(record.key, 'reject')}
                                    title="Reject dispute"
                                >
                                    Reject
                                </Button>
                            </>
                        ) : null}
                        <Button
                            type="text"
                            icon={<FileTextOutlined />}
                            onClick={() => handleDownloadInvoice(record.key)}
                            title="Download invoice"
                            disabled={actionOrderId === record.key}
                        />
                        {actions.length ? (
                            <Dropdown
                                menu={{
                                    items: actions.map((action) => ({
                                        key: action.key,
                                        label: action.label,
                                        disabled: actionOrderId === record.key,
                                        onClick: () => handleOrderAction(record.key, action.key),
                                    })),
                                }}
                            >
                                <Button type="text" icon={<MoreOutlined />} loading={actionOrderId === record.key} />
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
                        <Row gutter={[16, 16]} style={{ marginBottom: '12px' }}>
                            <Col xs={24} md={12}>
                                <Card size="small" title="Weekly Summary">
                                    <Text type="secondary">
                                        Orders: {weeklySummary?.orders_count || 0}
                                    </Text>
                                    <br />
                                    <Text type="secondary">
                                        Net Payout: INR {Number(weeklySummary?.net_payout || 0).toFixed(2)}
                                    </Text>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card size="small" title="Monthly Summary">
                                    <Text type="secondary">
                                        Orders: {monthlySummary?.orders_count || 0}
                                    </Text>
                                    <br />
                                    <Text type="secondary">
                                        Net Payout: INR {Number(monthlySummary?.net_payout || 0).toFixed(2)}
                                    </Text>
                                </Card>
                            </Col>
                        </Row>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                            Overdue orders: {overdueOrders}
                        </Text>
                        <Space style={{ marginBottom: '12px' }}>
                            <Button
                                onClick={() => handleExportReport('orders')}
                                loading={exportingType === 'orders'}
                            >
                                Export Orders CSV
                            </Button>
                            <Button
                                onClick={() => handleExportReport('payouts')}
                                loading={exportingType === 'payouts'}
                            >
                                Export Payouts CSV
                            </Button>
                            <Button
                                onClick={() => handleExportReport('disputes')}
                                loading={exportingType === 'disputes'}
                            >
                                Export Disputes CSV
                            </Button>
                        </Space>
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
                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                            <Col xs={24} lg={12}>
                                <Card size="small" title="Recent Reviews">
                                    <Table
                                        size="small"
                                        pagination={false}
                                        dataSource={reviewItems.slice(0, 5).map((item) => ({
                                            key: item.review_id,
                                            product: item.product_name,
                                            reviewer: item.reviewer,
                                            rating: item.rating,
                                        }))}
                                        columns={[
                                            { title: 'Product', dataIndex: 'product', key: 'product' },
                                            { title: 'Reviewer', dataIndex: 'reviewer', key: 'reviewer' },
                                            { title: 'Rating', dataIndex: 'rating', key: 'rating' },
                                        ]}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} lg={12}>
                                <Card size="small" title="Dispute Tracker">
                                    <Table
                                        size="small"
                                        pagination={false}
                                        dataSource={disputeItems.slice(0, 5).map((item) => ({
                                            key: item.order_id,
                                            order: `#ORD-${item.order_id}`,
                                            product: item.product_name || 'Produce',
                                            status: item.dispute_status || 'none',
                                        }))}
                                        columns={[
                                            { title: 'Order', dataIndex: 'order', key: 'order' },
                                            { title: 'Product', dataIndex: 'product', key: 'product' },
                                            { title: 'Dispute', dataIndex: 'status', key: 'status' },
                                        ]}
                                    />
                                </Card>
                            </Col>
                        </Row>
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
                    <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Please select category' }]}>
                        <Select
                            options={[
                                { value: 'buyer_request', label: 'Buyer Request' },
                                { value: 'stock_issue', label: 'Stock Issue' },
                                { value: 'logistics_issue', label: 'Logistics Issue' },
                                { value: 'quality_issue', label: 'Quality Issue' },
                                { value: 'other', label: 'Other' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Cancellation Reason"
                        name="reason"
                        rules={[
                            { required: true, message: 'Please provide a reason' },
                            { min: 5, message: 'Enter at least 5 characters' },
                        ]}
                    >
                        <Input.TextArea rows={3} placeholder="Reason for cancellation" />
                    </Form.Item>
                    <Form.Item label="Internal Note" name="note" rules={[{ max: 300, message: 'Maximum 300 characters' }]}>
                        <Input.TextArea rows={2} placeholder="Optional note for audit" />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Schedule Delivery"
                open={scheduleModalOpen}
                onCancel={() => {
                    setScheduleModalOpen(false);
                    setScheduleTargetOrderId(null);
                    scheduleForm.resetFields();
                }}
                onOk={handleSaveSchedule}
                confirmLoading={scheduleSubmitting}
                okText="Save Schedule"
            >
                <Form form={scheduleForm} layout="vertical">
                    <Form.Item
                        label="Delivery Date"
                        name="deliveryDate"
                        rules={[{ required: true, message: 'Select delivery date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            disabledDate={(current) => current && current < new Date().setHours(0, 0, 0, 0)}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Delivery Slot"
                        name="deliverySlot"
                        rules={[{ required: true, message: 'Select delivery slot' }]}
                    >
                        <Select
                            options={[
                                { value: '06:00-09:00', label: '06:00-09:00' },
                                { value: '09:00-12:00', label: '09:00-12:00' },
                                { value: '12:00-15:00', label: '12:00-15:00' },
                                { value: '15:00-18:00', label: '15:00-18:00' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal title="Order Status History" open={historyModalOpen} onCancel={() => setHistoryModalOpen(false)} footer={null}>
                <Table
                    loading={historyLoading}
                    pagination={false}
                    dataSource={historyItems.map((item) => ({
                        key: item.id,
                        when: new Date(item.created_at).toLocaleString(),
                        from: item.from_status,
                        to: item.to_status,
                        event: item.reason || '-',
                        category: item.category || '-',
                        note: item.note || item.reason || '-',
                    }))}
                    columns={[
                        { title: 'When', dataIndex: 'when', key: 'when' },
                        { title: 'From', dataIndex: 'from', key: 'from' },
                        { title: 'To', dataIndex: 'to', key: 'to' },
                        { title: 'Event', dataIndex: 'event', key: 'event' },
                        { title: 'Category', dataIndex: 'category', key: 'category' },
                        { title: 'Note', dataIndex: 'note', key: 'note' },
                    ]}
                />
            </Modal>
            <Modal
                title={disputeAction === 'open' ? 'Open Dispute' : disputeAction === 'resolve' ? 'Resolve Dispute' : 'Reject Dispute'}
                open={disputeModalOpen}
                onCancel={() => {
                    setDisputeModalOpen(false);
                    setDisputeTargetOrderId(null);
                    setDisputeAction('');
                    disputeForm.resetFields();
                }}
                onOk={handleSubmitDisputeAction}
                confirmLoading={disputeSubmitting}
                okText="Submit"
            >
                <Form form={disputeForm} layout="vertical">
                    <Form.Item
                        label="Reason"
                        name="note"
                        rules={[
                            { required: true, message: 'Reason is required' },
                            { min: 5, message: 'Enter at least 5 characters' },
                            { max: 300, message: 'Maximum 300 characters' },
                        ]}
                    >
                        <Input.TextArea rows={3} placeholder="Enter reason" />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default FarmerOrders;
