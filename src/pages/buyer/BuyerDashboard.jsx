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
    Dropdown
} from 'antd';
import {
    SearchOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    HeartOutlined,
    FilterOutlined,
    EnvironmentOutlined,
    StarFilled,
    LogoutOutlined,
    ShopOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../api/products';
import { addToCart, getCart } from '../../api/cart';
import { message } from 'antd';
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

const BuyerDashboard = () => {
    const [priceRange, setPriceRange] = useState([0, 60]);
    const [products, setProducts] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await getProducts({ limit: 20 });
                setProducts(data?.items || []);
            } catch {
                setProducts([]);
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
    }, []);

    const handleAddToCart = async (productId) => {
        try {
            await addToCart({ product_id: productId, quantity: 1 });
            message.success('Added to cart');
            const data = await getCart();
            setCartCount((data?.items || []).length);
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to add item');
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
                    <div className="logo-buyer">
                        <ShopOutlined style={{ fontSize: '28px', color: '#13ec13' }} />
                        <Title level={4} style={{ margin: 0 }}>AgriMarket</Title>
                    </div>

                    <div className="search-bar-buyer">
                        <Input
                            size="large"
                            placeholder="Search products..."
                            prefix={<SearchOutlined style={{ color: '#13ec13' }} />}
                            className="main-search"
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
                                aria-label="Open cart"
                            />
                        </Badge>
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }
                                ]
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
                        <Title level={5} className="filter-title">CATEGORIES</Title>
                        <div className="category-list">
                            <div className="category-item active">
                                <FilterOutlined /> All Produce
                            </div>
                            <div className="category-item">Vegetables</div>
                            <div className="category-item">Fruits</div>
                            <div className="category-item">Grains</div>
                        </div>
                    </div>

                    <div className="filter-section">
                        <Title level={5} className="filter-title">PRICE RANGE</Title>
                        <Slider
                            range
                            value={priceRange}
                            onChange={setPriceRange}
                            max={100}
                            className="price-slider"
                        />
                        <div className="price-inputs">
                            <Input prefix="₹" value={priceRange[0]} size="small" />
                            <Input prefix="₹" value={priceRange[1]} size="small" />
                        </div>
                    </div>

                    <div className="filter-section">
                        <Title level={5} className="filter-title">OPTIONS</Title>
                        <Space direction="vertical">
                            <Checkbox defaultChecked>Organic Only</Checkbox>
                            <Checkbox>Near Me (&lt; 20mi)</Checkbox>
                            <Checkbox>Bulk Available</Checkbox>
                        </Space>
                    </div>
                </Sider>

                <Content className="buyer-content">
                    <div className="content-header">
                        <div>
                            <Title level={2}>Fresh Marketplace</Title>
                            <Text type="secondary">{products.length} products found</Text>
                        </div>
                        <div className="sort-section">
                            <Text>Sort by:</Text>
                            <Select defaultValue="newest" style={{ width: 200 }}>
                                <Option value="newest">Newest Arrivals</Option>
                                <Option value="price-low">Price: Low to High</Option>
                                <Option value="price-high">Price: High to Low</Option>
                                <Option value="nearest">Nearest First</Option>
                            </Select>
                        </div>
                    </div>

                    <Row gutter={[24, 24]} className="product-grid">
                        {products.map((product) => (
                            <Col xs={24} sm={12} lg={8} key={product.id}>
                                <Card
                                    className="product-card"
                                    hoverable
                                    cover={
                                        <div className="product-image-wrapper">
                                            <img src={resolveImageUrl(product.image_url)} alt={product.crop_name} />
                                            {product.status === 'active' && (
                                                <Tag color="success" className="product-badge">ACTIVE</Tag>
                                            )}
                                            <Button
                                                type="text"
                                                icon={<HeartOutlined />}
                                                className="favorite-btn"
                                                aria-label={`Add ${product.crop_name} to favorites`}
                                            />
                                        </div>
                                    }
                                >
                                    <div className="product-info">
                                        <div className="product-header">
                                            <Title level={4} className="product-name">{product.crop_name}</Title>
                                            <div className="product-price">
                                                <Text strong style={{ fontSize: '20px', color: '#13ec13' }}>
                                                    ₹{Number(product.price_per_unit || 0).toFixed(2)}
                                                </Text>
                                                <Text type="secondary">/{product.unit || 'unit'}</Text>
                                            </div>
                                        </div>
                                        <div className="product-location">
                                            <EnvironmentOutlined style={{ color: '#13ec13' }} />
                                            <Text type="secondary">
                                                {product?.farmer?.name || 'Unknown Farmer'} • {product.city || 'N/A'}, {product.state || 'N/A'}
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
                                        >
                                            Add to Cart
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Content>
            </Layout>
        </Layout>
    );
};

export default BuyerDashboard;
