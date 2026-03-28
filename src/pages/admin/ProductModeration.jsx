import React, { useEffect, useMemo, useState } from 'react';
import {
    Layout,
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
    Menu,
    Image,
    Modal,
    message,
    Tabs,
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
    SearchOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminProducts, updateAdminProductModeration } from '../../api/admin';
import { getBackendOrigin } from '../../api/client';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const fallbackImage = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&h=200&fit=crop';

const ProductModeration = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('pending_review');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [moderationTarget, setModerationTarget] = useState(null);
    const [moderationStatus, setModerationStatus] = useState('active');
    const [moderationNote, setModerationNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { logout, user: currentUser } = useAuth();

    const loadProducts = async () => {
        try {
            const data = await getAdminProducts();
            setProducts(data?.items || []);
        } catch (error) {
            setProducts([]);
            message.error(error?.response?.data?.error || 'Failed to load products');
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const filteredProducts = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        return products
            .filter((product) => activeTab === 'all' || product.status === activeTab)
            .filter((product) => {
                if (!query) return true;
                return [
                    product.crop_name,
                    product.category,
                    product.city,
                    product.state,
                    product?.farmer?.name,
                ].some((value) => String(value || '').toLowerCase().includes(query));
            });
    }, [products, activeTab, searchText]);

    const handleModeration = async () => {
        if (!moderationTarget) return;
        if (moderationStatus === 'rejected' && !moderationNote.trim()) {
            message.error('Rejection note is required');
            return;
        }

        try {
            setSubmitting(true);
            await updateAdminProductModeration(moderationTarget.id, {
                status: moderationStatus,
                note: moderationNote,
            });
            message.success(`Product ${moderationStatus === 'active' ? 'approved' : 'updated'}`);
            setModerationTarget(null);
            setModerationNote('');
            await loadProducts();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update product');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Product',
            dataIndex: 'crop_name',
            key: 'crop_name',
            render: (_, record) => (
                <Space size="middle">
                    <Image
                        src={record.image_url ? `${getBackendOrigin()}${record.image_url}` : fallbackImage}
                        width={60}
                        height={60}
                        style={{ borderRadius: '8px', objectFit: 'cover' }}
                        fallback={fallbackImage}
                    />
                    <div>
                        <Text strong>{record.crop_name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>#{record.id}</Text>
                    </div>
                </Space>
            ),
        },
        { title: 'Farmer', dataIndex: ['farmer', 'name'], key: 'farmer' },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category) => <Tag color="blue">{String(category || 'uncategorized').toUpperCase()}</Tag>,
        },
        {
            title: 'Price',
            dataIndex: 'price_per_unit',
            key: 'price_per_unit',
            render: (value, record) => `INR ${Number(value || 0).toFixed(2)}/${record.unit || 'unit'}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colorMap = {
                    pending_review: 'gold',
                    active: 'green',
                    rejected: 'red',
                    draft: 'default',
                    expired: 'volcano',
                    sold: 'blue',
                };
                return <Tag color={colorMap[status] || 'default'}>{String(status || '').replaceAll('_', ' ').toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Submitted',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (value) => new Date(value).toLocaleDateString(),
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
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => {
                            setModerationTarget(record);
                            setModerationStatus('active');
                            setModerationNote(record.moderation_note || '');
                        }}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                            setModerationTarget(record);
                            setModerationStatus('rejected');
                            setModerationNote(record.moderation_note || '');
                        }}
                    >
                        Reject
                    </Button>
                    <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setSelectedProduct(record)} />
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

    const tabItems = [
        { key: 'pending_review', label: `Pending (${products.filter((item) => item.status === 'pending_review').length})` },
        { key: 'active', label: `Approved (${products.filter((item) => item.status === 'active').length})` },
        { key: 'rejected', label: `Rejected (${products.filter((item) => item.status === 'rejected').length})` },
        { key: 'all', label: `All (${products.length})` },
    ];

    return (
        <Layout className="admin-dashboard-layout">
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} className="admin-sider" width={260}>
                <div className="logo-section-admin">
                    <div className="logo-icon-admin"><SafetyCertificateOutlined /></div>
                    {!collapsed && <div><Title level={5} style={{ margin: 0, color: 'white' }}>AgriMarket</Title><Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Admin Console</Text></div>}
                </div>
                <Menu theme="dark" selectedKeys={['products']} mode="inline" items={menuItems} className="admin-menu" />
                <div className="admin-profile-section"><div className="admin-profile-card"><Avatar size={40} icon={<UserOutlined />} />{!collapsed && <div className="admin-info"><Text strong style={{ color: 'white', fontSize: '14px' }}>{currentUser?.name || 'Admin User'}</Text><Tag color="purple" style={{ fontSize: '10px', padding: '0 6px' }}>{String(currentUser?.user_type || 'admin').toUpperCase()}</Tag></div>}</div></div>
            </Sider>

            <Layout>
                <Header className="admin-header">
                    <div className="admin-header-left"><Title level={3} style={{ margin: 0 }}>Product Moderation</Title></div>
                    <div className="admin-header-right">
                        <Input
                            placeholder="Search listings..."
                            prefix={<SearchOutlined />}
                            style={{ width: 250, borderRadius: 8 }}
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
                        <Badge count={products.filter((item) => item.status === 'pending_review').length} offset={[-5, 5]}>
                            <Button type="text" icon={<ShoppingOutlined style={{ fontSize: '20px' }} />} />
                        </Badge>
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer', background: '#722ed1' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="admin-content">
                    <div className="admin-welcome">
                        <Title level={2}>Listing Approval Queue</Title>
                        <Paragraph type="secondary">Approve listings to make them publicly visible or reject them with an actionable note for the farmer.</Paragraph>
                    </div>
                    <Card className="verification-card">
                        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
                        <Table
                            columns={columns}
                            dataSource={filteredProducts}
                            className="verification-table"
                            rowKey="id"
                            locale={{ emptyText: 'No listings match the current moderation filter.' }}
                        />
                    </Card>
                </Content>
            </Layout>

            <Modal
                open={Boolean(selectedProduct)}
                onCancel={() => setSelectedProduct(null)}
                footer={null}
                title={selectedProduct?.crop_name || 'Listing details'}
            >
                {selectedProduct ? (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Image
                            src={selectedProduct.image_url ? `${getBackendOrigin()}${selectedProduct.image_url}` : fallbackImage}
                            fallback={fallbackImage}
                            style={{ borderRadius: 12 }}
                        />
                        <Text><strong>Farmer:</strong> {selectedProduct?.farmer?.name || 'Unknown'}</Text>
                        <Text><strong>Category:</strong> {selectedProduct.category || 'N/A'}</Text>
                        <Text><strong>Location:</strong> {selectedProduct.city || 'N/A'}, {selectedProduct.state || 'N/A'}</Text>
                        <Text><strong>Quantity:</strong> {selectedProduct.quantity} {selectedProduct.unit}</Text>
                        <Text><strong>Price:</strong> INR {Number(selectedProduct.price_per_unit || 0).toFixed(2)}</Text>
                        <Text><strong>Status:</strong> {selectedProduct.status}</Text>
                        <Text><strong>Admin note:</strong> {selectedProduct.moderation_note || 'No note yet'}</Text>
                        <Paragraph style={{ marginBottom: 0 }}>{selectedProduct.description || 'No description provided.'}</Paragraph>
                    </Space>
                ) : null}
            </Modal>

            <Modal
                open={Boolean(moderationTarget)}
                onCancel={() => {
                    if (!submitting) {
                        setModerationTarget(null);
                        setModerationNote('');
                    }
                }}
                onOk={handleModeration}
                confirmLoading={submitting}
                okText={moderationStatus === 'active' ? 'Approve Listing' : 'Reject Listing'}
                title={moderationStatus === 'active' ? 'Approve listing' : 'Reject listing'}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>
                        {moderationStatus === 'active'
                            ? `Approve "${moderationTarget?.crop_name || ''}" and make it live on the marketplace.`
                            : `Reject "${moderationTarget?.crop_name || ''}" and send the farmer a moderation note.`}
                    </Text>
                    <TextArea
                        rows={4}
                        value={moderationNote}
                        onChange={(event) => setModerationNote(event.target.value)}
                        placeholder={moderationStatus === 'active' ? 'Optional admin note' : 'Reason for rejection'}
                    />
                </Space>
            </Modal>
        </Layout>
    );
};

export default ProductModeration;
