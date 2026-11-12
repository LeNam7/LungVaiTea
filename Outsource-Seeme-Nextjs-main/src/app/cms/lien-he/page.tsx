'use client';
import React, {useEffect, useState} from 'react';
import {Alert, Card, Table, Tag, Typography, Input, Button, Drawer, Descriptions} from 'antd';
import {Phone, Search, Eye} from 'lucide-react';
import dayjs from 'dayjs';
import {unwrapPagingData} from '@/api/response';
import {getContactsPagingAPI} from '@/api/ContactAPI';

const {Title} = Typography;

interface ContactItem {
    id: number;
    name?: string;
    phone?: string;
    subject?: string;
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    title?: string;
    message?: string;
    address?: string;
    content?: string;
    createdDate?: string;
    isRead?: boolean;
}

export default function LienHePage() {
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState<ContactItem | null>(null);
    const [apiNote, setApiNote] = useState('');

    const fetchContacts = async (pageIndex = 1, kw = '') => {
        await Promise.resolve();
        setLoading(true);
        try {
            const res = await getContactsPagingAPI({
                pageIndex,
                pageSize: 20,
                keyword: kw || null,
            });
            const paging = unwrapPagingData<ContactItem>(res);
            setContacts(paging.data);
            setTotal(paging.totalRecords);
            setApiNote('');
        } catch {
            setContacts([]);
            setTotal(0);
            setApiNote('Không thể tải danh sách liên hệ từ API. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void Promise.resolve().then(() => fetchContacts(1, ''));
    }, []);

    const handleSearch = () => {
        setPage(1);
        fetchContacts(1, keyword);
    };

    const columns = [
        {title: 'ID', dataIndex: 'id', key: 'id', width: 70},
        {title: 'Họ tên', key: 'name', render: (_: unknown, row: ContactItem) => row.name ?? row.fullName ?? '-'},
        {title: 'Điện thoại', key: 'phone', width: 130, render: (_: unknown, row: ContactItem) => row.phone ?? row.phoneNumber ?? '-'},
        {title: 'Email', dataIndex: 'email', key: 'email'},
        {title: 'Tiêu đề', key: 'subject', ellipsis: true, render: (_: unknown, row: ContactItem) => row.subject ?? row.title ?? '-'},
        {
            title: 'Trạng thái',
            dataIndex: 'isRead',
            key: 'isRead',
            width: 120,
            render: (v: boolean) => <Tag color={v ? 'default' : 'blue'}>{v ? 'Đã đọc' : 'Chưa đọc'}</Tag>,
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 150,
            render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-'),
        },
        {
            title: '',
            key: 'action',
            width: 60,
            render: (_: unknown, record: ContactItem) => (
                <Button
                    type="text"
                    icon={<Eye size={16} />}
                    onClick={() => setSelected(record)}
                />
            ),
        },
    ];

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Phone size={20} color="#3B5518" />
                <Title level={4} style={{margin: 0, color: '#3B5518'}}>
                    Quản lý liên hệ
                </Title>
            </div>

            {apiNote && (
                <Alert
                    type="warning"
                    showIcon
                    message={apiNote}
                    style={{marginBottom: 16}}
                />
            )}

            <Card style={{borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                <div className="flex gap-3 mb-4">
                    <Input
                        prefix={<Search size={14} className="text-gray-400" />}
                        placeholder="Tìm theo tên, email, số điện thoại..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{maxWidth: 340}}
                    />
                    <Button type="primary" onClick={handleSearch}>Tìm kiếm</Button>
                </div>

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={contacts}
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize: 20,
                        total,
                        onChange: (p) => {
                            setPage(p);
                            fetchContacts(p, keyword);
                        },
                        showTotal: (t) => `Tổng ${t} liên hệ`,
                    }}
                    size="small"
                    locale={{emptyText: 'Chưa có liên hệ nào'}}
                />
            </Card>

            <Drawer
                title="Chi tiết liên hệ"
                open={!!selected}
                onClose={() => setSelected(null)}
                size="large"
            >
                {selected && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Họ tên">{selected.name ?? selected.fullName ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Điện thoại">{selected.phone ?? selected.phoneNumber ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Email">{selected.email ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{selected.address ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Tiêu đề">{selected.subject ?? selected.title ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Nội dung">
                            <div style={{whiteSpace: 'pre-wrap'}}>{selected.message ?? selected.content ?? '-'}</div>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày gửi">
                            {selected.createdDate ? dayjs(selected.createdDate).format('DD/MM/YYYY HH:mm') : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </div>
    );
}
