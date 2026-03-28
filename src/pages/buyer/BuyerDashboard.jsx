import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
    Layout,
    Card,
    Row,
    Col,
    Button,
    Input,
    Select,
    Tag,
    Badge,
    Avatar,
    Space,
    Typography,
    Dropdown,
    Statistic,
    Spin,
    message,
    Modal,
    Form,
    InputNumber,
    DatePicker,
} from 'antd';
import {
    SearchOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    EnvironmentOutlined,
    StarFilled,
    LogoutOutlined,
    ShopOutlined,
    ArrowRightOutlined,
    HeartOutlined,
    HeartFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../api/products';
import { addToCart, getCart } from '../../api/cart';
import { createBulkOrder, createHarvestRequest } from '../../api/orders';
import { getMyFavorites, toggleFavorite } from '../../api/users';
import { getApiErrorMessage } from '../../utils/apiError';
import { getBackendOrigin } from '../../api/client';
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const fallbackImage = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

const sortMap = {
    newest: 'date_desc',
    'price-low': 'price_asc',
    'price-high': 'price_desc',
};

const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return fallbackImage;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${getBackendOrigin()}${imageUrl}`;
};

const BuyerDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [addingProductId, setAddingProductId] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [searchText, setSearchText] = useState('');
    const [query, setQuery] = useState('');
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [harvestModalOpen, setHarvestModalOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [bulkForm] = Form.useForm();
    const [harvestForm] = Form.useForm();
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const t = setTimeout(() => setQuery(searchText.trim()), 300);
        return () => clearTimeout(t);
    }, [searchText]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [productsData, cartData, favoritesData] = await Promise.all([
                getProducts({
                    limit: 12,
                    status: 'active',
                    sort_by: sortMap[sortBy] || 'date_desc',
                    ranking_mode: (sortBy === 'price-low' || sortBy === 'price-high') ? 'none' : 'fairness',
                    ...(query ? { crop_name: query } : {}),
                }),
                getCart(),
                getMyFavorites(),
            ]);
            setProducts(productsData?.items || []);
            setCartCount((cartData?.items || []).length);
            setFavoriteIds(new Set((favoritesData?.items || []).map((item) => item.product_id)));
        } catch (error) {
            setProducts([]);
            setCartCount(0);
            setFavoriteIds(new Set());
            message.error(getApiErrorMessage(error, 'Failed to load dashboard'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [sortBy, query]);

    const handleAddToCart = async (productId) => {
        try {
            setAddingProductId(productId);
            await addToCart({ product_id: productId, quantity: 1 });
            const cartData = await getCart();
            setCartCount((cartData?.items || []).length);
            message.success('Added to cart');
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Failed to add item'));
        } finally {
            setAddingProductId(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleToggleFavorite = async (productId) => {
        try {
            const data = await toggleFavorite(productId);
            setFavoriteIds((prev) => {
                const next = new Set(prev);
                if (data?.active) next.add(productId);
                else next.delete(productId);
                return next;
            });
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Failed to update favorites'));
        }
    };

    const openBulkModal = (product) => {
        setActiveProduct(product);
        bulkForm.setFieldsValue({
            quantity: Number(product.minimum_bulk_quantity || product.quantity || 1),
            delivery_address: '',
            buyer_note: '',
            payment_method: 'cod',
            payment_reference: '',
            preferred_date: null,
        });
        setBulkModalOpen(true);
    };

    const openHarvestModal = (product) => {
        setActiveProduct(product);
        harvestForm.setFieldsValue({
            requested_quantity: Number(product.minimum_bulk_quantity || product.quantity || 1),
            preferred_harvest_date: product.harvest_lead_days ? dayjs().add(Number(product.harvest_lead_days), 'day') : null,
            delivery_address: '',
            buyer_note: '',
        });
        setHarvestModalOpen(true);
    };

    const handleCreateBulkOrder = async () => {
        if (!activeProduct) return;
        try {
            const values = await bulkForm.validateFields();
            setSubmitting(true);
            await createBulkOrder({
                product_id: activeProduct.id,
                quantity: Number(values.quantity),
                delivery_address: values.delivery_address || '',
                buyer_note: values.buyer_note || '',
                payment_method: values.payment_method,
                payment_reference: values.payment_reference || '',
                preferred_date: values.preferred_date ? values.preferred_date.toISOString() : '',
            });
            message.success('Bulk order placed successfully');
            setBulkModalOpen(false);
            navigate('/buyer/orders');
        } catch (error) {
            if (!error?.errorFields) {
                message.error(getApiErrorMessage(error, 'Failed to place bulk order'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateHarvestRequest = async () => {
        if (!activeProduct) return;
        try {
            const values = await harvestForm.validateFields();
            setSubmitting(true);
            await createHarvestRequest({
                product_id: activeProduct.id,
                requested_quantity: Number(values.requested_quantity),
                preferred_harvest_date: values.preferred_harvest_date.toISOString(),
                delivery_address: values.delivery_address || '',
                buyer_note: values.buyer_note || '',
            });
            message.success('Harvest request sent successfully');
            setHarvestModalOpen(false);
            navigate('/buyer/orders');
        } catch (error) {
            if (!error?.errorFields) {
                message.error(getApiErrorMessage(error, 'Failed to send harvest request'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const priceStats = useMemo(() => {
        if (!products.length) return { min: 0, max: 0 };
        let min = Number(products[0].display_price ?? products[0].price_per_unit ?? 0);
        let max = min;
        products.forEach((p) => {
            const v = Number(p.display_price ?? p.price_per_unit ?? 0);
            if (v < min) min = v;
            if (v > max) max = v;
        });
        return { min, max };
    }, [products]);

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
                            placeholder="Search products..."
                            prefix={<SearchOutlined style={{ color: '#13ec13' }} />}
                            className="main-search"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
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
                <Card className="product-card" style={{ marginBottom: '24px' }}>
                    <Row gutter={[24, 16]} align="middle">
                        <Col xs={24} lg={16}>
                            <Title level={2} style={{ marginBottom: '8px' }}>Fresh Marketplace</Title>
                            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                Live produce listings from registered farmers. Prices and stock are updated from the database.
                            </Paragraph>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
                                <Select value={sortBy} onChange={setSortBy} style={{ width: 200 }}>
                                    <Option value="newest">Newest Arrivals</Option>
                                    <Option value="price-low">Price: Low to High</Option>
                                    <Option value="price-high">Price: High to Low</Option>
                                </Select>
                                <Button type="primary" className="add-to-cart-btn" onClick={() => navigate('/buyer/browse')}>
                                    Open Full Browse <ArrowRightOutlined />
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </Card>

                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12} lg={8}>
                        <Card className="stat-card">
                            <Statistic title="Live Listings" value={products.length} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Card className="stat-card">
                            <Statistic title="Lowest Price" value={Number(priceStats.min.toFixed(2))} prefix="INR " />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Card className="stat-card">
                            <Statistic title="Highest Price" value={Number(priceStats.max.toFixed(2))} prefix="INR " />
                        </Card>
                    </Col>
                </Row>

                <Spin spinning={loading}>
                    <Row gutter={[24, 24]} className="product-grid">
                        {products.map((product) => (
                            <Col xs={24} sm={12} lg={8} key={product.id}>
                                <Card
                                    className="product-card"
                                    hoverable
                                    cover={(
                                        <div className="product-image-wrapper">
                                            <img src={resolveImageUrl(product.image_url)} alt={product.crop_name} />
                                            {product.status === 'active' ? <Tag color="success" className="product-badge">ACTIVE</Tag> : null}
                                        </div>
                                    )}
                                >
                                    <div className="product-info">
                                        <div className="product-header">
                                            <Title level={4} className="product-name">{product.crop_name}</Title>
                                            <div className="product-price">
                                                <Text strong style={{ fontSize: '18px', color: '#13ec13' }}>
                                                    INR {Number(product.display_price ?? product.price_per_unit ?? 0).toFixed(2)}
                                                </Text>
                                                <Text type="secondary">/{product.unit || 'unit'}</Text>
                                            </div>
                                        </div>
                                        <Button
                                            type="text"
                                            style={{ padding: 0, marginBottom: 8 }}
                                            onClick={() => handleToggleFavorite(product.id)}
                                            icon={favoriteIds.has(product.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                        >
                                            {favoriteIds.has(product.id) ? 'Saved' : 'Save'}
                                        </Button>
                                        <div className="product-location">
                                            <EnvironmentOutlined style={{ color: '#13ec13' }} />
                                            <Text type="secondary">
                                                {product?.farmer?.name || 'Unknown Farmer'} | {product.city || 'N/A'}, {product.state || 'N/A'}
                                            </Text>
                                        </div>
                                        <div className="product-rating">
                                            <StarFilled style={{ color: '#faad14' }} />
                                            <Text>{product?.farmer?.farmer_profile?.rating_average?.toFixed?.(1) || 'New'}</Text>
                                        </div>
                                        <div className="product-rating">
                                            <Text type="secondary">Freshness: {product?.freshness_label || 'Fresh'}</Text>
                                        </div>
                                        {product.is_bulk_available ? (
                                            <div className="product-rating">
                                                <Text type="secondary">Bulk ready from {Number(product.minimum_bulk_quantity || 0)} {product.unit || 'unit'}</Text>
                                            </div>
                                        ) : null}
                                        {product.supports_harvest_request ? (
                                            <div className="product-rating">
                                                <Text type="secondary">Harvest requests enabled{Number(product.harvest_lead_days || 0) > 0 ? ` | lead time ${product.harvest_lead_days} day(s)` : ''}</Text>
                                            </div>
                                        ) : null}
                                        <Button
                                            type="primary"
                                            block
                                            icon={<ShoppingCartOutlined />}
                                            className="add-to-cart-btn"
                                            onClick={() => handleAddToCart(product.id)}
                                            loading={addingProductId === product.id}
                                            disabled={product.status !== 'active' || Number(product.quantity || 0) <= 0}
                                        >
                                            Add to Cart
                                        </Button>
                                        {product.is_bulk_available ? (
                                            <Button block style={{ marginTop: 8 }} onClick={() => openBulkModal(product)}>
                                                Bulk Order
                                            </Button>
                                        ) : null}
                                        {product.supports_harvest_request ? (
                                            <Button block style={{ marginTop: 8 }} onClick={() => openHarvestModal(product)}>
                                                Request Harvest
                                            </Button>
                                        ) : null}
                                    </div>
                                </Card>
                            </Col>
                        ))}
                        {!loading && products.length === 0 ? (
                            <Col span={24}>
                                <Card><Text type="secondary">No products found.</Text></Card>
                            </Col>
                        ) : null}
                    </Row>
                </Spin>
            </Content>
            <Modal title={activeProduct ? `Bulk Order: ${activeProduct.crop_name}` : 'Bulk Order'} open={bulkModalOpen} onCancel={() => setBulkModalOpen(false)} onOk={handleCreateBulkOrder} confirmLoading={submitting} okText="Place Bulk Order">
                <Form form={bulkForm} layout="vertical">
                    <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                        This creates a live bulk order from current stock and sends it directly into the normal order flow.
                    </Paragraph>
                    <Form.Item label="Quantity" name="quantity" rules={[{ required: true, message: 'Enter quantity' }]}>
                        <InputNumber min={Number(activeProduct?.minimum_bulk_quantity || 1)} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Preferred Date" name="preferred_date">
                        <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} />
                    </Form.Item>
                    <Form.Item label="Delivery Address" name="delivery_address">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Payment Method" name="payment_method" rules={[{ required: true, message: 'Select payment method' }]}>
                        <Select
                            options={[
                                { value: 'cod', label: 'Cash on Delivery' },
                                { value: 'upi', label: 'UPI ID' },
                                { value: 'online_banking', label: 'Online Banking' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item shouldUpdate={(prev, curr) => prev.payment_method !== curr.payment_method} noStyle>
                        {({ getFieldValue }) => {
                            const method = getFieldValue('payment_method');
                            if (method === 'cod') return null;
                            return (
                                <Form.Item
                                    label={method === 'upi' ? 'UPI ID' : 'Bank Reference'}
                                    name="payment_reference"
                                    rules={[{ required: true, message: method === 'upi' ? 'Enter UPI ID' : 'Enter bank reference' }]}
                                >
                                    <Input />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>
                    <Form.Item label="Buyer Note" name="buyer_note">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal title={activeProduct ? `Request Harvest: ${activeProduct.crop_name}` : 'Request Harvest'} open={harvestModalOpen} onCancel={() => setHarvestModalOpen(false)} onOk={handleCreateHarvestRequest} confirmLoading={submitting} okText="Send Request">
                <Form form={harvestForm} layout="vertical">
                    <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                        This is a future supply request. The farmer must accept it before you can convert it into a real order.
                    </Paragraph>
                    <Form.Item label="Requested Quantity" name="requested_quantity" rules={[{ required: true, message: 'Enter quantity' }]}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Preferred Harvest Date" name="preferred_harvest_date" rules={[{ required: true, message: 'Select date' }]}>
                        <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} />
                    </Form.Item>
                    <Form.Item label="Delivery Address" name="delivery_address">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Buyer Note" name="buyer_note">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default BuyerDashboard;
