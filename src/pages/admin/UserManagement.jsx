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
    Tabs,
    Modal,
    message,
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
    StopOutlined,
    CheckCircleOutlined,
    EyeOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getAdminUsers,
    updateAdminUserStatus,
    updateAdminUserVerification,
} from '../../api/admin';
import './AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const UserManagement = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [users, setUsers] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [workingUserId, setWorkingUserId] = useState(null);
    const navigate = useNavigate();
    const { logout, user: currentUser } = useAuth();

    const loadUsers = async () => {
        try {
            const data = await getAdminUsers();
            setUsers(data?.items || []);
        } catch (error) {
            setUsers([]);
            message.error(error?.response?.data?.error || 'Failed to load users');
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const alertsCount = useMemo(
        () => users.filter((user) => user.user_type === 'farmer' && user.verification_status === 'pending').length,
        [users],
    );

    const filteredUsers = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        return users.filter((entry) => {
            const tabMatch = (
                activeTab === 'all'
                || (activeTab === 'farmers' && entry.user_type === 'farmer')
                || (activeTab === 'buyers' && entry.user_type === 'buyer')
                || (activeTab === 'pending' && entry.user_type === 'farmer' && entry.verification_status === 'pending')
            );
            if (!tabMatch) return false;
            if (!query) return true;
            return [
                entry.name,
                entry.email,
                entry.phone,
                entry.city,
                entry.state,
                entry.user_type,
                entry.verification_status,
            ].some((value) => String(value || '').toLowerCase().includes(query));
        });
    }, [users, activeTab, searchText]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleStatusToggle = async (userId, isActive, note) => {
        try {
            setWorkingUserId(userId);
            await updateAdminUserStatus(userId, { is_active: isActive, note });
            message.success(isActive ? 'User reactivated' : 'User suspended');
            await loadUsers();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update user status');
        } finally {
            setWorkingUserId(null);
        }
    };

    const handleVerification = async (userId, verificationStatus, note) => {
        try {
            setWorkingUserId(userId);
            await updateAdminUserVerification(userId, { verification_status: verificationStatus, note });
            message.success(`Farmer ${verificationStatus}`);
            await loadUsers();
        } catch (error) {
            message.error(error?.response?.data?.error || 'Failed to update verification');
        } finally {
            setWorkingUserId(null);
        }
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
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
            dataIndex: 'user_type',
            key: 'user_type',
            render: (role) => <Tag color={role === 'farmer' ? 'green' : role === 'admin' ? 'purple' : 'blue'}>{String(role || '').toUpperCase()}</Tag>,
        },
        {
            title: 'Verification',
            dataIndex: 'verification_status',
            key: 'verification_status',
            render: (status, record) => {
                if (record.user_type !== 'farmer') {
                    return <Tag color="default">N/A</Tag>;
                }
                const color = status === 'verified' ? 'success' : status === 'pending' ? 'warning' : 'error';
                return <Tag color={color}>{String(status || '').toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Account',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive) => <Tag color={isActive ? 'success' : 'error'}>{isActive ? 'ACTIVE' : 'SUSPENDED'}</Tag>,
        },
        {
            title: 'Joined',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (value) => new Date(value).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => setSelectedUser(record)} />
                    {record.user_type === 'farmer' && record.verification_status !== 'verified' ? (
                        <Button
                            type="text"
                            icon={<CheckCircleOutlined />}
                            style={{ color: '#52c41a' }}
                            loading={workingUserId === record.id}
                            onClick={() => handleVerification(record.id, 'verified', 'Verified by admin')}
                        />
                    ) : null}
                    {record.user_type === 'farmer' && record.verification_status !== 'rejected' ? (
                        <Button
                            type="text"
                            danger
                            icon={<StopOutlined />}
                            loading={workingUserId === record.id}
                            onClick={() => handleVerification(record.id, 'rejected', 'Rejected by admin')}
                        />
                    ) : null}
                    {record.id !== currentUser?.id ? (
                        <Button
                            type="text"
                            icon={record.is_active ? <StopOutlined /> : <ReloadOutlined />}
                            danger={record.is_active}
                            loading={workingUserId === record.id}
                            onClick={() => handleStatusToggle(
                                record.id,
                                !record.is_active,
                                record.is_active ? 'Suspended by admin' : 'Reactivated by admin',
                            )}
                        />
                    ) : null}
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

    const tabItems = [
        { key: 'all', label: `All Users (${users.length})` },
        { key: 'farmers', label: `Farmers (${users.filter((entry) => entry.user_type === 'farmer').length})` },
        { key: 'buyers', label: `Buyers (${users.filter((entry) => entry.user_type === 'buyer').length})` },
        { key: 'pending', label: `Pending Verification (${alertsCount})` },
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
                        {!collapsed && <div className="admin-info"><Text strong style={{ color: 'white', fontSize: '14px' }}>{currentUser?.name || 'Admin User'}</Text><Tag color="purple" style={{ fontSize: '10px', padding: '0 6px' }}>{String(currentUser?.user_type || 'admin').toUpperCase()}</Tag></div>}
                    </div>
                </div>
            </Sider>

            <Layout>
                <Header className="admin-header">
                    <div className="admin-header-left"><Title level={3} style={{ margin: 0 }}>User Management</Title></div>
                    <div className="admin-header-right">
                        <Input
                            placeholder="Search users..."
                            prefix={<SearchOutlined />}
                            style={{ width: 250, borderRadius: 8 }}
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
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
                        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
                        <Table
                            columns={columns}
                            dataSource={filteredUsers}
                            className="verification-table"
                            rowKey="id"
                            locale={{ emptyText: 'No users match the current filter.' }}
                        />
                    </Card>
                </Content>
            </Layout>

            <Modal
                open={Boolean(selectedUser)}
                onCancel={() => setSelectedUser(null)}
                footer={null}
                title={selectedUser?.name || 'User details'}
            >
                {selectedUser ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text><strong>Email:</strong> {selectedUser.email}</Text>
                        <Text><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</Text>
                        <Text><strong>Role:</strong> {selectedUser.user_type}</Text>
                        <Text><strong>Account state:</strong> {selectedUser.is_active ? 'Active' : 'Suspended'}</Text>
                        <Text><strong>Verification:</strong> {selectedUser.verification_status || 'N/A'}</Text>
                        <Text><strong>Location:</strong> {selectedUser.city || 'N/A'}, {selectedUser.state || 'N/A'}</Text>
                        <Text><strong>Verification note:</strong> {selectedUser.verification_note || 'No admin note'}</Text>
                        <Text><strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleString()}</Text>
                    </Space>
                ) : null}
            </Modal>
        </Layout>
    );
};

export default UserManagement;
