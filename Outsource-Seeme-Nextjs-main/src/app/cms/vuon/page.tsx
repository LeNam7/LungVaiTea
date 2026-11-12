'use client';
import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Button, Form, Input, message, Modal, Popconfirm, Space, Switch, Table, Tag, Typography} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {Edit2, MapPin, Plus, Trash2} from 'lucide-react';
import {
    getGardensPagingAPI,
    getGardenByIdAPI,
    createGardenAPI,
    updateGardenAPI,
    deleteGardenAPI,
} from '@/api/GardenAPI';
import {getTeasPagingAPI} from '@/api/TeaAPI';
import {unwrapApiData, unwrapPagingData} from '@/api/response';
import type {Garden, Tea} from '@/types/swagger.types';
import {formatGardenCode} from '@/utils/teaFields';
import dayjs from 'dayjs';

const {Title} = Typography;

export default function VuonPage() {
    const [gardens, setGardens] = useState<Garden[]>([]);
    const [teaCounts, setTeaCounts] = useState<Record<number, number>>({});
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

    const fetchData = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        try {
            const [gardenRes, teaRes] = await Promise.all([
                getGardensPagingAPI({
                    pageIndex,
                    pageSize: 20,
                    keyword: keyword || null,
                }),
                getTeasPagingAPI({
                    pageIndex: 1,
                    pageSize: 500,
                }).catch(() => null),
            ]);

            const paging = unwrapPagingData<Garden>(gardenRes);
            setGardens(paging.data);
            setTotal(paging.totalRecords);

            if (teaRes) {
                const teas = unwrapPagingData<Tea>(teaRes).data;
                const counts: Record<number, number> = {};
                for (const tea of teas) {
                    if (tea.gardenId != null) {
                        counts[tea.gardenId] = (counts[tea.gardenId] || 0) + 1;
                    }
                }
                setTeaCounts(counts);
            }
        } catch {
            messageApi.error('Không thể tải danh sách vườn');
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
        setModalOpen(true);
    };

    const openEdit = async (id: number) => {
        if (editingLoadingId || deletingId) return;
        setEditingLoadingId(id);
        try {
            const res = (await getGardenByIdAPI(id)) as any;
            setEditingId(id);
            const garden = unwrapApiData<Garden>(res);
            form.setFieldsValue({
                ...garden,
                gardenDescription: garden.description ?? '',
            });
            setModalOpen(true);
        } catch {
            messageApi.error('Không thể tải thông tin vườn');
        } finally {
            setEditingLoadingId(null);
        }
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        const {gardenDescription, ...apiValues} = values;
        setSaving(true);
        try {
            // Mô tả vườn lưu thẳng vào API (Garden.description).
            const payload = {...apiValues, description: (gardenDescription ?? '').trim()};
            if (editingId) {
                await updateGardenAPI(editingId, payload);
                messageApi.success('Cập nhật vườn thành công');
            } else {
                await createGardenAPI(payload);
                messageApi.success('Thêm vườn thành công');
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
        if (deletingId || editingLoadingId) return;
        setDeletingId(id);
        try {
            await deleteGardenAPI(id);
            messageApi.success('Xoá vườn thành công');
            fetchData();
        } catch {
            messageApi.error('Xoá thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    const columns: ColumnsType<Garden> = [
        {title: 'ID', dataIndex: 'id', key: 'id', width: 60},
        {
            title: 'Mã vườn',
            key: 'gardenCode',
            width: 120,
            render: (_, r) => (
                <Tag color="green" className="font-semibold">
                    {formatGardenCode(r)}
                </Tag>
            ),
        },
        {
            title: 'Tên vườn',
            dataIndex: 'name',
            key: 'name',
            width: 120,
            render: (n) => <span className="font-medium">{n}</span>,
        },
        {
            title: 'Số lượng cây',
            key: 'treeCount',
            width: 110,
            render: (_, r) => {
                const count = r.id ? (teaCounts[r.id] ?? 0) : 0;
                return <Tag color={count > 0 ? 'blue' : 'default'}>{count} cây</Tag>;
            },
        },
        {title: 'Địa chỉ', dataIndex: 'address', key: 'address', width: 220},
        {
            title: 'Mô tả',
            key: 'gardenDescription',
            width: 380,
            render: (_, r) => {
                const desc = r.description ?? '';
                return desc ? (
                    <span className="line-clamp-2" title={desc}>
                        {desc}
                    </span>
                ) : (
                    '-'
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 110,
            render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hoạt động' : 'Tạm dừng'}</Tag>,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 110,
            render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 110,
            fixed: 'right',
            render: (_, r) => (
                <Space>
                    <Button
                        type="text"
                        icon={<Edit2 size={15} />}
                        loading={editingLoadingId === r.id}
                        disabled={deletingId !== null}
                        onClick={() => openEdit(r.id!)}
                    />
                    <Popconfirm
                        title="Xoá vườn này?"
                        onConfirm={() => handleDelete(r.id!)}
                        okButtonProps={{loading: deletingId === r.id}}
                        okText="Xoá"
                        cancelText="Huỷ"
                    >
                        <Button
                            type="text"
                            danger
                            disabled={deletingId !== null || editingLoadingId !== null}
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
                    <MapPin
                        size={20}
                        color="#3B5518"
                    />
                    <Title
                        level={4}
                        style={{margin: 0, color: '#3B5518'}}
                    >
                        Vườn trà
                    </Title>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={openCreate}
                    style={{background: '#3B5518'}}
                >
                    Thêm vườn
                </Button>
            </div>

            <div style={{background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                <div className="flex gap-3 mb-4">
                    <Input.Search
                        placeholder="Tìm tên, địa chỉ vườn..."
                        allowClear
                        style={{maxWidth: 300}}
                        onSearch={(v) => {
                            setKeyword(v);
                            setPageIndex(1);
                        }}
                    />
                </div>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={gardens}
                    loading={loading}
                    scroll={{x: 1340, y: 'calc(100vh - 370px)'}}
                    pagination={{
                        current: pageIndex,
                        pageSize: 20,
                        total,
                        showTotal: (t) => `Tổng ${t} vườn`,
                        onChange: (p) => setPageIndex(p),
                        showSizeChanger: false,
                    }}
                    locale={{emptyText: 'Chưa có vườn nào'}}
                />
            </div>

            <Modal
                title={editingId ? 'Chỉnh sửa vườn' : 'Thêm vườn mới'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
                confirmLoading={saving}
                okText={editingId ? 'Lưu' : 'Thêm'}
                cancelText="Huỷ"
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-4"
                >
                    <Form.Item
                        name="name"
                        label="Tên vườn"
                        rules={[{required: true, message: 'Nhập tên vườn'}]}
                    >
                        <Input placeholder="Ví dụ: Nhiềm, Chúi, Pèng, Hậu, Sui, Bằng, Cháp, Hẹc" />
                    </Form.Item>
                    <Form.Item
                        name="address"
                        label="Địa chỉ"
                    >
                        <Input placeholder="Địa chỉ vườn..." />
                    </Form.Item>
                    <Alert
                        type="info"
                        showIcon
                        message="Mô tả vườn hiện lưu tạm trên trình duyệt này (backend chưa có API mô tả vườn). Khi API có, cấu hình này sẽ được chuyển sang API mà không cần sửa giao diện."
                        style={{marginBottom: 16}}
                    />
                    <Form.Item
                        name="gardenDescription"
                        label="Mô tả vườn (hiển thị ở trang Bộ sưu tập cây trà)"
                    >
                        <Input.TextArea rows={3} placeholder="Mô tả vườn, vị trí, đặc điểm cây trà trong vườn..." />
                    </Form.Item>
                    <Form.Item
                        name="isActive"
                        label="Kích hoạt"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
