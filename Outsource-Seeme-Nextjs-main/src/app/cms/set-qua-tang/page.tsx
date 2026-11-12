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
import {
    GIFT_COLLECTIONS,
    collectionIdForName,
    parseColorOptions,
    type GiftColor,
} from '@/lib/tea-taxonomy';
import {getProductsPagingAPI, createProductAPI, updateProductAPI, deleteProductAPI, getProductByIdAPI, getSoldCountsAPI} from '@/api/ProductAPI';
import {unwrapApiData, unwrapPagingData} from '@/api/response';
import type {Product, SoldCount} from '@/types/swagger.types';
import ImageUploadField from '@/components/cms/ImageUploadField';
import {parseApiImageList, resolveApiImageUrl} from '@/utils/imageUrl';
import {normalizeLineName} from '@/lib/tea-taxonomy';

const {Title} = Typography;

/**
 * CMS Set quà tặng - quản lý trực tiếp các Product có isGiftSet = true trên
 * API (danh mục "Set quà tặng" id 14). Chỉ có 2 cấp: set quà → quy cách đóng gói.
 * Mỗi quy cách là 1 row API (tên quy cách + giá riêng), khách chọn bằng select
 * ở trang chi tiết. Ảnh sản phẩm là ảnh của cả set (sửa ở modal set, áp cho
 * mọi quy cách) - modal quy cách không còn ô ảnh riêng. Màu sắc mỗi quy cách
 * chỉ là các ảnh admin upload (không nhập tên, không nhập mã màu); khách chọn
 * màu bằng ảnh ở trang chi tiết.
 */
interface GiftLine {
    key: string;
    name: string;
    collectionId: string;
    options: Product[];
    minPrice: number;
    maxPrice: number;
    image: string | null;
    description: string | null;
    userManual: string | null;
    storageInstructions: string | null;
}

function groupGiftLines(products: Product[]): GiftLine[] {
    const byKey = new Map<string, GiftLine>();
    for (const product of products) {
        if (!product.isGiftSet) continue;
        const name = normalizeLineName(product.name) || `Set quà #${product.id}`;
        const collectionId = collectionIdForName(product.collectionName);
        const key = `${collectionId}::${name.toLowerCase()}`;
        const price = Number(product.price ?? 0);
        const existing = byKey.get(key);
        if (existing) {
            existing.options.push(product);
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
                collectionId,
                options: [product],
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
        options: [...line.options].sort((a, b) => (Number(a.price ?? 0) || 0) - (Number(b.price ?? 0) || 0)),
    }));
}

/** Một lựa chọn màu = 1 ảnh admin upload + ghi chú tên màu tùy chọn (để lúc đóng hàng nhìn tên là biết màu gì, thay vì phải nhìn hình đoán). */
interface ColorRow {
    image: string;
    name: string;
}

function colorsToRows(colors: GiftColor[]): ColorRow[] {
    return colors.map((c) => ({image: c.image ?? '', name: c.name ?? ''}));
}

/** Ghép các màu thành chuỗi lưu API (định dạng parseColorOptions đọc được).
 * Có ghi chú thì `Tên|ảnh`, không có thì chỉ ảnh (tương thích dữ liệu cũ).
 * Ghi chú bị lược ký tự `;`, `|`, `:` vì chúng là ký tự phân tách của định dạng. */
function rowsToColorOptions(rows: ColorRow[]): string {
    return rows
        .map((r) => {
            const image = r.image.trim();
            const name = r.name.trim().replace(/[;|:]/g, '');
            return name ? `${name}|${image}` : image;
        })
        .filter(Boolean)
        .join(';');
}

/** Sửa màu bằng các ảnh upload + ghi chú tên màu: mỗi ảnh là một lựa chọn màu, khách chọn bằng ảnh, đơn hàng hiện cả ảnh lẫn tên màu. */
function ColorRowsEditor({value, onChange}: {value: ColorRow[]; onChange: (next: ColorRow[]) => void}) {
    const update = (index: number, patch: Partial<ColorRow>) => {
        onChange(value.map((row, i) => (i === index ? {...row, ...patch} : row)));
    };
    return (
        <div className="flex flex-col gap-2">
            {value.map((row, i) => (
                <div key={i} className="flex items-start gap-2">
                    <div style={{width: 150}}>
                        <ImageUploadField maxCount={1} value={row.image || null} onChange={(v) => update(i, {image: v})} />
                    </div>
                    <Input
                        placeholder="Ghi chú màu, vd: Vàng"
                        value={row.name}
                        onChange={(e) => update(i, {name: e.target.value})}
                        style={{flex: 1}}
                    />
                    <Button danger type="text" icon={<Trash2 size={15} />} onClick={() => onChange(value.filter((_, j) => j !== i))} />
                </div>
            ))}
            <Button type="dashed" icon={<Plus size={15} />} onClick={() => onChange([...value, {image: '', name: ''}])}>
                Thêm ảnh màu
            </Button>
            <span className="text-xs text-[#3B5518]/60">
                Mỗi ảnh là một lựa chọn màu (admin tự chụp set màu đó rồi tải lên). Nhập thêm ghi chú màu (vd Vàng, Xanh) để lúc đóng hàng nhìn tên là biết màu gì; đơn hàng của admin và khách cũng hiện tên màu kèm ảnh.
            </span>
        </div>
    );
}

export default function SetQuaTangPage() {
    const [allGifts, setAllGifts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [setModalOpen, setSetModalOpen] = useState(false);
    const [editingLine, setEditingLine] = useState<GiftLine | null>(null);
    const [optionModalOpen, setOptionModalOpen] = useState(false);
    const [optionLine, setOptionLine] = useState<GiftLine | null>(null);
    const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
    const [colorRows, setColorRows] = useState<ColorRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [setForm] = Form.useForm();
    const [optionForm] = Form.useForm();
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
        setLoading(true);
        try {
            // Lấy đủ sản phẩm để gom set ở client, KỂ CẢ set đang ẩn (admin cần thấy để bật lại).
            const res = await getProductsPagingAPI({pageIndex: 1, pageSize: 200} as any);
            setAllGifts(unwrapPagingData<Product>(res).data);
        } catch {
            messageApi.error('Không thể tải set quà tặng');
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        void Promise.resolve().then(fetchData);
    }, [fetchData]);

    const lines = useMemo(() => groupGiftLines(allGifts), [allGifts]);

    const collectionShortName = (collectionId: string) =>
        GIFT_COLLECTIONS.find((c) => c.id === collectionId)?.shortName ?? collectionId;

    // ── Modal set quà (tạo mới / sửa tên + bộ sưu tập + mô tả của cả set) ──
    const openCreateSet = () => {
        setEditingLine(null);
        setForm.resetFields();
        setForm.setFieldsValue({collectionId: 'huyen', gram: 60, isActive: true});
        setColorRows([]);
        setSetModalOpen(true);
    };

    const openEditSet = (line: GiftLine) => {
        setEditingLine(line);
        setForm.setFieldsValue({
            name: line.name,
            collectionId: line.collectionId,
            description: line.description ?? '',
            userManual: line.userManual ?? '',
            storageInstructions: line.storageInstructions ?? '',
            image: line.image ?? '',
        });
        setSetModalOpen(true);
    };

    const handleSaveSet = async () => {
        const values = await setForm.validateFields();
        setSaving(true);
        try {
            if (editingLine) {
                for (const option of editingLine.options) {
                    const full = unwrapApiData<Product>(await getProductByIdAPI(option.id!));
                    await updateProductAPI(option.id!, {
                        ...full,
                        name: values.name,
                        collectionName: collectionShortName(values.collectionId),
                        description: values.description ?? '',
                        userManual: values.userManual ?? '',
                        storageInstructions: values.storageInstructions ?? '',
                        images: values.image || '',
                    });
                }
                messageApi.success('Cập nhật set quà thành công');
            } else {
                await createProductAPI({
                    name: values.name,
                    groupId: 'set-qua-tang',
                    price: Number(values.priceMin ?? 0),
                    total: 100,
                    description: values.description ?? '',
                    userManual: values.userManual ?? '',
                    storageInstructions: values.storageInstructions ?? '',
                    isActive: values.isActive ?? true,
                    images: values.image || '',
                    quantity: Number(values.gram ?? 60),
                    packagingName: values.packaging ?? '',
                    variantName: '',
                    isGiftSet: true,
                    collectionName: collectionShortName(values.collectionId),
                    colorOptions: rowsToColorOptions(colorRows.filter((r) => r.image.trim())),
                } as any);
                messageApi.success('Thêm set quà thành công');
            }
            setSetModalOpen(false);
            void fetchData();
        } catch {
            messageApi.error('Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSet = async (line: GiftLine) => {
        if (deletingId) return;
        setDeletingId(-1);
        try {
            for (const option of line.options) {
                await deleteProductAPI(option.id!);
            }
            messageApi.success(`Đã xoá set quà và ${line.options.length} quy cách`);
            void fetchData();
        } catch {
            messageApi.error('Xoá thất bại (một số quy cách có thể đã bị xoá)');
            void fetchData();
        } finally {
            setDeletingId(null);
        }
    };

    // ── Modal quy cách (thêm / sửa 1 row trong set) ──
    const openCreateOption = (line: GiftLine) => {
        setOptionLine(line);
        setEditingOptionId(null);
        optionForm.resetFields();
        optionForm.setFieldsValue({isActive: true});
        setColorRows([]);
        setOptionModalOpen(true);
    };

    const openEditOption = async (line: GiftLine | null, option: Product) => {
        if (!line) return;
        setOptionLine(line);
        setEditingOptionId(option.id!);
        try {
            const full = unwrapApiData<Product>(await getProductByIdAPI(option.id!));
            optionForm.setFieldsValue({...full, packaging: full.packagingName ?? '', priceMin: full.price});
        } catch {
            optionForm.setFieldsValue({...option, packaging: option.packagingName ?? '', priceMin: option.price});
        }
        setColorRows(colorsToRows(parseColorOptions(option.colorOptions)));
        setOptionModalOpen(true);
    };

    const handleSaveOption = async () => {
        if (!optionLine) return;
        const values = await optionForm.validateFields();
        setSaving(true);
        try {
            const colorOptions = rowsToColorOptions(colorRows.filter((r) => r.image.trim()));
            if (editingOptionId) {
                const full = unwrapApiData<Product>(await getProductByIdAPI(editingOptionId));
                await updateProductAPI(editingOptionId, {
                    ...full,
                    price: Number(values.priceMin ?? 0),
                    quantity: Number(values.gram ?? 60),
                    packagingName: values.packaging ?? '',
                    colorOptions,
                    isActive: values.isActive ?? true,
                });
                messageApi.success('Cập nhật quy cách thành công');
            } else {
                await createProductAPI({
                    name: optionLine.name,
                    groupId: 'set-qua-tang',
                    price: Number(values.priceMin ?? 0),
                    total: 100,
                    description: optionLine.description ?? '',
                    userManual: optionLine.userManual ?? '',
                    storageInstructions: optionLine.storageInstructions ?? '',
                    isActive: values.isActive ?? true,
                    images: optionLine.image ?? '',
                    quantity: Number(values.gram ?? 60),
                    packagingName: values.packaging ?? '',
                    variantName: '',
                    isGiftSet: true,
                    collectionName: collectionShortName(optionLine.collectionId),
                    colorOptions,
                } as any);
                messageApi.success('Thêm quy cách thành công');
            }
            setOptionModalOpen(false);
            void fetchData();
        } catch {
            messageApi.error('Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteOption = async (option: Product) => {
        if (deletingId) return;
        setDeletingId(option.id!);
        try {
            await deleteProductAPI(option.id!);
            messageApi.success('Xoá quy cách thành công');
            void fetchData();
        } catch {
            messageApi.error('Xoá thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    const lineOfOption = (option: Product): GiftLine | null => {
        const name = normalizeLineName(option.name);
        return lines.find((l) => l.collectionId === collectionIdForName(option.collectionName) && normalizeLineName(l.name) === name) ?? null;
    };

    const optionColumns: ColumnsType<Product> = [
        {
            title: 'Ảnh',
            key: 'image',
            width: 70,
            render: (_, r) => {
                const first = parseApiImageList(r.images)[0] ?? '';
                const src = resolveApiImageUrl(first, '/images/shan-tuyet-tea-tree.jpg');
                return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt=""
                        style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 6}}
                        onError={(e) => { const i = e.currentTarget; i.onerror = null; i.src = '/images/shan-tuyet-tea-tree.jpg'; }}
                    />
                );
            },
        },
        {
            title: 'Quy cách đóng gói',
            dataIndex: 'packagingName',
            key: 'packagingName',
            render: (v) => <span className="line-clamp-2">{v || '-'}</span>,
        },
        {
            title: 'Giá',
            key: 'price',
            render: (_, r) => `${Number(r.price ?? 0).toLocaleString('vi-VN')} VND`,
        },
        {
            title: 'Khối lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (g) => `${g}g`,
        },
        {
            title: 'Màu',
            key: 'colors',
            render: (_, r) => {
                const withImage = parseColorOptions(r.colorOptions).filter((c) => c.image);
                return withImage.length > 0 ? `${withImage.length} ảnh` : '-';
            },
        },
        {
            title: 'Kích hoạt',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hoạt động' : 'Ẩn'}</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 110,
            render: (_, r) => (
                <Space>
                    <Button type="text" icon={<Edit2 size={15} />} onClick={() => openEditOption(lineOfOption(r), r)} />
                    <Popconfirm title="Xoá quy cách này?" okText="Xoá" cancelText="Huỷ" onConfirm={() => handleDeleteOption(r)}>
                        <Button type="text" danger disabled={deletingId !== null} icon={<Trash2 size={15} color="#DC2626" />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const lineColumns: ColumnsType<GiftLine> = [
        {
            title: 'Ảnh',
            key: 'image',
            width: 70,
            render: (_, r) => {
                const first = parseApiImageList(r.image)[0] ?? '';
                const src = resolveApiImageUrl(first, '/images/shan-tuyet-tea-tree.jpg');
                return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt=""
                        style={{width: 48, height: 48, objectFit: 'cover', borderRadius: 6}}
                        onError={(e) => { const i = e.currentTarget; i.onerror = null; i.src = '/images/shan-tuyet-tea-tree.jpg'; }}
                    />
                );
            },
        },
        {
            title: 'Tên set',
            dataIndex: 'name',
            key: 'name',
            render: (n, r) => (
                <span>
                    <span className="font-medium">{n}</span>
                    <span className="text-[#3B5518]/60"> · {r.options.length} quy cách</span>
                </span>
            ),
        },
        {
            title: 'Bộ sưu tập',
            dataIndex: 'collectionId',
            key: 'collectionId',
            render: (id) => GIFT_COLLECTIONS.find((c) => c.id === id)?.name ?? id,
        },
        {
            title: 'Giá',
            key: 'price',
            render: (_, r) =>
                r.minPrice === r.maxPrice
                    ? `${r.minPrice.toLocaleString('vi-VN')} VND`
                    : `${r.minPrice.toLocaleString('vi-VN')} - ${r.maxPrice.toLocaleString('vi-VN')} VND`,
        },
        {
            title: 'Đã bán',
            key: 'sold',
            width: 90,
            render: (_, r) => {
                if (!soldLoaded) return '-';
                return `${r.options.reduce((sum, o) => sum + (soldMap[o.id ?? -1] ?? 0), 0)}`;
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, r) => {
                const anyActive = r.options.some((o) => o.isActive !== false);
                return <Tag color={anyActive ? 'green' : 'default'}>{anyActive ? 'Hoạt động' : 'Ẩn'}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 150,
            render: (_, r) => (
                <Space>
                    <Button type="text" icon={<Edit2 size={15} />} onClick={() => openEditSet(r)} title="Sửa tên, bộ sưu tập, mô tả của set" />
                    <Button type="text" icon={<Plus size={15} />} onClick={() => openCreateOption(r)} title="Thêm quy cách" />
                    <Popconfirm
                        title={`Xoá set quà này và tất cả ${r.options.length} quy cách?`}
                        okText="Xoá"
                        cancelText="Huỷ"
                        onConfirm={() => handleDeleteSet(r)}
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
                style={{position: 'sticky', top: 0, zIndex: 10, background: '#f5f5f5', paddingTop: 4, paddingBottom: 4, marginBottom: 20}}
            >
                <div className="flex items-center gap-2">
                    <ShoppingBag size={20} color="#3B5518" />
                    <Title level={4} style={{margin: 0, color: '#3B5518'}}>
                        Set quà tặng
                    </Title>
                </div>
                <Space>
                    <Button type="primary" icon={<Plus size={15} />} onClick={openCreateSet} style={{background: '#3B5518'}}>
                        Thêm set quà
                    </Button>
                </Space>
            </div>

            <div style={{background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                <p className="text-sm text-[#3B5518]/70 mb-3">
                    Mỗi set quà gồm nhiều quy cách đóng gói (mỗi quy cách tên + giá riêng, khách chọn bằng select ở trang chi tiết). Bấm vào set để xem, thêm, sửa, xoá quy cách. Set đang ẩn vẫn hiện ở đây để admin bật lại khi có giá.
                </p>
                <Table
                    rowKey="key"
                    columns={lineColumns}
                    dataSource={lines}
                    loading={loading}
                    pagination={false}
                    scroll={{x: 'max-content'}}
                    locale={{emptyText: 'Chưa có set quà nào'}}
                    expandable={{
                        expandedRowRender: (line) => (
                            <Table
                                rowKey="id"
                                columns={optionColumns}
                                dataSource={line.options}
                                pagination={false}
                                size="small"
                                locale={{emptyText: 'Chưa có quy cách'}}
                            />
                        ),
                    }}
                />
            </div>

            {/* Modal set quà */}
            <Modal
                title={editingLine ? 'Chỉnh sửa set quà' : 'Thêm set quà mới'}
                open={setModalOpen}
                onCancel={() => setSetModalOpen(false)}
                onOk={handleSaveSet}
                confirmLoading={saving}
                okText={editingLine ? 'Lưu' : 'Thêm'}
                cancelText="Huỷ"
                width={640}
                destroyOnHidden
            >
                <Form form={setForm} layout="vertical" className="mt-4">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Tên set quà" rules={[{required: true, message: 'Nhập tên set quà'}]}>
                                <Input placeholder="Ví dụ: Huyền Nhất" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="collectionId" label="Bộ sưu tập" rules={[{required: true}]}>
                                <Select options={GIFT_COLLECTIONS.map((c) => ({value: c.id, label: c.name}))} />
                            </Form.Item>
                        </Col>
                        {!editingLine && (
                            <>
                                <Col span={12}>
                                    <Form.Item name="priceMin" label="Giá quy cách đầu tiên (VNĐ)" rules={[{required: true}]}>
                                        <InputNumber style={{width: '100%'}} min={0} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="image" label="Ảnh set quà (bấm để tải ảnh lên)">
                                        <ImageUploadField maxCount={5} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="gram" label="Khối lượng (gram)">
                                        <InputNumber style={{width: '100%'}} min={0} addonAfter="gram" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="packaging" label="Quy cách đóng gói đầu tiên">
                                        <Input.TextArea rows={2} placeholder="Ví dụ: Set mix Lục Trà Shan 1 Tôm 1 Lá, Lục Trà Shan 1 Tôm 2 Lá, Hồng Trà Shan" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Màu sắc quy cách đầu tiên">
                                        <ColorRowsEditor value={colorRows} onChange={setColorRows} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                        {editingLine && (
                            <Col span={12}>
                                <Form.Item name="image" label="Ảnh sản phẩm (bấm để tải ảnh lên)" help="Ảnh này áp cho tất cả quy cách của set.">
                                    <ImageUploadField maxCount={5} />
                                </Form.Item>
                            </Col>
                        )}
                        <Col span={24}>
                            <Form.Item name="description" label="Mô tả" help={editingLine ? 'Mô tả này sẽ áp cho tất cả quy cách của set.' : undefined}>
                                <Input.TextArea rows={3} placeholder="Mô tả set quà..." />
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
            </Modal>

            {/* Modal quy cách */}
            <Modal
                title={editingOptionId ? 'Chỉnh sửa quy cách' : `Thêm quy cách cho ${optionLine?.name ?? ''}`}
                open={optionModalOpen}
                onCancel={() => setOptionModalOpen(false)}
                onOk={handleSaveOption}
                confirmLoading={saving}
                okText={editingOptionId ? 'Lưu' : 'Thêm'}
                cancelText="Huỷ"
                width={640}
                destroyOnHidden
            >
                <Form form={optionForm} layout="vertical" className="mt-4">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="priceMin" label="Giá (VNĐ)" rules={[{required: true}]}>
                                <InputNumber style={{width: '100%'}} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="gram" label="Khối lượng (gram)">
                                <InputNumber style={{width: '100%'}} min={0} addonAfter="gram" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="packaging" label="Quy cách đóng gói">
                                <Input.TextArea rows={2} placeholder="Ví dụ: Set mix Lục Trà Shan 1 Tôm 1 Lá, Hồng Trà Shan, Bạch Trà Chốt và Đại Lão Shan" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item label="Màu sắc quy cách">
                                <ColorRowsEditor value={colorRows} onChange={setColorRows} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
