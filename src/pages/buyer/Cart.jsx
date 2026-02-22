import React, { useEffect, useMemo, useState } from 'react';
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
    Empty,
    message,
    Input,
} from 'antd';
import {
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    ShopOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    CreditCardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkoutCart, getCart, removeCartItem, updateCartItem } from '../../api/cart';
import { getApiErrorMessage } from '../../utils/apiError';
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const fallbackImage = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&h=100&fit=crop';

const toImageUrl = (path) => {
    if (!path) return fallbackImage;
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path}`;
};

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const navigate = useNavigate();
    const { logout } = useAuth();

    const loadCart = async () => {
        try {
            const data = await getCart();
            setCartItems(data?.items || []);
        } catch {
            setCartItems([]);
        }
    };

    useEffect(() => {
        loadCart();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleQtyChange = async (item, quantity) => {
        const nextQty = Number(quantity || 1);
        const maxQty = Number(item?.product?.quantity || 0);
        if (maxQty > 0 && nextQty > maxQty) {
            message.error(`Only ${maxQty} available in stock`);
            return;
        }
        setUpdatingId(item.id);
        try {
            await updateCartItem(item.id, { quantity: nextQty });
            await loadCart();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Failed to update quantity'));
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRemove = async (id) => {
        try {
            await removeCartItem(id);
            await loadCart();
            message.success('Item removed');
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Failed to remove item'));
        }
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            message.error('Cart is empty');
            return;
        }
        setCheckoutLoading(true);
        try {
            await checkoutCart({ delivery_address: deliveryAddress.trim() });
            message.success('Checkout complete');
            await loadCart();
            setDeliveryAddress('');
            navigate('/buyer/orders');
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Checkout failed'));
        } finally {
            setCheckoutLoading(false);
        }
    };

    const subtotal = useMemo(
        () => cartItems.reduce((acc, item) => acc + (Number(item?.product?.price_per_unit || 0) * Number(item.quantity || 0)), 0),
        [cartItems],
    );
    const shipping = cartItems.length ? Number((subtotal * 0.05).toFixed(2)) : 0;
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
                            <Button type="text" icon={<ShoppingCartOutlined style={{ fontSize: '20px', color: '#13ec13' }} />} className="cart-btn" />
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

            <Content className="buyer-content">
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/buyer/browse')} style={{ marginBottom: '24px', color: '#13ec13' }}>
                    Back to Marketplace
                </Button>

                <Title level={2} style={{ marginBottom: '32px' }}>Shopping Cart</Title>

                {cartItems.length > 0 ? (
                    <Row gutter={32}>
                        <Col xs={24} lg={16}>
                            <Card className="product-card buyer-cart-list" style={{ padding: '0 24px' }}>
                                {cartItems.map((item, index) => {
                                    const unitPrice = Number(item?.product?.price_per_unit || 0);
                                    const lineTotal = unitPrice * Number(item.quantity || 0);
                                    const maxQty = Number(item?.product?.quantity || 0);
                                    return (
                                        <React.Fragment key={item.id}>
                                            <div className="buyer-cart-item">
                                                <img src={toImageUrl(item?.product?.image_url)} alt={item?.product?.crop_name} className="buyer-cart-item-image" />
                                                <div className="buyer-cart-item-content">
                                                    <div className="buyer-cart-item-head">
                                                        <div>
                                                            <Title level={4} style={{ margin: 0 }}>{item?.product?.crop_name || 'Produce'}</Title>
                                                            <Text type="secondary">{item?.product?.farmer?.name || 'Farmer'}</Text>
                                                        </div>
                                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(item.id)} />
                                                    </div>
                                                    <div className="buyer-cart-item-meta">
                                                        <Space size="large" wrap>
                                                            <Text strong style={{ fontSize: '18px', color: '#13ec13' }}>
                                                                INR {unitPrice.toFixed(2)} <small style={{ fontWeight: 400, color: '#999' }}>/ {item?.product?.unit || 'unit'}</small>
                                                            </Text>
                                                            <InputNumber
                                                                min={1}
                                                                max={maxQty > 0 ? maxQty : undefined}
                                                                value={item.quantity}
                                                                size="large"
                                                                style={{ borderRadius: '8px' }}
                                                                onChange={(value) => handleQtyChange(item, value)}
                                                                disabled={updatingId === item.id}
                                                            />
                                                            <Text type="secondary">Stock: {maxQty}</Text>
                                                        </Space>
                                                        <Text strong style={{ fontSize: '18px' }}>INR {lineTotal.toFixed(2)}</Text>
                                                    </div>
                                                </div>
                                            </div>
                                            {index < cartItems.length - 1 ? <Divider style={{ margin: 0 }} /> : null}
                                        </React.Fragment>
                                    );
                                })}
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card className="product-card" title="Order Summary">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <Text type="secondary">Subtotal</Text>
                                    <Text strong>INR {subtotal.toFixed(2)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <Text type="secondary">Shipping (Flat rate)</Text>
                                    <Text strong>INR {shipping.toFixed(2)}</Text>
                                </div>
                                <Divider />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <Title level={3} style={{ margin: 0 }}>Total</Title>
                                    <Title level={3} style={{ margin: 0, color: '#13ec13' }}>INR {total.toFixed(2)}</Title>
                                </div>
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Delivery address (optional)"
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    style={{ marginBottom: '16px' }}
                                />
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    icon={<CreditCardOutlined />}
                                    className="add-to-cart-btn"
                                    onClick={handleCheckout}
                                    loading={checkoutLoading}
                                    disabled={checkoutLoading || cartItems.length === 0}
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
