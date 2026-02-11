import React from 'react';
import {
    Layout,
    Card,
    Row,
    Col,
    Button,
    Badge,
    Avatar,
    Space,
    Typography,
    Dropdown,
    Divider,
    InputNumber,
    Empty
} from 'antd';
import {
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    ShopOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    CreditCardOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const Cart = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const cartItems = [
        {
            id: 1,
            name: 'Organic Red Tomatoes',
            price: 4.50,
            unit: 'kg',
            quantity: 3,
            farmer: 'Green Valley Farm',
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&h=100&fit=crop'
        },
        {
            id: 2,
            name: 'Fresh Spinach',
            price: 3.20,
            unit: 'bunch',
            quantity: 5,
            farmer: 'Sunny Acres',
            image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop'
        }
    ];

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = 5.00;
    const total = subtotal + shipping;

    return (
        <Layout className="buyer-dashboard-layout">
            <Header className="buyer-header">
                <div className="header-content-buyer">
                    <div className="logo-buyer" onClick={() => navigate('/buyer/dashboard')} style={{ cursor: 'pointer' }}>
                        <ShopOutlined style={{ fontSize: '28px', color: '#13ec13' }} />
                        <Title level={4} style={{ margin: 0 }}>AgriMarket</Title>
                    </div>

                    <div className="header-actions-buyer">
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/browse')}>Browse</Button>
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/farmers')}>Farmers</Button>
                        <Button type="text" className="nav-link" onClick={() => navigate('/buyer/orders')}>Orders</Button>
                        <Badge count={cartItems.length} offset={[-5, 5]}>
                            <Button
                                type="text"
                                icon={<ShoppingCartOutlined style={{ fontSize: '20px', color: '#13ec13' }} />}
                                className="cart-btn"
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

            <Content className="buyer-content">
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/buyer/browse')}
                    style={{ marginBottom: '24px', color: '#13ec13' }}
                >
                    Back to Marketplace
                </Button>

                <Title level={2} style={{ marginBottom: '32px' }}>Shopping Cart</Title>

                {cartItems.length > 0 ? (
                    <Row gutter={32}>
                        <Col xs={24} lg={16}>
                            <Card className="product-card" style={{ padding: '0 24px' }}>
                                {cartItems.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        <div style={{ padding: '24px 0', display: 'flex', gap: '24px', alignItems: 'center' }}>
                                            <img src={item.image} alt={item.name} style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <Title level={4} style={{ margin: 0 }}>{item.name}</Title>
                                                        <Text type="secondary">{item.farmer}</Text>
                                                    </div>
                                                    <Button type="text" danger icon={<DeleteOutlined />} />
                                                </div>
                                                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Space size="large">
                                                        <Text strong style={{ fontSize: '18px', color: '#13ec13' }}>${item.price} <small style={{ fontWeight: 400, color: '#999' }}>/ {item.unit}</small></Text>
                                                        <InputNumber min={1} defaultValue={item.quantity} size="large" style={{ borderRadius: '8px' }} />
                                                    </Space>
                                                    <Text strong style={{ fontSize: '18px' }}>${(item.price * item.quantity).toFixed(2)}</Text>
                                                </div>
                                            </div>
                                        </div>
                                        {index < cartItems.length - 1 && <Divider style={{ margin: 0 }} />}
                                    </React.Fragment>
                                ))}
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card className="product-card" title="Order Summary">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <Text type="secondary">Subtotal</Text>
                                    <Text strong>${subtotal.toFixed(2)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <Text type="secondary">Shipping (Flat rate)</Text>
                                    <Text strong>${shipping.toFixed(2)}</Text>
                                </div>
                                <Divider />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <Title level={3} style={{ margin: 0 }}>Total</Title>
                                    <Title level={3} style={{ margin: 0, color: '#13ec13' }}>${total.toFixed(2)}</Title>
                                </div>
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    icon={<CreditCardOutlined />}
                                    className="add-to-cart-btn"
                                    onClick={() => message.success('Redirecting to checkout...')}
                                >
                                    Proceed to Checkout
                                </Button>
                                <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
                                    Secure SSL encrypted transaction.
                                </Paragraph>
                            </Card>
                        </Col>
                    </Row>
                ) : (
                    <Card style={{ textAlign: 'center', padding: '64px 0' }}>
                        <Empty description="Your cart is empty" />
                        <Button type="primary" size="large" style={{ marginTop: '24px' }} onClick={() => navigate('/buyer/browse')}>
                            Start Shopping
                        </Button>
                    </Card>
                )}
            </Content>
        </Layout>
    );
};

export default Cart;
