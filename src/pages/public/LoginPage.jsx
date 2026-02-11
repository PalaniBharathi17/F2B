import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { MobileOutlined, LockOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

const { Title, Text, Paragraph } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [mobileNumber, setMobileNumber] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    const role = searchParams.get('role') || 'buyer';

    const getRoleColor = () => {
        switch (role) {
            case 'farmer': return '#13ec13';
            case 'buyer': return '#13ec13';
            case 'admin': return '#722ed1';
            default: return '#13ec13';
        }
    };

    const getRoleIcon = () => {
        switch (role) {
            case 'farmer': return '🌾';
            case 'buyer': return '🛒';
            case 'admin': return '👨‍💼';
            default: return '👤';
        }
    };

    const onFinishMobile = (values) => {
        setLoading(true);
        setMobileNumber(values.mobile);
        // Simulate API call to send OTP
        setTimeout(() => {
            setLoading(false);
            setOtpSent(true);
            message.success(`OTP sent to ${values.mobile}`);
        }, 1000);
    };

    const onFinishOtp = (values) => {
        setLoading(true);
        // Simulate API verification
        setTimeout(() => {
            setLoading(false);
            if (values.otp === '1234') { // Mock OTP
                const userData = {
                    name: 'Demo User',
                    mobile: mobileNumber,
                    role: role
                };
                login(userData);
                message.success('Login Successful!');
                navigate(`/${role}/dashboard`);
            } else {
                message.error('Invalid OTP. Use 1234');
            }
        }, 1000);
    };

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
                        <div className="role-badge" style={{ background: `${getRoleColor()}15`, color: getRoleColor() }}>
                            <span className="role-emoji">{getRoleIcon()}</span>
                            <Text strong style={{ color: getRoleColor(), textTransform: 'capitalize' }}>
                                {role} Portal
                            </Text>
                        </div>
                        <Title level={2} className="login-title">
                            {!otpSent ? 'Welcome Back' : 'Verify OTP'}
                        </Title>
                        <Paragraph className="login-subtitle">
                            {!otpSent
                                ? 'Enter your mobile number to receive a one-time password'
                                : `We've sent a 4-digit code to ${mobileNumber}`
                            }
                        </Paragraph>
                    </div>

                    {!otpSent ? (
                        <Form
                            name="mobile_login"
                            onFinish={onFinishMobile}
                            layout="vertical"
                            size="large"
                            className="login-form"
                        >
                            <Form.Item
                                name="mobile"
                                label="Mobile Number"
                                rules={[
                                    { required: true, message: 'Please input your mobile number!' },
                                    { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit number' }
                                ]}
                            >
                                <Input
                                    prefix={<MobileOutlined style={{ color: getRoleColor() }} />}
                                    placeholder="Enter 10-digit mobile number"
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
                                    Send OTP
                                </Button>
                            </Form.Item>

                            <div className="login-footer">
                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                    By continuing, you agree to our Terms of Service and Privacy Policy
                                </Text>
                            </div>
                        </Form>
                    ) : (
                        <Form
                            name="otp_verify"
                            onFinish={onFinishOtp}
                            layout="vertical"
                            size="large"
                            className="login-form"
                        >
                            <Form.Item
                                name="otp"
                                label="One-Time Password"
                                rules={[{ required: true, message: 'Please input the OTP!' }]}
                            >
                                <Input
                                    prefix={<LockOutlined style={{ color: getRoleColor() }} />}
                                    placeholder="Enter 4-digit OTP"
                                    maxLength={4}
                                    className="custom-input otp-input"
                                />
                            </Form.Item>

                            <div className="otp-hint">
                                <CheckCircleOutlined style={{ color: getRoleColor() }} />
                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                    For demo purposes, use OTP: <strong>1234</strong>
                                </Text>
                            </div>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                    className="submit-button"
                                    style={{ background: getRoleColor(), borderColor: getRoleColor() }}
                                >
                                    Verify & Login
                                </Button>
                            </Form.Item>

                            <div className="login-footer">
                                <Button type="link" onClick={() => setOtpSent(false)} className="change-number-btn">
                                    Change Mobile Number
                                </Button>
                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                    Didn't receive? <a href="#" style={{ color: getRoleColor() }}>Resend OTP</a>
                                </Text>
                            </div>
                        </Form>
                    )}
                </Card>

                <div className="security-badges">
                    <Space size="large">
                        <div className="badge-item">
                            <CheckCircleOutlined style={{ fontSize: '20px', color: getRoleColor() }} />
                            <Text type="secondary">Secure Login</Text>
                        </div>
                        <div className="badge-item">
                            <CheckCircleOutlined style={{ fontSize: '20px', color: getRoleColor() }} />
                            <Text type="secondary">OTP Verified</Text>
                        </div>
                        <div className="badge-item">
                            <CheckCircleOutlined style={{ fontSize: '20px', color: getRoleColor() }} />
                            <Text type="secondary">Data Protected</Text>
                        </div>
                    </Space>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
