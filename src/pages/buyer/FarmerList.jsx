import React, { useEffect, useState } from 'react';
import {
    Layout,
    Card,
    Row,
    Col,
    Button,
    Input,
    Tag,
    Badge,
    Avatar,
    Space,
    Typography,
    Dropdown,
    Rate
} from 'antd';
import {
    SearchOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    EnvironmentOutlined,
    LogoutOutlined,
    ShopOutlined,
    VerifiedOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFarmers } from '../../api/users';
import { getCart } from '../../api/cart';
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const FarmerList = () => {
    const [farmers, setFarmers] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const loadFarmers = async () => {
            try {
                const data = await getFarmers();
                const mapped = (data?.items || []).map((farmer) => ({
                    id: farmer.id,
                    name: farmer.name,
                    specialty: farmer?.farmer_profile?.farm_name || 'Local Produce',
                    location: `${farmer.city || 'N/A'}, ${farmer.state || 'N/A'}`,
                    distance: 'nearby',
                    rating: farmer?.farmer_profile?.rating_average || 0,
                    reviews: farmer?.farmer_profile?.completed_orders || 0,
                    image: '',
                    verified: (farmer?.farmer_profile?.badge || 'BRONZE') !== 'BRONZE'
                }));
                setFarmers(mapped);
            } catch {
                setFarmers([]);
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
        loadFarmers();
        loadCartCount();
    }, []);

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
                            placeholder="Search farmers..."
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
                <div className="content-header">
                    <div>
                        <Title level={2}>Registered Farmers</Title>
                        <Paragraph type="secondary">Directly connect with local growers and producers.</Paragraph>
                    </div>
                </div>

                <Row gutter={[24, 24]}>
                    {farmers.map(farmer => (
                        <Col xs={24} md={12} lg={8} key={farmer.id}>
                            <Card className="product-card" style={{ padding: '8px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <Avatar size={80} src={farmer.image} icon={<UserOutlined />} />
                                    <div>
                                        <Space>
                                            <Title level={4} style={{ margin: 0 }}>{farmer.name}</Title>
                                            {farmer.verified && <VerifiedOutlined style={{ color: '#13ec13' }} />}
                                        </Space>
                                        <div style={{ margin: '4px 0' }}>
                                            <Tag color="green">{farmer.specialty}</Tag>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            <EnvironmentOutlined /> {farmer.location} ({farmer.distance})
                                        </Text>
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Rate disabled defaultValue={farmer.rating} style={{ fontSize: '14px' }} />
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>{farmer.reviews} reviews</Text>
                                    </div>
                                    <Space>
                                        <Button icon={<MessageOutlined />} />
                                        <Button type="primary" className="add-to-cart-btn" onClick={() => navigate('/buyer/browse')}>View Store</Button>
                                    </Space>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Content>
        </Layout>
    );
};

export default FarmerList;
