'use client';
import React from 'react';
import { Alert, Card, Col, Form, Input, Row, Switch, Typography } from 'antd';
import { Settings, Globe, Bell, Lock } from 'lucide-react';

const { Title } = Typography;

export default function CauHinhPage() {
    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <Settings
                    size={20}
                    color="#3B5518"
                />
                <Title
                    level={4}
                    style={{ margin: 0, color: '#3B5518' }}
                >
                    Cấu hình hệ thống
                </Title>
            </div>

            <Alert
                type="warning"
                showIcon
                className="mb-5"
                message="Chưa thể chỉnh sửa cấu hình"
                description="Backend hiện chưa cung cấp API đọc/lưu cấu hình. Các trường bên dưới chỉ mô tả cấu hình dự kiến và đã được khóa để tránh báo lưu thành công sai sự thật."
            />

            <Row gutter={[20, 20]}>
                <Col
                    xs={24}
                    lg={12}
                >
                    <Card
                        title={
                            <span className="flex items-center gap-2">
                                <Globe
                                    size={16}
                                    color="#3B5518"
                                />{' '}
                                Thông tin website
                            </span>
                        }
                        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none' }}
                    >
                        <Form
                            layout="vertical"
                            disabled
                        >
                            <Form.Item
                                name="siteName"
                                label="Tên website"
                                initialValue="Lùng Vài Trà"
                            >
                                <Input placeholder="Tên hiển thị website" />
                            </Form.Item>
                            <Form.Item
                                name="siteDescription"
                                label="Mô tả ngắn"
                                initialValue="Khám phá những cây trà cổ thụ độc đáo"
                            >
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Mô tả website..."
                                />
                            </Form.Item>
                            <Form.Item
                                name="contactEmail"
                                label="Email liên hệ"
                            >
                                <Input placeholder="lungvaitea@gmai.com" />
                            </Form.Item>
                            <Form.Item
                                name="contactPhone"
                                label="Số điện thoại liên hệ"
                            >
                                <Input placeholder="0901 234 567" />
                            </Form.Item>
                            <Form.Item
                                name="address"
                                label="Địa chỉ công ty"
                            >
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Số X, Đường Y, Quận Z, TP. Hà Nội"
                                />
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col
                    xs={24}
                    lg={12}
                >
                    <Card
                        title={
                            <span className="flex items-center gap-2">
                                <Bell
                                    size={16}
                                    color="#3B5518"
                                />{' '}
                                Thông báo & Email
                            </span>
                        }
                        style={{
                            borderRadius: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            border: 'none',
                            marginBottom: 20,
                        }}
                    >
                        <Form
                            layout="vertical"
                            disabled
                            initialValues={{ requireStrongPassword: true, maxLoginAttempts: 5, sessionTimeout: 60 }}
                        >
                            <Form.Item
                                name="emailNewOrder"
                                label="Thông báo đơn hàng mới"
                                valuePropName="checked"
                                initialValue={true}
                            >
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                name="emailNewUser"
                                label="Thông báo người dùng mới"
                                valuePropName="checked"
                                initialValue={false}
                            >
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                name="smtpHost"
                                label="SMTP Host"
                            >
                                <Input placeholder="smtp.gmail.com" />
                            </Form.Item>
                            <Form.Item
                                name="smtpPort"
                                label="SMTP Port"
                            >
                                <Input placeholder="587" />
                            </Form.Item>
                            <Form.Item
                                name="smtpUser"
                                label="SMTP Username"
                            >
                                <Input placeholder="your@email.com" />
                            </Form.Item>
                            <Form.Item
                                name="smtpPass"
                                label="SMTP Password"
                            >
                                <Input.Password placeholder="••••••••" />
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card
                        title={
                            <span className="flex items-center gap-2">
                                <Lock
                                    size={16}
                                    color="#3B5518"
                                />{' '}
                                Bảo mật
                            </span>
                        }
                        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none' }}
                    >
                        <Form layout="vertical" disabled>
                            <Form.Item
                                name="requireStrongPassword"
                                label="Yêu cầu mật khẩu mạnh"
                                valuePropName="checked"
                                initialValue={true}
                            >
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                name="maxLoginAttempts"
                                label="Số lần đăng nhập sai tối đa"
                            >
                                <Input
                                    type="number"
                                    style={{ width: 120 }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="sessionTimeout"
                                label="Thời gian hết phiên (phút)"
                            >
                                <Input
                                    type="number"
                                    style={{ width: 120 }}
                                />
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>

        </div>
    );
}
