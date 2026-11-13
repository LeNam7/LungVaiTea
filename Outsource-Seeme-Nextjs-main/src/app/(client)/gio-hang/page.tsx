'use client';

import React from 'react';
import Link from 'next/link';
import {toast} from '@/utils/toast';
import {AnimatePresence, motion} from 'framer-motion';
import {useCart, type CartProduct, type CartTea, type CartTeaSeason} from '@/hooks/useCart';
import {getFirstApiImageUrl} from '@/utils/imageUrl';
import {getTeaCost, formatTeaCost} from '@/utils/teaFields';
import {createOrderAPI} from '@/api/OrderAPI';
import {getProductsPagingAPI} from '@/api/ProductAPI';
import {getDefaultAddressAPI} from '@/api/AddressAPI';
import {getTrackingByItemAPI, toggleTrackingAPI} from '@/api/UserPreferenceAPI';
import {unwrapApiData, unwrapPagingData} from '@/api/response';
import GenerateQRCode from '@/components/common/GenerateQRCode';
import {useAppSelector} from '@/store/hooks';
import {PROVINCES} from '@/constants/provinces';
import {getCommunesByProvince, Commune} from '@/constants/communes';
import {COUNTRIES, getCountryByCode} from '@/constants/countries';
import {convertVndToUsd, formatUsd, formatVnd} from '@/utils/currency';
import StripePaymentModal, {type StripeTransactionResult} from '@/components/payment/StripePaymentModal';
import PayPalPaymentModal, {type PayPalTransactionResult} from '@/components/payment/PayPalPaymentModal';
import {TrackingAction, TrackingType, type OrderProductDetailRequest, type OrderTeaDetailRequest, type Product} from '@/types/swagger.types';
import {BRAND, BANK_INFO} from '@/constants/brand';
import {getCookie} from '@/utils/cookie';
import {useLanguage} from '@/context/LanguageContext';

/* ---- Helpers ---- */

const fmt = (n: number) => `${n.toLocaleString('vi-VN')} VNĐ`;

const getImage = (images?: string | null, fallback = '/images/shan-tuyet-tea-tree.jpg') => {
    return getFirstApiImageUrl(images, fallback);
};

/* ---- Searchable Select ---- */

function SearchableSelect({
    options,
    value,
    placeholder,
    onChange,
    disabled,
}: {
    options: {code: string; name: string}[];
    value: string;
    placeholder: string;
    onChange: (code: string, name: string) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const ref = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const selected = options.find((o) => o.code === value);
    const filtered = search ? options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase())) : options;

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div
            ref={ref}
            className="relative"
        >
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setOpen((v) => !v);
                    setSearch('');
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="w-full px-4 py-3 rounded-xl bg-[#EEF2E4] text-[#3B5518] outline-none text-sm text-left truncate disabled:opacity-50"
            >
                {selected ? selected.name : <span className="text-gray-400">{placeholder}</span>}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        className={`transition-transform ${open ? 'rotate-180' : ''}`}
                    >
                        <path
                            d="M1 1l4 4 4-4"
                            stroke="#3B5518"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </button>
            {open && (
                <div className="absolute z-50 top-full mt-1 w-full rounded-xl bg-[#EEF2E4] shadow-2xl border border-[#7F9635]/30 overflow-hidden">
                    <div className="p-2 border-b border-[#7F9635]/20">
                        <input
                            ref={inputRef}
                            className="w-full px-3 py-1.5 rounded-lg bg-white text-[#3B5518] text-sm outline-none border border-[#7F9635]/40 placeholder-gray-400"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy</div>
                        ) : (
                            filtered.map((o) => (
                                <button
                                    key={o.code}
                                    type="button"
                                    onClick={() => {
                                        onChange(o.code, o.name);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors text-[#3B5518] ${
                                        value === o.code ? 'bg-[#7F9635]/30 font-semibold' : 'hover:bg-[#7F9635]/15'
                                    }`}
                                >
                                    {o.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Inline Icons ---- */

const HeartBtn = ({onClick, active, loading}: {onClick?: () => void; active?: boolean; loading?: boolean}) => (
    <button
        onClick={onClick}
        disabled={loading}
        aria-label={active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        aria-pressed={active}
        className={`h-11 w-11 rounded-full border border-[#7F9635]/50 flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
            active ? 'bg-[#7F9635]/15' : 'hover:bg-[#7F9635]/15'
        }`}
    >
        <svg
            width="16"
            height="14"
            viewBox="0 0 22 19"
            fill={active ? '#7F9635' : 'none'}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.75 1.926C8.438-.144 5.849-.434 3.75.525 1.536 1.54 0 3.892 0 6.604c0 2.665 1.11 4.699 2.567 6.339 1.166 1.313 2.593 2.412 3.854 3.382.287.22.562.434.826.642.513.404 1.063.834 1.62 1.16.557.326 1.193.59 1.883.59s1.326-.264 1.883-.59c.558-.326 1.107-.756 1.62-1.16.264-.208.539-.422.826-.642 1.26-.97 2.688-2.07 3.854-3.382C20.39 11.303 21.5 9.269 21.5 6.604c0-2.712-1.535-5.064-3.75-6.077-2.099-.96-4.688-.67-7 1.399z"
                stroke="#7F9635"
                strokeWidth="1.5"
            />
        </svg>
    </button>
);

const FavoriteCartButton = ({
    type,
    itemId,
    itemName,
}: {
    type: TrackingType;
    itemId: number;
    itemName?: string | null;
}) => {
    const [isFavorite, setIsFavorite] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        let ignore = false;
        getTrackingByItemAPI({type, action: TrackingAction.Like, itemId})
            .then((tracking) => {
                if (!ignore) setIsFavorite(Boolean(tracking));
            })
            .catch(() => {
                if (!ignore) setIsFavorite(false);
            });

        return () => {
            ignore = true;
        };
    }, [itemId, type]);

    const handleToggle = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const result = await toggleTrackingAPI(type, TrackingAction.Like, itemId, itemName);
            setIsFavorite(Boolean(result.liked));
            toast.success(result.liked ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích');
        } catch {
            toast.error('Không thể cập nhật yêu thích');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HeartBtn
            active={isFavorite}
            loading={loading}
            onClick={handleToggle}
        />
    );
};

const TrashBtn = ({onClick}: {onClick?: () => void}) => (
    <button
        onClick={onClick}
        className="h-11 w-11 rounded-full border border-[#DC2626]/50 text-[#DC2626] flex items-center justify-center hover:bg-[#DC2626]/10 transition-colors"
        aria-label="Xoá khỏi giỏ hàng"
        title="Xoá"
    >
        <svg
            width="14"
            height="16"
            viewBox="0 0 14 16"
            fill="none"
        >
            <path
                d="M1 3.5h12M5.5 3.5V2a1.5 1.5 0 011.5-1.5h0A1.5 1.5 0 018.5 2v1.5m1.5 0v9A1.5 1.5 0 018.5 14h-3A1.5 1.5 0 014 12.5v-9h6zM5.5 7v4M8.5 7v4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </button>
);

const TriangleIcon = ({open}: {open: boolean}) => (
    <svg
        width="10"
        height="12"
        viewBox="0 0 10 12"
        fill="#3B5518"
        className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    >
        <path d="M0 0l10 6-10 6V0z" />
    </svg>
);

/* ---- Shared input classes ---- */

const inputCls =
    'w-full px-4 py-3 rounded-xl bg-[#EEF2E4] text-[#3B5518] placeholder-gray-400 outline-none text-sm focus:ring-2 focus:ring-[#7F9635]/50';

const Req = () => <span className="text-red-400 ml-1 font-bold text-xs align-middle leading-none">*</span>;

type SepayTransactionPayload = {
    id: string;
    content: string;
    transferAmount: number;
    transferType: string;
    transactionDate: string | null;
    referenceCode: string | null;
    raw: Record<string, unknown>;
};

type SepaySocketPayload =
    | {type: 'history'; transactions: SepayTransactionPayload[]}
    | {type: 'transaction'; transaction: SepayTransactionPayload}
    | {type: 'payment-confirmed'; transaction: SepayTransactionPayload};

type ShippingRegion = 'domestic' | 'international';
type PaymentMethod = 'qr' | 'cod' | 'stripe' | 'paypal';

const getTeaSeasonByName = (seasons: CartTeaSeason[], keyword: 'xuân') =>
    seasons.find((season) => season.label.toLocaleLowerCase('vi-VN').includes(keyword));

const formatHarvestOutput = (season?: CartTeaSeason) =>
    season ? `${season.quantity} kg trà khô/năm` : null;

const getOwnershipDates = (years: number) => {
    const fromDate = new Date();
    const toDate = new Date(fromDate);
    toDate.setFullYear(fromDate.getFullYear() + Math.max(1, years || 1));
    return {
        FromDate: fromDate.toISOString(),
        ToDate: toDate.toISOString(),
    };
};

const buildTeaOrderDetail = (item: CartTea): OrderTeaDetailRequest => {
    const spring = getTeaSeasonByName(item.seasons, 'xuân') ?? item.seasons[0];
    const dates = getOwnershipDates(item.plantingYears);

    return {
        Type: 'tea',
        TeaId: item.id,
        TeaName: item.name,
        Price: getTeaCost(item) ?? 0,
        // The order API models Quantity as System.Int32. Tea volume is a
        // decimal kg value (for example 0.3), so it cannot be sent here.
        // A tea selection is one item; the exact kg amount remains in Volume.
        Quantity: 1,
        SpringHarvestName: spring?.variant ?? null,
        SpringHarvestOutput: formatHarvestOutput(spring),
        WinterHarvestName: null,
        WinterHarvestOutput: null,
        Volume: item.volume ?? 0,
        TeaType: item.type ?? null,
        ...dates,
    };
};

const buildProductOrderDetail = (item: CartProduct): OrderProductDetailRequest => {
    // variant của set quà là khóa màu: ảnh upload (chứa '/') hoặc tên màu cũ.
    const variantIsImage = !!item.variant && item.variant.includes('/');
    return {
        Type: 'product',
        ProductId: item.id,
        ProductName: item.name,
        Price: item.price,
        Quantity: Math.max(1, Math.trunc(Number(item.quantity) || 1)),
        PackagingName: item.packagingName ?? null,
        ColorImage: variantIsImage ? item.variant : null,
        ColorName: item.colorName ?? (!variantIsImage && item.variant ? item.variant : null),
    };
};

/* ================================================================== */

export default function GioHangPage() {
    const { t, locale } = useLanguage();
    const isEn = locale === 'en';
    const localizePath = (path: string) => locale === 'en' ? (path.startsWith('/en') ? path : `/en${path === '/' ? '' : path}`) : path;
    const [submitting, setSubmitting] = React.useState(false);
    const [showQR, setShowQR] = React.useState(false);
    const [orderSuccess, setOrderSuccess] = React.useState<'paid' | 'manual-review' | 'cod' | null>(null);
    const [orderContent, setOrderContent] = React.useState('');
    const [paymentStatus, setPaymentStatus] = React.useState<
        'idle' | 'waiting' | 'checking' | 'paid' | 'manual-review' | 'order-creating' | 'error'
    >('idle');
    const [paymentTransaction, setPaymentTransaction] = React.useState<SepayTransactionPayload | null>(null);
    const paymentHandledRef = React.useRef(false);
    const paymentCheckingRef = React.useRef(false);
    const paymentTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const loginPromptShownRef = React.useRef(false);

    const {user} = useAppSelector((s) => s.auth);

    React.useEffect(() => {
        if (user || loginPromptShownRef.current) return;
        const timer = window.setTimeout(() => {
            if (loginPromptShownRef.current || getCookie('accessToken')) return;
            loginPromptShownRef.current = true;
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
        }, 500);

        return () => window.clearTimeout(timer);
    }, [user]);

    const {cart, removeProduct, removeTea, updateProductQty, clearCart} = useCart();
    const productItems = cart.products;
    const teaItems = cart.teas;

    const [teaOpen, setTeaOpen] = React.useState(true);
    const [productOpen, setProductOpen] = React.useState(true);

    /* Form state */
    const [shippingRegion, setShippingRegion] = React.useState<ShippingRegion>('domestic');
    const [countryCode, setCountryCode] = React.useState('US');
    const [stateCity, setStateCity] = React.useState('');
    const [postalCode, setPostalCode] = React.useState('');
    const [fullName, setFullName] = React.useState('');
    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [provinceCode, setProvinceCode] = React.useState('');
    const [provinceName, setProvinceName] = React.useState('');
    const [wardCode, setWardCode] = React.useState('');
    const [wardName, setWardName] = React.useState('');
    const [address, setAddress] = React.useState('');
    const [note, setNote] = React.useState('');
    const [companyInvoice, setCompanyInvoice] = React.useState(false);
    const [invoiceCompanyName, setInvoiceCompanyName] = React.useState('');
    const [invoiceTaxCode, setInvoiceTaxCode] = React.useState('');
    const [invoiceEmail, setInvoiceEmail] = React.useState('');
    const [invoiceAddress, setInvoiceAddress] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('qr');
    const [showStripeModal, setShowStripeModal] = React.useState(false);
    const [showPayPalModal, setShowPayPalModal] = React.useState(false);

    /* Country options for international checkout */
    const countryOptions = React.useMemo(() => {
        return COUNTRIES.map((c) => ({
            code: c.code,
            name: `${c.flag} ${locale === 'en' ? c.nameEn : c.nameVi} (${c.dialCode})`,
        }));
    }, [locale]);

    /* Communes filtered by selected province */
    const [wards, setWards] = React.useState<Commune[]>([]);

    const handleProvinceChange = (code: string, name: string) => {
        setProvinceCode(code);
        setProvinceName(name);
        setWardCode('');
        setWardName('');
        setWards(code ? getCommunesByProvince(code) : []);
    };

    /* Auto-fill from default address when user is logged in */
    React.useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const res = await getDefaultAddressAPI();
                const addr = unwrapApiData<any>(res);
                if (!addr?.id) return;
                setFullName(addr.customerName ?? '');
                setPhoneNumber(addr.phone ?? '');
                setAddress(addr.address ?? '');
                setProvinceName(addr.provinceName ?? '');
                setWardName(addr.wardName ?? '');
                /* Match province by name from static list */
                if (addr.provinceName) {
                    const prov = PROVINCES.find((p) => p.name === addr.provinceName);
                    if (prov) {
                        setProvinceCode(prov.code);
                        const communes = getCommunesByProvince(prov.code);
                        setWards(communes);
                        if (addr.wardName) {
                            const ward = communes.find((c) => c.name === addr.wardName);
                            if (ward) setWardCode(ward.code);
                        }
                    }
                }
            } catch {
                /* no default address - ignore */
            }
        };
        load();
    }, [user]);

    const total = [...teaItems.map((t) => getTeaCost(t) ?? 0), ...productItems.map((p) => p.price * p.quantity)].reduce(
        (s, v) => s + v,
        0,
    );

    const createOrder = React.useCallback(
        async (transaction?: SepayTransactionPayload | StripeTransactionResult | PayPalTransactionResult | null, contentOverride?: string) => {
            if (paymentTimeoutRef.current) {
                clearTimeout(paymentTimeoutRef.current);
                paymentTimeoutRef.current = null;
            }
            paymentCheckingRef.current = false;
            setSubmitting(true);
            setPaymentStatus('order-creating');

            const isIntl = shippingRegion === 'international';
            const selectedCountry = getCountryByCode(countryCode);

            const deliveryInfo = {
                fullName,
                phoneNumber,
                email,
                shippingRegion,
                countryCode: isIntl ? countryCode : 'VN',
                countryName: isIntl ? (locale === 'en' ? selectedCountry?.nameEn : selectedCountry?.nameVi) : 'Việt Nam',
                stateCity: isIntl ? stateCity.trim() : '',
                postalCode: isIntl ? postalCode.trim() : '',
                provinceName: isIntl ? (stateCity.trim() || 'Quốc tế') : provinceName,
                wardName: isIntl ? (selectedCountry?.nameVi || 'Quốc tế') : wardName,
                address: isIntl
                    ? `${address.trim()}${stateCity ? `, ${stateCity.trim()}` : ''}${postalCode ? `, ZIP: ${postalCode.trim()}` : ''}, ${selectedCountry?.nameVi ?? countryCode}`
                    : address,
                note,
                companyInvoice: companyInvoice
                    ? {
                          companyName: invoiceCompanyName.trim(),
                          taxCode: invoiceTaxCode.trim(),
                          email: invoiceEmail.trim(),
                          address: invoiceAddress.trim(),
                      }
                    : false,
                paymentMethod,
                paymentMethodName:
                    paymentMethod === 'cod'
                        ? 'Thanh toán khi nhận hàng'
                        : paymentMethod === 'qr'
                          ? 'Quét mã QR để chuyển tiền'
                          : paymentMethod === 'stripe'
                            ? 'Thanh toán thẻ quốc tế (Stripe)'
                            : 'Thanh toán qua PayPal',
                orderContent: contentOverride ?? orderContent,
                totalAmount: total,
                totalAmountUsd: convertVndToUsd(total),
                paymentTransaction: transaction ?? null,
            };
            const orderDetails = [...teaItems.map(buildTeaOrderDetail), ...productItems.map(buildProductOrderDetail)];
            try {
                await createOrderAPI({
                    deliveryInformation: JSON.stringify(deliveryInfo),
                    orderDetails,
                    sepayTransaction: (paymentMethod === 'qr' ? transaction : null) as any,
                });
                setShowQR(false);
                setShowStripeModal(false);
                setShowPayPalModal(false);
                clearCart();
                setPaymentStatus(transaction ? 'paid' : paymentMethod === 'cod' ? 'idle' : 'manual-review');
                setPaymentTransaction((transaction as any) ?? null);
                setOrderSuccess(paymentMethod === 'cod' ? 'cod' : transaction ? 'paid' : 'manual-review');
                if (paymentMethod === 'cod') {
                    toast.success('Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.');
                } else if (transaction) {
                    toast.success('Thanh toán thành công! Đơn hàng đang được xử lý.');
                } else {
                    toast.warning('Đã tạo đơn hàng, chưa nhận được tiền. Chúng tôi sẽ kiểm tra và duyệt thủ công.');
                }
            } catch {
                setPaymentStatus('error');
                toast.error('Đặt hàng thất bại, vui lòng thử lại sau');
            } finally {
                setSubmitting(false);
            }
        },
        [
            address,
            clearCart,
            companyInvoice,
            countryCode,
            email,
            fullName,
            invoiceAddress,
            invoiceCompanyName,
            invoiceEmail,
            invoiceTaxCode,
            locale,
            note,
            orderContent,
            paymentMethod,
            phoneNumber,
            postalCode,
            productItems,
            provinceName,
            shippingRegion,
            stateCity,
            teaItems,
            total,
            wardName,
        ],
    );

    /* ---- Place order ---- */
    const placeOrder = async () => {
        if (submitting) return;
        if (!user) {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }
        const isIntl = shippingRegion === 'international';
        const normalizedName = fullName.trim();
        const normalizedPhone = phoneNumber.trim();
        const normalizedEmail = email.trim();
        const normalizedAddress = address.trim();

        if (!normalizedName || !normalizedPhone || !normalizedAddress) {
            toast.warning('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ giao hàng');
            return;
        }

        if (!isIntl) {
            if (!provinceName || !wardName) {
                toast.warning('Vui lòng chọn tỉnh/thành phố và phường/xã');
                return;
            }
            if (!/^(0[35789])\d{8}$/.test(normalizedPhone)) {
                toast.warning('Số điện thoại không hợp lệ (10 chữ số)');
                return;
            }
            if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                toast.warning('Email không hợp lệ');
                return;
            }
        } else {
            if (!countryCode) {
                toast.warning('Vui lòng chọn quốc gia nhận hàng');
                return;
            }
            if (!stateCity.trim()) {
                toast.warning('Vui lòng nhập bang, tỉnh hoặc thành phố quốc tế');
                return;
            }
            if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                toast.warning('Vui lòng nhập email hợp lệ để nhận thông báo và theo dõi đơn hàng quốc tế');
                return;
            }
            if (!/^\+?[0-9\s\-\(\)\.]{7,20}$/.test(normalizedPhone)) {
                toast.warning('Số điện thoại quốc tế không hợp lệ (Ví dụ: +1 234 567 8900)');
                return;
            }
            if (paymentMethod === 'cod') {
                toast.warning('Phương thức COD (nhận hàng trả tiền) chỉ áp dụng nội địa Việt Nam. Vui lòng chọn Thẻ quốc tế hoặc PayPal.');
                return;
            }
        }

        if (companyInvoice) {
            if (!invoiceCompanyName.trim() || !invoiceTaxCode.trim() || !invoiceEmail.trim()) {
                toast.warning(
                    isEn
                        ? 'Please enter company name, tax code and invoice email'
                        : 'Vui lòng nhập đủ tên công ty, mã số thuế và email nhận hoá đơn'
                );
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceEmail.trim())) {
                toast.warning(isEn ? 'Invalid invoice email address' : 'Email nhận hoá đơn không hợp lệ');
                return;
            }
        }
        if (teaItems.some((tea) => getTeaCost(tea) === null)) {
            toast.error(
                isEn
                    ? 'A tea tree in your cart lacks pricing or volume. Please update from the collection.'
                    : 'Có cây trà chưa có đơn giá hoặc sản lượng. Vui lòng cập nhật cây từ bộ sưu tập.'
            );
            return;
        }
        if (!teaItems.length && !productItems.length) {
            toast.warning(isEn ? 'Your cart is empty' : 'Giỏ hàng đang trống');
            return;
        }

        try {
            const res = await getProductsPagingAPI({pageIndex: 1, pageSize: 100} as any);
            const products = unwrapPagingData<Product>(res).data;
            const stockById = new Map(products.map((p) => [p.id, p.total ?? 0]));
            const outOfStock = productItems.filter((item) => stockById.has(item.id) && (stockById.get(item.id) ?? 0) <= 0);
            if (outOfStock.length > 0) {
                toast.error(`Có sản phẩm đã hết hàng, vui lòng bỏ khỏi giỏ trước khi thanh toán: ${outOfStock.map((item) => item.name).join(', ')}`);
                return;
            }
        } catch {
            toast.error('Không kiểm tra được tồn kho, vui lòng thử lại sau');
            return;
        }

        const lastName = normalizedName.split(/\s+/).pop()?.toUpperCase() ?? '';
        const orderCode = Math.random().toString(36).slice(2, 4).toUpperCase();
        const nextOrderContent = `LVT ${lastName} ${normalizedPhone.slice(-4)} ${orderCode}`;
        setFullName(normalizedName);
        setPhoneNumber(normalizedPhone);
        setEmail(normalizedEmail);
        setAddress(normalizedAddress);
        setOrderContent(nextOrderContent);
        setOrderSuccess(null);
        setPaymentTransaction(null);
        paymentHandledRef.current = false;
        paymentCheckingRef.current = false;
        if (paymentTimeoutRef.current) {
            clearTimeout(paymentTimeoutRef.current);
            paymentTimeoutRef.current = null;
        }

        if (paymentMethod === 'cod') {
            createOrder(null, nextOrderContent);
            return;
        }

        if (paymentMethod === 'stripe') {
            setShowStripeModal(true);
            return;
        }

        if (paymentMethod === 'paypal') {
            setShowPayPalModal(true);
            return;
        }

        setPaymentStatus('waiting');
        setShowQR(true);
    };

    const handlePaymentDone = React.useCallback(
        async (transaction?: SepayTransactionPayload | null) => {
            await createOrder(transaction);
        },
        [createOrder],
    );

    const handleStripeSuccess = React.useCallback(
        async (transaction: StripeTransactionResult) => {
            setShowStripeModal(false);
            await createOrder(transaction as any);
        },
        [createOrder],
    );

    const handlePayPalSuccess = React.useCallback(
        async (transaction: PayPalTransactionResult) => {
            setShowPayPalModal(false);
            await createOrder(transaction as any);
        },
        [createOrder],
    );

    const handleConfirmTransfer = React.useCallback(() => {
        if (submitting || paymentHandledRef.current) return;

        setPaymentStatus('checking');
        paymentCheckingRef.current = true;

        if (paymentTransaction) {
            paymentHandledRef.current = true;
            handlePaymentDone(paymentTransaction);
            return;
        }

        if (paymentTimeoutRef.current) {
            clearTimeout(paymentTimeoutRef.current);
        }

        paymentTimeoutRef.current = setTimeout(() => {
            if (paymentHandledRef.current) return;
            paymentHandledRef.current = true;
            handlePaymentDone(null);
        }, 15000);
    }, [handlePaymentDone, paymentTransaction, submitting]);

    React.useEffect(() => {
        if (!showQR || !orderContent || total <= 0) return;

        const source = new EventSource(
            `/api/socket/sepay?code=${encodeURIComponent(orderContent)}&amount=${encodeURIComponent(String(total))}`,
        );

        source.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as SepaySocketPayload;
                if (payload.type !== 'payment-confirmed') return;
                if (paymentHandledRef.current) return;

                paymentHandledRef.current = true;
                setPaymentTransaction(payload.transaction);
                handlePaymentDone(payload.transaction);
            } catch {
                // Ignore malformed socket events and keep waiting for a valid confirmation.
            }
        };

        source.onerror = () => {
            if (!paymentHandledRef.current && !paymentCheckingRef.current) {
                setPaymentStatus('waiting');
            }
        };

        return () => {
            source.close();
        };
    }, [handlePaymentDone, orderContent, showQR, total]);

    React.useEffect(() => {
        return () => {
            if (paymentTimeoutRef.current) {
                clearTimeout(paymentTimeoutRef.current);
                paymentTimeoutRef.current = null;
            }
        };
    }, []);

    const isCheckingPayment = paymentStatus === 'checking';
    const isCartEmpty = teaItems.length === 0 && productItems.length === 0;

    const confirmButtonLabel = isCheckingPayment
        ? 'Đang kiểm tra...'
        : submitting
          ? 'Đang tạo đơn...'
          : 'Đã chuyển khoản';

    return (
        <div className="min-h-screen bg-[#DCCFB4] text-[#3B5518]">
            <h1 className="sr-only">Giỏ hàng và thanh toán</h1>
            {/* QR Modal */}
            <AnimatePresence>
                {showQR && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.2}}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

                        {/* Modal */}
                        <motion.div
                            className="relative bg-[#23340D] border border-[#7F9635]/40 rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4 text-[#E4D7BD] shadow-2xl"
                            initial={{scale: 0.88, opacity: 0, y: 24}}
                            animate={{scale: 1, opacity: 1, y: 0}}
                            exit={{scale: 0.92, opacity: 0, y: 16}}
                            transition={{type: 'spring', stiffness: 340, damping: 28}}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="font-source-serif-4 text-2xl text-[#7F9635]">Quét mã QR thanh toán</h3>
                            <motion.div
                                initial={{opacity: 0, scale: 0.9}}
                                animate={{opacity: 1, scale: 1}}
                                transition={{delay: 0.12, duration: 0.3}}
                            >
                                <GenerateQRCode
                                    amount={total}
                                    content={orderContent}
                                />
                            </motion.div>
                            <motion.div
                                className="text-center space-y-1"
                                initial={{opacity: 0, y: 8}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.18, duration: 0.25}}
                            >
                                <p className="text-sm opacity-90 font-medium">
                                    {BANK_INFO.bankName} · STK: <span className="font-bold text-[#E4D7BD] tracking-wider">{BANK_INFO.accountNumber}</span>
                                </p>
                                <p className="text-xs uppercase opacity-80 font-semibold text-[#E4D7BD]">
                                    {BANK_INFO.accountName}
                                </p>
                                <p className="text-[#7F9635] font-bold text-xl">{fmt(total)}</p>
                                <p className="text-xs opacity-60">
                                    Nội dung: <span className="font-semibold text-[#E4D7BD]">{orderContent}</span>
                                </p>

                                {paymentTransaction?.referenceCode && (
                                    <p className="text-[11px] opacity-50">Mã GD: {paymentTransaction.referenceCode}</p>
                                )}
                            </motion.div>
                            <motion.button
                                onClick={handleConfirmTransfer}
                                disabled={submitting || isCheckingPayment}
                                className="w-full py-3 rounded-xl bg-[#7F9635] text-white font-bold text-base hover:bg-[#8BA33B] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                initial={{opacity: 0, y: 8}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.22, duration: 0.25}}
                                whileTap={{scale: submitting || isCheckingPayment ? 1 : 0.97}}
                            >
                                <span className="inline-flex items-center justify-center gap-2">
                                    {(submitting || isCheckingPayment) && (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                                    )}
                                    {confirmButtonLabel}
                                </span>
                            </motion.button>
                            <button
                                onClick={() => !submitting && !isCheckingPayment && setShowQR(false)}
                                className="text-xs opacity-40 hover:opacity-70 transition-opacity disabled:pointer-events-none"
                            >
                                Đóng
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stripe International Card Modal */}
            <StripePaymentModal
                open={showStripeModal}
                onClose={() => setShowStripeModal(false)}
                totalAmountVnd={total}
                orderContent={orderContent}
                customerEmail={email}
                customerName={fullName}
                onSuccess={handleStripeSuccess}
            />

            {/* PayPal Modal */}
            <PayPalPaymentModal
                open={showPayPalModal}
                onClose={() => setShowPayPalModal(false)}
                totalAmountVnd={total}
                orderContent={orderContent}
                customerEmail={email}
                onSuccess={handlePayPalSuccess}
            />

            <AnimatePresence>
                {orderSuccess && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.2}}
                    >
                        <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
                        <motion.div
                            className="relative mx-4 w-full max-w-sm rounded-2xl border border-[#7F9635]/40 bg-[#23340D] p-8 text-center text-[#E4D7BD] shadow-2xl"
                            initial={{scale: 0.9, opacity: 0, y: 18}}
                            animate={{scale: 1, opacity: 1, y: 0}}
                            exit={{scale: 0.94, opacity: 0, y: 12}}
                            transition={{type: 'spring', stiffness: 340, damping: 28}}
                        >
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7F9635] text-white">
                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M5 12.5l4.2 4L19 7"
                                        stroke="currentColor"
                                        strokeWidth="2.4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <h3 className="mt-5 font-source-serif-4 text-2xl text-[#7F9635]">
                                {orderSuccess === 'paid'
                                    ? 'Thanh toán thành công!'
                                    : orderSuccess === 'cod'
                                      ? 'Đặt hàng thành công!'
                                      : 'Đã tạo đơn hàng, chờ duyệt'}
                            </h3>
                            <p className="mt-3 text-sm leading-6 opacity-80">
                                {orderSuccess === 'paid'
                                    ? 'Lùng Vài Trà đã nhận được thanh toán của bạn và đang xử lý đơn hàng.'
                                    : orderSuccess === 'cod'
                                      ? 'Bạn sẽ thanh toán trực tiếp cho nhân viên giao hàng tại thời điểm nhận sản phẩm.'
                                    : 'Hệ thống đã tạo đơn hàng của bạn, nhưng chưa nhận được thanh toán. Vui lòng chờ kiểm tra và duyệt đơn hàng.'}
                            </p>
                            <div className="mt-6 flex flex-col gap-3">
                                <Link
                                    href="/thong-tin-tai-khoan?tab=lich-su-don-hang"
                                    className="w-full rounded-xl bg-[#7F9635] px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#8BA33B]"
                                    onClick={() => setOrderSuccess(null)}
                                >
                                    Xem đơn hàng của tôi
                                </Link>
                                <button
                                    onClick={() => setOrderSuccess(null)}
                                    className="text-xs opacity-50 transition-opacity hover:opacity-80"
                                >
                                    Đóng
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========== Banner ========== */}
            <div className="relative h-[140px] sm:h-[170px] lg:h-[220px] -mt-[72px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/bghome.png"
                    alt="banner"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(59,85,24,0)_30%,rgba(59,85,24,0.5)_60%,#DCCFB4_100%)]" />
                <div className="absolute bottom-4 left-4 sm:left-10 lg:left-20 text-sm">
                    <Link
                        href={localizePath('/')}
                        className="hover:text-[#7F9635] transition-colors"
                    >
                        {t('nav.home', 'Home')}
                    </Link>
                    <span className="mx-1">/</span>
                    <span>{t('cartPage.title', 'Giỏ hàng')}</span>
                </div>
            </div>

            {/* ========== Main Content ========== */}
            <div className="px-4 sm:px-10 lg:px-20 pt-4 pb-12">
                {isCartEmpty ? (
                    <div className="mx-auto max-w-2xl rounded-2xl border border-[#7F9635]/25 bg-[#F1E8D2] px-6 py-10 text-center shadow-[0_10px_30px_rgba(59,85,24,0.12)]">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#7F9635]/15 text-3xl">🛒</div>
                        <h2 className="font-source-serif-4 text-3xl text-[#3B5518]">{t('cartPage.emptyTitle', 'Giỏ hàng đang trống')}</h2>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#3B5518]/75">
                            {t('cartPage.emptyDesc', 'Hãy chọn sản phẩm trà hoặc cây trà yêu thích trước khi nhập thông tin giao hàng và thanh toán.')}
                        </p>
                        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                            <Link href={localizePath('/san-pham-tra')} className="rounded-xl bg-[#7F9635] px-5 py-3 font-semibold text-white transition hover:bg-[#6f8532]">{t('cartPage.shopTea', 'Mua sản phẩm trà')}</Link>
                            <Link href={localizePath('/bo-suu-tap-cay-tra')} className="rounded-xl border border-[#7F9635] px-5 py-3 font-semibold text-[#3B5518] transition hover:bg-[#7F9635]/10">{t('cartPage.exploreTrees', 'Khám phá cây trà')}</Link>
                        </div>
                    </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-8 lg:gap-12">
                    {/* ===== LEFT COLUMN: Form + Payment ===== */}
                    <div>
                        {/* Title */}
                        <h2 className="font-source-serif-4 text-3xl lg:text-[40px] text-[#7F9635]">
                            {t('cartPage.shippingInfo', 'Thông tin giao hàng')}
                        </h2>
                        <p className="text-sm mt-2 mb-6">
                            {user ? t('cartPage.userSelectAddress', 'Chọn từ địa chỉ nhận hàng của bạn') : t('cartPage.loginPrompt', 'Bạn đã có tài khoản?')}{' '}
                            <Link
                                href={localizePath('/tai-khoan')}
                                className="text-[#7F9635] font-semibold hover:underline"
                            >
                                {user ? t('cartPage.manageAddress', 'Quản lý địa chỉ') : t('cartPage.loginLink', 'Đăng nhập ngay')}
                            </Link>
                        </p>

                        {/* --- Form Fields --- */}
                        <div className="space-y-4">
                            {/* Shipping Region Selector (Nội địa vs Quốc tế) */}
                            <div>
                                <label className="text-sm mb-1.5 block font-semibold text-[#3B5518]">
                                    {t('cartPage.shippingRegion', 'Khu vực nhận hàng')}
                                    <Req />
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-[#EEF2E4] rounded-xl border border-[#7F9635]/30">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShippingRegion('domestic');
                                        }}
                                        className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                            shippingRegion === 'domestic'
                                                ? 'bg-[#7F9635] text-white shadow-sm'
                                                : 'text-[#3B5518] hover:bg-[#7F9635]/15'
                                        }`}
                                    >
                                        <span>🇻🇳</span>
                                        <span>{t('cartPage.domestic', 'Nội địa (Việt Nam)')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShippingRegion('international');
                                            if (paymentMethod === 'cod') {
                                                setPaymentMethod('stripe');
                                            }
                                        }}
                                        className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                            shippingRegion === 'international'
                                                ? 'bg-[#7F9635] text-white shadow-sm'
                                                : 'text-[#3B5518] hover:bg-[#7F9635]/15'
                                        }`}
                                    >
                                        <span>🌐</span>
                                        <span>{t('cartPage.international', 'Quốc tế (Giao toàn cầu)')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Name + Phone */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="checkout-full-name" className="text-sm mb-1.5 block">
                                        {t('cartPage.fullName', 'Họ và tên')}
                                        <Req />
                                    </label>
                                    <input
                                        id="checkout-full-name"
                                        name="fullName"
                                        autoComplete="name"
                                        className={inputCls}
                                        placeholder={t('cartPage.enterFullName', 'Nhập họ và tên')}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="checkout-phone" className="text-sm mb-1.5 block">
                                        {shippingRegion === 'international' ? t('cartPage.internationalPhone', 'Số điện thoại quốc tế') : t('cartPage.phone', 'Số điện thoại')}
                                        <Req />
                                    </label>
                                    <input
                                        id="checkout-phone"
                                        name="phone"
                                        autoComplete="tel"
                                        inputMode="tel"
                                        className={inputCls}
                                        placeholder={shippingRegion === 'international' ? '+1 234 567 8900' : t('cartPage.enterPhone', 'Nhập số điện thoại')}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="checkout-email" className="text-sm mb-1.5 block">
                                    {t('cartPage.email', 'Email')}
                                    {shippingRegion === 'international' && <Req />}
                                </label>
                                <input
                                    id="checkout-email"
                                    name="email"
                                    autoComplete="email"
                                    type="email"
                                    className={inputCls}
                                    placeholder={shippingRegion === 'international' ? 'customer@example.com' : t('cartPage.emailOptional', 'Email (không bắt buộc)')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {shippingRegion === 'international' && (
                                    <p className="text-[11px] text-[#3B5518]/70 mt-1">
                                        {t('cartPage.emailNotice', 'Email bắt buộc để gửi mã vận đơn quốc tế và xác nhận thanh toán.')}
                                    </p>
                                )}
                            </div>

                            {/* Location Section */}
                            {shippingRegion === 'domestic' ? (
                                /* DOMESTIC: Province / Ward (no district) */
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm mb-1.5 block">
                                            {t('cartPage.province', 'Tỉnh/thành phố')}
                                            <Req />
                                        </label>
                                        <SearchableSelect
                                            options={PROVINCES}
                                            value={provinceCode}
                                            placeholder={t('cartPage.selectProvince', 'Chọn tỉnh/thành phố')}
                                            onChange={handleProvinceChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm mb-1.5 block">
                                            {t('cartPage.ward', 'Phường/xã')}
                                            <Req />
                                        </label>
                                        <SearchableSelect
                                            options={wards}
                                            value={wardCode}
                                            placeholder={!provinceCode ? t('cartPage.selectProvinceFirst', 'Chọn tỉnh trước') : t('cartPage.selectWard', 'Chọn phường/xã')}
                                            disabled={!provinceCode}
                                            onChange={(code, name) => {
                                                setWardCode(code);
                                                setWardName(name);
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* INTERNATIONAL: Country + State/City + Postal Code */
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm mb-1.5 block">
                                            {t('cartPage.country', 'Quốc gia / Vùng lãnh thổ')}
                                            <Req />
                                        </label>
                                        <SearchableSelect
                                            options={countryOptions}
                                            value={countryCode}
                                            placeholder={t('cartPage.selectCountry', 'Chọn quốc gia')}
                                            onChange={(code) => setCountryCode(code)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="checkout-state-city" className="text-sm mb-1.5 block">
                                                {t('cartPage.stateCity', 'Bang / Tỉnh / Thành phố')}
                                                <Req />
                                            </label>
                                            <input
                                                id="checkout-state-city"
                                                className={inputCls}
                                                placeholder={t('cartPage.enterStateCity', 'Nhập bang, tỉnh hoặc thành phố')}
                                                value={stateCity}
                                                onChange={(e) => setStateCity(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="checkout-postal-code" className="text-sm mb-1.5 block">
                                                {t('cartPage.postalCode', 'Mã bưu chính (ZIP / Postal Code)')}
                                            </label>
                                            <input
                                                id="checkout-postal-code"
                                                className={inputCls}
                                                placeholder={t('cartPage.enterPostalCode', 'Nhập mã bưu chính (VD: 10001)')}
                                                value={postalCode}
                                                onChange={(e) => setPostalCode(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Address */}
                            <div>
                                <label htmlFor="checkout-address" className="text-sm mb-1.5 block">
                                    {t('cartPage.address', 'Địa chỉ')}
                                    <Req />
                                </label>
                                <input
                                    id="checkout-address"
                                    name="address"
                                    autoComplete="street-address"
                                    className={inputCls}
                                    placeholder={shippingRegion === 'international' ? 'Street address, Apartment, Suite, Unit, etc.' : t('cartPage.addressPlaceholder', 'Số nhà, tên đường...')}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>

                            {/* Note */}
                            <div>
                                <label htmlFor="checkout-note" className="text-sm mb-1.5 block">{t('cartPage.note', 'Lời nhắn')}</label>
                                <textarea
                                    id="checkout-note"
                                    name="note"
                                    className="w-full px-5 py-3 rounded-xl bg-[#EEF2E4] text-[#3B5518] placeholder-gray-400 outline-none text-sm resize-none focus:ring-2 focus:ring-[#7F9635]/50"
                                    rows={3}
                                    placeholder={t('cartPage.notePlaceholder', 'Lời nhắn')}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>

                            {/* Company invoice checkbox */}
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={companyInvoice}
                                    onChange={(event) => setCompanyInvoice(event.target.checked)}
                                    className="h-5 w-5 accent-[#3B5518]"
                                />
                                <span className="text-sm">{t('cartPage.companyInvoice', 'Xuất hóa đơn công ty')}</span>
                            </label>
                            {companyInvoice && (
                                <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-[#7F9635]/25 bg-[#EEF2E4]/60 p-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="invoice-company-name" className="text-sm mb-1.5 block">
                                            {t('cartPage.companyName', 'Tên công ty')} *
                                        </label>
                                        <input
                                            id="invoice-company-name"
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#EEF2E4] text-[#3B5518] placeholder-gray-400 outline-none text-sm focus:ring-2 focus:ring-[#7F9635]/50"
                                            placeholder={t('cartPage.companyName', 'Tên công ty')}
                                            value={invoiceCompanyName}
                                            onChange={(e) => setInvoiceCompanyName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="invoice-tax-code" className="text-sm mb-1.5 block">
                                            {t('cartPage.taxCode', 'Mã số thuế')} *
                                        </label>
                                        <input
                                            id="invoice-tax-code"
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#EEF2E4] text-[#3B5518] placeholder-gray-400 outline-none text-sm focus:ring-2 focus:ring-[#7F9635]/50"
                                            placeholder={t('cartPage.taxCode', 'Mã số thuế')}
                                            value={invoiceTaxCode}
                                            onChange={(e) => setInvoiceTaxCode(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="invoice-email" className="text-sm mb-1.5 block">
                                            {t('cartPage.invoiceEmail', 'Email nhận hoá đơn')} *
                                        </label>
                                        <input
                                            id="invoice-email"
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#EEF2E4] text-[#3B5518] placeholder-gray-400 outline-none text-sm focus:ring-2 focus:ring-[#7F9635]/50"
                                            placeholder={isEn ? "email@company.com" : "email@congty.vn"}
                                            value={invoiceEmail}
                                            onChange={(e) => setInvoiceEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="invoice-address" className="text-sm mb-1.5 block">
                                            {t('cartPage.companyAddress', 'Địa chỉ công ty')}
                                        </label>
                                        <input
                                            id="invoice-address"
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#EEF2E4] text-[#3B5518] placeholder-gray-400 outline-none text-sm focus:ring-2 focus:ring-[#7F9635]/50"
                                            placeholder={t('cartPage.companyAddress', 'Địa chỉ công ty')}
                                            value={invoiceAddress}
                                            onChange={(e) => setInvoiceAddress(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- Payment Method --- */}
                        <div className="mt-8">
                            <h3 className="font-source-serif-4 text-2xl lg:text-3xl text-[#7F9635]">
                                {t('cartPage.paymentMethod', 'Phương thức thanh toán')}
                            </h3>

                            <div className="mt-4 space-y-3">
                                {/* Option 1: International Card (Stripe) */}
                                <label
                                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${
                                        paymentMethod === 'stripe' ? 'border-[#7F9635]/80 bg-[#DCE7C4]' : 'border-[#7F9635]/25 hover:bg-[#EEF2E4]/40'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="stripe"
                                        checked={paymentMethod === 'stripe'}
                                        onChange={() => setPaymentMethod('stripe')}
                                        className="mt-1 h-5 w-5 shrink-0 accent-[#7F9635]"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <p className="font-semibold text-sm">
                                                {t('cartPage.stripeTitle', 'Thẻ quốc tế (Visa / Mastercard / JCB / AMEX)')}
                                            </p>
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#7F9635] text-white">
                                                Quốc tế & VN
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-70 mt-0.5">
                                            {t('cartPage.stripeDesc', 'Cổng Stripe bảo mật toàn cầu, hỗ trợ thanh toán thẻ tín dụng và ghi nợ quốc tế.')}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-white">
                                            <span className="px-1.5 py-0.5 bg-blue-700 rounded">VISA</span>
                                            <span className="px-1.5 py-0.5 bg-red-600 rounded">MASTERCARD</span>
                                            <span className="px-1.5 py-0.5 bg-sky-700 rounded">JCB</span>
                                            <span className="px-1.5 py-0.5 bg-emerald-700 rounded">AMEX</span>
                                        </div>
                                    </div>
                                </label>

                                {/* Option 2: PayPal */}
                                <label
                                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${
                                        paymentMethod === 'paypal' ? 'border-[#7F9635]/80 bg-[#DCE7C4]' : 'border-[#7F9635]/25 hover:bg-[#EEF2E4]/40'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="paypal"
                                        checked={paymentMethod === 'paypal'}
                                        onChange={() => setPaymentMethod('paypal')}
                                        className="mt-1 h-5 w-5 shrink-0 accent-[#7F9635]"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <p className="font-semibold text-sm">
                                                {t('cartPage.paypalTitle', 'Ví điện tử PayPal')}
                                            </p>
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#003087] text-white">
                                                PayPal Global
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-70 mt-0.5">
                                            {t('cartPage.paypalDesc', 'Thanh toán quốc tế nhanh chóng, tiện lợi bằng tài khoản PayPal hoặc thẻ liên kết.')}
                                        </p>
                                    </div>
                                </label>

                                {/* Option 3: VietQR (Chuyển khoản ngân hàng) */}
                                <label
                                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${
                                        paymentMethod === 'qr' ? 'border-[#7F9635]/80 bg-[#DCE7C4]' : 'border-[#7F9635]/25 hover:bg-[#EEF2E4]/40'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="qr"
                                        checked={paymentMethod === 'qr'}
                                        onChange={() => setPaymentMethod('qr')}
                                        className="mt-1 h-5 w-5 shrink-0 accent-[#7F9635]"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <p className="font-semibold text-sm">{t('cartPage.qrTitle', 'Quét mã QR để chuyển tiền')}</p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#3B5518]/15 text-[#3B5518]">
                                                VietQR · MBBank
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-60 mt-0.5">
                                            {t('cartPage.qrDesc', 'Hỗ trợ hầu hết các ngân hàng và ví điện tử tại Việt Nam.')}
                                        </p>
                                    </div>
                                </label>

                                {/* Option 4: COD */}
                                <label
                                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${
                                        shippingRegion === 'international' ? 'opacity-40 cursor-not-allowed bg-gray-200/50' : paymentMethod === 'cod' ? 'border-[#7F9635]/80 bg-[#DCE7C4]' : 'border-[#7F9635]/25 hover:bg-[#EEF2E4]/40'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        disabled={shippingRegion === 'international'}
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                        className="mt-1 h-5 w-5 shrink-0 accent-[#7F9635]"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <p className="font-semibold text-sm">{t('cartPage.codTitle', 'Thanh toán khi nhận hàng (COD)')}</p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                                Chỉ nội địa VN
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-60 mt-0.5">
                                            {t('cartPage.codDesc', 'Khách hàng thanh toán trực tiếp cho nhân viên giao hàng tại thời điểm nhận sản phẩm.')}
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* ===== RIGHT COLUMN: Cart ===== */}
                    <div>
                        <h2 className="font-source-serif-4 text-3xl lg:text-[40px] text-[#7F9635]">{t('cartPage.cartTitle', 'Giỏ hàng')}</h2>

                        <div className="mt-5 space-y-5">
                            {/* ---- Cây trà Section ---- */}
                            {teaItems.length > 0 && (
                                <div>
                                    <button
                                        onClick={() => setTeaOpen(!teaOpen)}
                                        className="flex items-center gap-2 mb-4"
                                    >
                                        <TriangleIcon open={teaOpen} />
                                        <span className="font-source-serif-4 text-xl text-[#7F9635]">{t('cartPage.teaTrees', 'Cây trà')}</span>
                                    </button>

                                    {teaOpen && (
                                        <div className="space-y-5">
                                            {teaItems.map((tea) => (
                                                <div
                                                    key={tea.id}
                                                    className="border-b border-[#7F9635]/20 pb-5"
                                                >
                                                    <div className="flex gap-3">
                                                        {/* Thumbnail */}
                                                        <div className="w-[75px] h-[75px] lg:w-[85px] lg:h-[85px] rounded-lg overflow-hidden flex-shrink-0">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={getImage(
                                                                    tea.images,
                                                                    '/images/shan-tuyet-tea-tree.jpg',
                                                                )}
                                                                alt={tea.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src =
                                                                        '/images/shan-tuyet-tea-tree.jpg';
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Title + price row */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="bg-[#2d5e2d] text-white text-[10px] px-2 py-0.5 rounded font-bold tracking-wide whitespace-nowrap">
                                                                        {tea.code}
                                                                    </span>
                                                                    <span className="text-sm font-semibold leading-tight">
                                                                        {tea.name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[#7F9635] font-bold text-sm whitespace-nowrap hidden lg:block">
                                                                    {formatTeaCost(tea)}
                                                                </span>
                                                            </div>
                                                            {/* Mobile price */}
                                                            <p className="text-[#7F9635] font-bold text-sm mt-1 lg:hidden">
                                                                {formatTeaCost(tea)}
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#3B5518]/75">
                                                                <span className="rounded-full bg-[#EEF2E4] px-2.5 py-1">
                                                                    {t('cartPage.yield', 'Sản lượng')}:{' '}
                                                                    {tea.volume && tea.volume > 0
                                                                        ? `${tea.volume.toLocaleString('vi-VN')} ${isEn ? 'kg/tree/year' : 'kg/cây/năm'}`
                                                                        : '-'}
                                                                </span>
                                                                <span className="rounded-full bg-[#EEF2E4] px-2.5 py-1">
                                                                    {t('cartPage.treeType', 'Loại cây')}: {tea.type || '-'}
                                                                </span>
                                                            </div>

                                                            {tea.seasons.map((season) => (
                                                                <div key={season.label} className="mt-2.5 space-y-1 text-sm">
                                                                    <p>{season.label} - {isEn ? '1 harvest/year' : '1 lần/năm'}</p>
                                                                    <p>{season.variant}</p>
                                                                    <p>{t('cartPage.quantity', 'Số lượng')}: {season.quantity.toLocaleString('vi-VN')} {isEn ? 'kg dry tea/year' : 'kg trà khô/năm'}</p>
                                                                    <p>{t('cartPage.unitPrice', 'Đơn giá')}: {fmt(tea.price)}/kg</p>
                                                                </div>
                                                            ))}

                                                            {/* Planting note + action buttons */}
                                                            <div className="flex items-center justify-between mt-3">
                                                                <span className="text-[11px] opacity-50 italic">
                                                                    {isEn ? `Adoption period: ${tea.plantingYears} years` : `Nhận trồng cây trong ${tea.plantingYears} năm`}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    {user && (
                                                                        <FavoriteCartButton
                                                                            type={TrackingType.Tea}
                                                                            itemId={tea.id}
                                                                            itemName={tea.name}
                                                                        />
                                                                    )}
                                                                    <TrashBtn onClick={() => removeTea(tea.id)} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ---- Sản phẩm trà Section ---- */}
                            {productItems.length > 0 && (
                                <div>
                                    <button
                                        onClick={() => setProductOpen(!productOpen)}
                                        className="flex items-center gap-2 mb-4"
                                    >
                                        <TriangleIcon open={productOpen} />
                                        <span className="font-source-serif-4 text-xl text-[#7F9635]">{t('cartPage.teaProducts', 'Sản phẩm trà')}</span>
                                    </button>

                                    {productOpen && (
                                        <div className="space-y-5">
                                            {productItems.map((product) => (
                                                <div
                                                    key={product.id}
                                                    className="border-b border-[#7F9635]/20 pb-5"
                                                >
                                                    <div className="flex gap-3 items-start">
                                                        {/* Thumbnail */}
                                                        <div className="w-[65px] h-[65px] lg:w-[75px] lg:h-[75px] rounded-lg overflow-hidden flex-shrink-0">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={getImage(product.images, '/images/shan-tuyet-tea-tree.jpg')}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src =
                                                                        '/images/shan-tuyet-tea-tree.jpg';
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="font-semibold font-source-serif-4 text-lg leading-tight">
                                                                    {product.name}
                                                                </p>
                                                                <span className="text-[#7F9635] font-bold text-sm whitespace-nowrap hidden lg:block">
                                                                    {fmt(product.price)}
                                                                </span>
                                                            </div>
                                                            <p className="text-[#7F9635] font-bold text-sm mt-0.5 lg:hidden">
                                                                {fmt(product.price)}
                                                            </p>

                                                            {/* Phân loại + màu đã chọn */}
                                                            {product.packagingName ? (
                                                                <p className="text-xs opacity-70 mt-1">
                                                                    Phân loại: {product.packagingName}
                                                                </p>
                                                            ) : null}
                                                            {product.variant ? (
                                                                product.variant.includes('/') ? (
                                                                    <p className="text-xs opacity-70 mt-1 flex items-center gap-1.5">
                                                                        Màu:
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img
                                                                            src={getFirstApiImageUrl(
                                                                                product.variant,
                                                                                '/images/shan-tuyet-tea-tree.jpg',
                                                                            )}
                                                                            alt=""
                                                                            className="w-7 h-7 rounded object-cover"
                                                                        />
                                                                        {product.colorName ? <span>{product.colorName}</span> : null}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs opacity-70 mt-1">
                                                                        {t('cartPage.variant', 'Màu')}: {product.variant}
                                                                    </p>
                                                                )
                                                            ) : null}

                                                            {/* Quantity */}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-xs opacity-70">
                                                                    {t('cartPage.quantity', 'Số lượng')}
                                                                </span>
                                                                <div className="flex items-center gap-0.5">
                                                                    <button
                                                                        onClick={() =>
                                                                            updateProductQty(
                                                                                product.id,
                                                                                product.quantity - 1,
                                                                                product.variant,
                                                                            )
                                                                        }
                                                                        className="h-11 w-11 rounded bg-[#7F9635] flex items-center justify-center text-white text-base hover:bg-[#6F8532] transition-colors"
                                                                        aria-label={isEn ? `Decrease quantity of ${product.name}` : `Giảm số lượng ${product.name}`}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className="text-sm w-8 text-center font-medium">
                                                                        {product.quantity}
                                                                    </span>
                                                                    <button
                                                                        onClick={() =>
                                                                            updateProductQty(
                                                                                product.id,
                                                                                product.quantity + 1,
                                                                                product.variant,
                                                                            )
                                                                        }
                                                                        className="h-11 w-11 rounded bg-[#7F9635] flex items-center justify-center text-white text-base hover:bg-[#6F8532] transition-colors"
                                                                        aria-label={isEn ? `Increase quantity of ${product.name}` : `Tăng số lượng ${product.name}`}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                                <span className="text-xs opacity-50">
                                                                    {isEn ? (product.unit === 'hộp' ? t('cartPage.unitBox', 'box') : product.unit === 'gói' ? t('cartPage.unitPack', 'pack') : product.unit) : product.unit}
                                                                </span>
                                                            </div>

                                                            {/* Action buttons */}
                                                            <div className="flex items-center justify-end gap-2 mt-3">
                                                                {user && (
                                                                    <FavoriteCartButton
                                                                        type={TrackingType.Product}
                                                                        itemId={product.id}
                                                                        itemName={product.name}
                                                                    />
                                                                )}
                                                                <TrashBtn onClick={() => removeProduct(product.id, product.variant)} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ---- Total + Order Button ---- */}
                            {(teaItems.length > 0 || productItems.length > 0) && (
                                <div className="pt-3">
                                    <div className="flex items-baseline justify-between">
                                        <span className="font-source-serif-4 text-2xl lg:text-[28px] text-[#7F9635]">
                                            {t('cartPage.total', 'Tổng thanh toán')}
                                        </span>
                                        <div className="text-right">
                                            <span className="text-[#7F9635] font-bold text-xl lg:text-2xl block">
                                                {fmt(total)}
                                            </span>
                                            <span className="text-xs text-[#3B5518]/70 font-semibold block mt-0.5">
                                                ≈ {formatUsd(convertVndToUsd(total))}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-right text-xs opacity-50 mt-1">
                                        {t('cartPage.shippingNotice', 'Chưa bao gồm phí ship 30-50k/đơn hàng')}
                                    </p>

                                    <button
                                        onClick={placeOrder}
                                        disabled={submitting}
                                        className="w-full mt-5 py-3.5 rounded-lg bg-[#7F9635] text-white font-bold text-base disabled:opacity-60 hover:bg-[#8BA33B] transition-colors"
                                    >
                                        {submitting ? t('cartPage.placingOrder', 'Đang đặt hàng...') : t('cartPage.placeOrder', 'Đặt hàng')}
                                    </button>

                                    <p className="text-center text-[11px] opacity-40 mt-3 italic leading-relaxed">
                                        {t('cartPage.treePolicyNotice', 'Lưu ý, khi đã đặt cây, bạn không thể huỷ hoặc nhận hoàn tiền cho đơn hàng')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}
