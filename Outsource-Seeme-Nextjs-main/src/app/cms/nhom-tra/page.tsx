'use client';

import React, {useCallback, useEffect, useState} from 'react';
import {Button, Form, Input, InputNumber, message, Modal, Popconfirm, Space, Switch, Table, Tag, Typography} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {Edit2, FolderTree, Plus, Trash2} from 'lucide-react';
import ImageUploadField from '@/components/cms/ImageUploadField';
import {
    createTeaGroupAPI,
    deleteTeaGroupAPI,
    getTeaGroupsPagingAPI,
    updateTeaGroupAPI,
} from '@/api/TeaGroupAPI';
import {unwrapPagingData} from '@/api/response';
import type {TeaGroupRecord} from '@/types/swagger.types';
import {normalizeSearchText} from '@/lib/tea-taxonomy';

const {Title} = Typography;

const readApiMessage = (err: unknown): string | null => {
    const response = (err as {response?: {data?: {message?: unknown}}})?.response?.data;
    return typeof response?.message === 'string' && response.message ? response.message : null;
};

/**
 * CMS Nhóm trà - tầng phân loại duy nhất từ tái cấu trúc 1/11/2026
 * (Nhóm trà → Sản phẩm). Nhóm là bản ghi thật trên API (bảng TeaGroup,
 * BE 30/10/2026); sản phẩm trỏ thẳng tới nhóm qua groupId. Xóa nhóm còn
 * sản phẩm thì BE chặn (400).
 */
export default function NhomTraPage() {
    const [groups, setGroups] = useState<TeaGroupRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<TeaGroupRecord | null>(null);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getTeaGroupsPagingAPI({pageIndex: 1, pageSize: 100} as any);
            const all = unwrapPagingData<TeaGroupRecord>(res).data.filter((g) => g.isDelete !== true);
            all.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (b.id ?? 0) - (a.id ?? 0));
            setGroups(all);
        } catch {
            messageApi.error('Không thể tải nhóm trà');
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        void Promise.resolve().then(fetchData);
    }, [fetchData]);

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        form.setFieldsValue({sortOrder: 0, isActive: true});
        setModalOpen(true);
    };

    const openEdit = (record: TeaGroupRecord) => {
        setEditing(record);
        form.setFieldsValue({
            name: record.name ?? '',
            nameEn: record.nameEn ?? '',
            slug: record.slug ?? '',
            description: record.description ?? '',
            descriptionEn: record.descriptionEn ?? '',
            imageUrl: record.imageUrl ?? '',
            sortOrder: record.sortOrder ?? 0,
            isActive: record.isActive !== false,
        });
        setModalOpen(true);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editing) return;
        if (form.getFieldValue('slug')) return;
        const slug = normalizeSearchText(e.target.value).replace(/\s+/g, '-');
        form.setFieldsValue({slug});
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        const slug = String(values.slug ?? '').trim().toLowerCase();
        const payload: TeaGroupRecord = {
            slug,
            name: String(values.name ?? '').trim(),
            nameEn: String(values.nameEn ?? '').trim() || null,
            description: String(values.description ?? '').trim() || null,
            descriptionEn: String(values.descriptionEn ?? '').trim() || null,
            imageUrl: String(values.imageUrl ?? '').trim() || null,
            sortOrder: Number(values.sortOrder ?? 0),
            isActive: values.isActive !== false,
        };
        setSaving(true);
        try {
            if (editing?.slug) {
                await updateTeaGroupAPI(editing.slug, payload);
                messageApi.success('Cập nhật nhóm trà thành công');
            } else {
                await createTeaGroupAPI(payload);
                messageApi.success('Thêm nhóm trà thành công');
            }
            setModalOpen(false);
            void fetchData();
        } catch (err) {
            messageApi.error(readApiMessage(err) ?? 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record: TeaGroupRecord) => {
        if (!record.slug) return;
        try {
            await deleteTeaGroupAPI(record.slug);
            messageApi.success('Xoá nhóm trà thành công');
            void fetchData();
        } catch (err) {
            messageApi.error(readApiMessage(err) ?? 'Xoá thất bại');
        }
    };

    const columns: ColumnsType<TeaGroupRecord> = [
        {
            title: 'Tên nhóm',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            render: (n) => <span className="font-medium">{n}</span>,
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            width: 140,
            render: (s) => <code>{s}</code>,
        },
        {
            title: 'Mô tả (mega menu)',
            dataIndex: 'description',
            key: 'description',
            width: 420,
            render: (v) => (
                <span className="line-clamp-2" title={v || undefined}>
                    {v || '-'}
                </span>
            ),
        },
        {
            title: 'Thứ tự',
            dataIndex: 'sortOrder',
            key: 'sortOrder',
            width: 90,
        },
        {
            title: 'Trạng thái',
            key: 'isActive',
            width: 110,
            render: (_, r) =>
                r.isActive !== false ? <Tag color="green">Hoạt động</Tag> : <Tag>Ẩn</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 110,
            fixed: 'right',
            render: (_, r) => (
                <Space>
                    <Button type="text" icon={<Edit2 size={15} />} onClick={() => openEdit(r)} />
                    <Popconfirm
                        title="Xoá nhóm trà này?"
                        description="Nhóm còn danh mục sẽ bị chặn xóa."
                        okText="Xoá"
                        cancelText="Huỷ"
                        onConfirm={() => handleDelete(r)}
                    >
                        <Button type="text" danger icon={<Trash2 size={15} color="#DC2626" />} />
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
                style={{position: 'sticky', top: 0, zIndex: 10, background: '#f5f5f5', paddingTop: 4, paddingBottom: 4, marginBottom: 20}}
            >
                <div className="flex items-center gap-2">
                    <FolderTree size={20} color="#3B5518" />
                    <Title level={4} style={{margin: 0, color: '#3B5518'}}>
                        Nhóm trà
                    </Title>
                </div>
                <Space>
                    <Button type="primary" icon={<Plus size={15} />} onClick={openCreate} style={{background: '#3B5518'}}>
                        Thêm nhóm trà
                    </Button>
                </Space>
            </div>

            <div style={{background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                <Table
                    rowKey={(r) => r.slug ?? String(r.id)}
                    columns={columns}
                    dataSource={groups}
                    loading={loading}
                    pagination={false}
                    scroll={{x: 1020}}
                    locale={{emptyText: 'Chưa có nhóm trà nào'}}
                />
            </div>

            <Modal
                title={editing ? 'Chỉnh sửa nhóm trà' : 'Thêm nhóm trà mới'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
                confirmLoading={saving}
                okText={editing ? 'Lưu' : 'Thêm'}
                cancelText="Huỷ"
                destroyOnHidden
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Form.Item
                            name="name"
                            label="Tên nhóm trà (Tiếng Việt)"
                            rules={[{required: true, message: 'Nhập tên nhóm trà'}]}
                        >
                            <Input placeholder="Ví dụ: Trà Ô Long" onChange={handleNameChange} />
                        </Form.Item>
                        <Form.Item
                            name="nameEn"
                            label="Tên nhóm trà (Tiếng Anh)"
                        >
                            <Input placeholder="Ví dụ: Oolong Tea" />
                        </Form.Item>
                    </div>
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[
                            {required: true, message: 'Nhập slug'},
                            {pattern: /^[a-z0-9-]+$/, message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'},
                        ]}
                        help="Slug dùng trong link ?group=... và khớp với trường nhóm của danh mục. Tạo xong không đổi được."
                    >
                        <Input placeholder="Ví dụ: tra-o-long" disabled={!!editing} />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-3">
                        <Form.Item name="description" label="Mô tả nhóm (Tiếng Việt)">
                            <Input.TextArea rows={3} placeholder="Mô tả nhóm trà..." />
                        </Form.Item>
                        <Form.Item name="descriptionEn" label="Mô tả nhóm (Tiếng Anh)">
                            <Input.TextArea rows={3} placeholder="Group description in English..." />
                        </Form.Item>
                    </div>
                    <Form.Item name="imageUrl" label="Ảnh đại diện nhóm">
                        <ImageUploadField maxCount={1} />
                    </Form.Item>
                    <Form.Item name="sortOrder" label="Thứ tự hiển thị">
                        <InputNumber style={{width: '100%'}} min={0} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
