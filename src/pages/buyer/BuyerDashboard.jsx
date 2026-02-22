import React, { useEffect, useMemo, useState } from 'react';
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
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../api/products';
import { addToCart, getCart } from '../../api/cart';
import { getApiErrorMessage } from '../../utils/apiError';
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
    return `http://localhost:8080${imageUrl}`;
};

const BuyerDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [addingProductId, setAddingProductId] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [searchText, setSearchText] = useState('');
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const t = setTimeout(() => setQuery(searchText.trim()), 300);
        return () => clearTimeout(t);
    }, [searchText]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [productsData, cartData] = await Promise.all([
                getProducts({
                    limit: 12,
                    status: 'active',
                    sort_by: sortMap[sortBy] || 'date_desc',
                    ...(query ? { crop_name: query } : {}),
                }),
                getCart(),
            ]);
            setProducts(productsData?.items || []);
            setCartCount((cartData?.items || []).length);
        } catch (error) {
            setProducts([]);
            setCartCount(0);
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

    const priceStats = useMemo(() => {
        if (!products.length) return { min: 0, max: 0 };
        let min = Number(products[0].price_per_unit || 0);
        let max = min;
        products.forEach((p) => {
            const v = Number(p.price_per_unit || 0);
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
                                                    INR {Number(product.price_per_unit || 0).toFixed(2)}
                                                </Text>
                                                <Text type="secondary">/{product.unit || 'unit'}</Text>
                                            </div>
                                        </div>
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
                                <Card><Text type="secondary">No products found.</Text></Card>
                            </Col>
                        ) : null}
                    </Row>
                </Spin>
            </Content>
        </Layout>
    );
};

export default BuyerDashboard;

