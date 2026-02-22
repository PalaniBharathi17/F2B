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
    Modal,
    Form,
    Select,
    InputNumber,
    Popconfirm,
    message
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
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    MoreOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    bulkUpdateProductStatus,
    deleteProduct,
    duplicateProduct,
    getProductPriceHistory,
    getMyListings,
    updateProduct,
    updateProductPrice,
    updateProductStatus
} from '../../api/products';
import { getFarmerOrders } from '../../api/orders';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const MyListings = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [listingsData, setListingsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [stockFilter, setStockFilter] = useState('all');
    const [sortBy, setSortBy] = useState('latest');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [bulkSaving, setBulkSaving] = useState(false);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [viewItem, setViewItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [priceModalOpen, setPriceModalOpen] = useState(false);
    const [priceTargetItem, setPriceTargetItem] = useState(null);
    const [priceSaving, setPriceSaving] = useState(false);
    const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);
    const [priceHistory, setPriceHistory] = useState([]);
    const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
    const [actionProductId, setActionProductId] = useState(null);
    const [form] = Form.useForm();
    const [priceForm] = Form.useForm();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const loadListings = async () => {
        setLoading(true);
        try {
            const data = await getMyListings();
            setListingsData(data?.products || []);
        } catch {
            setListingsData([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingOrders = async () => {
        try {
            const data = await getFarmerOrders();
            const count = (data?.orders || []).filter((o) => o.status === 'pending').length;
            setPendingOrders(count);
        } catch {
            setPendingOrders(0);
        }
    };

    useEffect(() => {
        loadListings();
        loadPendingOrders();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const tableData = useMemo(() => (
        listingsData
            .filter((item) => {
                const q = query.trim().toLowerCase();
                if (!q) return true;
                return (
                    (item.crop_name || '').toLowerCase().includes(q)
                    || (item.city || '').toLowerCase().includes(q)
                    || (item.state || '').toLowerCase().includes(q)
                    || String(item.id).includes(q)
                );
            })
            .filter((item) => {
                if (stockFilter === 'low') return Number(item.quantity || 0) > 0 && Number(item.quantity || 0) <= 5;
                if (stockFilter === 'out') return Number(item.quantity || 0) <= 0;
                if (stockFilter === 'active') return item.status === 'active';
                if (stockFilter === 'draft') return item.status === 'draft';
                if (stockFilter === 'sold') return item.status === 'sold';
                if (stockFilter === 'expired') return item.status === 'expired';
                return true;
            })
            .map((item) => ({
                key: item.id,
                name: item.crop_name,
                category: item.category || 'Produce',
                price: Number(item.price_per_unit || 0),
                unit: item.unit || 'unit',
                stock: Number(item.quantity || 0),
                status: item.status || 'active',
                createdAt: item.created_at,
                image: item.image_url ? `http://localhost:8080${item.image_url}` : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&h=100&fit=crop',
            }))
            .sort((a, b) => {
                if (sortBy === 'price_asc') return a.price - b.price;
                if (sortBy === 'price_desc') return b.price - a.price;
                if (sortBy === 'stock_asc') return a.stock - b.stock;
                if (sortBy === 'stock_desc') return b.stock - a.stock;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
    ), [listingsData, query, stockFilter, sortBy]);

    const handleOpenEdit = (record) => {
        const item = listingsData.find((p) => p.id === record.key);
        if (!item) return;
        const desc = String(item.description || '').toLowerCase();
        const fallbackCategory = desc.includes('category: fruits')
            ? 'fruits'
            : desc.includes('category: vegetables')
                ? 'vegetables'
                : desc.includes('category: grains')
                    ? 'grains'
                    : desc.includes('category: dairy')
                        ? 'dairy'
                        : desc.includes('category: honey')
                            ? 'honey'
                            : '';
        setEditingItem(item);
        form.setFieldsValue({
            name: item.crop_name,
            category: item.category || fallbackCategory,
            quantity: Number(item.quantity || 0),
            price: Number(item.price_per_unit || 0),
            unit: item.unit || 'kg',
            description: item.description || '',
            city: item.city || '',
            state: item.state || '',
            status: item.status || 'active',
        });
    };

    const handleUpdate = async () => {
        if (!editingItem) return;
        try {
            const values = await form.validateFields();
            setSaving(true);
            await updateProduct(editingItem.id, {
                crop_name: values.name,
                category: values.category || '',
                quantity: Number(values.quantity),
                unit: values.unit,
                price_per_unit: Number(values.price),
                description: values.description || '',
                city: values.city || '',
                state: values.state || '',
                image_url: editingItem.image_url || '',
            });
            message.success('Listing updated successfully');
            setEditingItem(null);
            await loadListings();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.error || 'Failed to update listing');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        try {
            setActionProductId(record.key);
            await deleteProduct(record.key);
            message.success('Listing deleted successfully');
            await loadListings();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to delete listing');
        } finally {
            setActionProductId(null);
        }
    };

    const handleStatusChange = async (record, status) => {
        try {
            setActionProductId(record.key);
            await updateProductStatus(record.key, status);
            message.success('Listing status updated successfully');
            await loadListings();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update listing status');
        } finally {
            setActionProductId(null);
        }
    };

    const handleBulkStatusChange = async (status) => {
        if (!selectedRowKeys.length) {
            message.warning('Select at least one listing');
            return;
        }
        try {
            setBulkSaving(true);
            await bulkUpdateProductStatus(selectedRowKeys, status);
            message.success('Listings updated successfully');
            setSelectedRowKeys([]);
            await loadListings();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update listings');
        } finally {
            setBulkSaving(false);
        }
    };

    const openPriceModal = (record) => {
        const item = listingsData.find((p) => p.id === record.key);
        if (!item) return;
        setPriceTargetItem(item);
        priceForm.setFieldsValue({ price: Number(item.price_per_unit || 0) });
        setPriceModalOpen(true);
    };

    const handleQuickPriceUpdate = async () => {
        if (!priceTargetItem) return;
        try {
            const values = await priceForm.validateFields();
            setPriceSaving(true);
            await updateProductPrice(priceTargetItem.id, Number(values.price));
            message.success('Price updated successfully');
            setPriceModalOpen(false);
            setPriceTargetItem(null);
            priceForm.resetFields();
            await loadListings();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.error || 'Failed to update price');
        } finally {
            setPriceSaving(false);
        }
    };

    const handleDuplicateListing = async (record) => {
        try {
            setActionProductId(record.key);
            await duplicateProduct(record.key);
            message.success('Listing duplicated as draft');
            await loadListings();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to duplicate listing');
        } finally {
            setActionProductId(null);
        }
    };

    const openPriceHistory = async (record) => {
        try {
            setPriceHistoryOpen(true);
            setPriceHistoryLoading(true);
            const data = await getProductPriceHistory(record.key);
            setPriceHistory(data?.history || []);
        } catch {
            setPriceHistory([]);
        } finally {
            setPriceHistoryLoading(false);
        }
    };

    const totalProducts = tableData.length;
    const activeListings = tableData.filter((item) => item.status === 'active').length;
    const stockValue = tableData.reduce((sum, item) => sum + (item.price * item.stock), 0);
    const lowStockCount = tableData.filter((item) => item.stock > 0 && item.stock <= 5).length;

    const columns = [
        {
            title: 'Product',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.image} shape="square" size={48} />
                    <div>
                        <Text strong>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.category}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price, record) => (
                <Text strong>INR {price.toFixed(2)}<span style={{ fontWeight: 400, color: '#999' }}> / {record.unit}</span></Text>
            )
        },
        {
            title: 'Inventory',
            dataIndex: 'stock',
            key: 'stock',
            render: (stock, record) => `${stock} ${record.unit}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'success';
                if (status === 'sold') color = 'warning';
                if (status === 'expired') color = 'error';
                if (status === 'draft') color = 'default';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Alert',
            key: 'alert',
            render: (_, record) => {
                if (record.stock <= 0) return <Tag color="error">OUT OF STOCK</Tag>;
                if (record.stock <= 5) return <Tag color="warning">LOW STOCK</Tag>;
                return <Tag color="success">IN STOCK</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} title="View details" onClick={() => setViewItem(listingsData.find((p) => p.id === record.key) || null)} />
                    <Button type="text" icon={<EditOutlined />} title="Edit listing" onClick={() => handleOpenEdit(record)} disabled={actionProductId === record.key} />
                    <Button type="text" onClick={() => openPriceModal(record)} title="Quick price update" disabled={actionProductId === record.key}>Price</Button>
                    <Button type="text" onClick={() => handleDuplicateListing(record)} title="Duplicate listing" loading={actionProductId === record.key}>Duplicate</Button>
                    <Button type="text" onClick={() => openPriceHistory(record)} title="Price history" disabled={actionProductId === record.key}>History</Button>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'active',
                                    label: 'Publish',
                                    disabled: record.status === 'active' || actionProductId === record.key,
                                    onClick: () => handleStatusChange(record, 'active'),
                                },
                                {
                                    key: 'draft',
                                    label: 'Move to Draft',
                                    disabled: record.status === 'draft' || record.status === 'sold' || actionProductId === record.key,
                                    onClick: () => handleStatusChange(record, 'draft'),
                                },
                                {
                                    key: 'expired',
                                    label: 'Mark Expired',
                                    disabled: record.status === 'expired' || actionProductId === record.key,
                                    onClick: () => handleStatusChange(record, 'expired'),
                                },
                            ],
                        }}
                    >
                        <Button type="text" icon={<MoreOutlined />} title="More actions" loading={actionProductId === record.key} />
                    </Dropdown>
                    <Popconfirm
                        title="Delete this listing?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record)}
                        okText="Delete"
                        cancelText="Cancel"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} title="Delete listing" loading={actionProductId === record.key} />
                    </Popconfirm>
                </Space>
            ),
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
                    <div className="logo-icon">
                        <ShoppingOutlined />
                    </div>
                    {!collapsed && (
                        <div>
                            <Title level={5} style={{ margin: 0, color: 'white' }}>AgriMarket</Title>
                            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Farmer Portal</Text>
                        </div>
                    )}
                </div>

                <Menu theme="dark" selectedKeys={['my-listings']} mode="inline" items={menuItems} className="sidebar-menu" />

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
                        <Title level={3} style={{ margin: 0 }}>My Product Inventory</Title>
                    </div>
                    <div className="header-right">
                        <Input
                            placeholder="Search listings..."
                            prefix={<SearchOutlined />}
                            className="search-input"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Select
                            value={stockFilter}
                            onChange={setStockFilter}
                            style={{ width: 150 }}
                            options={[
                                { value: 'all', label: 'All Stock' },
                                { value: 'active', label: 'Active Only' },
                                { value: 'draft', label: 'Draft' },
                                { value: 'sold', label: 'Sold' },
                                { value: 'expired', label: 'Expired' },
                                { value: 'low', label: 'Low Stock' },
                                { value: 'out', label: 'Out of Stock' },
                            ]}
                        />
                        <Select
                            value={sortBy}
                            onChange={setSortBy}
                            style={{ width: 170 }}
                            options={[
                                { value: 'latest', label: 'Newest First' },
                                { value: 'price_asc', label: 'Price Low-High' },
                                { value: 'price_desc', label: 'Price High-Low' },
                                { value: 'stock_asc', label: 'Stock Low-High' },
                                { value: 'stock_desc', label: 'Stock High-Low' },
                            ]}
                        />
                        <Badge count={pendingOrders} offset={[-5, 5]}>
                            <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} aria-label="Notifications" />
                        </Badge>
                        <Button type="primary" icon={<PlusOutlined />} className="add-produce-btn" onClick={() => navigate('/farmer/add-produce')}>
                            Add New Produce
                        </Button>
                        <Dropdown
                            menu={{
                                items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }]
                            }}
                        >
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" src="https://i.pravatar.cc/150?img=12" style={{ cursor: 'pointer' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="dashboard-content">
                    <Row gutter={[24, 24]} className="stats-row">
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stat-card">
                                <Statistic title="Total Products" value={totalProducts} prefix={<UnorderedListOutlined style={{ color: '#13ec13', marginRight: '8px' }} />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stat-card">
                                <Statistic title="Active Listings" value={activeListings} valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stat-card">
                                <Statistic title="Stock Value" value={Number(stockValue.toFixed(2))} prefix="INR " />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stat-card">
                                <Statistic title="Low Stock Alerts" value={lowStockCount} valueStyle={{ color: lowStockCount ? '#faad14' : '#52c41a' }} />
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        className="activity-card"
                        title="All Listings"
                        extra={(
                            <Space>
                                <Button loading={bulkSaving} onClick={() => handleBulkStatusChange('active')}>Bulk Publish</Button>
                                <Button loading={bulkSaving} onClick={() => handleBulkStatusChange('draft')}>Bulk Draft</Button>
                                <Button loading={bulkSaving} onClick={() => handleBulkStatusChange('expired')}>Bulk Expire</Button>
                            </Space>
                        )}
                    >
                        <Table
                            rowSelection={{
                                selectedRowKeys,
                                onChange: setSelectedRowKeys,
                            }}
                            columns={columns}
                            dataSource={tableData}
                            className="activity-table"
                            loading={loading}
                        />
                    </Card>
                </Content>
            </Layout>
            <Modal title="Listing Details" open={Boolean(viewItem)} onCancel={() => setViewItem(null)} footer={null}>
                {viewItem && (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text><Text strong>Produce:</Text> {viewItem.crop_name}</Text>
                        <Text><Text strong>Quantity:</Text> {viewItem.quantity} {viewItem.unit}</Text>
                        <Text><Text strong>Price:</Text> INR {Number(viewItem.price_per_unit || 0).toFixed(2)} / {viewItem.unit}</Text>
                        <Text><Text strong>Location:</Text> {[viewItem.city, viewItem.state].filter(Boolean).join(', ') || '-'}</Text>
                        <Text><Text strong>Status:</Text> {viewItem.status}</Text>
                        <Text><Text strong>Description:</Text> {viewItem.description || '-'}</Text>
                    </Space>
                )}
            </Modal>
            <Modal title="Edit Listing" open={Boolean(editingItem)} onCancel={() => setEditingItem(null)} onOk={handleUpdate} confirmLoading={saving} okText="Update">
                <Form form={form} layout="vertical">
                    <Form.Item label="Produce Name" name="name" rules={[{ required: true, message: 'Please enter produce name' }]}>
                        <Input />
                    </Form.Item>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="Quantity" name="quantity" rules={[{ required: true, message: 'Required' }]}>
                                <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Price" name="price" rules={[{ required: true, message: 'Required' }]}>
                                <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Required' }]}>
                                <Select
                                    options={[
                                        { value: 'vegetables', label: 'Vegetables' },
                                        { value: 'fruits', label: 'Fruits' },
                                        { value: 'grains', label: 'Grains' },
                                        { value: 'dairy', label: 'Dairy & Eggs' },
                                        { value: 'honey', label: 'Honey & Preserves' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Unit" name="unit" rules={[{ required: true, message: 'Required' }]}>
                                <Select
                                    options={[
                                        { value: 'kg', label: 'kg' },
                                        { value: 'bunch', label: 'bunch' },
                                        { value: 'piece', label: 'piece' },
                                        { value: 'dozen', label: 'dozen' },
                                        { value: 'box', label: 'box' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Status" name="status">
                                <Select
                                    disabled
                                    options={[
                                        { value: 'active', label: 'active' },
                                        { value: 'sold', label: 'sold' },
                                        { value: 'expired', label: 'expired' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="City" name="city">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="State" name="state">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Description" name="description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Quick Price Update"
                open={priceModalOpen}
                onCancel={() => {
                    setPriceModalOpen(false);
                    setPriceTargetItem(null);
                    priceForm.resetFields();
                }}
                onOk={handleQuickPriceUpdate}
                confirmLoading={priceSaving}
                okText="Update Price"
            >
                <Form form={priceForm} layout="vertical">
                    <Form.Item
                        label="Price (INR)"
                        name="price"
                        rules={[
                            { required: true, message: 'Price is required' },
                            { type: 'number', min: 0.1, message: 'Price must be greater than 0' },
                        ]}
                    >
                        <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal title="Price History" open={priceHistoryOpen} onCancel={() => setPriceHistoryOpen(false)} footer={null}>
                <Table
                    loading={priceHistoryLoading}
                    dataSource={priceHistory.map((item) => ({
                        key: item.id,
                        changedAt: new Date(item.changed_at).toLocaleString(),
                        oldPrice: Number(item.old_price || 0).toFixed(2),
                        newPrice: Number(item.new_price || 0).toFixed(2),
                    }))}
                    pagination={false}
                    columns={[
                        { title: 'Changed At', dataIndex: 'changedAt', key: 'changedAt' },
                        { title: 'Old Price', dataIndex: 'oldPrice', key: 'oldPrice', render: (p) => `INR ${p}` },
                        { title: 'New Price', dataIndex: 'newPrice', key: 'newPrice', render: (p) => `INR ${p}` },
                    ]}
                />
            </Modal>
        </Layout>
    );
};

export default MyListings;
