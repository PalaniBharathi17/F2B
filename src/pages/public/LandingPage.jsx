import React from 'react';
import { Layout, Button, Typography, Row, Col, Card, Statistic, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    ShopOutlined,
    UserOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined,
    RocketOutlined,
    TruckOutlined,
    VerifiedOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import './LandingPage.css';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <Layout className="landing-layout">
            {/* Sticky Navbar */}
            <Header className="landing-header glass-effect">
                <div className="header-content">
                    <div className="logo-section">
                        <ShopOutlined style={{ fontSize: '28px', color: '#13ec13' }} />
                        <Text strong style={{ fontSize: '20px', marginLeft: '8px' }}>AgriMarket</Text>
                    </div>
                    <nav className="nav-links">
                        <a href="#how-it-works">How it Works</a>
                        <a href="#roles">Join Us</a>
                        <a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">Marketplace</a>
                    </nav>
                    <Space>
                        <Button onClick={() => navigate('/login')}>Login</Button>
                        <Button type="primary" onClick={() => navigate('/role-selection')}>
                            Sign Up
                        </Button>
                    </Space>
                </div>
            </Header>

            <Content id="main-content">
                {/* Hero Section */}
                <section className="hero-section">
                    <Row gutter={[48, 48]} align="middle" className="hero-content">
                        <Col xs={24} lg={12}>
                            <div className="hero-text">
                                <div className="badge">The Future of Agriculture</div>
                                <Title level={1} className="hero-title">
                                    Direct from the <span className="highlight">Soil</span> to your Store.
                                </Title>
                                <Paragraph className="hero-description">
                                    Connecting local farmers with wholesale buyers for a fresher tomorrow.
                                    Join the modern agricultural revolution today.
                                </Paragraph>
                                <Space size="large" wrap>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<ArrowRightOutlined />}
                                        onClick={() => navigate('/role-selection')}
                                        className="hero-btn-primary"
                                    >
                                        Explore Marketplace
                                    </Button>
                                    <Button size="large" className="hero-btn-secondary">
                                        How it works
                                    </Button>
                                </Space>
                            </div>
                        </Col>
                        <Col xs={24} lg={12}>
                            <div className="hero-image">
                                <div className="image-card">
                                    <img
                                        src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=600&fit=crop"
                                        alt="Fresh organic vegetables"
                                    />
                                </div>
                                <div className="floating-badge">
                                    <VerifiedOutlined style={{ fontSize: '24px', color: '#13ec13' }} />
                                    <div>
                                        <Text strong>100% Certified</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Local Farm Produce</Text>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </section>

                {/* Trust Stats Banner */}
                <section className="stats-banner">
                    <Row gutter={[32, 32]} className="stats-content">
                        <Col xs={12} md={6}>
                            <Statistic
                                title="Active Farmers"
                                value="1,200+"
                                valueStyle={{ color: '#13ec13', fontWeight: 'bold' }}
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Statistic
                                title="Fresh Products"
                                value="5k+"
                                valueStyle={{ color: '#13ec13', fontWeight: 'bold' }}
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Statistic
                                title="Delivery Speed"
                                value="< 24h"
                                valueStyle={{ color: '#13ec13', fontWeight: 'bold' }}
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Statistic
                                title="Quality Match"
                                value="99.9%"
                                valueStyle={{ color: '#13ec13', fontWeight: 'bold' }}
                            />
                        </Col>
                    </Row>
                </section>

                {/* How it Works Section */}
                <section className="how-it-works" id="how-it-works">
                    <div className="section-header">
                        <Title level={2}>How it Works</Title>
                        <Paragraph type="secondary">
                            Our platform streamlines the supply chain, ensuring farmers get better prices
                            and buyers get fresher produce.
                        </Paragraph>
                    </div>
                    <Row gutter={[32, 32]}>
                        <Col xs={24} md={12}>
                            <Card className="process-card">
                                <div className="card-header">
                                    <Title level={3}>For Farmers</Title>
                                    <ShopOutlined style={{ fontSize: '32px', color: '#13ec13' }} />
                                </div>
                                <div className="process-steps">
                                    <div className="step">
                                        <div className="step-number">1</div>
                                        <div>
                                            <Title level={5}>List Your Produce</Title>
                                            <Paragraph type="secondary">
                                                Upload photos and specify your inventory availability.
                                            </Paragraph>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div>
                                            <Title level={5}>Set Your Price</Title>
                                            <Paragraph type="secondary">
                                                Choose your own fair wholesale prices without middleman markups.
                                            </Paragraph>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div>
                                            <Title level={5}>Direct Pickup</Title>
                                            <Paragraph type="secondary">
                                                Buyers or our logistics partners collect directly from your farm.
                                            </Paragraph>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="process-card">
                                <div className="card-header">
                                    <Title level={3}>For Buyers</Title>
                                    <UserOutlined style={{ fontSize: '32px', color: '#13ec13' }} />
                                </div>
                                <div className="process-steps">
                                    <div className="step">
                                        <div className="step-number">1</div>
                                        <div>
                                            <Title level={5}>Browse Catalog</Title>
                                            <Paragraph type="secondary">
                                                Filter by location, crop type, and harvest date.
                                            </Paragraph>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div>
                                            <Title level={5}>Secure Order</Title>
                                            <Paragraph type="secondary">
                                                Place bulk orders with secure payment and traceability.
                                            </Paragraph>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div>
                                            <Title level={5}>Fresh Delivery</Title>
                                            <Paragraph type="secondary">
                                                Receive farm-fresh produce at your store within 24 hours.
                                            </Paragraph>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </section>

                {/* Role Selection */}
                <section className="role-selection" id="roles">
                    <div className="section-header">
                        <Title level={2}>Join the Ecosystem</Title>
                        <Paragraph type="secondary">
                            Select your role to get started with the tailored dashboard experience.
                        </Paragraph>
                    </div>
                    <Row gutter={[32, 32]}>
                        <Col xs={24} md={8}>
                            <Card
                                className="role-card"
                                hoverable
                                onClick={() => navigate('/role-selection')}
                            >
                                <div className="role-icon">
                                    <ShopOutlined />
                                </div>
                                <Title level={3}>Farmer</Title>
                                <Paragraph>
                                    Grow your business by reaching more buyers directly.
                                    Manage your inventory and track sales easily.
                                </Paragraph>
                                <Button block size="large" className="role-btn">
                                    Join as Farmer
                                </Button>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card
                                className="role-card"
                                hoverable
                                onClick={() => navigate('/role-selection')}
                            >
                                <div className="role-icon">
                                    <UserOutlined />
                                </div>
                                <Title level={3}>Buyer</Title>
                                <Paragraph>
                                    Source the freshest produce directly from the farm.
                                    Ensure traceability and quality for your customers.
                                </Paragraph>
                                <Button block size="large" className="role-btn">
                                    Join as Buyer
                                </Button>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card
                                className="role-card"
                                hoverable
                                onClick={() => navigate('/role-selection')}
                            >
                                <div className="role-icon">
                                    <SafetyCertificateOutlined />
                                </div>
                                <Title level={3}>Admin</Title>
                                <Paragraph>
                                    Manage marketplace operations, verify sellers, and oversee
                                    logistics and dispute resolution.
                                </Paragraph>
                                <Button block size="large" className="role-btn">
                                    Staff Login
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </section>

                {/* Final CTA */}
                <section className="final-cta">
                    <div className="cta-content">
                        <Title level={2} style={{ color: '#102210', marginBottom: '16px' }}>
                            Ready to transform your business?
                        </Title>
                        <Paragraph style={{ fontSize: '18px', opacity: 0.8, marginBottom: '32px' }}>
                            Join thousands of farmers and stores already trading on AgriMarket.
                        </Paragraph>
                        <Button
                            type="primary"
                            size="large"
                            style={{
                                backgroundColor: '#102210',
                                borderColor: '#102210',
                                height: '56px',
                                padding: '0 48px',
                                fontSize: '16px'
                            }}
                            onClick={() => navigate('/role-selection')}
                        >
                            Get Started Now
                        </Button>
                    </div>
                </section>
            </Content>

            {/* Footer */}
            <Footer className="landing-footer">
                <Row gutter={[48, 48]}>
                    <Col xs={24} md={12} lg={8}>
                        <Space direction="vertical" size="middle">
                            <div>
                                <ShopOutlined style={{ fontSize: '28px', color: '#13ec13' }} />
                                <Text strong style={{ fontSize: '20px', marginLeft: '8px' }}>AgriMarket</Text>
                            </div>
                            <Paragraph type="secondary">
                                The world's most trusted digital marketplace connecting the soil to the shelf.
                            </Paragraph>
                        </Space>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                        <ul className="footer-links">
                            <li><a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">Marketplace</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">Pricing</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">Logistics</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">Security</a></li>
                        </ul>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                        <Title level={5}>Company</Title>
                        <ul className="footer-links">
                            <li><a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">About Us</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">Success Stories</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">Privacy Policy</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">Terms of Service</a></li>
                        </ul>
                    </Col>

                </Row>
                <div className="footer-bottom">
                    <Text type="secondary">© 2024 AgriMarket Inc. All rights reserved.</Text>
                </div>
            </Footer>
        </Layout>
    );
};

export default LandingPage;
