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
    Progress,
    Timeline,
    Steps,
    Divider,
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
    getBuyerHarvestRequests,
    getBuyerReviews,
    getBuyerNotifications,
    submitBuyerReview,
    cancelOrder,
    getOrderStatusHistory,
    updateOrderStatus,
    convertHarvestRequestToOrder,
    getOrderMessages,
    sendOrderMessage,
    getDisputeEvidence,
    addDisputeEvidence,
} from '../../api/orders';
import { getCart } from '../../api/cart';
import { addToCart } from '../../api/cart';
import { getApiErrorMessage } from '../../utils/apiError';
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const isBuyerCancellable = (status) => ['pending', 'confirmed', 'packed', 'out_for_delivery'].includes(status);
const canBuyerMarkReceived = (status) => status === 'out_for_delivery';

const getShipmentProgress = (status) => {
    if (status === 'pending') return 20;
    if (status === 'confirmed') return 40;
    if (status === 'packed') return 60;
    if (status === 'out_for_delivery') return 85;
    if (status === 'completed') return 100;
    if (status === 'cancelled') return 0;
    return 0;
};

const statusSteps = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'completed'];

const humanizeStatus = (value) => {
    const v = String(value || '').trim();
    if (!v) return '-';
    return v.replaceAll('_', ' ').toUpperCase();
};

const statusTag = (status) => {
    const s = String(status || '').toLowerCase();
    let color = 'default';
    if (s === 'pending') color = 'warning';
    if (s === 'confirmed') color = 'processing';
    if (s === 'packed') color = 'cyan';
    if (s === 'out_for_delivery') color = 'geekblue';
    if (s === 'completed') color = 'success';
    if (s === 'cancelled') color = 'error';
    return <Tag color={color}>{humanizeStatus(s)}</Tag>;
};

const getStepIndex = (status) => {
    const s = String(status || '').toLowerCase();
    const idx = statusSteps.indexOf(s);
    return idx >= 0 ? idx : 0;
};

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
    const [historyTargetOrder, setHistoryTargetOrder] = useState(null);
    const [harvestRequests, setHarvestRequests] = useState([]);
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [messageTargetOrder, setMessageTargetOrder] = useState(null);
    const [messageItems, setMessageItems] = useState([]);
    const [messageLoading, setMessageLoading] = useState(false);
    const [messageSubmitting, setMessageSubmitting] = useState(false);
    const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
    const [evidenceTargetOrder, setEvidenceTargetOrder] = useState(null);
    const [evidenceItems, setEvidenceItems] = useState([]);
    const [evidenceLoading, setEvidenceLoading] = useState(false);
    const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [messageForm] = Form.useForm();
    const [evidenceForm] = Form.useForm();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const loadData = async () => {
        setLoading(true);
        const [ordersRes, harvestRes, reviewsRes, cartRes, notificationsRes] = await Promise.allSettled([
            getBuyerOrders(),
            getBuyerHarvestRequests(),
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

        if (harvestRes.status === 'fulfilled') {
            setHarvestRequests(harvestRes.value?.items || []);
        } else {
            setHarvestRequests([]);
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
        setHistoryTargetOrder(record?.raw || null);
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

    const handleMarkReceived = async (record) => {
        try {
            setActionOrderId(record.key);
            await updateOrderStatus(record.key, 'completed');
            message.success('Order marked as received');
            await loadData();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Failed to mark as received'));
        } finally {
            setActionOrderId(null);
        }
    };

    const handleReorder = async (record) => {
        try {
            setActionOrderId(`reorder-${record.key}`);
            await addToCart({
                product_id: record.raw.product_id,
                quantity: Number(record.raw.quantity || 1),
            });
            message.success('Item added to cart for reorder');
            await loadData();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Failed to reorder item'));
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
                orderType: order.order_type || 'standard',
                status: order.status,
                farmer: order?.farmer?.name || 'Farmer',
                deliveryDate: order.delivery_date,
                deliverySlot: order.delivery_slot,
                disputeStatus: order.dispute_status || 'none',
                reviewSubmitted: reviewedOrderIds.has(order.id),
                canCancel: isBuyerCancellable(order.status),
                canMarkReceived: canBuyerMarkReceived(order.status),
            })),
        [orderHistory, reviewedOrderIds, searchQuery],
    );

    const columns = [
        { title: 'Order ID', dataIndex: 'orderId', key: 'orderId', render: (text) => <Text strong>{text}</Text> },
        { title: 'Date', dataIndex: 'date', key: 'date' },
        { title: 'Farmer', dataIndex: 'farmer', key: 'farmer' },
        { title: 'Type', dataIndex: 'orderType', key: 'orderType', render: (value) => <Tag color={value === 'bulk' ? 'purple' : value === 'harvest_request' ? 'geekblue' : 'default'}>{humanizeStatus(value)}</Tag> },
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
                    <Button type="text" onClick={() => openMessages(record)}>Messages</Button>
                    {record.disputeStatus !== 'none' ? <Button type="text" onClick={() => openEvidence(record)}>Evidence</Button> : null}
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
                    {record.canMarkReceived ? (
                        <Button
                            type="text"
                            loading={actionOrderId === record.key}
                            onClick={() => Modal.confirm({
                                title: 'Confirm delivery received?',
                                content: 'This will mark the order as completed.',
                                okText: 'Mark Received',
                                onOk: () => handleMarkReceived(record),
                            })}
                        >
                            Mark Received
                        </Button>
                    ) : null}
                    {record.status === 'completed' && !record.reviewSubmitted ? (
                        <Button type="text" onClick={() => openReviewModal(record.key)}>Review</Button>
                    ) : null}
                    {record.reviewSubmitted ? <Tag color="success">REVIEWED</Tag> : null}
                    <Button type="text" loading={actionOrderId === `reorder-${record.key}`} onClick={() => handleReorder(record)}>Reorder</Button>
                </Space>
            ),
        },
    ];

    const timelineItems = useMemo(() => {
        const sorted = [...(historyItems || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return sorted.map((item) => {
            const to = String(item.to_status || '').toLowerCase();
            const reason = item.reason ? String(item.reason).replaceAll('_', ' ') : '';
            const note = String(item.note || '').trim();
            const title = reason ? reason.toUpperCase() : 'UPDATE';
            const subtitle = [
                item.from_status ? `FROM ${humanizeStatus(item.from_status)}` : '',
                item.to_status ? `TO ${humanizeStatus(item.to_status)}` : '',
                item.category ? String(item.category).toUpperCase() : '',
            ].filter(Boolean).join(' • ');

            return {
                key: item.id,
                dot: statusTag(to),
                children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Text strong>{title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text>
                        {note ? <Text style={{ fontSize: 13 }}>{note}</Text> : null}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                        </Text>
                    </div>
                ),
            };
        });
    }, [historyItems]);

    const handleConvertRequest = async (item) => {
        try {
            setActionOrderId(`request-${item.id}`);
            await convertHarvestRequestToOrder(item.id, {
                quantity: Number(item.requested_quantity || 0),
                delivery_address: item.delivery_address || '',
                buyer_note: item.buyer_note || '',
            });
            message.success('Harvest request converted to order');
            await loadData();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Failed to convert harvest request'));
        } finally {
            setActionOrderId(null);
        }
    };

    const openMessages = async (record) => {
        setMessageTargetOrder(record.raw);
        setMessageModalOpen(true);
        setMessageLoading(true);
        try {
            const data = await getOrderMessages(record.key);
            setMessageItems(data?.items || []);
        } catch (error) {
            setMessageItems([]);
            message.error(getApiErrorMessage(error, 'Failed to load messages'));
        } finally {
            setMessageLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageTargetOrder) return;
        try {
            const values = await messageForm.validateFields();
            setMessageSubmitting(true);
            const data = await sendOrderMessage(messageTargetOrder.id, { message: values.message });
            setMessageItems(data?.items || []);
            messageForm.resetFields();
            message.success('Message sent');
        } catch (error) {
            if (error?.errorFields) return;
            message.error(getApiErrorMessage(error, 'Failed to send message'));
        } finally {
            setMessageSubmitting(false);
        }
    };

    const openEvidence = async (record) => {
        setEvidenceTargetOrder(record.raw);
        setEvidenceModalOpen(true);
        setEvidenceLoading(true);
        try {
            const data = await getDisputeEvidence(record.key);
            setEvidenceItems(data?.items || []);
        } catch (error) {
            setEvidenceItems([]);
            message.error(getApiErrorMessage(error, 'Failed to load evidence'));
        } finally {
            setEvidenceLoading(false);
        }
    };

    const handleAddEvidence = async () => {
        if (!evidenceTargetOrder) return;
        try {
            const values = await evidenceForm.validateFields();
            setEvidenceSubmitting(true);
            const data = await addDisputeEvidence(evidenceTargetOrder.id, {
                note: values.note || '',
                evidence_url: values.evidence_url || '',
            });
            setEvidenceItems(data?.items || []);
            evidenceForm.resetFields();
            message.success('Evidence added');
            await loadData();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(getApiErrorMessage(error, 'Failed to add evidence'));
        } finally {
            setEvidenceSubmitting(false);
        }
    };

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
                        <Paragraph type="secondary">Track standard orders, bulk purchases, and harvest requests in one place.</Paragraph>
                    </div>
                </div>

                <Card className="product-card buyer-orders-card" style={{ padding: 0 }}>
                    <Card size="small" title="Shipment Overview" style={{ marginBottom: '12px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text type="secondary">In Transit: {tableData.filter((o) => o.status === 'out_for_delivery').length}</Text>
                            <Text type="secondary">Awaiting Farmer Action: {tableData.filter((o) => ['pending', 'confirmed', 'packed'].includes(o.status)).length}</Text>
                            <Text type="secondary">Delivered: {tableData.filter((o) => o.status === 'completed').length}</Text>
                        </Space>
                    </Card>
                    <Card size="small" title="Recent Alerts" style={{ marginBottom: '12px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {notifications.slice(0, 5).map((n) => (
                                <Text key={n.id} type="secondary">{n.title}: {n.message}</Text>
                            ))}
                            {notifications.length === 0 ? <Text type="secondary">No alerts available.</Text> : null}
                        </Space>
                    </Card>
                    <Card size="small" title="Harvest Requests" style={{ marginBottom: '12px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {harvestRequests.slice(0, 5).map((item) => (
                                <Card key={item.id} size="small">
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Text strong>{item.product?.crop_name || 'Produce'} - {item.requested_quantity} {item.product?.unit || 'unit'}</Text>
                                        <Text type="secondary">Status: {humanizeStatus(item.status)} | Preferred: {item.preferred_harvest_date ? new Date(item.preferred_harvest_date).toLocaleDateString() : '-'}</Text>
                                        {item.farmer_response_note ? <Text type="secondary">{item.farmer_response_note}</Text> : null}
                                        {item.status === 'pending' ? <Text type="secondary">Waiting for farmer response.</Text> : null}
                                        {item.status === 'accepted' ? <Text type="secondary">Accepted by farmer. Convert it when you want this to become a live order.</Text> : null}
                                        {item.status === 'ready' ? <Text type="secondary">Farmer marked it ready for conversion into an order.</Text> : null}
                                        {(item.status === 'accepted' || item.status === 'ready') && !item.converted_order_id ? (
                                            <Button loading={actionOrderId === `request-${item.id}`} onClick={() => handleConvertRequest(item)}>
                                                Convert To Order
                                            </Button>
                                        ) : null}
                                    </Space>
                                </Card>
                            ))}
                            {harvestRequests.length === 0 ? <Text type="secondary">No harvest requests yet.</Text> : null}
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
                        <Text><Text strong>Payment:</Text> {String(detailOrder?.payment_method || 'cod').replaceAll('_', ' ').toUpperCase()}</Text>
                        {detailOrder?.payment_reference ? <Text><Text strong>Payment Ref:</Text> {detailOrder.payment_reference}</Text> : null}
                        <Text><Text strong>Status:</Text> {String(detailOrder?.status || '').toUpperCase()}</Text>
                        <div>
                            <Text strong>Shipment Progress:</Text>
                            <Progress
                                percent={getShipmentProgress(detailOrder?.status)}
                                status={detailOrder?.status === 'cancelled' ? 'exception' : 'active'}
                                style={{ marginTop: '8px' }}
                            />
                        </div>
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

            <Modal
                title="Order Status Timeline"
                open={historyModalOpen}
                footer={null}
                width={960}
                styles={{ body: { maxHeight: '60vh', overflow: 'auto' } }}
                onCancel={() => {
                    setHistoryModalOpen(false);
                    setHistoryTargetOrder(null);
                    setHistoryItems([]);
                }}
            >
                {historyTargetOrder ? (
                    <>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Text><Text strong>Order:</Text> #ORD-{historyTargetOrder.id}</Text>
                            <Text><Text strong>Current Status:</Text> {statusTag(historyTargetOrder.status)}</Text>
                            <Steps
                                size="small"
                                current={getStepIndex(historyTargetOrder.status)}
                                status={String(historyTargetOrder.status || '').toLowerCase() === 'cancelled' ? 'error' : 'process'}
                                items={statusSteps.map((s) => ({ title: humanizeStatus(s) }))}
                            />
                        </Space>
                        <Divider style={{ margin: '16px 0' }} />
                    </>
                ) : null}

                <Timeline
                    mode="left"
                    pending={historyLoading ? 'Loading history…' : undefined}
                    items={timelineItems.length ? timelineItems : [{ children: <Text type="secondary">No history available yet.</Text> }]}
                />
            </Modal>
            <Modal
                title={messageTargetOrder ? `Messages for #ORD-${messageTargetOrder.id}` : 'Order Messages'}
                open={messageModalOpen}
                onCancel={() => {
                    setMessageModalOpen(false);
                    setMessageTargetOrder(null);
                    setMessageItems([]);
                    messageForm.resetFields();
                }}
                onOk={handleSendMessage}
                okText="Send"
                confirmLoading={messageSubmitting}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary">Use this thread to coordinate delivery details, substitutions, or harvest timing with the farmer.</Text>
                    <Card size="small" loading={messageLoading}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {messageItems.map((item) => (
                                <Card key={item.id} size="small">
                                    <Text strong>{item?.sender?.name || humanizeStatus(item.sender_role)}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                                    </Text>
                                    <br />
                                    <Text>{item.message}</Text>
                                </Card>
                            ))}
                            {!messageLoading && messageItems.length === 0 ? <Text type="secondary">No messages yet.</Text> : null}
                        </Space>
                    </Card>
                    <Form form={messageForm} layout="vertical">
                        <Form.Item
                            label="Message"
                            name="message"
                            rules={[
                                { required: true, message: 'Enter a message' },
                                { min: 2, message: 'Enter at least 2 characters' },
                                { max: 500, message: 'Maximum 500 characters' },
                            ]}
                        >
                            <Input.TextArea rows={4} placeholder="Send the farmer a delivery or order message" />
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>
            <Modal
                title={evidenceTargetOrder ? `Dispute Evidence for #ORD-${evidenceTargetOrder.id}` : 'Dispute Evidence'}
                open={evidenceModalOpen}
                onCancel={() => {
                    setEvidenceModalOpen(false);
                    setEvidenceTargetOrder(null);
                    setEvidenceItems([]);
                    evidenceForm.resetFields();
                }}
                onOk={handleAddEvidence}
                okText="Add Evidence"
                confirmLoading={evidenceSubmitting}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary">Attach factual notes or uploaded image URLs for the current dispute.</Text>
                    <Card size="small" loading={evidenceLoading}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {evidenceItems.map((item) => (
                                <Card key={item.id} size="small">
                                    <Text strong>{item?.uploader?.name || 'Participant'}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                                    </Text>
                                    {item.note ? (
                                        <>
                                            <br />
                                            <Text>{item.note}</Text>
                                        </>
                                    ) : null}
                                    {item.evidence_url ? (
                                        <>
                                            <br />
                                            <a href={item.evidence_url} target="_blank" rel="noreferrer">Open evidence</a>
                                        </>
                                    ) : null}
                                </Card>
                            ))}
                            {!evidenceLoading && evidenceItems.length === 0 ? <Text type="secondary">No evidence submitted yet.</Text> : null}
                        </Space>
                    </Card>
                    <Form form={evidenceForm} layout="vertical">
                        <Form.Item label="Evidence Note" name="note" rules={[{ max: 500, message: 'Maximum 500 characters' }]}>
                            <Input.TextArea rows={3} placeholder="Describe what this evidence shows" />
                        </Form.Item>
                        <Form.Item label="Evidence URL" name="evidence_url" rules={[{ type: 'url', warningOnly: true, message: 'Enter a valid URL' }]}>
                            <Input placeholder="Paste an uploaded image or document URL" />
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>
        </Layout>
    );
};

export default BuyerOrders;
