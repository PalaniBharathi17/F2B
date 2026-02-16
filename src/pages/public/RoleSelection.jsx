import React from 'react';
import { Card, Row, Col, Typography, Layout, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    UserOutlined,
    ShopOutlined,
    SafetyCertificateOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import './RoleSelection.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const RoleSelection = () => {
    const navigate = useNavigate();

    const handleRoleSelect = (role) => {
        if (role === 'admin') {
            message.info('Admin backend is not implemented yet. Use farmer or buyer.');
            return;
        }
        navigate(`/login?role=${role}`);
    };

    return (
        <Layout className="role-selection-layout">
            <Content id="main-content" className="role-selection-content">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/')}
                    className="back-button"
                >
                    Back to Home
                </Button>

                <div className="role-selection-header">
                    <Title level={1}>Join the Ecosystem</Title>
                    <Paragraph className="subtitle">
                        Select your role to get started with the tailored dashboard experience.
                    </Paragraph>
                </div>

                <Row gutter={[32, 32]} justify="center" className="role-cards-container">
                    <Col xs={24} sm={24} md={8}>
                        <Card
                            className="role-card farmer-card"
                            hoverable
                            onClick={() => handleRoleSelect('farmer')}
                        >
                            <div className="role-icon-wrapper">
                                <div className="role-icon">
                                    <ShopOutlined />
                                </div>
                            </div>
                            <Title level={2}>Farmer</Title>
                            <Paragraph className="role-description">
                                Grow your business by reaching more buyers directly.
                                Manage your inventory and track sales easily.
                            </Paragraph>
                            <div className="role-features">
                                <div className="feature-item">✓ List unlimited produce</div>
                                <div className="feature-item">✓ Set your own prices</div>
                                <div className="feature-item">✓ Direct buyer connections</div>
                            </div>
                            <Button block size="large" className="role-select-btn">
                                Join as Farmer
                            </Button>
                        </Card>
                    </Col>

                    <Col xs={24} sm={24} md={8}>
                        <Card
                            className="role-card buyer-card"
                            hoverable
                            onClick={() => handleRoleSelect('buyer')}
                        >
                            <div className="role-icon-wrapper">
                                <div className="role-icon">
                                    <UserOutlined />
                                </div>
                            </div>
                            <Title level={2}>Buyer</Title>
                            <Paragraph className="role-description">
                                Source the freshest produce directly from the farm.
                                Ensure traceability and quality for your customers.
                            </Paragraph>
                            <div className="role-features">
                                <div className="feature-item">✓ Browse fresh produce</div>
                                <div className="feature-item">✓ Bulk order discounts</div>
                                <div className="feature-item">✓ Quality guarantee</div>
                            </div>
                            <Button block size="large" className="role-select-btn">
                                Join as Buyer
                            </Button>
                        </Card>
                    </Col>

                    <Col xs={24} sm={24} md={8}>
                        <Card
                            className="role-card admin-card"
                            hoverable
                            onClick={() => handleRoleSelect('admin')}
                        >
                            <div className="role-icon-wrapper">
                                <div className="role-icon">
                                    <SafetyCertificateOutlined />
                                </div>
                            </div>
                            <Title level={2}>Admin</Title>
                            <Paragraph className="role-description">
                                Manage marketplace operations, verify sellers, and oversee
                                logistics and dispute resolution.
                            </Paragraph>
                            <div className="role-features">
                                <div className="feature-item">✓ User verification</div>
                                <div className="feature-item">✓ Platform analytics</div>
                                <div className="feature-item">✓ Dispute management</div>
                            </div>
                            <Button block size="large" className="role-select-btn">
                                Staff Login
                            </Button>
                        </Card>
                    </Col>
                </Row>

                <div className="help-section">
                    <Paragraph type="secondary">
                        Not sure which role fits you? <a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true">Learn more about each role</a>
                    </Paragraph>
                </div>
            </Content>
        </Layout>
    );
};

export default RoleSelection;
