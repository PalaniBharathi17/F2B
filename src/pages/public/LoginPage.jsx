import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, ArrowLeftOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginRequest, registerRequest } from '../../api/auth';
import './LoginPage.css';

const { Title, Text, Paragraph } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    const role = searchParams.get('role') || 'buyer';
    const isAdmin = role === 'admin';

    const getRoleColor = () => {
        switch (role) {
            case 'farmer': return '#13ec13';
            case 'buyer': return '#13ec13';
            default: return '#13ec13';
        }
    };

    const handleAuthSuccess = (payload) => {
        login(payload);
        const dashboardRole = payload?.user?.user_type || role;
        navigate(`/${dashboardRole}/dashboard`);
    };

    const onLogin = async (values) => {
        setLoading(true);
        try {
            const data = await loginRequest({
                email: values.email,
                password: values.password,
            });

            if (data?.user?.user_type && data.user.user_type !== role) {
                message.error(`This account is registered as ${data.user.user_type}.`);
                setLoading(false);
                return;
            }

            message.success('Login successful');
            handleAuthSuccess(data);
        } catch (error) {
            message.error(error?.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const onRegister = async (values) => {
        setLoading(true);
        try {
            const data = await registerRequest({
                name: values.name,
                email: values.email,
                phone: values.phone,
                password: values.password,
                user_type: role,
                city: values.city || '',
                state: values.state || '',
            });

            message.success('Registration successful');
            handleAuthSuccess(data);
        } catch (error) {
            message.error(error?.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (isAdmin) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/role-selection')}
                        className="back-button-login"
                    >
                        Back
                    </Button>
                    <Card className="login-card">
                        <Title level={3}>Admin Login</Title>
                        <Alert
                            type="info"
                            showIcon
                            message="Admin backend is not implemented yet."
                            description="Use farmer or buyer login to test frontend-backend integration."
                        />
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/role-selection')}
                    className="back-button-login"
                >
                    Back
                </Button>

                <Card className="login-card">
                    <div className="login-header">
                        <Title level={2} className="login-title">
                            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
                        </Title>
                        <Paragraph className="login-subtitle">
                            {isRegisterMode
                                ? `Register as ${role}`
                                : `Sign in as ${role}`
                            }
                        </Paragraph>
                    </div>

                    {!isRegisterMode ? (
                        <Form
                            name="email_login"
                            onFinish={onLogin}
                            layout="vertical"
                            size="large"
                            className="login-form"
                        >
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Please enter your email' },
                                    { type: 'email', message: 'Enter a valid email' },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined style={{ color: getRoleColor() }} />}
                                    placeholder="you@example.com"
                                    className="custom-input"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label="Password"
                                rules={[{ required: true, message: 'Please enter your password' }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined style={{ color: getRoleColor() }} />}
                                    placeholder="Enter password"
                                    className="custom-input"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                    className="submit-button"
                                    style={{ background: getRoleColor(), borderColor: getRoleColor() }}
                                >
                                    Login
                                </Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        <Form
                            name="register"
                            onFinish={onRegister}
                            layout="vertical"
                            size="large"
                            className="login-form"
                        >
                            <Form.Item
                                name="name"
                                label="Full Name"
                                rules={[{ required: true, message: 'Please enter your name' }]}
                            >
                                <Input
                                    prefix={<UserOutlined style={{ color: getRoleColor() }} />}
                                    placeholder="Your full name"
                                    className="custom-input"
                                />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Please enter your email' },
                                    { type: 'email', message: 'Enter a valid email' },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined style={{ color: getRoleColor() }} />}
                                    placeholder="you@example.com"
                                    className="custom-input"
                                />
                            </Form.Item>

                            <Form.Item
                                name="phone"
                                label="Phone Number"
                                rules={[
                                    { required: true, message: 'Please enter your phone number' },
                                    { pattern: /^[6-9]\d{9}$/, message: 'Use a valid 10-digit Indian number' },
                                ]}
                            >
                                <Input
                                    prefix={<PhoneOutlined style={{ color: getRoleColor() }} />}
                                    placeholder="9876543210"
                                    className="custom-input"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label="Password"
                                rules={[
                                    { required: true, message: 'Please enter a password' },
                                    { min: 6, message: 'Password must be at least 6 characters' },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined style={{ color: getRoleColor() }} />}
                                    placeholder="Create password"
                                    className="custom-input"
                                />
                            </Form.Item>

                            <Space style={{ display: 'flex' }}>
                                <Form.Item name="city" label="City" style={{ flex: 1 }}>
                                    <Input placeholder="City" className="custom-input" />
                                </Form.Item>
                                <Form.Item name="state" label="State" style={{ flex: 1 }}>
                                    <Input placeholder="State" className="custom-input" />
                                </Form.Item>
                            </Space>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                    className="submit-button"
                                    style={{ background: getRoleColor(), borderColor: getRoleColor() }}
                                >
                                    Register
                                </Button>
                            </Form.Item>
                        </Form>
                    )}

                    <div className="login-footer">
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}{' '}
                        </Text>
                        <Button type="link" onClick={() => setIsRegisterMode((prev) => !prev)}>
                            {isRegisterMode ? 'Login' : 'Register'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
