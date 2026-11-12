'use client';
import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Card, Col, Progress, Row, Statistic, Table, Tag, Typography} from 'antd';
import {Leaf, ShoppingBag, Users, MapPin, ClipboardList, TrendingUp, WalletCards} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {getTeasPagingAPI} from '@/api/TeaAPI';
import {getProductsPagingAPI} from '@/api/ProductAPI';
import {getUsersPagingAPI} from '@/api/UserAPI';
import {getGardensPagingAPI} from '@/api/GardenAPI';
import {getOrdersPagingAPI} from '@/api/OrderAPI';
import {unwrapPagingData} from '@/api/response';
import {getCookie} from '@/utils/cookie';
import {getDerivedOrderStatus, getOrderLikeId, getOrderTypeLabel, renderOrderStatusTag, renderPaymentTag, STATUS_META} from '@/utils/orderStatus';
import dayjs from 'dayjs';

const {Title, Text} = Typography;

interface StatCard {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bg: string;
    suffix?: string;
}

const formatCurrency = (value: number) => value.toLocaleString('vi-VN') + '₫';
const ORDER_STATUS_KEYS = Object.keys(STATUS_META).map(Number);

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        teas: 0,
        products: 0,
        users: 0,
        gardens: 0,
        orders: 0,
        paidRevenue: 0,
        pendingOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const accessToken = getCookie('accessToken');
        if (!accessToken) {
            router.replace('/tai-khoan');
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const [teasRes, productsRes, usersRes, gardensRes, ordersRes] = await Promise.all([
                    getTeasPagingAPI({pageIndex: 1, pageSize: 1}),
                    getProductsPagingAPI({pageIndex: 1, pageSize: 1}),
                    getUsersPagingAPI({pageIndex: 1, pageSize: 1}),
                    getGardensPagingAPI({pageIndex: 1, pageSize: 1}),
                    getOrdersPagingAPI({pageIndex: 1, pageSize: 10}),
                ]);
                const teasPaging = unwrapPagingData<any>(teasRes);
                const productsPaging = unwrapPagingData<any>(productsRes);
                const usersPaging = unwrapPagingData<any>(usersRes);
                const gardensPaging = unwrapPagingData<any>(gardensRes);
                const ordersPaging = unwrapPagingData<any>(ordersRes);
                const orders = ordersPaging.data;
                setStats({
                    teas: teasPaging.totalRecords,
                    products: productsPaging.totalRecords,
                    users: usersPaging.totalRecords,
                    gardens: gardensPaging.totalRecords,
                    orders: ordersPaging.totalRecords,
                    paidRevenue: orders.reduce((sum, order) => sum + Number(order?.totalPayment ?? 0), 0),
                    pendingOrders: orders.filter((order) => getDerivedOrderStatus(order) === 0).length,
                });
                setRecentOrders(orders);
            } catch {
                setError('Không thể tải dữ liệu dashboard. Vui lòng thử refresh lại trang.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [router]);

    const statCards: StatCard[] = [
        {title: 'Cây trà', value: stats.teas, icon: <Leaf size={24} />, color: '#3B5518', bg: '#EEF2E4'},
        {title: 'Sản phẩm', value: stats.products, icon: <ShoppingBag size={24} />, color: '#3B5518', bg: '#F4F0E4'},
        {title: 'Khách hàng', value: stats.users, icon: <Users size={24} />, color: '#1a6340', bg: '#f0faf5'},
        {title: 'Vườn trà', value: stats.gardens, icon: <MapPin size={24} />, color: '#1a4a7a', bg: '#eef5fd'},
        {title: 'Đơn hàng', value: stats.orders, icon: <ClipboardList size={24} />, color: '#3B5518', bg: '#F4F0E4'},
        {title: 'Doanh thu gần đây', value: stats.paidRevenue, icon: <WalletCards size={24} />, color: '#8A5A12', bg: '#FFF7E6', suffix: '₫'},
    ];

    const statusSummary = useMemo(() => {
        const summary = new Map<number, number>();
        recentOrders.forEach((order) => {
            const status = getDerivedOrderStatus(order);
            summary.set(status, (summary.get(status) ?? 0) + 1);
        });
        return ORDER_STATUS_KEYS.map((status) => [status, summary.get(status) ?? 0] as const);
    }, [recentOrders]);

    const maxStatusCount = Math.max(1, ...statusSummary.map(([, count]) => count));
    const paidOrders = recentOrders.filter((order) => Number(order?.totalPayment ?? 0) >= Number(order?.totalPrice ?? 0) && Number(order?.totalPrice ?? 0) > 0).length;
    const conversionPercent = recentOrders.length ? Math.round((paidOrders / recentOrders.length) * 100) : 0;

    const orderColumns = [
        {title: 'ID', dataIndex: 'orderId', key: 'orderId', width: 80, render: (_: any, row: any) => getOrderLikeId(row) || '-'},
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 150,
            render: (value: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-'),
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
            ellipsis: true,
            render: (value: string) => value || '-',
        },
        {
            title: 'Loại đơn',
            dataIndex: 'orderType',
            key: 'orderType',
            width: 150,
            render: (value: string) => <Tag color={value === 'Both' ? 'purple' : value === 'Tea' ? 'green' : 'blue'}>{getOrderTypeLabel(value)}</Tag>,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 150,
            render: (_: any, row: any) => renderOrderStatusTag(getDerivedOrderStatus(row)),
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 112,
            render: (_: any, row: any) => renderPaymentTag(row),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            align: 'right' as const,
            width: 140,
            render: (value: number) => (value != null ? formatCurrency(value) : '-'),
        },
    ];

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <TrendingUp size={22} color="#3B5518" />
                    <div>
                        <Title level={4} style={{margin: 0, color: '#3B5518'}}>Tổng quan hệ thống</Title>
                        <Text type="secondary">Theo dõi nhanh dữ liệu vận hành và các đơn hàng mới nhất.</Text>
                    </div>
                </div>
                {stats.pendingOrders > 0 ? <Tag color="gold">{stats.pendingOrders} đơn đang chờ xử lý</Tag> : null}
            </div>

            {error ? <Alert className="mb-4" type="error" showIcon message={error} /> : null}

            <Row gutter={[16, 16]} className="mb-6">
                {statCards.map((card) => (
                    <Col xs={24} sm={12} md={8} lg={6} xl={4} key={card.title}>
                        <Card loading={loading} style={{borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}} styles={{body: {padding: '20px 24px'}}}>
                            <div className="flex items-center gap-4">
                                <div style={{background: card.bg, borderRadius: 10, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0}}>
                                    {card.icon}
                                </div>
                                <Statistic title={<span style={{fontSize: 13, color: '#888'}}>{card.title}</span>} value={card.value} suffix={card.suffix} styles={{content: {fontSize: 22, fontWeight: 700, color: card.color}}} formatter={(value) => card.suffix ? Number(value).toLocaleString('vi-VN') : value} />
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} lg={9}>
                    <Card title={<span style={{fontWeight: 600, color: '#3B5518'}}>Dashboard vận hành</span>} style={{borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none'}}>
                        <div className="mb-5 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-[#F7F8F1] p-4">
                                <Text type="secondary">Tỷ lệ thanh toán</Text>
                                <Progress percent={conversionPercent} strokeColor="#7F9635" railColor="#E8EBDD" />
                            </div>
                            <div className="rounded-xl bg-[#FFF7E6] p-4">
                                <Text type="secondary">Đơn cần xử lý</Text>
                                <div className="mt-2 text-2xl font-bold text-[#8A5A12]">{stats.pendingOrders}</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {statusSummary.map(([status, count]) => (
                                <div key={status} className="grid grid-cols-[118px_1fr_46px] items-center gap-3">
                                    {renderOrderStatusTag(status)}
                                    <div className="h-3 overflow-hidden rounded-full bg-[#EEF2E4]">
                                        <div className="h-full rounded-full bg-[#7F9635]" style={{width: `${count ? Math.max(8, (count / maxStatusCount) * 100) : 0}%`}} />
                                    </div>
                                    <strong className="text-right">{count}</strong>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={15}>
                    <Card title={<span style={{fontWeight: 600, color: '#3B5518'}}>Đơn hàng gần đây</span>} style={{borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none'}}>
                        <Table
                            rowKey={(row) => getOrderLikeId(row)}
                            columns={orderColumns}
                            dataSource={recentOrders}
                            loading={loading}
                            pagination={false}
                            size="small"
                            tableLayout="fixed"
                            onRow={(record) => ({
                                onClick: () => router.push(`/cms/quan-ly-don-hang?orderId=${getOrderLikeId(record)}`),
                                style: {cursor: 'pointer'},
                            })}
                            locale={{emptyText: 'Chưa có đơn hàng nào'}}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
