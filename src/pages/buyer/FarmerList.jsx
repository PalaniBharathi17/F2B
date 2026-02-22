import React, { useEffect, useMemo, useState } from 'react';
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
    Rate,
    Select,
    Spin,
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
import { getApiErrorMessage } from '../../utils/apiError';
import { message } from 'antd';
import './BuyerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const FarmerList = () => {
    const [farmers, setFarmers] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('rating');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const loadFarmers = async () => {
            setLoading(true);
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
                    trustScore: Number(farmer?.farmer_profile?.trust_score || 0),
                    badge: farmer?.farmer_profile?.badge || 'BRONZE',
                    image: '',
                    verified: (farmer?.farmer_profile?.badge || 'BRONZE') !== 'BRONZE'
                }));
                setFarmers(mapped);
            } catch (error) {
                setFarmers([]);
                message.error(getApiErrorMessage(error, 'Failed to load farmers'));
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
        loadFarmers();
        loadCartCount();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const filteredFarmers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let rows = farmers.filter((f) => {
            if (!q) return true;
            return (
                (f.name || '').toLowerCase().includes(q)
                || (f.specialty || '').toLowerCase().includes(q)
                || (f.location || '').toLowerCase().includes(q)
            );
        });

        rows = rows.slice().sort((a, b) => {
            if (sortBy === 'reviews') return b.reviews - a.reviews;
            if (sortBy === 'trust') return b.trustScore - a.trustScore;
            return b.rating - a.rating;
        });
        return rows;
    }, [farmers, searchQuery, sortBy]);

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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                        <Paragraph type="secondary">
                            Directly connect with local growers and producers.
                            {' '}
                            <Text strong>{filteredFarmers.length}</Text>
                            {' '}
                            profiles found.
                        </Paragraph>
                    </div>
                    <Select value={sortBy} onChange={setSortBy} style={{ width: 220 }}>
                        <Option value="rating">Sort: Rating</Option>
                        <Option value="reviews">Sort: Completed Orders</Option>
                        <Option value="trust">Sort: Trust Score</Option>
                    </Select>
                </div>

                <Spin spinning={loading}>
                <Row gutter={[24, 24]}>
                    {filteredFarmers.map(farmer => (
                        <Col xs={24} md={12} lg={8} key={farmer.id}>
                            <Card className="product-card farmer-card">
                                <div className="farmer-top">
                                    <Avatar size={74} src={farmer.image} icon={<UserOutlined />} />
                                    <div className="farmer-meta">
                                        <Space>
                                            <Title level={4} style={{ margin: 0 }}>{farmer.name}</Title>
                                            {farmer.verified ? <VerifiedOutlined style={{ color: '#13ec13' }} /> : null}
                                        </Space>
                                        <div style={{ margin: '4px 0' }}>
                                            <Tag color="green">{farmer.specialty}</Tag>
                                            <Tag color={farmer.badge === 'GOLD' ? 'gold' : farmer.badge === 'SILVER' ? 'default' : 'orange'}>
                                                {farmer.badge}
                                            </Tag>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            <EnvironmentOutlined /> {farmer.location}
                                        </Text>
                                    </div>
                                </div>
                                <div className="farmer-stats">
                                    <div>
                                        <Rate disabled allowHalf value={Math.max(0, Math.min(5, farmer.rating))} style={{ fontSize: '14px' }} />
                                        <div><Text type="secondary" style={{ fontSize: '12px' }}>Completed: {farmer.reviews}</Text></div>
                                        <div><Text type="secondary" style={{ fontSize: '12px' }}>Trust Score: {farmer.trustScore.toFixed(1)}</Text></div>
                                    </div>
                                    <Space className="farmer-actions">
                                        <Button icon={<MessageOutlined />} onClick={() => message.info('Direct messaging will be added soon')} />
                                        <Button
                                            type="primary"
                                            className="add-to-cart-btn"
                                            onClick={() => navigate(`/buyer/browse?farmer_id=${farmer.id}&farmer_name=${encodeURIComponent(farmer.name)}`)}
                                        >
                                            View Store
                                        </Button>
                                    </Space>
                                </div>
                            </Card>
                        </Col>
                    ))}
                    {filteredFarmers.length === 0 ? (
                        <Col span={24}>
                            <Card><Text type="secondary">No farmers found.</Text></Card>
                        </Col>
                    ) : null}
                </Row>
                </Spin>
            </Content>
        </Layout>
    );
};

export default FarmerList;
