'use client';
import React, {useEffect, useState} from 'react';
import {Button, Descriptions, message, Spin, Tag, Typography} from 'antd';
import {ArrowLeft, Ban, CheckCircle} from 'lucide-react';
import {useParams, useRouter} from 'next/navigation';
import {getUserByIdAPI, toggleBlockUserAPI} from '@/api/UserAPI';
import {unwrapApiData} from '@/api/response';
import {Gender, Role} from '@/types/swagger.types';
import dayjs from 'dayjs';

const {Title} = Typography;

const ROLE_LABELS: Record<number, {label: string; color: string}> = {
    [Role.Admin]: {label: 'Quản trị viên', color: 'red'},
    [Role.Manager]: {label: 'Nhân viên', color: 'blue'},
    [Role.User]: {label: 'Khách hàng', color: 'green'},
    [Role.Supervisor]: {label: 'Giám sát', color: 'purple'},
};

const GENDER_LABELS: Record<number, string> = {
    [Gender.Male]: 'Nam',
    [Gender.Female]: 'Nữ',
    [Gender.Other]: 'Khác',
};

const renderGender = (value: unknown) => {
    const numeric = Number(value);
    return numeric in GENDER_LABELS ? GENDER_LABELS[numeric] : '-';
};

export default function ChiTietKhachHangPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [blocking, setBlocking] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const loadUser = async () => {
        try {
            const res = await getUserByIdAPI(id);
            setUser(unwrapApiData<any>(res));
        } catch {
            messageApi.error('Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) void Promise.resolve().then(loadUser);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleToggleBlock = async () => {
        setBlocking(true);
        try {
            await toggleBlockUserAPI(id);
            messageApi.success(`${user?.isBlock ? 'Mở khoá' : 'Khoá'} tài khoản thành công`);
            loadUser();
        } catch {
            messageApi.error('Thao tác thất bại');
        } finally {
            setBlocking(false);
        }
    };

    if (loading) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400}}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return <div style={{textAlign: 'center', padding: 60, color: '#999'}}>Không tìm thấy người dùng</div>;
    }

    const roleInfo = ROLE_LABELS[user.role];

    return (
        <div>
            {contextHolder}
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        icon={<ArrowLeft size={16} />}
                        onClick={() => router.push('/cms/danh-sach-khach-hang')}
                    >
                        Quay lại
                    </Button>
                    <Title
                        level={4}
                        style={{margin: 0, color: '#3B5518'}}
                    >
                        Chi tiết người dùng #{id}
                    </Title>
                </div>
                <Button
                    danger={!user.isBlock}
                    type={user.isBlock ? 'default' : 'default'}
                    icon={
                        user.isBlock ? (
                            <CheckCircle
                                size={15}
                                color="#52c41a"
                            />
                        ) : (
                            <Ban
                                size={15}
                                color="#ff4d4f"
                            />
                        )
                    }
                    loading={blocking}
                    onClick={handleToggleBlock}
                >
                    {user.isBlock ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
                </Button>
            </div>

            <div style={{background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                <Descriptions
                    bordered
                    column={2}
                    size="middle"
                >
                    <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
                    <Descriptions.Item label="Tên đăng nhập">{user.userName ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Họ">{user.firstName ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Tên">{user.lastName ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Email">{user.email ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{user.phoneNumber ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Giới tính">{renderGender(user.gender)}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ">{user.address ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày sinh">
                        {user.birthDate ? dayjs(user.birthDate).format('DD/MM/YYYY') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Vai trò">
                        {roleInfo ? <Tag color={roleInfo.color}>{roleInfo.label}</Tag> : <Tag>{user.role}</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {user.isBlock ? <Tag color="red">Đã khoá</Tag> : <Tag color="green">Hoạt động</Tag>}
                    </Descriptions.Item>
                    {user.bio && (
                        <Descriptions.Item
                            label="Giới thiệu"
                            span={2}
                        >
                            {user.bio}
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </div>
        </div>
    );
}
