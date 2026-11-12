'use client';
import React, {useCallback, useEffect, useState} from 'react';
import Image from 'next/image';
import {Button, Input, message, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {Edit2, Eye, Newspaper, Plus, Trash2} from 'lucide-react';
import {getBlogsPagingAPI, deleteBlogAPI} from '@/api/BlogAPI';
import {unwrapPagingData} from '@/api/response';
import {BlogType, type Blog} from '@/types/swagger.types';
import dayjs from 'dayjs';
import {useRouter} from 'next/navigation';

const {Title} = Typography;

const BLOG_TYPE_MAP: Record<BlogType, {label: string; color: string}> = {
    [BlogType.Default]: {label: 'Mặc định', color: 'default'},
    [BlogType.Hot]: {label: 'Hot', color: 'red'},
    [BlogType.MostViewed]: {label: 'Most viewed', color: 'blue'},
};

const BLOG_TYPE_FILTER_OPTIONS = [
    {label: 'Tất cả loại', value: 'all'},
    {label: 'Mặc định', value: BlogType.Default},
    {label: 'Hot', value: BlogType.Hot},
    {label: 'Most viewed', value: BlogType.MostViewed},
];

export default function TinTucPage() {
    const router = useRouter();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [total, setTotal] = useState(0);
    const [pageIndex, setPageIndex] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [blogTypeFilter, setBlogTypeFilter] = useState<BlogType | null>(null);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [messageApi, contextHolder] = message.useMessage();

    const fetchData = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        try {
            const res = await getBlogsPagingAPI({
                pageIndex,
                pageSize: 20,
                keyword: keyword || null,
                type: blogTypeFilter ?? undefined,
            });
            const paging = unwrapPagingData<Blog>(res);
            setBlogs(paging.data);
            setTotal(paging.totalRecords);
        } catch {
            messageApi.error('Không thể tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    }, [pageIndex, keyword, blogTypeFilter, messageApi]);

    useEffect(() => {
        void Promise.resolve().then(fetchData);
    }, [fetchData]);

    const handleDelete = async (id: number) => {
        if (deletingId) return;
        setDeletingId(id);
        try {
            await deleteBlogAPI(id);
            messageApi.success('Xoá bài viết thành công');
            fetchData();
        } catch {
            messageApi.error('Xoá thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    const columns: ColumnsType<Blog> = [
        {title: 'ID', dataIndex: 'id', key: 'id', width: 60},
        {
            title: 'Ảnh',
            key: 'coverImage',
            width: 80,
            render: (_: any, r: any) => {
                const v = r.coverImage ?? r.thumbnail;
                if (!v) return <div style={{width:60,height:40,background:'#f5f5f5',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#ccc'}}>No img</div>;
                const src = v.startsWith('http') || v.startsWith('/images/') ? v : `${process.env.NEXT_PUBLIC_STORAGE_URL}${v}`;
                return <Image src={src} alt="" width={60} height={40} unoptimized style={{objectFit:'cover',borderRadius:4}} />;
            },
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (t) => <span className="font-medium line-clamp-2">{t}</span>,
        },
        {
            title: 'Tác giả',
            dataIndex: 'author',
            key: 'author',
            width: 130,
            render: (v) => v ?? '-',
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            width: 150,
            render: (v) => v ? v.split(',').map((tag: string) => <Tag key={tag} color="green" style={{marginBottom:2}}>{tag.trim()}</Tag>) : null,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (v: BlogType | null | undefined) => {
                const type = BLOG_TYPE_MAP[v ?? BlogType.Default] ?? BLOG_TYPE_MAP[BlogType.Default];
                return <Tag color={type.color}>{type.label}</Tag>;
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 120,
            render: (v: boolean | null | undefined) => (
                <Tag color={v === false ? 'default' : 'green'}>{v === false ? 'Ẩn' : 'Hiển thị'}</Tag>
            ),
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
            fixed: 'right',
            width: 120,
            render: (_, r) => (
                <Space>
                    <Tooltip title="Xem trước">
                        <Button
                            type="text"
                            icon={<Eye size={15} />}
                            onClick={() => window.open(`/tin-tuc/${r.id}`, '_blank')}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<Edit2 size={15} />}
                            onClick={() => router.push(`/cms/tin-tuc/${r.id}`)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xoá bài viết này?"
                        onConfirm={() => handleDelete(r.id!)}
                        okButtonProps={{loading: deletingId === r.id}}
                        okText="Xoá"
                        cancelText="Huỷ"
                    >
                        <Button
                            type="text"
                            danger
                            disabled={deletingId !== null}
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
                    <Newspaper
                        size={20}
                        color="#3B5518"
                    />
                    <Title
                        level={4}
                        style={{margin: 0, color: '#3B5518'}}
                    >
                        Tin tức / Blog
                    </Title>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={() => router.push('/cms/tin-tuc/tao-moi')}
                    style={{background: '#3B5518'}}
                >
                    Viết bài mới
                </Button>
            </div>

            <div style={{background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                <div className="flex gap-3 mb-4 flex-wrap">
                    <Input.Search
                        placeholder="Tìm tiêu đề..."
                        allowClear
                        style={{maxWidth: 300}}
                        onSearch={(v) => {
                            setKeyword(v);
                            setPageIndex(1);
                        }}
                    />
                    <Select
                        value={blogTypeFilter ?? 'all'}
                        options={BLOG_TYPE_FILTER_OPTIONS}
                        style={{width: 180}}
                        onChange={(value: BlogType | 'all') => {
                            setBlogTypeFilter(value === 'all' ? null : value);
                            setPageIndex(1);
                        }}
                    />
                </div>

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={blogs}
                    loading={loading}
                    scroll={{x: 'max-content', y: 'calc(100vh - 390px)'}}
                    pagination={{
                        current: pageIndex,
                        pageSize: 20,
                        total,
                        showTotal: (t) => `Tổng ${t} bài viết`,
                        onChange: (p) => setPageIndex(p),
                        showSizeChanger: false,
                    }}
                    locale={{emptyText: 'Chưa có bài viết nào'}}
                />
            </div>
        </div>
    );
}
