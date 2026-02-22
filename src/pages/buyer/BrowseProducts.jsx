import React, { useEffect, useState } from 'react';
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
} from 'antd';
import {
    SearchOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    EnvironmentOutlined,
    StarFilled,
    LogoutOutlined,
    ShopOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../api/products';
import { addToCart, getCart } from '../../api/cart';
import { message } from 'antd';
import { getApiErrorMessage } from '../../utils/apiError';
import './BuyerDashboard.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const fallbackImage = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return fallbackImage;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
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
                const data = await getCart();
                setCartCount((data?.items || []).length);
            } catch {
                setCartCount(0);
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
                                                    INR {Number(product.price_per_unit || 0).toFixed(2)}
                                                </Text>
                                                <Text type="secondary">/{product.unit || 'unit'}</Text>
                                            </div>
                                        </div>
                                        <div className="product-location">
                                            <EnvironmentOutlined style={{ color: '#13ec13' }} />
                                            <Text type="secondary">{product?.farmer?.name || 'Unknown Farmer'}</Text>
                                        </div>
                                        <div className="product-rating">
                                            <StarFilled style={{ color: '#faad14' }} />
                                            <Text>{product?.farmer?.farmer_profile?.rating_average?.toFixed?.(1) || 'New'} (live)</Text>
                                        </div>
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
        </Layout>
    );
};

export default BrowseProducts;
