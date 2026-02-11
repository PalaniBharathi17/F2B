import React, { useState } from 'react';
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
import useMockData from '../../hooks/useMockData';
import './BuyerDashboard.css';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const BuyerDashboard = () => {
    const [priceRange, setPriceRange] = useState([0, 60]);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const { data: products } = useMockData('buyer');

    return (
        <Layout className="buyer-dashboard-layout">
            {/* Header */}
            <Header className="buyer-header">
                <div className="header-content-buyer">
                    <div className="logo-buyer" onClick={() => navigate('/buyer/dashboard')} style={{ cursor: 'pointer' }}>
                        <ShopOutlined style={{ fontSize: '28px', color: '#13ec13' }} />
                        <Title level={4} style={{ margin: 0 }}>AgriMarket</Title>
                    </div>

                    <div className="search-bar-buyer">
                        <Input
                            size="large"
                            placeholder="Search for organic tomatoes, fresh honey, or local grains..."
                            prefix={<SearchOutlined style={{ color: '#13ec13' }} />}
                            className="main-search"
                        />
                    </div>

                    <div className="header-actions-buyer">
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/browse')}>Browse</Button>
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/farmers')}>Farmers</Button>
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/orders')}>Orders</Button>
                        <Badge count={3} offset={[-5, 5]}>
                            <Button
                                type="text"
                                icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />}
                                className="cart-btn"
                                aria-label="Open cart"
                                onClick={() => navigate('/buyer/cart')}
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
                {/* Sidebar Filters */}
                <Sider width={280} className="filter-sider" theme="light">
                    <div className="filter-section">
                        <Title level={5} className="filter-title">CATEGORIES</Title>
                        <div className="category-list">
                            <div className="category-item active">
                                <FilterOutlined /> All Produce
                            </div>
                            <div className="category-item">
                                🥬 Vegetables
                            </div>
                            <div className="category-item">
                                🍎 Fruits
                            </div>
                            <div className="category-item">
                                🌾 Grains
                            </div>
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
                            <Input prefix="$" value={priceRange[0]} size="small" />
                            <Input prefix="$" value={priceRange[1]} size="small" />
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

                {/* Main Content */}
                <Content className="buyer-content">
                    <div className="content-header">
                        <div>
                            <Title level={2}>Fresh Marketplace</Title>
                            <Text type="secondary">248 products found in your area</Text>
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

                    {/* Product Grid */}
                    <Row gutter={[24, 24]} className="product-grid">
                        {products.map(product => (
                            <Col xs={24} sm={12} lg={8} key={product.id}>
                                <Card
                                    className="product-card"
                                    hoverable
                                    cover={
                                        <div className="product-image-wrapper">
                                            <img src={product.image} alt={product.name} />
                                            {product.organic && (
                                                <Tag color="success" className="product-badge">ORGANIC</Tag>
                                            )}
                                            {product.bulk && (
                                                <Tag color="processing" className="product-badge">BULK AVAILABLE</Tag>
                                            )}
                                            <Button
                                                type="text"
                                                icon={<HeartOutlined />}
                                                className="favorite-btn"
                                                aria-label={`Add ${product.name} to favorites`}
                                            />
                                        </div>
                                    }
                                >
                                    <div className="product-info">
                                        <div className="product-header">
                                            <Title level={4} className="product-name">{product.name}</Title>
                                            <div className="product-price">
                                                <Text strong style={{ fontSize: '20px', color: '#13ec13' }}>
                                                    ${product.price}
                                                </Text>
                                                <Text type="secondary">/{product.unit}</Text>
                                            </div>
                                        </div>
                                        <div className="product-location">
                                            <EnvironmentOutlined style={{ color: '#13ec13' }} />
                                            <Text type="secondary">{product.farmer} • {product.distance}</Text>
                                        </div>
                                        <div className="product-rating">
                                            <StarFilled style={{ color: '#faad14' }} />
                                            <Text>{product.rating}</Text>
                                        </div>
                                        <Button
                                            type="primary"
                                            block
                                            icon={<ShoppingCartOutlined />}
                                            className="add-to-cart-btn"
                                        >
                                            Add to Cart
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Pagination */}
                    <div className="pagination-section">
                        <Button icon={<span>←</span>}>Previous</Button>
                        <Space>
                            <Button type="primary">1</Button>
                            <Button>2</Button>
                            <Button>3</Button>
                            <Text>...</Text>
                            <Button>12</Button>
                        </Space>
                        <Button icon={<span>→</span>} iconPosition="end">Next</Button>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default BuyerDashboard;
