import React, { useState } from 'react';
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
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const FarmerList = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const farmers = [
        {
            id: 1,
            name: 'Green Valley Farm',
            specialty: 'Organic Vegetables',
            location: 'Salem, OR',
            distance: '5.2 mi',
            rating: 4.9,
            reviews: 128,
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
            verified: true
        },
        {
            id: 2,
            name: 'Sunny Acres',
            specialty: 'Fruits & Berries',
            location: 'Portland, OR',
            distance: '12.4 mi',
            rating: 4.7,
            reviews: 86,
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
            verified: true
        },
        {
            id: 3,
            name: 'Bees & Bloom',
            specialty: 'Honey & Pollen',
            location: 'Eugene, OR',
            distance: '8.5 mi',
            rating: 4.8,
            reviews: 54,
            image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop',
            verified: false
        }
    ];

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
                        <Badge count={3} offset={[-5, 5]}>
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
                                    <Avatar size={80} src={farmer.image} />
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
