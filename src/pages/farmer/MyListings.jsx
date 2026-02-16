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
    EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { deleteProduct, getMyListings, updateProduct } from '../../api/products';
import { getFarmerOrders } from '../../api/orders';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const MyListings = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [listingsData, setListingsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [pendingOrders, setPendingOrders] = useState(0);
    const [viewItem, setViewItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
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
            .map((item) => ({
            key: item.id,
            name: item.crop_name,
            category: item.city || 'Produce',
            price: Number(item.price_per_unit || 0),
            unit: item.unit || 'unit',
            stock: Number(item.quantity || 0),
            status: item.status || 'active',
            image: item.image_url ? `http://localhost:8080${item.image_url}` : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&h=100&fit=crop',
            }))
    ), [listingsData, query]);

    const handleOpenEdit = (record) => {
        const item = listingsData.find((p) => p.id === record.key);
        if (!item) return;
        setEditingItem(item);
        form.setFieldsValue({
            name: item.crop_name,
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
            await deleteProduct(record.key);
            message.success('Listing deleted successfully');
            await loadListings();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to delete listing');
        }
    };

    const totalProducts = tableData.length;
    const activeListings = tableData.filter((item) => item.status === 'active').length;
    const stockValue = tableData.reduce((sum, item) => sum + (item.price * item.stock), 0);

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
                <Text strong>₹{price.toFixed(2)}<span style={{ fontWeight: 400, color: '#999' }}> / {record.unit}</span></Text>
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
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} title="View details" onClick={() => setViewItem(listingsData.find((p) => p.id === record.key) || null)} />
                    <Button type="text" icon={<EditOutlined />} title="Edit listing" onClick={() => handleOpenEdit(record)} />
                    <Popconfirm
                        title="Delete this listing?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record)}
                        okText="Delete"
                        cancelText="Cancel"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} title="Delete listing" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/farmer/dashboard')
        },
        {
            key: 'add-produce',
            icon: <PlusOutlined />,
            label: 'Add Produce',
            onClick: () => navigate('/farmer/add-produce')
        },
        {
            key: 'my-listings',
            icon: <UnorderedListOutlined />,
            label: 'My Listings',
            onClick: () => navigate('/farmer/listings')
        },
        {
            key: 'orders',
            icon: <ShoppingOutlined />,
            label: 'Orders',
            onClick: () => navigate('/farmer/orders')
        },
    ];

    return (
        <Layout className="farmer-dashboard-layout">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                className="dashboard-sider"
                width={260}
            >
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

                <Menu
                    theme="dark"
                    selectedKeys={['my-listings']}
                    mode="inline"
                    items={menuItems}
                    className="sidebar-menu"
                />

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
                        <Badge count={pendingOrders} offset={[-5, 5]}>
                            <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} aria-label="Notifications" />
                        </Badge>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            className="add-produce-btn"
                            onClick={() => navigate('/farmer/add-produce')}
                        >
                            Add New Produce
                        </Button>
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }
                                ]
                            }}
                        >
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" src="https://i.pravatar.cc/150?img=12" style={{ cursor: 'pointer' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="dashboard-content">
                    <Row gutter={[24, 24]} className="stats-row">
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Total Products" value={totalProducts} prefix={<UnorderedListOutlined style={{ color: '#13ec13', marginRight: '8px' }} />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Active Listings" value={activeListings} valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Stock Value" value={Number(stockValue.toFixed(2))} prefix="₹" />
                            </Card>
                        </Col>
                    </Row>

                    <Card className="activity-card" title="All Listings">
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            className="activity-table"
                            loading={loading}
                        />
                    </Card>
                </Content>
            </Layout>
            <Modal
                title="Listing Details"
                open={Boolean(viewItem)}
                onCancel={() => setViewItem(null)}
                footer={null}
            >
                {viewItem && (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text><Text strong>Produce:</Text> {viewItem.crop_name}</Text>
                        <Text><Text strong>Quantity:</Text> {viewItem.quantity} {viewItem.unit}</Text>
                        <Text><Text strong>Price:</Text> ₹{Number(viewItem.price_per_unit || 0).toFixed(2)} / {viewItem.unit}</Text>
                        <Text><Text strong>Location:</Text> {[viewItem.city, viewItem.state].filter(Boolean).join(', ') || '-'}</Text>
                        <Text><Text strong>Status:</Text> {viewItem.status}</Text>
                        <Text><Text strong>Description:</Text> {viewItem.description || '-'}</Text>
                    </Space>
                )}
            </Modal>
            <Modal
                title="Edit Listing"
                open={Boolean(editingItem)}
                onCancel={() => setEditingItem(null)}
                onOk={handleUpdate}
                confirmLoading={saving}
                okText="Update"
            >
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
        </Layout>
    );
};

export default MyListings;
