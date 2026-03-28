import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
    Layout,
    Card,
    Row,
    Col,
    Button,
    Input,
    Select,
    Checkbox,
    Slider,
    Tag,
    Badge,
    Avatar,
    Space,
    Typography,
    Dropdown,
    Spin,
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
    HeartOutlined,
    HeartFilled,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../api/products';
import { addToCart, getCart } from '../../api/cart';
import { createBulkOrder, createHarvestRequest } from '../../api/orders';
import { getMyFavorites, toggleFavorite } from '../../api/users';
import { message } from 'antd';
import { getApiErrorMessage } from '../../utils/apiError';
import { getBackendOrigin } from '../../api/client';
import './BuyerDashboard.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const fallbackImage = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return fallbackImage;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${getBackendOrigin()}${imageUrl}`;
};

const sortMap = {
    newest: 'date_desc',
    'price-low': 'price_asc',
    'price-high': 'price_desc',
    rating: 'date_desc',
};

const categoryMap = {
    all: '',
    vegetables: 'vegetables',
    fruits: 'fruits',
    grains: 'grains',
    dairy: 'dairy',
};

const BrowseProducts = () => {
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [products, setProducts] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [category, setCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [addingProductId, setAddingProductId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [harvestModalOpen, setHarvestModalOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [bulkForm] = Form.useForm();
    const [harvestForm] = Form.useForm();
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const navigate = useNavigate();
    const { logout } = useAuth();
    const selectedFarmerID = searchParams.get('farmer_id') || '';
    const selectedFarmerName = searchParams.get('farmer_name') || '';

    useEffect(() => {
        const t = setTimeout(() => {
            setQuery(searchText.trim());
        }, 300);
        return () => clearTimeout(t);
    }, [searchText]);

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                const params = {
                    limit: 60,
                    status: 'active',
                    sort_by: sortMap[sortBy] || 'date_desc',
                    ranking_mode: (sortBy === 'price-low' || sortBy === 'price-high') ? 'none' : 'fairness',
                    min_price: Number(priceRange[0] || 0),
                    max_price: Number(priceRange[1] || 1000),
                };
                if (selectedFarmerID) {
                    params.farmer_id = selectedFarmerID;
                }
                if (query) {
                    params.crop_name = query;
                } else if (categoryMap[category]) {
                    params.category = categoryMap[category];
                }
                const data = await getProducts(params);
                setProducts(data?.items || []);
            } catch (error) {
                setProducts([]);
                message.error(getApiErrorMessage(error, 'Failed to load products'));
            } finally {
                setLoading(false);
            }
        };

        const loadCartCount = async () => {
            try {
                const [data, favoritesData] = await Promise.all([getCart(), getMyFavorites()]);
                setCartCount((data?.items || []).length);
                setFavoriteIds(new Set((favoritesData?.items || []).map((item) => item.product_id)));
            } catch {
                setCartCount(0);
                setFavoriteIds(new Set());
            }
        };

        loadProducts();
        loadCartCount();
    }, [query, priceRange, sortBy, category, selectedFarmerID]);

    const handleAddToCart = async (productId) => {
        try {
            setAddingProductId(productId);
            await addToCart({ product_id: productId, quantity: 1 });
            message.success('Added to cart');
            const data = await getCart();
            setCartCount((data?.items || []).length);
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
            bulkForm.resetFields();
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
            harvestForm.resetFields();
            navigate('/buyer/orders');
        } catch (error) {
            if (!error?.errorFields) {
                message.error(getApiErrorMessage(error, 'Failed to send harvest request'));
            }
        } finally {
            setSubmitting(false);
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
                        <Dropdown
                            menu={{
                                items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }],
                            }}
                        >
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer' }} />
                        </Dropdown>
                    </div>
                </div>
            </Header>

            <Layout>
                <Sider width={280} className="filter-sider" theme="light">
                    <div className="filter-section">
                        <Title level={5} className="filter-title">SEARCH FILTERS</Title>
                        <Input
                            placeholder="Search keywords..."
                            style={{ marginBottom: '16px', borderRadius: '8px' }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />

                        <Title level={5} className="filter-title">CATEGORIES</Title>
                        <div className="category-list">
                            <div className={`category-item ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>All Produce</div>
                            <div className={`category-item ${category === 'vegetables' ? 'active' : ''}`} onClick={() => setCategory('vegetables')}>Vegetables</div>
                            <div className={`category-item ${category === 'fruits' ? 'active' : ''}`} onClick={() => setCategory('fruits')}>Fruits</div>
                            <div className={`category-item ${category === 'grains' ? 'active' : ''}`} onClick={() => setCategory('grains')}>Grains</div>
                            <div className={`category-item ${category === 'dairy' ? 'active' : ''}`} onClick={() => setCategory('dairy')}>Dairy & Eggs</div>
                        </div>
                    </div>

                    <div className="filter-section">
                        <Title level={5} className="filter-title">PRICE RANGE</Title>
                        <Slider range value={priceRange} onChange={setPriceRange} max={1000} className="price-slider" />
                        <div className="price-inputs">
                            <Input prefix="INR " value={priceRange[0]} size="small" readOnly />
                            <Input prefix="INR " value={priceRange[1]} size="small" readOnly />
                        </div>
                    </div>

                    <div className="filter-section">
                        <Title level={5} className="filter-title">SPECIFICATIONS</Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Checkbox>Organic Only</Checkbox>
                            <Checkbox>Pesticide Free</Checkbox>
                            <Checkbox>Bulk Available</Checkbox>
                            <Checkbox>Same Day Pickup</Checkbox>
                        </Space>
                    </div>
                </Sider>

                <Content className="buyer-content">
                    <div className="content-header">
                        <div>
                            <Title level={2}>{selectedFarmerName ? `${selectedFarmerName}'s Store` : 'Browse All Produce'}</Title>
                            <Text type="secondary">
                                {selectedFarmerName ? 'Showing products from selected farmer only' : 'Discover fresh items from verified local farmers'}
                            </Text>
                            {selectedFarmerID ? (
                                <div style={{ marginTop: '8px' }}>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            const next = new URLSearchParams(searchParams);
                                            next.delete('farmer_id');
                                            next.delete('farmer_name');
                                            setSearchParams(next);
                                        }}
                                    >
                                        Clear Store Filter
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                        <div className="sort-section">
                            <Select value={sortBy} style={{ width: 180 }} onChange={setSortBy}>
                                <Option value="newest">Newest Arrivals</Option>
                                <Option value="price-low">Price: Low to High</Option>
                                <Option value="price-high">Price: High to Low</Option>
                                <Option value="rating">Top Rated</Option>
                            </Select>
                        </div>
                    </div>

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
                                            <Text type="secondary">{product?.farmer?.name || 'Unknown Farmer'}</Text>
                                        </div>
                                        <div className="product-rating">
                                            <StarFilled style={{ color: '#faad14' }} />
                                            <Text>{product?.farmer?.farmer_profile?.rating_average?.toFixed?.(1) || 'New'} (live)</Text>
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
                                            <Button
                                                block
                                                style={{ marginTop: 8 }}
                                                onClick={() => openBulkModal(product)}
                                                disabled={product.status !== 'active' || Number(product.quantity || 0) <= 0}
                                            >
                                                Bulk Order
                                            </Button>
                                        ) : null}
                                        {product.supports_harvest_request ? (
                                            <Button
                                                block
                                                style={{ marginTop: 8 }}
                                                onClick={() => openHarvestModal(product)}
                                            >
                                                Request Harvest
                                            </Button>
                                        ) : null}
                                    </div>
                                </Card>
                            </Col>
                        ))}
                        {!loading && products.length === 0 ? (
                            <Col span={24}>
                                <Card><Text type="secondary">No products found for the selected filters.</Text></Card>
                            </Col>
                        ) : null}
                    </Row>
                    </Spin>
                </Content>
            </Layout>
            <Modal
                title={activeProduct ? `Bulk Order: ${activeProduct.crop_name}` : 'Bulk Order'}
                open={bulkModalOpen}
                onCancel={() => setBulkModalOpen(false)}
                onOk={handleCreateBulkOrder}
                confirmLoading={submitting}
                okText="Place Bulk Order"
            >
                <Form form={bulkForm} layout="vertical">
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Bulk ordering uses current inventory and immediately enters the order pipeline.
                    </Text>
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
            <Modal
                title={activeProduct ? `Request Harvest: ${activeProduct.crop_name}` : 'Request Harvest'}
                open={harvestModalOpen}
                onCancel={() => setHarvestModalOpen(false)}
                onOk={handleCreateHarvestRequest}
                confirmLoading={submitting}
                okText="Send Request"
            >
                <Form form={harvestForm} layout="vertical">
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Harvest requests are future commitments. Convert the request into an order after farmer approval.
                    </Text>
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

export default BrowseProducts;
