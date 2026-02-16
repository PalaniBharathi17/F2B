import React, { useEffect, useMemo, useState } from 'react';
import {
    Layout,
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
    Menu,
    Tabs
} from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    TeamOutlined,
    ShoppingOutlined,
    DollarOutlined,
    WarningOutlined,
    LogoutOutlined,
    SafetyCertificateOutlined,
    SearchOutlined,
    EditOutlined,
    StopOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminUsers } from '../../api/admin';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const UserManagement = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [usersData, setUsersData] = useState([]);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await getAdminUsers();
                const mapped = (data?.items || []).map((u) => ({
                    key: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.user_type === 'farmer' ? 'Farmer' : 'Buyer',
                    status: u.user_type === 'farmer' && (!u.farmer_profile || u.farmer_profile.badge === 'BRONZE') ? 'Pending' : 'Verified',
                    joinDate: new Date(u.created_at).toLocaleDateString(),
                    avatar: ''
                }));
                setUsersData(mapped);
            } catch {
                setUsersData([]);
            }
        };
        loadUsers();
    }, []);

    const alertsCount = useMemo(() => usersData.filter((u) => u.status === 'Pending').length, [usersData]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.avatar} icon={<UserOutlined />} />
                    <div>
                        <Text strong>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => <Tag color={role === 'Farmer' ? 'green' : 'blue'}>{role.toUpperCase()}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'success';
                if (status === 'Pending') color = 'warning';
                if (status === 'Suspended') color = 'error';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        { title: 'Joined', dataIndex: 'joinDate', key: 'joinDate' },
        {
            title: 'Actions',
            key: 'actions',
            render: () => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} />
                    <Button type="text" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }} />
                    <Button type="text" danger icon={<StopOutlined />} />
                </Space>
            ),
        },
    ];

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => navigate('/admin/dashboard') },
        { key: 'users', icon: <TeamOutlined />, label: 'User Management', onClick: () => navigate('/admin/users') },
        { key: 'products', icon: <ShoppingOutlined />, label: 'Product Moderation', onClick: () => navigate('/admin/products') },
        { key: 'transactions', icon: <DollarOutlined />, label: 'Transactions', onClick: () => navigate('/admin/transactions') },
        { key: 'reports', icon: <WarningOutlined />, label: 'Reports & Issues', onClick: () => navigate('/admin/reports') },
    ];

    return (
        <Layout className="admin-dashboard-layout">
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} className="admin-sider" width={260}>
                <div className="logo-section-admin">
                    <div className="logo-icon-admin"><SafetyCertificateOutlined /></div>
                    {!collapsed && <div><Title level={5} style={{ margin: 0, color: 'white' }}>AgriMarket</Title><Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Admin Console</Text></div>}
                </div>
                <Menu theme="dark" selectedKeys={['users']} mode="inline" items={menuItems} className="admin-menu" />
                <div className="admin-profile-section">
                    <div className="admin-profile-card">
                        <Avatar size={40} icon={<UserOutlined />} />
                        {!collapsed && <div className="admin-info"><Text strong style={{ color: 'white', fontSize: '14px' }}>Admin User</Text><Tag color="purple" style={{ fontSize: '10px', padding: '0 6px' }}>SUPER ADMIN</Tag></div>}
                    </div>
                </div>
            </Sider>

            <Layout>
                <Header className="admin-header">
                    <div className="admin-header-left"><Title level={3} style={{ margin: 0 }}>User Management</Title></div>
                    <div className="admin-header-right">
                        <Input placeholder="Search users..." prefix={<SearchOutlined />} style={{ width: 250, borderRadius: 8 }} />
                        <Badge count={alertsCount} offset={[-5, 5]}>
                            <Button type="text" icon={<WarningOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />} aria-label="Platform alerts" />
                        </Badge>
                        <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }] }}>
                            <Avatar icon={<UserOutlined />} aria-label="Account menu" style={{ cursor: 'pointer', background: '#722ed1' }} />
                        </Dropdown>
                    </div>
                </Header>

                <Content className="admin-content">
                    <Card className="verification-card">
                        <Tabs defaultActiveKey="all" items={[{ key: 'all', label: 'All Users' }, { key: 'farmers', label: 'Farmers' }, { key: 'buyers', label: 'Buyers' }, { key: 'pending', label: 'Pending Verification' }]} />
                        <Table columns={columns} dataSource={usersData} className="verification-table" />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default UserManagement;
