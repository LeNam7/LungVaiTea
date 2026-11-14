'use client';
import React, {useCallback, useEffect, useState} from 'react';
import {
    Button,
    Col,
    Descriptions,
    Form,
    Input,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {Edit2, Eye, Plus, Trash2, Users, Ban, CheckCircle} from 'lucide-react';
import {
    getUsersPagingAPI,
    createUserByAdminAPI,
    getUserByIdAPI,
    updateUserAPI,
    deleteUserAPI,
    toggleBlockUserAPI,
} from '@/api/UserAPI';
import {unwrapApiData, unwrapPagingData} from '@/api/response';
import {Gender, Role} from '@/types/swagger.types';
import dayjs from 'dayjs';

const {Title} = Typography;

const ROLE_LABELS: Record<number, {label: string; color: string}> = {
    [Role.Admin]: {label: 'Quản trị viên', color: 'red'},
    [Role.Manager]: {label: 'Nhân viên', color: 'blue'},
    [Role.User]: {label: 'Khách hàng', color: 'green'},
    [Role.Supervisor]: {label: 'Giám sát', color: 'purple'},
};

/**
 * Chỉ 3 vai trò được dùng khi thêm/sửa người dùng: Quản trị viên, Nhân viên,
 * Khách hàng. Vai trò Giám sát chỉ hiển thị cho tài khoản đã mang sẵn,
 * form không cho gán mới.
 */
const FORM_ROLE_OPTIONS = [
    {value: Role.Admin, label: 'Quản trị viên'},
    {value: Role.Manager, label: 'Nhân viên'},
    {value: Role.User, label: 'Khách hàng'},
];

/**
 * Tự tạo tên đăng nhập từ họ tên (lúc đăng ký tài khoản không có ô nhập
 * tên đăng nhập nên CMS cũng không bắt nhập): bỏ dấu, viết thường, bỏ
 * khoảng trắng. Hết họ tên thì lấy phần trước @ của email.
 */
const buildUsername = (firstName?: string | null, lastName?: string | null, email?: string | null): string => {
    const strip = (text: string) =>
        text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    const fromName = strip(`${firstName ?? ''}${lastName ?? ''}`);
    if (fromName) return fromName;
    return strip((email ?? '').split('@')[0] ?? '');
};

const GENDER_LABELS: Record<number, string> = {
    [Gender.Male]: 'Nam',
    [Gender.Female]: 'Nữ',
    [Gender.Other]: 'Khác',
};

const normalizeGender = (value: unknown): Gender | undefined => {
    const numeric = Number(value);
    if (numeric === Gender.Male || numeric === Gender.Female || numeric === Gender.Other) return numeric;
    return undefined;
};

const renderGender = (value: unknown) => {
    const gender = normalizeGender(value);
    return gender === undefined ? '-' : GENDER_LABELS[gender];
};

export default function DanhSachKhachHangPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [pageIndex, setPageIndex] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingLoadingId, setEditingLoadingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    /* Detail modal */
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailUser, setDetailUser] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        try {
            const res = await getUsersPagingAPI({
                pageIndex,
                pageSize: 20,
                keyword: keyword || null,
            });
            const paging = unwrapPagingData<any>(res);
            setUsers(paging.data);
            setTotal(paging.totalRecords);
        } catch {
            messageApi.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [pageIndex, keyword, messageApi]);

    useEffect(() => {
        void Promise.resolve().then(fetchData);
    }, [fetchData]);

    const openCreate = () => {
        setEditingId(null);
        form.resetFields();
        form.setFieldsValue({gender: Gender.Male, role: Role.User});
        setModalOpen(true);
    };

    const openEdit = async (id: number) => {
        if (editingLoadingId || deletingId || togglingUserId) return;
        setEditingLoadingId(id);
        try {
            const res = (await getUserByIdAPI(id)) as any;
            const data = unwrapApiData<any>(res);
            setEditingId(id);
            form.setFieldsValue({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                address: data.address,
                bio: data.bio,
                gender: normalizeGender(data.gender),
                birthDate: data.birthDate ? dayjs(data.birthDate).format('YYYY-MM-DD') : undefined,
                role: data.role,
            });
            setModalOpen(true);
        } catch {
            messageApi.error('Không thể tải thông tin người dùng');
        } finally {
            setEditingLoadingId(null);
        }
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        setSaving(true);
        try {
            if (editingId) {
                // Lưu ý: UpdateUserModel phía BE hiện chưa có trường role nên
                // vai trò gửi kèm sẽ chỉ có tác dụng sau khi BE nhận thêm
                // trường này (đã ghi vào đợt việc BE).
                await updateUserAPI(editingId, values);
                messageApi.success('Cập nhật người dùng thành công');
            } else {
                const userName = buildUsername(values.firstName, values.lastName, values.email);
                await createUserByAdminAPI({...values, userName: userName || undefined});
                messageApi.success(
                    userName
                        ? `Thêm người dùng thành công (tên đăng nhập: ${userName})`
                        : 'Thêm người dùng thành công',
                );
            }
            setModalOpen(false);
            fetchData();
        } catch {
            messageApi.error('Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (deletingId || editingLoadingId || togglingUserId) return;
        setDeletingId(id);
        try {
            await deleteUserAPI(id);
            messageApi.success('Xoá người dùng thành công');
            fetchData();
        } catch {
            messageApi.error('Xoá thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleBlock = async (id: number) => {
        if (togglingUserId || deletingId || editingLoadingId) return;
        setTogglingUserId(id);
        try {
            await toggleBlockUserAPI(id);
            messageApi.success('Cập nhật trạng thái thành công');
            fetchData();
        } catch {
            messageApi.error('Thao tác thất bại');
        } finally {
            setTogglingUserId(null);
        }
    };

    const openDetail = async (id: number) => {
        setDetailOpen(true);
        setDetailUser(null);
        setDetailLoading(true);
        try {
            const res = (await getUserByIdAPI(id)) as any;
            setDetailUser(unwrapApiData<any>(res));
        } catch {
            messageApi.error('Không thể tải thông tin người dùng');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleToggleBlockInDetail = async () => {
        if (!detailUser?.id) return;
        setToggling(true);
        try {
            await toggleBlockUserAPI(detailUser.id);
            messageApi.success(`${detailUser.isBlock ? 'Mở khoá' : 'Khoá'} tài khoản thành công`);
            const res = (await getUserByIdAPI(detailUser.id)) as any;
            setDetailUser(unwrapApiData<any>(res));
            fetchData();
        } catch {
            messageApi.error('Thao tác thất bại');
        } finally {
            setToggling(false);
        }
    };

    const columns: ColumnsType<any> = [
        {title: 'ID', dataIndex: 'id', key: 'id', width: 60},
        {
            title: 'Họ tên',
            key: 'fullName',
            render: (_, r) => (
                <span className="font-medium">
                    {[r.firstName, r.lastName].filter(Boolean).join(' ') || r.userName || '-'}
                </span>
            ),
        },
        {title: 'Email', dataIndex: 'email', key: 'email'},
        {title: 'Số điện thoại', dataIndex: 'phoneNumber', key: 'phoneNumber'},
        {title: 'Giới tính', dataIndex: 'gender', key: 'gender', width: 100, render: renderGender},
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (v) => {
                const r = ROLE_LABELS[v];
                return r ? <Tag color={r.color}>{r.label}</Tag> : <Tag>{v}</Tag>;
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isBlock',
            key: 'isBlock',
            render: (v) => (v ? <Tag color="red">Đã khoá</Tag> : <Tag color="green">Hoạt động</Tag>),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            fixed: 'right',
            width: 130,
            render: (_, r) => (
                <Space>
                    <Tooltip title={r.isBlock ? 'Mở khoá' : 'Khoá tài khoản'}>
                        <Button
                            type="text"
                            loading={togglingUserId === r.id}
                            disabled={editingLoadingId !== null || deletingId !== null}
                            icon={
                                r.isBlock ? (
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
                            onClick={() => handleToggleBlock(r.id)}
                        />
                    </Tooltip>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<Eye size={15} />}
                            onClick={() => openDetail(r.id)}
                        />
                    </Tooltip>
                    <Button
                        type="text"
                        icon={<Edit2 size={15} />}
                        loading={editingLoadingId === r.id}
                        disabled={deletingId !== null || togglingUserId !== null}
                        onClick={() => openEdit(r.id)}
                    />
                    <Popconfirm
                        title="Xoá người dùng này?"
                        onConfirm={() => handleDelete(r.id)}
                        okButtonProps={{loading: deletingId === r.id}}
                        okText="Xoá"
                        cancelText="Huỷ"
                    >
                        <Button
                            type="text"
                            danger
                            disabled={deletingId !== null || editingLoadingId !== null || togglingUserId !== null}
                            icon={<Trash2 size={15} color="#DC2626" />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {contextHolder}
            <div
                className="flex items-center justify-between"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: '#f5f5f5',
                    paddingTop: 4,
                    paddingBottom: 4,
                    marginBottom: 20,
                }}
            >
                <div className="flex items-center gap-2">
                    <Users
                        size={20}
                        color="#3B5518"
                    />
                    <Title
                        level={4}
                        style={{margin: 0, color: '#3B5518'}}
                    >
                        Khách hàng & Người dùng
                    </Title>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={openCreate}
                    style={{background: '#3B5518'}}
                >
                    Thêm người dùng
                </Button>
            </div>

            <div style={{background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                <div className="flex gap-3 mb-4">
                    <Input.Search
                        placeholder="Tìm tên, email, SĐT..."
                        allowClear
                        style={{maxWidth: 320}}
                        onSearch={(v) => {
                            setKeyword(v);
                            setPageIndex(1);
                        }}
                    />
                </div>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={users}
                    loading={loading}
                    scroll={{x: 'max-content', y: 'calc(100vh - 370px)'}}
                    pagination={{
                        current: pageIndex,
                        pageSize: 20,
                        total,
                        showTotal: (t) => `Tổng ${t} người dùng`,
                        onChange: (p) => setPageIndex(p),
                        showSizeChanger: false,
                    }}
                    locale={{emptyText: 'Chưa có người dùng'}}
                />
            </div>

            {/* Detail Modal */}
            <Modal
                title={
                    <div className="flex items-center justify-between pr-8">
                        <span>Chi tiết người dùng {detailUser ? `#${detailUser.id}` : ''}</span>
                        {detailUser && (
                            <Button
                                size="small"
                                danger={!detailUser.isBlock}
                                loading={toggling}
                                icon={detailUser.isBlock ? <CheckCircle size={13} color="#52c41a" /> : <Ban size={13} color="#ff4d4f" />}
                                onClick={handleToggleBlockInDetail}
                            >
                                {detailUser.isBlock ? 'Mở khoá' : 'Khoá tài khoản'}
                            </Button>
                        )}
                    </div>
                }
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={null}
                width={680}
                destroyOnHidden
            >
                {detailLoading ? (
                    <div style={{textAlign: 'center', padding: 40}}><Spin /></div>
                ) : detailUser ? (
                    <Descriptions bordered column={2} size="small" style={{marginTop: 16}}>
                        <Descriptions.Item label="ID">{detailUser.id}</Descriptions.Item>
                        <Descriptions.Item label="Tên đăng nhập">{detailUser.userName ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Họ">{detailUser.firstName ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Tên">{detailUser.lastName ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Email">{detailUser.email ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{detailUser.phoneNumber ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Giới tính">{renderGender(detailUser.gender)}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{detailUser.address ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">
                            {detailUser.birthDate ? dayjs(detailUser.birthDate).format('DD/MM/YYYY') : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Vai trò">
                            {(() => { const r = ROLE_LABELS[detailUser.role]; return r ? <Tag color={r.color}>{r.label}</Tag> : <Tag>{detailUser.role}</Tag>; })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {detailUser.isBlock ? <Tag color="red">Đã khoá</Tag> : <Tag color="green">Hoạt động</Tag>}
                        </Descriptions.Item>
                        {detailUser.bio && (
                            <Descriptions.Item label="Giới thiệu" span={2}>{detailUser.bio}</Descriptions.Item>
                        )}
                        <Descriptions.Item label="Ngày tạo">
                            {detailUser.createdDate ? dayjs(detailUser.createdDate).format('DD/MM/YYYY HH:mm') : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                ) : null}
            </Modal>

            {/* Create / Edit Modal */}
            <Modal
                title={editingId ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
                confirmLoading={saving}
                okText={editingId ? 'Lưu' : 'Thêm'}
                cancelText="Huỷ"
                width={600}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-4"
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="role"
                                label="Vai trò"
                            >
                                <Select
                                    placeholder="Chọn vai trò"
                                    options={FORM_ROLE_OPTIONS}
                                />
                            </Form.Item>
                        </Col>
                        {!editingId && (
                            <Col span={12}>
                                <p style={{margin: 0, paddingTop: 30, color: '#888', fontSize: 13}}>
                                    Tên đăng nhập được tự tạo từ họ tên khi lưu, không cần nhập.
                                </p>
                            </Col>
                        )}
                        <Col span={12}>
                            <Form.Item
                                name="firstName"
                                label="Họ"
                            >
                                <Input placeholder="Họ" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="lastName"
                                label="Tên"
                            >
                                <Input placeholder="Tên" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                            >
                                <Input placeholder="email@example.com" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="phoneNumber"
                                label="Số điện thoại"
                            >
                                <Input placeholder="0901234567" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="birthDate"
                                label="Ngày sinh"
                            >
                                <Input type="date" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="gender"
                                label="Giới tính"
                            >
                                <Select
                                    placeholder="Chọn giới tính"
                                    options={Object.entries(GENDER_LABELS).map(([value, label]) => ({
                                        value: Number(value),
                                        label,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="address"
                                label="Địa chỉ"
                            >
                                <Input placeholder="Địa chỉ..." />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="bio"
                                label="Giới thiệu bản thân"
                            >
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Bio..."
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
