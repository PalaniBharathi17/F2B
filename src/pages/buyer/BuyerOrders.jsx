import React, { useEffect, useMemo, useState } from 'react';
import {
    Layout,
    Card,
    Button,
    Input,
    Tag,
    Badge,
    Avatar,
    Space,
    Typography,
    Dropdown,
    Table,
    Modal,
    Form,
    message,
    Rate,
} from 'antd';
import {
    SearchOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    ShopOutlined,
    EyeOutlined,
    FileTextOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getBuyerOrders,
    getBuyerReviews,
    getBuyerNotifications,
    submitBuyerReview,
    cancelOrder,
    getOrderStatusHistory,
} from '../../api/orders';
import { getCart } from '../../api/cart';
import { getApiErrorMessage } from '../../utils/apiError';
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const isBuyerCancellable = (status) => ['pending', 'confirmed', 'packed', 'out_for_delivery'].includes(status);

const BuyerOrders = () => {
    const [orderHistory, setOrderHistory] = useState([]);
    const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewTargetOrderId, setReviewTargetOrderId] = useState(null);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [actionOrderId, setActionOrderId] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailOrder, setDetailOrder] = useState(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const loadData = async () => {
        setLoading(true);
        const [ordersRes, reviewsRes, cartRes, notificationsRes] = await Promise.allSettled([
            getBuyerOrders(),
            getBuyerReviews({ page: 1, limit: 100 }),
            getCart(),
            getBuyerNotifications(),
        ]);

        if (ordersRes.status === 'fulfilled') {
            setOrderHistory(ordersRes.value?.orders || []);
        } else {
            setOrderHistory([]);
            message.error('Failed to load orders');
        }

        if (reviewsRes.status === 'fulfilled') {
            setReviewedOrderIds(new Set((reviewsRes.value?.items || []).map((item) => item.order_id)));
        } else {
            setReviewedOrderIds(new Set());
        }

        if (cartRes.status === 'fulfilled') {
            setCartCount((cartRes.value?.items || []).length);
        } else {
            setCartCount(0);
        }

        if (notificationsRes.status === 'fulfilled') {
            setNotifications(notificationsRes.value?.items || []);
        } else {
            setNotifications([]);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const openReviewModal = (orderId) => {
        setReviewTargetOrderId(orderId);
        form.resetFields();
        setReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewTargetOrderId) return;
        try {
            const values = await form.validateFields();
            setReviewSubmitting(true);
            await submitBuyerReview(reviewTargetOrderId, {
                rating: values.rating,
                comment: values.comment || '',
            });
            message.success('Review submitted successfully');
            setReviewModalOpen(false);
            setReviewTargetOrderId(null);
            form.resetFields();
            await loadData();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(getApiErrorMessage(error, 'Failed to submit review'));
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleOpenDetail = (record) => {
        setDetailOrder(record.raw);
        setDetailModalOpen(true);
    };

    const handleOpenHistory = async (record) => {
        setHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const data = await getOrderStatusHistory(record.key, { page: 1, limit: 50 });
            setHistoryItems(data?.logs || []);
        } catch {
            setHistoryItems([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleCancelOrder = async (record) => {
        try {
            setActionOrderId(record.key);
            await cancelOrder(record.key);
            message.success('Order cancelled successfully');
            await loadData();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Failed to cancel order'));
        } finally {
            setActionOrderId(null);
        }
    };

    const tableData = useMemo(
        () => orderHistory
            .filter((order) => {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                return (
                    String(order.id).includes(q)
                    || (order?.product?.crop_name || '').toLowerCase().includes(q)
                    || (order?.farmer?.name || '').toLowerCase().includes(q)
                );
            })
            .map((order) => ({
                key: order.id,
                raw: order,
                orderId: `#ORD-${order.id}`,
                date: new Date(order.created_at).toLocaleDateString(),
                items: `${order.quantity} ${order?.product?.unit || 'unit'} ${order?.product?.crop_name || 'Produce'}`,
                total: `INR ${Number(order.total_price || 0).toFixed(2)}`,
                status: order.status,
                farmer: order?.farmer?.name || 'Farmer',
                deliveryDate: order.delivery_date,
                deliverySlot: order.delivery_slot,
                disputeStatus: order.dispute_status || 'none',
                reviewSubmitted: reviewedOrderIds.has(order.id),
                canCancel: isBuyerCancellable(order.status),
            })),
        [orderHistory, reviewedOrderIds, searchQuery],
    );

    const columns = [
        { title: 'Order ID', dataIndex: 'orderId', key: 'orderId', render: (text) => <Text strong>{text}</Text> },
        { title: 'Date', dataIndex: 'date', key: 'date' },
        { title: 'Farmer', dataIndex: 'farmer', key: 'farmer' },
        { title: 'Items', dataIndex: 'items', key: 'items', ellipsis: true },
        { title: 'Total', dataIndex: 'total', key: 'total', render: (text) => <Text strong style={{ color: '#13ec13' }}>{text}</Text> },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'success';
                if (status === 'pending') color = 'warning';
                if (status === 'cancelled') color = 'error';
                if (status === 'confirmed') color = 'processing';
                if (status === 'packed') color = 'cyan';
                if (status === 'out_for_delivery') color = 'geekblue';
                return <Tag color={color}>{String(status).toUpperCase()}</Tag>;
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
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space wrap className="buyer-table-actions">
                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record)} />
                    <Button type="text" icon={<FileTextOutlined />} onClick={() => handleOpenHistory(record)} />
                    {record.canCancel ? (
                        <Button
                            type="text"
                            danger
                            icon={<StopOutlined />}
                            loading={actionOrderId === record.key}
                            onClick={() => Modal.confirm({
                                title: 'Cancel this order?',
                                content: 'This will cancel the order if it is not completed yet.',
                                okText: 'Cancel Order',
                                okButtonProps: { danger: true },
                                onOk: () => handleCancelOrder(record),
                            })}
                        >
                            Cancel
                        </Button>
                    ) : null}
                    {record.status === 'completed' && !record.reviewSubmitted ? (
                        <Button type="text" onClick={() => openReviewModal(record.key)}>Review</Button>
                    ) : null}
                    {record.reviewSubmitted ? <Tag color="success">REVIEWED</Tag> : null}
                </Space>
            ),
        },
    ];

    return (
        <Layout className="buyer-dashboard-layout">
            <Header className="buyer-header">
                <div className="header-content-buyer">
                    <div className="logo-buyer" onClick={() => navigate('/buyer/dashboard')} style={{ cursor: 'pointer' }}>
                        <ShopOutlined style={{ fontSize: '28px', color: '#13ec13' }} />
                        <Title level={4} style={{ margin: 0 }}>AgriMarket</Title>
                    </div>

                    <div className="search-bar-buyer">
                        <Input
                            size="large"
                            placeholder="Search orders..."
                            prefix={<SearchOutlined style={{ color: '#13ec13' }} />}
                            className="main-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="header-actions-buyer">
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/browse')}>Browse</Button>
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/farmers')}>Farmers</Button>
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/orders')}>Orders</Button>
                        <Badge count={cartCount} offset={[-5, 5]}>
                            <Button
                                type="text"
                                icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />}
                                className="cart-btn"
                                onClick={() => navigate('/buyer/cart')}
                            />
                        </Badge>
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer' }} />
                        </Dropdown>
                    </div>
                </div>
            </Header>

            <Content className="buyer-content">
                <div className="content-header">
                    <div>
                        <Title level={2}>Order History</Title>
                        <Paragraph type="secondary">Track your current and past purchases.</Paragraph>
                    </div>
                </div>

                <Card className="product-card buyer-orders-card" style={{ padding: 0 }}>
                    <Card size="small" title="Recent Alerts" style={{ marginBottom: '12px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {notifications.slice(0, 5).map((n) => (
                                <Text key={n.id} type="secondary">{n.title}: {n.message}</Text>
                            ))}
                            {notifications.length === 0 ? <Text type="secondary">No alerts available.</Text> : null}
                        </Space>
                    </Card>
                    <Table columns={columns} dataSource={tableData} pagination={false} loading={loading} scroll={{ x: 1100 }} />
                </Card>
            </Content>

            <Modal
                title="Submit Review"
                open={reviewModalOpen}
                onCancel={() => {
                    setReviewModalOpen(false);
                    setReviewTargetOrderId(null);
                    form.resetFields();
                }}
                onOk={handleSubmitReview}
                confirmLoading={reviewSubmitting}
                okText="Submit"
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="Rating" name="rating" rules={[{ required: true, message: 'Please select rating' }]}>
                        <Rate />
                    </Form.Item>
                    <Form.Item label="Comment" name="comment" rules={[{ max: 300, message: 'Maximum 300 characters' }]}>
                        <Input.TextArea rows={3} placeholder="Share your experience" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="Order Details" open={detailModalOpen} footer={null} onCancel={() => setDetailModalOpen(false)}>
                {detailOrder ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text><Text strong>Order:</Text> #ORD-{detailOrder.id}</Text>
                        <Text><Text strong>Product:</Text> {detailOrder?.product?.crop_name || 'Produce'}</Text>
                        <Text><Text strong>Quantity:</Text> {detailOrder?.quantity} {detailOrder?.product?.unit || 'unit'}</Text>
                        <Text><Text strong>Total:</Text> INR {Number(detailOrder?.total_price || 0).toFixed(2)}</Text>
                        <Text><Text strong>Status:</Text> {String(detailOrder?.status || '').toUpperCase()}</Text>
                        <Text><Text strong>Dispute Status:</Text> {String(detailOrder?.dispute_status || 'none').toUpperCase()}</Text>
                        <Text><Text strong>Dispute Note:</Text> {detailOrder?.dispute_note || '-'}</Text>
                        <Text><Text strong>Farmer:</Text> {detailOrder?.farmer?.name || 'Farmer'}</Text>
                        <Text><Text strong>Delivery Address:</Text> {detailOrder?.delivery_address || '-'}</Text>
                        <Text>
                            <Text strong>Delivery Schedule:</Text>{' '}
                            {detailOrder?.delivery_date ? new Date(detailOrder.delivery_date).toLocaleDateString() : '-'}
                            {detailOrder?.delivery_slot ? ` (${detailOrder.delivery_slot})` : ''}
                        </Text>
                    </Space>
                ) : null}
            </Modal>

            <Modal title="Order Status Timeline" open={historyModalOpen} footer={null} onCancel={() => setHistoryModalOpen(false)}>
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
                        note: item.note || '-',
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
        </Layout>
    );
};

export default BuyerOrders;
