'use client';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Button,
    Col,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {Edit2, Plus, ShoppingBag, Trash2} from 'lucide-react';
import ImageUploadField from '@/components/cms/ImageUploadField';
import {
    getProductsPagingAPI,
    getProductByIdAPI,
    createProductAPI,
    updateProductAPI,
    deleteProductAPI,
    getSoldCountsAPI,
} from '@/api/ProductAPI';
import {unwrapApiData, unwrapPagingData} from '@/api/response';
import type {Product, SoldCount} from '@/types/swagger.types';
import {getFirstApiImageUrl} from '@/utils/imageUrl';
import {
    groupIdForProduct,
    lineKeyForProduct,
    normalizeLineName,
    normalizeSearchText,
    type TeaGroup,
} from '@/lib/tea-taxonomy';
import {useTeaGroups} from '@/hooks/useTeaGroups';
import dayjs from 'dayjs';

const {Title} = Typography;

const getFirstImage = (images?: string | null): string => {
    return getFirstApiImageUrl(images, '/images/shan-tuyet-tea-tree.jpg');
};

/** 1 dòng trong bảng phân loại của modal (row API thật hoặc row mới chưa lưu). */
interface VariantDraft {
    key: string;
    id?: number;
    /** Tên phân loại duy nhất trong bảng (hiển thị ngoài trang bán; dữ liệu thật đang nằm ở packagingName). */
    name: string;
    quantity: number;
    price: number;
    total: number;
    isActive: boolean;
    images: string;
}

const emptyDraft = (): VariantDraft => ({
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '',
    quantity: 0,
    price: 0,
    total: 0,
    isActive: true,
    images: '',
});

const draftOf = (v: Product): VariantDraft => ({
    key: `id-${v.id}`,
    id: v.id,
    name: v.packagingName?.trim() || v.variantName?.trim() || '',
    quantity: Number(v.quantity ?? 0),
    price: Number(v.price ?? 0),
    total: Number(v.total ?? 0),
    isActive: v.isActive !== false,
    images: v.images ?? '',
});

/** 1 dòng sản phẩm = các row API cùng nhóm + cùng tên. Mỗi row là 1 phân loại. */
interface ProductLineRow {
    key: string;
    name: string;
    groupId: string | null;
    groupName: string;
    variants: Product[];
    minPrice: number;
    maxPrice: number;
    image: string | null;
    description: string | null;
    userManual: string | null;
    storageInstructions: string | null;
}

function groupTeaLines(products: Product[], groups: TeaGroup[]): ProductLineRow[] {
    const byKey = new Map<string, ProductLineRow>();
    for (const product of products) {
        if (product.isGiftSet) continue;
        const name = normalizeLineName(product.name) || `Sản phẩm #${product.id}`;
        const groupId = groupIdForProduct(product, groups);
        const key = lineKeyForProduct(product, groups);
        const price = Number(product.price ?? 0);
        const existing = byKey.get(key);
        if (existing) {
            existing.variants.push(product);
            existing.minPrice = Math.min(existing.minPrice, price);
            existing.maxPrice = Math.max(existing.maxPrice, price);
            if (!existing.image && product.images) existing.image = product.images;
            if (!existing.description && product.description) existing.description = product.description;
            if (!existing.userManual && product.userManual) existing.userManual = product.userManual;
            if (!existing.storageInstructions && product.storageInstructions)
                existing.storageInstructions = product.storageInstructions;
        } else {
            byKey.set(key, {
                key,
                name,
                groupId,
                groupName: groups.find((g) => g.id === groupId)?.name ?? 'Chưa phân nhóm',
                variants: [product],
                minPrice: price,
                maxPrice: price,
                image: product.images ?? null,
                description: product.description ?? null,
                userManual: product.userManual ?? null,
                storageInstructions: product.storageInstructions ?? null,
            });
        }
    }
    return Array.from(byKey.values()).map((line) => ({
        ...line,
        variants: [...line.variants].sort((a, b) => (Number(a.price ?? 0) || 0) - (Number(b.price ?? 0) || 0)),
    }));
}

export default function SanPhamPage() {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const {groups} = useTeaGroups();
    const [keyword, setKeyword] = useState('');

    const [lineModalOpen, setLineModalOpen] = useState(false);
    const [editingLine, setEditingLine] = useState<ProductLineRow | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const [lineForm] = Form.useForm();
    // Bảng phân loại trong modal dòng: sửa/thêm/xoá mọi phân loại rồi lưu 1 lần.
    const [draftVariants, setDraftVariants] = useState<VariantDraft[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    // Số đã bán theo id sản phẩm (BE 30/10/2026). Lỗi thì map rỗng + chưa tải xong (hiện '-').
    const [soldMap, setSoldMap] = useState<Record<number, number>>({});
    const [soldLoaded, setSoldLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getSoldCountsAPI()
            .then((res) => {
                if (cancelled) return;
                const list = unwrapApiData<SoldCount[]>(res);
                const map: Record<number, number> = {};
                (Array.isArray(list) ? list : []).forEach((row) => {
                    if (typeof row.productId === 'number') map[row.productId] = Number(row.soldCount ?? 0);
                });
                setSoldMap(map);
                setSoldLoaded(true);
            })
            .catch(() => {
                /* BE chưa deploy endpoint doanh số: cột Đã bán hiện '-'. */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const fetchData = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        try {
            // Lấy đủ sản phẩm để gom dòng ở client (hiện ~67 sản phẩm, lấy 200 cho dư).
            const res = await getProductsPagingAPI({pageIndex: 1, pageSize: 200});
            setAllProducts(unwrapPagingData<Product>(res).data);
        } catch {
            messageApi.error('Không thể tải sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        void Promise.resolve().then(fetchData);
    }, [fetchData]);

    const lines = useMemo(() => groupTeaLines(allProducts, groups), [allProducts, groups]);
    const filteredLines = useMemo(() => {
        const q = normalizeSearchText(keyword);
        if (!q) return lines;
        const words = q.split(' ');
        return lines.filter((line) => {
            const haystack = normalizeSearchText(`${line.name} ${line.groupName}`);
            return words.every((w) => haystack.includes(w));
        });
    }, [lines, keyword]);

    const soldOf = useCallback(
        (variant: Product) => (soldLoaded ? (soldMap[variant.id ?? -1] ?? 0) : null),
        [soldLoaded, soldMap],
    );

    // ── Modal sản phẩm: tên + nhóm trà + mô tả của cả dòng + BẢNG phân loại ──
    // Lưu 1 lần xong cả sản phẩm + mọi phân loại (không tách 2 bước như trước).
    const openCreateLine = () => {
        setEditingLine(null);
        lineForm.resetFields();
        setDraftVariants([emptyDraft()]);
        setLineModalOpen(true);
    };

    const openEditLine = (line: ProductLineRow) => {
        setEditingLine(line);
        lineForm.setFieldsValue({
            name: line.name,
            groupId: line.groupId,
            description: line.description ?? '',
            userManual: line.userManual ?? '',
            storageInstructions: line.storageInstructions ?? '',
        });
        setDraftVariants(line.variants.map(draftOf));
        setLineModalOpen(true);
    };

    const updateDraft = (key: string, patch: Partial<VariantDraft>) => {
        setDraftVariants((rows) => rows.map((r) => (r.key === key ? {...r, ...patch} : r)));
    };

    const handleSaveLine = async () => {
        const values = await lineForm.validateFields();
        if (!draftVariants.length) {
            messageApi.error('Cần ít nhất 1 phân loại');
            return;
        }
        setSaving(true);
        try {
            if (editingLine) {
                // Xoá các phân loại đã bỏ khỏi bảng, rồi cập nhật/tạo các dòng còn lại.
                // Đổi tên/nhóm trà/mô tả thì áp cho mọi phân loại của dòng.
                for (const variant of editingLine.variants) {
                    if (!draftVariants.some((d) => d.id === variant.id)) {
                        await deleteProductAPI(variant.id!);
                    }
                }
                for (const d of draftVariants) {
                    if (d.id) {
                        // PUT đủ field để không mất dữ liệu cũ của row.
                        const full = unwrapApiData<Product>(await getProductByIdAPI(d.id));
                        await updateProductAPI(d.id, {
                            ...full,
                            name: values.name,
                            groupId: values.groupId,
                            description: values.description ?? '',
                            userManual: values.userManual ?? '',
                            storageInstructions: values.storageInstructions ?? '',
                            price: d.price,
                            quantity: d.quantity,
                            // 1 cột tên duy nhất: ghi vào packagingName (trường trang bán đang dùng),
                            // xoá variantName để nhãn ngoài trang bán không bị lặp "Tên - Tên".
                            packagingName: d.name,
                            variantName: '',
                            total: d.total,
                            isActive: d.isActive,
                            images: d.images,
                        });
                    } else {
                        await createProductAPI({
                            name: values.name,
                            groupId: values.groupId,
                            price: d.price,
                            quantity: d.quantity,
                            packagingName: d.name,
                            variantName: '',
                            total: d.total,
                            description: values.description ?? '',
                            userManual: values.userManual ?? '',
                            storageInstructions: values.storageInstructions ?? '',
                            isActive: d.isActive,
                            images: d.images,
                            isGiftSet: false,
                        } as any);
                    }
                }
                messageApi.success('Cập nhật sản phẩm thành công');
            } else {
                for (const d of draftVariants) {
                    await createProductAPI({
                        name: values.name,
                        groupId: values.groupId,
                        price: d.price,
                        quantity: d.quantity,
                        packagingName: d.name,
                        variantName: '',
                        total: d.total,
                        description: values.description ?? '',
                        userManual: values.userManual ?? '',
                        storageInstructions: values.storageInstructions ?? '',
                        isActive: d.isActive,
                        images: d.images,
                        isGiftSet: false,
                    } as any);
                }
                messageApi.success('Thêm sản phẩm thành công');
            }
            setLineModalOpen(false);
            fetchData();
        } catch {
            messageApi.error('Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLine = async (line: ProductLineRow) => {
        if (deletingId) return;
        setDeletingId(-1);
        try {
            for (const variant of line.variants) {
                await deleteProductAPI(variant.id!);
            }
            messageApi.success(`Đã xoá sản phẩm và ${line.variants.length} phân loại`);
            fetchData();
        } catch {
            messageApi.error('Xoá thất bại (một số phân loại có thể đã bị xoá)');
            fetchData();
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteVariant = async (variant: Product) => {
        if (deletingId) return;
        setDeletingId(variant.id!);
        try {
            await deleteProductAPI(variant.id!);
            messageApi.success('Xoá phân loại thành công');
            fetchData();
        } catch {
            messageApi.error('Xoá thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    // Bảng phân loại bung ra dưới mỗi dòng: bấm Sửa mở modal bảng phân loại của cả dòng.
    const variantColumnsFor = (line: ProductLineRow): ColumnsType<Product> => [
        {
            title: 'Ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 70,
            render: (images) => {
                const src = getFirstImage(images);
                return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt=""
                        style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 6, cursor: 'pointer'}}
                        onClick={() => setPreviewImg(src)}
                        onError={(e) => { const i = e.currentTarget; i.onerror = null; i.src = '/images/shan-tuyet-tea-tree.jpg'; }}
                    />
                );
            },
        },
        {
            title: 'Phân loại',
            key: 'variant',
            render: (_, r) => (
                <span>
                    {[r.packagingName?.trim(), r.variantName?.trim()].filter(Boolean).join(' - ') || 'Hộp'}
                    {r.quantity ? ` · ${r.quantity}g` : ''}
                </span>
            ),
        },
        {
            title: 'Giá (VNĐ)',
            dataIndex: 'price',
            key: 'price',
            render: (v) => (v != null ? v.toLocaleString('vi-VN') : '-'),
        },
        {
            title: 'Đã bán',
            key: 'sold',
            width: 90,
            render: (_, r) => {
                const sold = soldOf(r);
                return sold === null ? '-' : `${sold}`;
            },
        },
        {
            title: 'Tồn kho',
            dataIndex: 'total',
            key: 'total',
            render: (v) => v ?? 0,
        },
        {
            title: 'Kích hoạt',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hoạt động' : 'Ẩn'}</Tag>,
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
            width: 110,
            render: (_, r) => (
                <Space>
                    <Button type="text" icon={<Edit2 size={15} />} onClick={() => openEditLine(line)} title="Sửa sản phẩm và phân loại" />
                    <Popconfirm title="Xoá phân loại này?" onConfirm={() => handleDeleteVariant(r)} okText="Xoá" cancelText="Huỷ">
                        <Button type="text" danger disabled={deletingId !== null} icon={<Trash2 size={15} color="#DC2626" />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const lineColumns: ColumnsType<ProductLineRow> = [
        {
            title: 'Ảnh',
            dataIndex: 'image',
            key: 'image',
            width: 70,
            render: (image) => {
                const src = getFirstImage(image);
                return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt=""
                        style={{width: 48, height: 48, objectFit: 'cover', borderRadius: 6, cursor: 'pointer'}}
                        onClick={() => setPreviewImg(src)}
                        onError={(e) => { const i = e.currentTarget; i.onerror = null; i.src = '/images/shan-tuyet-tea-tree.jpg'; }}
                    />
                );
            },
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (n, r) => (
                <span>
                    <span className="font-medium">{n}</span>
                    <span className="text-[#3B5518]/60"> · {r.variants.length} phân loại</span>
                </span>
            ),
        },
        {
            title: 'Nhóm trà',
            dataIndex: 'groupName',
            key: 'groupName',
        },
        {
            title: 'Giá (VNĐ)',
            key: 'price',
            render: (_, r) =>
                r.minPrice === r.maxPrice ? r.minPrice.toLocaleString('vi-VN') : `${r.minPrice.toLocaleString('vi-VN')} - ${r.maxPrice.toLocaleString('vi-VN')}`,
        },
        {
            title: 'Đã bán',
            key: 'sold',
            width: 90,
            render: (_, r) => {
                if (!soldLoaded) return '-';
                return `${r.variants.reduce((sum, v) => sum + (soldMap[v.id ?? -1] ?? 0), 0)}`;
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, r) => (
                <Space>
                    <Button type="text" icon={<Edit2 size={15} />} onClick={() => openEditLine(r)} title="Sửa sản phẩm và phân loại" />
                    <Popconfirm
                        title={`Xoá sản phẩm này và tất cả ${r.variants.length} phân loại?`}
                        onConfirm={() => handleDeleteLine(r)}
                        okText="Xoá"
                        cancelText="Huỷ"
                    >
                        <Button type="text" danger disabled={deletingId !== null} icon={<Trash2 size={15} color="#DC2626" />} />
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
                    <ShoppingBag size={20} color="#3B5518" />
                    <Title level={4} style={{margin: 0, color: '#3B5518'}}>
                        Sản phẩm
                    </Title>
                </div>
                <Button type="primary" icon={<Plus size={15} />} onClick={openCreateLine} style={{background: '#3B5518'}}>
                    Thêm sản phẩm
                </Button>
            </div>

            <div style={{background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                <div className="flex gap-3 mb-4">
                    <Input.Search
                        placeholder="Tìm tên sản phẩm..."
                        allowClear
                        style={{maxWidth: 300}}
                        onSearch={(v) => setKeyword(v)}
                    />
                </div>
                <p className="text-sm text-[#3B5518]/70 mb-3">
                    Mỗi sản phẩm gồm nhiều phân loại (hộp bao nhiêu gram, giá riêng, ảnh riêng). Bấm Sửa để thêm, sửa, xoá phân loại trong cùng 1 bảng, lưu 1 lần là xong. Set quà tặng quản lý riêng ở trang Set quà tặng.
                </p>
                <Table
                    rowKey="key"
                    columns={lineColumns}
                    dataSource={filteredLines}
                    loading={loading}
                    scroll={{x: 'max-content', y: 'calc(100vh - 390px)'}}
                    pagination={{
                        pageSize: 20,
                        showTotal: (t) => `Tổng ${t} sản phẩm`,
                        showSizeChanger: false,
                    }}
                    locale={{emptyText: 'Chưa có sản phẩm'}}
                    expandable={{
                        expandedRowRender: (line) => (
                            <Table
                                rowKey="id"
                                columns={variantColumnsFor(line)}
                                dataSource={line.variants}
                                pagination={false}
                                size="small"
                                locale={{emptyText: 'Chưa có phân loại'}}
                            />
                        ),
                    }}
                />
            </div>

            {/* Modal sản phẩm: thông tin dòng + bảng phân loại, lưu 1 lần */}
            <Modal
                title={editingLine ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                open={lineModalOpen}
                onCancel={() => setLineModalOpen(false)}
                onOk={handleSaveLine}
                confirmLoading={saving}
                okText={editingLine ? 'Lưu' : 'Thêm'}
                cancelText="Huỷ"
                width="96vw"
                style={{top: 20}}
                styles={{body: {overflow: 'hidden'}}}
                destroyOnHidden
            >
                <Form form={lineForm} layout="vertical" className="mt-4">
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item name="name" label="Tên sản phẩm" rules={[{required: true, message: 'Nhập tên sản phẩm'}]}>
                                <Input placeholder="Tên sản phẩm..." />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="groupId" label="Nhóm trà" rules={[{required: true, message: 'Chọn nhóm trà'}]}>
                                <Select
                                    placeholder="Chọn nhóm trà"
                                    options={groups
                                        .filter((g) => g.id !== 'set-qua-tang')
                                        .map((g) => ({value: g.id, label: g.name}))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="description" label="Mô tả" help="Mô tả này sẽ áp cho tất cả phân loại của sản phẩm.">
                                <Input.TextArea rows={3} placeholder="Mô tả sản phẩm..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="userManual"
                                label="Hướng dẫn sử dụng"
                                help="Hiện ở mục Hướng dẫn sử dụng ngoài trang chi tiết."
                            >
                                <Input.TextArea rows={2} placeholder="Hướng dẫn sử dụng..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="storageInstructions"
                                label="Hướng dẫn bảo quản"
                                help="Hiện ở mục Hướng dẫn bảo quản ngoài trang chi tiết."
                            >
                                <Input.TextArea rows={2} placeholder="Hướng dẫn bảo quản..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
                <div className="mb-2 font-medium">Phân loại</div>
                <Table
                    rowKey="key"
                    size="small"
                    pagination={false}
                    scroll={{y: 320}}
                    dataSource={draftVariants}
                    locale={{emptyText: 'Chưa có phân loại - bấm Thêm phân loại bên dưới'}}
                    columns={[
                        {
                            title: 'Ảnh',
                            key: 'images',
                            width: 170,
                            render: (_, r) => (
                                <ImageUploadField
                                    value={r.images || null}
                                    onChange={(v) => updateDraft(r.key, {images: v})}
                                    maxCount={5}
                                />
                            ),
                        },
                        {
                            title: 'Tên biến thể',
                            key: 'name',
                            width: 190,
                            render: (_, r) => (
                                <Input
                                    value={r.name}
                                    placeholder="Ví dụ: Hộp Lập Thiếc vuông"
                                    onChange={(e) => updateDraft(r.key, {name: e.target.value})}
                                />
                            ),
                        },
                        {
                            title: 'Gram',
                            key: 'quantity',
                            width: 110,
                            render: (_, r) => (
                                <InputNumber
                                    style={{width: '100%'}}
                                    min={0}
                                    addonAfter="gram"
                                    value={r.quantity}
                                    onChange={(v) => updateDraft(r.key, {quantity: Number(v ?? 0)})}
                                />
                            ),
                        },
                        {
                            title: 'Giá (VNĐ)',
                            key: 'price',
                            width: 140,
                            render: (_, r) => (
                                <InputNumber
                                    style={{width: '100%'}}
                                    min={0}
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    value={r.price}
                                    onChange={(v) => updateDraft(r.key, {price: Number(v ?? 0)})}
                                />
                            ),
                        },
                        {
                            title: 'Tồn kho',
                            key: 'total',
                            width: 100,
                            render: (_, r) => (
                                <InputNumber
                                    style={{width: '100%'}}
                                    min={0}
                                    value={r.total}
                                    onChange={(v) => updateDraft(r.key, {total: Number(v ?? 0)})}
                                />
                            ),
                        },
                        {
                            title: 'Hiện',
                            key: 'isActive',
                            width: 70,
                            render: (_, r) => (
                                <Switch checked={r.isActive} onChange={(v) => updateDraft(r.key, {isActive: v})} />
                            ),
                        },
                        {
                            title: 'Xoá',
                            key: 'actions',
                            width: 60,
                            render: (_, r) => (
                                <Popconfirm
                                    title={
                                        r.id
                                            ? 'Bỏ phân loại này khỏi bảng? (chỉ xoá thật khi bấm Lưu)'
                                            : 'Bỏ dòng này?'
                                    }
                                    onConfirm={() => setDraftVariants((rows) => rows.filter((x) => x.key !== r.key))}
                                    okText="Bỏ"
                                    cancelText="Huỷ"
                                >
                                    <Button type="text" danger icon={<Trash2 size={15} color="#DC2626" />} />
                                </Popconfirm>
                            ),
                        },
                    ]}
                />
                <Button
                    type="dashed"
                    icon={<Plus size={15} />}
                    className="mt-3"
                    onClick={() => setDraftVariants((rows) => [...rows, emptyDraft()])}
                >
                    Thêm phân loại
                </Button>
            </Modal>

            <Modal open={!!previewImg} footer={null} onCancel={() => setPreviewImg(null)} centered width={600}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={previewImg ?? ''}
                    alt="preview"
                    style={{width: '100%', borderRadius: 8}}
                    onError={(e) => { const i = e.currentTarget; i.onerror = null; i.src = '/images/shan-tuyet-tea-tree.jpg'; }}
                />
            </Modal>
        </div>
    );
}
