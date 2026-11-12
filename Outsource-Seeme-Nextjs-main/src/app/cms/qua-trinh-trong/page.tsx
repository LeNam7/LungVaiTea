'use client';
import React, {useCallback, useEffect, useState} from 'react';
import {Button, Col, Form, Input, message, Modal, Row, Select, Space, Table, Tag, Typography} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {Edit2, Plus, Sprout} from 'lucide-react';
import ImageUploadField from '@/components/cms/ImageUploadField';
import {getPlantProcessPagingAPI, createPlantProcessAPI, updatePlantProcessAPI} from '@/api/PlantProcessAPI';
import {getTeasPagingAPI} from '@/api/TeaAPI';
import {unwrapPagingData} from '@/api/response';
import type {PlantProgressResponse, Tea} from '@/types/swagger.types';
import dayjs from 'dayjs';

const {Title} = Typography;

export default function QuaTrinhTrongPage() {
    const [records, setRecords] = useState<PlantProgressResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [pageIndex, setPageIndex] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [filterTeaId, setFilterTeaId] = useState<number | undefined>();
    const [loading, setLoading] = useState(false);
    const [teas, setTeas] = useState<Tea[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const fetchData = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        try {
            const res = await getPlantProcessPagingAPI({
                pageIndex,
                pageSize: 20,
                keyword: keyword || undefined,
                teaId: filterTeaId,
            });
            const paging = unwrapPagingData<PlantProgressResponse>(res);
            setRecords(paging.data);
            setTotal(paging.totalRecords);
        } catch {
            messageApi.error('Không thể tải dữ liệu quá trình trồng');
        } finally {
            setLoading(false);
        }
    }, [pageIndex, keyword, filterTeaId, messageApi]);

    useEffect(() => {
        void Promise.resolve().then(fetchData);
    }, [fetchData]);

    useEffect(() => {
        getTeasPagingAPI({pageIndex: 1, pageSize: 200})
            .then((res: any) => setTeas(unwrapPagingData<Tea>(res).data))
            .catch(() => {});
    }, []);

    const openCreate = () => {
        setEditingId(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (record: PlantProgressResponse) => {
        setEditingId(record.id!);
        form.setFieldsValue(record);
        setModalOpen(true);
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        setSaving(true);
        try {
            if (editingId) {
                await updatePlantProcessAPI({id: editingId, ...values});
                messageApi.success('Cập nhật thành công');
            } else {
                await createPlantProcessAPI(values);
                messageApi.success('Thêm tiến độ thành công');
            }
            setModalOpen(false);
            fetchData();
        } catch {
            messageApi.error('Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const columns: ColumnsType<PlantProgressResponse> = [
        {title: 'ID', dataIndex: 'id', key: 'id', width: 60},
        {
            title: 'Cây trà',
            dataIndex: 'teaId',
            key: 'teaId',
            render: (id) => teas.find((t) => t.id === id)?.name ?? <Tag>{id}</Tag>,
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (t) => <span className="font-medium">{t}</span>,
        },
        {
            title: 'Nội dung',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-'),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 90,
            render: (_, r) => (
                <Space>
                    <Button
                        type="text"
                        icon={<Edit2 size={15} />}
                        onClick={() => openEdit(r)}
                    />
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
                    <Sprout
                        size={20}
                        color="#3B5518"
                    />
                    <Title
                        level={4}
                        style={{margin: 0, color: '#3B5518'}}
                    >
                        Quá trình trồng
                    </Title>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={openCreate}
                    style={{background: '#3B5518'}}
                >
                    Thêm tiến độ
                </Button>
            </div>

            <div style={{background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                <div className="flex gap-3 mb-4 flex-wrap">
                    <Select
                        placeholder="Lọc theo cây trà"
                        allowClear
                        style={{width: 220}}
                        options={teas.map((t) => ({value: t.id, label: t.name}))}
                        onChange={(v) => {
                            setFilterTeaId(v);
                            setPageIndex(1);
                        }}
                    />
                    <Input.Search
                        placeholder="Tìm tiêu đề..."
                        allowClear
                        style={{maxWidth: 280}}
                        onSearch={(v) => {
                            setKeyword(v);
                            setPageIndex(1);
                        }}
                    />
                </div>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={records}
                    loading={loading}
                    pagination={{
                        current: pageIndex,
                        pageSize: 20,
                        total,
                        showTotal: (t) => `Tổng ${t} tiến độ`,
                        onChange: (p) => setPageIndex(p),
                        showSizeChanger: false,
                    }}
                    locale={{emptyText: 'Chưa có dữ liệu'}}
                />
            </div>

            <Modal
                title={editingId ? 'Chỉnh sửa tiến độ' : 'Thêm tiến độ trồng mới'}
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
                        {!editingId && (
                            <Col span={24}>
                                <Form.Item
                                    name="teaId"
                                    label="Cây trà"
                                    rules={[{required: true, message: 'Chọn cây trà'}]}
                                >
                                    <Select
                                        placeholder="Chọn cây trà"
                                        showSearch
                                        optionFilterProp="label"
                                        options={teas.map((t) => ({value: t.id, label: t.name}))}
                                    />
                                </Form.Item>
                            </Col>
                        )}
                        <Col span={24}>
                            <Form.Item
                                name="title"
                                label="Tiêu đề"
                                rules={[
                                    {required: true, message: 'Nhập tiêu đề'},
                                    {max: 200, message: 'Tối đa 200 ký tự'},
                                ]}
                            >
                                <Input placeholder="Tiêu đề tiến độ..." />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="content"
                                label="Nội dung"
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Mô tả chi tiết tiến độ..."
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="images"
                                label="Hình ảnh"
                            >
                                <ImageUploadField maxCount={4} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
