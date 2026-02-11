import React, { useState } from 'react';
import {
    Layout,
    Menu,
    Card,
    Table,
    Tag,
    Button,
    Avatar,
    Space,
    Typography,
    Input,
    Badge,
    Dropdown,
    Row,
    Col,
    Statistic
} from 'antd';
import {
    DashboardOutlined,
    PlusOutlined,
    UnorderedListOutlined,
    ShoppingOutlined,
    UserOutlined,
    BellOutlined,
    LogoutOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ArrowUpOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './FarmerDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const MyListings = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const listingsData = [
        {
            key: '1',
            name: 'Organic Red Tomatoes',
            category: 'Vegetables',
            price: '$4.50',
            unit: 'kg',
            stock: '150kg',
            status: 'Active',
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&h=100&fit=crop'
        },
        {
            key: '2',
            name: 'Fresh Spinach',
            category: 'Vegetables',
            price: '$3.20',
            unit: 'bunch',
            stock: '45 bunches',
            status: 'Active',
            image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop'
        },
        {
            key: '3',
            name: 'Artisan Honey',
            category: 'Honey',
            price: '$12.00',
            unit: 'jar',
            stock: '12 jars',
            status: 'Low Stock',
            image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=100&h=100&fit=crop'
        },
        {
            key: '4',
            name: 'Sweet Corn',
            category: 'Vegetables',
            price: '$1.50',
            unit: 'piece',
            stock: '0 units',
            status: 'Out of Stock',
            image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=100&h=100&fit=crop'
        }
    ];

    const columns = [
        {
            title: 'Product',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.image} shape="square" size={48} />
                    <div>
                        <Text strong>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.category}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price, record) => (
                <Text strong>{price}<span style={{ fontWeight: 400, color: '#999' }}> / {record.unit}</span></Text>
            )
        },
        {
            title: 'Inventory',
            dataIndex: 'stock',
            key: 'stock',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'success';
                if (status === 'Low Stock') color = 'warning';
                if (status === 'Out of Stock') color = 'error';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: () => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} title="View details" />
                    <Button type="text" icon={<EditOutlined />} title="Edit listing" />
                    <Button type="text" danger icon={<DeleteOutlined />} title="Delete listing" />
                </Space>
            ),
        },
    ];

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/farmer/dashboard')
        },
        {
            key: 'add-produce',
            icon: <PlusOutlined />,
            label: 'Add Produce',
            onClick: () => navigate('/farmer/add-produce')
        },
        {
            key: 'my-listings',
            icon: <UnorderedListOutlined />,
            label: 'My Listings',
            onClick: () => navigate('/farmer/listings')
        },
        {
            key: 'orders',
            icon: <ShoppingOutlined />,
            label: 'Orders',
            onClick: () => navigate('/farmer/orders')
        },
    ];

    return (
        <Layout className="farmer-dashboard-layout">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                className="dashboard-sider"
                width={260}
            >
                <div className="logo-section">
                    <div className="logo-icon">
                        <ShoppingOutlined />
                    </div>
                    {!collapsed && (
                        <div>
                            <Title level={5} style={{ margin: 0, color: 'white' }}>AgriMarket</Title>
                            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Farmer Portal</Text>
                        </div>
                    )}
                </div>

                <Menu
                    theme="dark"
                    selectedKeys={['my-listings']}
                    mode="inline"
                    items={menuItems}
                    className="sidebar-menu"
                />

                <div className="user-profile-section">
                    <div className="user-profile-card">
                        <Avatar size={40} icon={<UserOutlined />} src="https://i.pravatar.cc/150?img=12" />
                        {!collapsed && (
                            <div className="user-info">
                                <Text strong style={{ color: 'white', fontSize: '14px' }}>Farmer Joe</Text>
                                <Tag color="success" style={{ fontSize: '10px', padding: '0 6px' }}>PRO SELLER</Tag>
                            </div>
                        )}
                    </div>
                </div>
            </Sider>

            <Layout>
                <Header className="dashboard-header">
                    <div className="header-left">
                        <Title level={3} style={{ margin: 0 }}>My Product Inventory</Title>
                    </div>
                    <div className="header-right">
                        <Input
                            placeholder="Search listings..."
                            prefix={<SearchOutlined />}
                            className="search-input"
                        />
                        <Badge count={3} offset={[-5, 5]}>
                            <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} aria-label="Notifications" />
                        </Badge>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            className="add-produce-btn"
                            onClick={() => navigate('/farmer/add-produce')}
                        >
                            Add New Produce
                        </Button>
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }
                                ]
                            }}
                        >
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" src="https://i.pravatar.cc/150?img=12" style={{ cursor: 'pointer' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="dashboard-content">
                    <Row gutter={[24, 24]} className="stats-row">
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Total Products" value={14} prefix={<UnorderedListOutlined style={{ color: '#13ec13', marginRight: '8px' }} />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Active Listings" value={12} valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Stock Value" value={4250} prefix="$" />
                            </Card>
                        </Col>
                    </Row>

                    <Card className="activity-card" title="All Listings">
                        <Table
                            columns={columns}
                            dataSource={listingsData}
                            className="activity-table"
                        />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MyListings;
