'use client';

import React from 'react';
import {createPortal} from 'react-dom';
import {toast} from '@/utils/toast';
import {
    UserAddress,
    createAddressAPI,
    deleteAddressAPI,
    getAddressesAPI,
    setDefaultAddressAPI,
    updateAddressAPI,
} from '@/api/AddressAPI';
import {unwrapListData} from '@/api/response';
import {PROVINCES} from '@/constants/provinces';
import {getCommunesByProvince, Commune} from '@/constants/communes';
import {useLanguage} from '@/context/LanguageContext';

const inputClass =
    'w-full rounded-xl border border-[#A7B36E] bg-[#F4F0E4] px-4 py-3 text-sm text-[#3B5518] outline-none placeholder:text-[#3B5518]/40 transition focus:border-[#3B5518] focus:ring-2 focus:ring-[#3B5518]/20';

const Req = () => <span className="text-red-400 ml-1 font-bold text-xs align-middle leading-none">*</span>;

const PencilIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#3B5518" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

function normalize(str: string) {
    return str
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/gi, 'd')
        .toLowerCase();
}

/* ---- Searchable Select ---- */
function SearchableSelect({
    options,
    value,
    placeholder,
    onChange,
    disabled,
    light,
}: {
    options: {code: string; name: string}[];
    value: string;
    placeholder: string;
    onChange: (code: string, name: string) => void;
    disabled?: boolean;
    light?: boolean;
}) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const ref = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const selected = options.find((o) => o.code === value);
    const filtered = search
        ? options.filter((o) => normalize(o.name).includes(normalize(search)))
        : options;

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

    const bg = light ? 'bg-[#F4F0E4] border border-[#A7B36E] focus:border-[#3B5518]' : 'bg-[#EEF2E4]';

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setOpen((v) => !v);
                    setSearch('');
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full px-4 py-3 rounded-xl text-sm text-left truncate outline-none disabled:opacity-50 transition ${bg} text-[#3B5518]`}
            >
                {selected ? selected.name : <span className="text-[#3B5518]/40">{placeholder}</span>}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
                        <path d="M1 1l4 4 4-4" stroke="#3B5518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>
            {open && (
                <div className="absolute z-[10000] top-full mt-1 w-full rounded-xl bg-[#F4F0E4] shadow-2xl border border-[#7F9635]/30 overflow-hidden">
                    <div className="p-2 border-b border-[#7F9635]/20">
                        <input
                            ref={inputRef}
                            className="w-full px-3 py-1.5 rounded-lg bg-white text-[#3B5518] text-sm outline-none border border-[#A7B36E] placeholder:text-[#3B5518]/40"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-[#3B5518]/50">Không tìm thấy</div>
                        ) : (
                            filtered.map((o) => (
                                <button
                                    key={o.code}
                                    type="button"
                                    onClick={() => { onChange(o.code, o.name); setOpen(false); setSearch(''); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors text-[#3B5518] ${value === o.code ? 'bg-[#7F9635]/25 font-semibold' : 'hover:bg-[#7F9635]/10'}`}
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

/* ---- Empty form ---- */
const EMPTY_FORM: UserAddress = {
    customerName: '',
    phone: '',
    provinceName: '',
    wardName: '',
    address: '',
    isDefault: false,
};

export default function DiaChiNhanHangTab() {
    const { t } = useLanguage();
    const [addresses, setAddresses] = React.useState<UserAddress[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalAnimOpen, setModalAnimOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<UserAddress | null>(null);
    const [form, setForm] = React.useState<UserAddress>(EMPTY_FORM);
    const [submitting, setSubmitting] = React.useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);
    const [defaultSubmittingId, setDefaultSubmittingId] = React.useState<number | null>(null);

    /* Province / Ward selection state (string codes from static list) */
    const [provinceCode, setProvinceCode] = React.useState('');
    const [wardCode, setWardCode] = React.useState('');
    const [wards, setWards] = React.useState<Commune[]>([]);

    const fetchAddresses = React.useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        try {
            const res = await getAddressesAPI();
            setAddresses(unwrapListData<UserAddress>(res));
        } catch {
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void Promise.resolve().then(fetchAddresses);
    }, [fetchAddresses]);

    const handleProvinceSelect = (code: string, name: string) => {
        setProvinceCode(code);
        setForm((prev) => ({...prev, provinceName: name, wardName: ''}));
        setWardCode('');
        setWards(getCommunesByProvince(code));
    };

    const handleWardSelect = (code: string, name: string) => {
        setWardCode(code);
        setForm((prev) => ({...prev, wardName: name}));
    };

    const openModal = () => {
        setModalVisible(true);
        setTimeout(() => setModalAnimOpen(true), 20);
    };

    const closeModal = () => {
        setModalAnimOpen(false);
        setTimeout(() => setModalVisible(false), 250);
    };

    const openDeleteConfirm = (id: number) => {
        setDeleteConfirmId(id);
        setTimeout(() => setDeleteModalOpen(true), 20);
    };

    const closeDeleteConfirm = () => {
        if (deleteSubmitting) return;
        setDeleteModalOpen(false);
        setTimeout(() => setDeleteConfirmId(null), 250);
    };

    const openCreate = () => {
        setEditing(null);
        setForm({...EMPTY_FORM});
        setProvinceCode('');
        setWardCode('');
        setWards([]);
        openModal();
    };

    const openEdit = (item: UserAddress) => {
        setEditing(item);
        setForm(item);
        /* Match province/ward by name from static list */
        const prov = PROVINCES.find((p) => p.name === item.provinceName);
        if (prov) {
            setProvinceCode(prov.code);
            const communes = getCommunesByProvince(prov.code);
            setWards(communes);
            const ward = communes.find((c) => c.name === item.wardName);
            setWardCode(ward?.code ?? '');
        } else {
            setProvinceCode('');
            setWardCode('');
            setWards([]);
        }
        openModal();
    };

    const saveAddress = async () => {
        const payload = {
            ...form,
            customerName: form.customerName?.trim(),
            phone: form.phone?.trim(),
            address: form.address?.trim(),
        };
        if (!payload.customerName || !payload.phone || !payload.provinceName || !payload.wardName || !payload.address) {
            toast.warning('Vui lòng nhập đầy đủ thông tin bắt buộc');
            return;
        }
        if (!/^(0[35789])\d{8}$/.test(payload.phone)) {
            toast.warning('Số điện thoại không hợp lệ');
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            if (editing?.id) {
                await updateAddressAPI(editing.id, payload);
                toast.success('Cập nhật địa chỉ thành công');
            } else {
                await createAddressAPI(payload);
                toast.success('Thêm địa chỉ thành công');
            }
            closeModal();
            fetchAddresses();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Không thể lưu địa chỉ');
        } finally {
            setSubmitting(false);
        }
    };

    const removeAddress = async (id: number) => {
        if (deleteSubmitting) return;
        setDeleteSubmitting(true);
        try {
            await deleteAddressAPI(id);
            toast.success('Đã xoá địa chỉ');
            setDeleteModalOpen(false);
            setTimeout(() => setDeleteConfirmId(null), 250);
            fetchAddresses();
        } catch {
            toast.error('Xoá địa chỉ thất bại');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const setDefault = async (id?: number) => {
        if (!id) return;
        if (defaultSubmittingId) return;
        setDefaultSubmittingId(id);
        try {
            await setDefaultAddressAPI(id);
            toast.success('Đặt địa chỉ mặc định thành công');
            fetchAddresses();
        } catch {
            toast.error('Không thể đặt mặc định');
        } finally {
            setDefaultSubmittingId(null);
        }
    };

    return (
        <div className="pt-[11px] text-[#F4F0E4]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-source-serif-4 text-2xl sm:text-[26px] leading-none text-[#F4F0E4]">
                    {t('account.address.title', 'Địa chỉ nhận hàng')}
                </h2>
            </div>

            {/* Address list */}
            {loading ? (
                <p className="text-[#F4F0E4]/70 text-sm">Đang tải...</p>
            ) : addresses.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {addresses.map((addr) => (
                        <div key={addr.id} className="min-h-[98px] p-3 bg-[#DDEBAA] relative text-[#3B5518]">
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-[#3B5518] font-source-serif-4 text-lg">
                                            {addr.customerName} - {addr.phone}
                                        </p>
                                        {addr.isDefault && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[#7F9635] text-white font-medium">
                                                {t('account.address.defaultBadge', 'Mặc định')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#7F9635] leading-relaxed">
                                        {[addr.address, addr.wardName, addr.provinceName].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button onClick={() => openEdit(addr)} className="h-11 w-11 flex items-center justify-center rounded hover:bg-[#3B5518]/10 transition" title="Sửa" aria-label="Sửa địa chỉ">
                                        <PencilIcon />
                                    </button>
                                    <button onClick={() => addr.id && openDeleteConfirm(addr.id)} className="h-11 w-11 flex items-center justify-center rounded hover:bg-[#3B5518]/10 transition" title="Xoá" aria-label="Xoá địa chỉ">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            {!addr.isDefault && (
                                <button
                                    onClick={() => setDefault(addr.id)}
                                    disabled={defaultSubmittingId !== null}
                                    className="mt-2 text-xs text-[#3B5518] underline underline-offset-2 hover:text-[#3B5518] transition disabled:cursor-wait disabled:opacity-60"
                                >
                                    {defaultSubmittingId === addr.id ? t('account.address.settingDefault', 'Đang đặt...') : t('account.address.setDefault', 'Đặt làm mặc định')}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[#F4F0E4]/70 text-sm">
                    {t('account.address.empty', 'Chưa có địa chỉ nào.')}
                </p>
            )}

            <div className="flex justify-center pt-[29px]">
                <button
                    onClick={openCreate}
                    className="h-[40px] min-w-[176px] rounded-full bg-[#7F9635] text-[#F4F0E4] text-sm font-semibold hover:bg-[#8DA33D] transition"
                >
                    {t('account.address.addNew', 'Thêm mới địa chỉ')}
                </button>
            </div>

            {/* Modal via portal */}
            {modalVisible &&
                createPortal(
                    <div
                        className={`fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4 py-6 transition-opacity duration-300 sm:items-center sm:py-4 ${modalAnimOpen ? 'opacity-100' : 'opacity-0'}`}
                        style={{backgroundColor: 'rgba(0,0,0,0.45)'}}
                        onClick={closeModal}
                    >
                        <div
                            className={`w-full max-w-2xl bg-[#F4F0E4] rounded-2xl shadow-2xl transition-all duration-300 ease-out transform ${modalAnimOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form
                                className="overflow-visible px-5 py-6 sm:px-8 sm:py-7"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void saveAddress();
                                }}
                            >
                                <h3 className="font-source-serif-4 text-xl sm:text-2xl text-[#3B5518] text-center mb-5 sm:mb-6">
                                    {editing ? t('account.address.updateTitle', 'Cập nhật địa chỉ nhận hàng') : t('account.address.addTitle', 'Thêm mới địa chỉ nhận hàng')}
                                </h3>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="address-customer-name" className="text-sm font-medium text-[#3B5518]">{t('account.address.fullName', 'Họ và tên')}<Req /></label>
                                        <input id="address-customer-name" name="customerName" autoComplete="name" className={inputClass} placeholder={t('account.info.enterFullName', 'Nhập họ và tên')} value={form.customerName ?? ''} onChange={(e) => setForm({...form, customerName: e.target.value})} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="address-phone" className="text-sm font-medium text-[#3B5518]">{t('account.address.phone', 'Số điện thoại')}<Req /></label>
                                        <input id="address-phone" name="phone" autoComplete="tel" inputMode="tel" className={inputClass} placeholder={t('cartDrawer.enterPhone', 'Nhập số điện thoại')} value={form.phone ?? ''} onChange={(e) => setForm({...form, phone: e.target.value})} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-[#3B5518]">{t('account.address.province', 'Tỉnh/thành phố')}<Req /></label>
                                        <SearchableSelect
                                            light
                                            options={PROVINCES}
                                            value={provinceCode}
                                            placeholder={t('account.address.selectProvince', 'Chọn tỉnh/thành phố')}
                                            onChange={handleProvinceSelect}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-[#3B5518]">{t('account.address.ward', 'Phường/xã')}<Req /></label>
                                        <SearchableSelect
                                            light
                                            options={wards}
                                            value={wardCode}
                                            placeholder={!provinceCode ? t('account.address.selectProvinceFirst', 'Chọn tỉnh trước') : t('account.address.selectWard', 'Chọn phường/xã')}
                                            disabled={!provinceCode}
                                            onChange={handleWardSelect}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 mt-4">
                                    <label htmlFor="address-detail" className="text-sm font-medium text-[#3B5518]">{t('account.address.address', 'Địa chỉ')}<Req /></label>
                                    <input id="address-detail" name="address" autoComplete="street-address" className={inputClass} placeholder={t('account.address.addressPlaceholder', 'Số nhà, tên đường...')} value={form.address ?? ''} onChange={(e) => setForm({...form, address: e.target.value})} />
                                </div>

                                <label className="flex items-center gap-2 mt-4 cursor-pointer text-sm text-[#3B5518]">
                                    <input type="checkbox" checked={!!form.isDefault} onChange={(e) => setForm({...form, isDefault: e.target.checked})} className="w-4 h-4 accent-[#3B5518] cursor-pointer" />
                                    {t('account.address.isDefault', 'Địa chỉ mặc định')}
                                </label>

                                <div className="flex flex-col items-stretch justify-center gap-3 mt-6 sm:flex-row sm:items-center sm:gap-4">
                                    <button type="button" onClick={closeModal} className="px-10 py-2 rounded-full border border-[#3B5518] text-[#3B5518] text-sm font-medium hover:bg-[#3B5518]/10 transition">
                                        {t('account.address.cancel', 'Huỷ')}
                                    </button>
                                    <button type="submit" disabled={submitting} className="px-10 py-2 rounded-full bg-[#3B5518] text-[#E4D7BD] text-sm font-medium hover:bg-[#4A6720] transition disabled:opacity-60 disabled:cursor-not-allowed">
                                        {submitting ? t('account.address.saving', 'Đang lưu...') : t('account.address.confirm', 'Xác nhận')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body,
                )}

            {deleteConfirmId &&
                createPortal(
                    <div
                        className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 p-4 transition-opacity duration-300 ${deleteModalOpen ? 'opacity-100' : 'opacity-0'}`}
                        onClick={closeDeleteConfirm}
                    >
                        <div
                            className={`w-full max-w-sm rounded-2xl bg-[#F4F0E4] px-5 py-6 text-center text-[#3B5518] shadow-2xl transition-all duration-300 ease-out ${deleteModalOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-3'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="font-source-serif-4 text-2xl text-[#3B5518]">
                                {t('account.address.deleteTitle', 'Xác nhận xoá')}
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-[#3B5518]/75">
                                {t('account.address.deleteConfirm', 'Bạn có chắc chắn muốn xoá địa chỉ nhận hàng này không?')}
                            </p>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <button
                                    onClick={closeDeleteConfirm}
                                    disabled={deleteSubmitting}
                                    className="h-10 rounded-full border border-[#3B5518] px-8 text-sm font-medium text-[#3B5518] transition hover:bg-[#3B5518]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {t('account.address.cancel', 'Huỷ')}
                                </button>
                                <button
                                    onClick={() => removeAddress(deleteConfirmId)}
                                    disabled={deleteSubmitting}
                                    className="h-10 rounded-full bg-[#3B5518] px-8 text-sm font-medium text-[#E4D7BD] transition hover:bg-[#4A6720] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleteSubmitting ? t('account.address.deleting', 'Đang xoá...') : t('account.address.delete', 'Xoá')}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
