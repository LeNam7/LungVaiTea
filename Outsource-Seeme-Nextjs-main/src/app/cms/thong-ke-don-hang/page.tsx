'use client';
import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Button, Card, Col, DatePicker, Row, Select, Statistic, Table, Tag, Tooltip, Typography} from 'antd';
import {TrendingUp, ClipboardList, ShoppingBag, Leaf, Download, WalletCards, PackageCheck} from 'lucide-react';
import {getOrdersPagingAPI, getOrderProductsPagingAPI, getOrderTeasPagingAPI} from '@/api/OrderAPI';
import {unwrapPagingData} from '@/api/response';
import {getDerivedOrderStatus, getOrderLikeId, getOrderTypeLabel, renderOrderStatusTag, renderPaymentTag, STATUS_META} from '@/utils/orderStatus';
import dayjs, {Dayjs} from 'dayjs';
import {useRouter} from 'next/navigation';

const {Title, Text} = Typography;
const {RangePicker} = DatePicker;

type RangeValue = [Dayjs | null, Dayjs | null] | null;

const formatCurrency = (value: number) => value.toLocaleString('vi-VN') + '₫';
const ORDER_STATUS_KEYS = Object.keys(STATUS_META).map(Number);

const downloadCsv = (rows: any[]) => {
    const headers = ['ID', 'Ngày tạo', 'Khách hàng', 'Loại đơn', 'Tổng tiền', 'Đã thanh toán', 'Trạng thái'];
    const body = rows.map((order) => [
        getOrderLikeId(order),
        order.createdDate ? dayjs(order.createdDate).format('DD/MM/YYYY HH:mm') : '',
        order.customerName ?? '',
        getOrderTypeLabel(order.orderType),
        order.totalPrice ?? 0,
        order.totalPayment ?? 0,
        STATUS_META[getDerivedOrderStatus(order)]?.label ?? 'Không rõ',
    ]);
    const csv = [headers, ...body]
        .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
        .join('\n');
    const blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thong-ke-don-hang-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

export default function ThongKeDonHangPage() {
    const router = useRouter();
    const [stats, setStats] = useState({total: 0, products: 0, teas: 0, paidRevenue: 0, mixed: 0});
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
    const [range, setRange] = useState<RangeValue>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (pageIndex = 1) => {
        await Promise.resolve();
        setLoading(true);
        setError(null);
        try {
            const [ordersRes, productsRes, teasRes] = await Promise.all([
                getOrdersPagingAPI({pageIndex, pageSize: 20}) as any,
                getOrderProductsPagingAPI({pageIndex: 1, pageSize: 1}) as any,
                getOrderTeasPagingAPI({pageIndex: 1, pageSize: 1}) as any,
            ]);

            const ordersPaging = unwrapPagingData<any>(ordersRes);
            const productsPaging = unwrapPagingData<any>(productsRes);
            const teasPaging = unwrapPagingData<any>(teasRes);
            const pageOrders = ordersPaging.data;
            setOrders(pageOrders);
            setTotal(ordersPaging.totalRecords);
            setStats({
                total: ordersPaging.totalRecords,
                products: productsPaging.totalRecords,
                teas: teasPaging.totalRecords,
                paidRevenue: pageOrders.reduce((sum, order) => sum + Number(order?.totalPayment ?? 0), 0),
                mixed: pageOrders.filter((order) => order?.orderType === 'Both').length,
            });
        } catch {
            setOrders([]);
            setError('Không thể tải thống kê đơn hàng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void Promise.resolve().then(() => fetchData(1));
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchStatus = statusFilter === undefined || getDerivedOrderStatus(order) === statusFilter;
            const createdDate = order?.createdDate ? dayjs(order.createdDate) : null;
            const matchRange = !range?.[0] || !range?.[1] || (createdDate && createdDate.isAfter(range[0].startOf('day')) && createdDate.isBefore(range[1].endOf('day')));
            return matchStatus && matchRange;
        });
    }, [orders, range, statusFilter]);

    const statusSummary = useMemo(() => {
        const summary = new Map<number, number>();
        filteredOrders.forEach((order) => {
            const status = getDerivedOrderStatus(order);
            summary.set(status, (summary.get(status) ?? 0) + 1);
        });
        return ORDER_STATUS_KEYS.map((status) => [status, summary.get(status) ?? 0] as const);
    }, [filteredOrders]);

    const maxStatusCount = Math.max(1, ...statusSummary.map(([, count]) => count));

    const typeSummary = useMemo(() => {
        const rows = [
            {key: 'Product', label: 'Sản phẩm', color: '#1677ff'},
            {key: 'Tea', label: 'Cây trà', color: '#3B5518'},
            {key: 'Both', label: 'Hỗn hợp', color: '#722ed1'},
        ];
        return rows.map((item) => ({...item, count: filteredOrders.filter((order) => order?.orderType === item.key).length}));
    }, [filteredOrders]);

    const paymentSummary = useMemo(() => {
        const paid = filteredOrders.filter((order) => Number(order?.totalPrice ?? 0) > 0 && Number(order?.totalPayment ?? 0) >= Number(order?.totalPrice ?? 0)).length;
        const partial = filteredOrders.filter((order) => Number(order?.totalPayment ?? 0) > 0 && Number(order?.totalPayment ?? 0) < Number(order?.totalPrice ?? 0)).length;
        return [
            {label: 'Đã thanh toán', count: paid, color: '#52c41a'},
            {label: 'Một phần', count: partial, color: '#1677ff'},
            {label: 'Chưa thanh toán', count: Math.max(0, filteredOrders.length - paid - partial), color: '#faad14'},
        ];
    }, [filteredOrders]);

    const revenueByDate = useMemo(() => {
        const summary = new Map<string, number>();
        filteredOrders.forEach((order) => {
            const label = order?.createdDate ? dayjs(order.createdDate).format('DD/MM') : 'Không rõ';
            summary.set(label, (summary.get(label) ?? 0) + Number(order?.totalPayment ?? 0));
        });
        return [...summary.entries()].slice(0, 7).map(([label, value]) => ({label, value}));
    }, [filteredOrders]);

    const maxRevenue = Math.max(1, ...revenueByDate.map((item) => item.value));
    const maxTypeCount = Math.max(1, ...typeSummary.map((item) => item.count));
    const maxPaymentCount = Math.max(1, ...paymentSummary.map((item) => item.count));

    const statCards = [
        {title: 'Tổng đơn hàng', value: stats.total, icon: <ClipboardList size={22} />, color: '#3B5518', bg: '#EEF2E4'},
        {title: 'Đơn sản phẩm', value: stats.products, icon: <ShoppingBag size={22} />, color: '#3B5518', bg: '#F4F0E4'},
        {title: 'Đơn cây trà', value: stats.teas, icon: <Leaf size={22} />, color: '#1a6340', bg: '#f0faf5'},
        {title: 'Đơn hỗn hợp', value: stats.mixed, icon: <PackageCheck size={22} />, color: '#6f42c1', bg: '#f5f0ff'},
        {title: 'Đã thanh toán gần đây', value: stats.paidRevenue, icon: <WalletCards size={22} />, color: '#8A5A12', bg: '#FFF7E6', suffix: '₫'},
    ];

    const columns = [
        {title: 'ID', dataIndex: 'orderId', key: 'orderId', width: 80, render: (_: any, row: any) => getOrderLikeId(row) || '-'},
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 150,
            render: (value: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-'),
        },
        {title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName', width: 130, ellipsis: true, render: (value: string) => value || '-'},
        {
            title: 'Loại đơn',
            dataIndex: 'orderType',
            key: 'orderType',
            width: 120,
            render: (value: string) => <Tag color={value === 'Both' ? 'purple' : value === 'Tea' ? 'green' : 'blue'}>{getOrderTypeLabel(value)}</Tag>,
        },
        {title: 'Trạng thái', key: 'status', width: 132, render: (_: any, row: any) => renderOrderStatusTag(getDerivedOrderStatus(row))},
        {title: 'TT', key: 'payment', width: 106, render: (_: any, row: any) => renderPaymentTag(row)},
        {title: 'Tổng tiền', dataIndex: 'totalPrice', key: 'totalPrice', align: 'right' as const, width: 120, render: (value: number) => (value != null ? formatCurrency(value) : '-')},
    ];

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <TrendingUp size={22} color="#3B5518" />
                    <div>
                        <Title level={4} style={{margin: 0, color: '#3B5518'}}>Thống kê đơn hàng</Title>
                        <Text type="secondary">Báo cáo phân tích đơn hàng: trạng thái, loại đơn, thanh toán, doanh thu và danh sách chi tiết.</Text>
                    </div>
                </div>
                <Button icon={<Download size={16} />} onClick={() => downloadCsv(filteredOrders)} disabled={!filteredOrders.length}>Export CSV</Button>
            </div>

            {error ? <Alert className="mb-4" type="error" showIcon message={error} /> : null}

            <Row gutter={[16, 16]} className="mb-6">
                {statCards.map((card) => (
                    <Col xs={24} sm={12} md={8} xl={4} key={card.title}>
                        <Card loading={loading} style={{borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}} styles={{body: {padding: '20px 24px'}}}>
                            <div className="flex items-center gap-4">
                                <div style={{background: card.bg, borderRadius: 10, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0}}>{card.icon}</div>
                                <Statistic title={<span style={{fontSize: 13, color: '#888'}}>{card.title}</span>} value={card.value} suffix={card.suffix} styles={{content: {fontSize: 22, fontWeight: 700, color: card.color}}} formatter={(value) => card.suffix ? Number(value).toLocaleString('vi-VN') : value} />
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} xl={12}>
                    <Card title={<span style={{fontWeight: 600, color: '#3B5518'}}>Biểu đồ trạng thái</span>} style={{borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none'}}>
                        {statusSummary.length ? (
                            <div className="space-y-3">
                                {statusSummary.map(([status, count]) => {
                                    const meta = STATUS_META[status];
                                    return (
                                        <Tooltip key={status} title={meta?.description}>
                                            <div className="grid grid-cols-[130px_1fr_40px] items-center gap-3">
                                                {renderOrderStatusTag(status)}
                                                <div className="h-3 overflow-hidden rounded-full bg-[#EEF2E4]">
                                                    <div className="h-full rounded-full bg-[#7F9635]" style={{width: `${Math.max(8, (count / maxStatusCount) * 100)}%`}} />
                                                </div>
                                                <strong className="text-right">{count}</strong>
                                            </div>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        ) : (
                            <Text type="secondary">Không có dữ liệu theo bộ lọc hiện tại.</Text>
                        )}
                    </Card>
                </Col>
                <Col xs={24} xl={12}>
                    <Card title={<span style={{fontWeight: 600, color: '#3B5518'}}>Cơ cấu loại đơn</span>} style={{borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none'}}>
                        <div className="space-y-4">
                            {typeSummary.map((item) => (
                                <div key={item.key} className="grid grid-cols-[96px_1fr_46px] items-center gap-3">
                                    <Tag color={item.key === 'Both' ? 'purple' : item.key === 'Tea' ? 'green' : 'blue'}>{item.label}</Tag>
                                    <div className="h-4 overflow-hidden rounded-full bg-[#EEF2E4]">
                                        <div className="h-full rounded-full" style={{background: item.color, width: `${item.count ? Math.max(8, (item.count / maxTypeCount) * 100) : 0}%`}} />
                                    </div>
                                    <strong className="text-right">{item.count}</strong>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} xl={12}>
                    <Card title={<span style={{fontWeight: 600, color: '#3B5518'}}>Doanh thu theo ngày</span>} style={{borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none'}}>
                        <div className="flex h-56 items-end gap-3 border-b border-[#edf0e8] pb-3">
                            {revenueByDate.length ? revenueByDate.map((item) => (
                                <Tooltip key={item.label} title={formatCurrency(item.value)}>
                                    <div className="flex flex-1 flex-col items-center gap-2">
                                        <div className="w-full rounded-t-lg bg-[#7F9635]" style={{height: `${Math.max(8, (item.value / maxRevenue) * 180)}px`}} />
                                        <span className="text-xs text-gray-500">{item.label}</span>
                                    </div>
                                </Tooltip>
                            )) : <Text type="secondary">Không có dữ liệu doanh thu.</Text>}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} xl={12}>
                    <Card title={<span style={{fontWeight: 600, color: '#3B5518'}}>Tình trạng thanh toán</span>} style={{borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none'}}>
                        <div className="space-y-4">
                            {paymentSummary.map((item) => (
                                <div key={item.label}>
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span>{item.label}</span>
                                        <strong>{item.count} đơn</strong>
                                    </div>
                                    <div className="h-4 overflow-hidden rounded-full bg-[#EEF2E4]">
                                        <div className="h-full rounded-full" style={{background: item.color, width: `${item.count ? Math.max(8, (item.count / maxPaymentCount) * 100) : 0}%`}} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="mb-6">
                <Col span={24}>
                    <Card
                        title={<span style={{fontWeight: 600, color: '#3B5518'}}>Bảng dữ liệu đơn hàng</span>}
                        style={{borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none'}}
                        extra={
                            <div className="flex flex-wrap gap-2">
                                <RangePicker value={range} onChange={(value) => setRange(value)} format="DD/MM/YYYY" />
                                <Select allowClear placeholder="Lọc trạng thái" style={{width: 170}} options={Object.entries(STATUS_META).map(([key, value]) => ({value: Number(key), label: value.label}))} onChange={setStatusFilter} />
                            </div>
                        }
                    >
                        <Table
                            rowKey={(row) => getOrderLikeId(row)}
                            columns={columns}
                            dataSource={filteredOrders}
                            loading={loading}
                            tableLayout="fixed"
                            onRow={(record) => ({
                                onClick: () => router.push(`/cms/quan-ly-don-hang?orderId=${getOrderLikeId(record)}`),
                                style: {cursor: 'pointer'},
                            })}
                            pagination={{
                                current: page,
                                pageSize: 20,
                                total,
                                onChange: (nextPage) => {
                                    setPage(nextPage);
                                    fetchData(nextPage);
                                },
                                showTotal: (value) => `Tổng ${value} đơn`,
                            }}
                            size="small"
                            locale={{emptyText: 'Không có đơn hàng phù hợp'}}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
