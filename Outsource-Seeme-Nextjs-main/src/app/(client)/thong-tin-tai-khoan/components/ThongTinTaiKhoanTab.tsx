'use client';
import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {toast} from '@/utils/toast';
import {changePasswordAPI} from '@/api/AuthAPI';
import {getUserByIdAPI, updateUserAPI} from '@/api/UserAPI';
import {unwrapApiData} from '@/api/response';
import {useAppSelector} from '@/store/hooks';
import ModalTitle from '@/components/ui/ModalTitle';
import {Gender} from '@/types/swagger.types';
import {useLanguage} from '@/context/LanguageContext';

type AccountModalType = 'change-password' | 'update-info';

const CloseIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 4L4 12M4 4L12 12"
            stroke="#6B7280"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
    </svg>
);

const EyeIcon = ({show}: {show: boolean}) =>
    show ? (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1 12C3.028 7.848 7.192 5 12 5C16.808 5 20.972 7.848 23 12C20.972 16.152 16.808 19 12 19C7.192 19 3.028 16.152 1 12ZM12 15.5C13.3807 15.5 14.5 14.3807 14.5 13C14.5 11.6193 13.3807 10.5 12 10.5C10.6193 10.5 9.5 11.6193 9.5 13C9.5 14.3807 10.6193 15.5 12 15.5Z"
                fill="#7B943E"
            />
        </svg>
    ) : (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M3 3L21 21M10.584 10.587A2 2 0 0013.414 13.414M9.363 5.365A9.466 9.466 0 0112 5C16.808 5 20.972 7.848 23 12C22.226 13.557 21.152 14.931 19.862 16.062M17.688 17.693A9.966 9.966 0 0112 19C7.192 19 3.028 16.152 1 12C2.005 9.891 3.652 8.124 5.67 6.934"
                stroke="#7B943E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

const inputClass =
    'w-full h-[46px] rounded-[9px] border border-[#3B5518] bg-[#F8F2E6] px-5 text-sm text-[#3B5518] outline-none placeholder:text-[#D8CFBE] transition focus:border-[#3B5518] focus:ring-2 focus:ring-[#3B5518]/15';

const labelClass = 'mb-1 block text-sm font-medium text-[#3B5518]';

const GENDER_OPTIONS = [
    {value: Gender.Male, label: 'Nam'},
    {value: Gender.Female, label: 'Nữ'},
    {value: Gender.Other, label: 'Khác'},
];

const normalizeGender = (value: unknown): Gender => {
    if (typeof value === 'string') {
        const text = value.toLowerCase();
        if (text.includes('nữ') || text.includes('nu')) return Gender.Female;
        if (text.includes('khác') || text.includes('khac') || text.includes('other')) return Gender.Other;
        if (text.includes('nam') || text.includes('male')) return Gender.Male;
    }

    const numeric = Number(value);
    if (numeric === Gender.Female || numeric === Gender.Other || numeric === Gender.Male) {
        return numeric;
    }

    return Gender.Male;
};

const getGenderLabel = (value: Gender, t?: (k: string, f?: string) => string) => {
    if (t) {
        if (value === Gender.Male) return t('account.info.male', 'Nam');
        if (value === Gender.Female) return t('account.info.female', 'Nữ');
        if (value === Gender.Other) return t('account.info.other', 'Khác');
    }
    return GENDER_OPTIONS.find((option) => option.value === value)?.label ?? '-';
};

type ChangePasswordPayload = {
    isSuccess?: boolean;
    oldPasswordError?: string | null;
    newPasswordError?: string | null;
    message?: string | null;
};

type ChangePasswordErrors = {
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    form?: string;
};

const getChangePasswordErrorMessage = (
    payload?: ChangePasswordPayload | null,
    fallback = 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu.',
) => {
    const apiMessage = payload?.message?.trim();
    return (
        payload?.oldPasswordError?.trim() ||
        payload?.newPasswordError?.trim() ||
        (apiMessage && apiMessage.toLowerCase() !== 'success' ? apiMessage : '') ||
        fallback
    );
};

const AccountInfoValue = ({loading, children}: {loading: boolean; children: React.ReactNode}) =>
    loading ? (
        <span className="mt-1 block h-5 w-36 animate-pulse rounded bg-[#F4F0E4]/25" />
    ) : (
        <p className="break-words font-normal text-base sm:text-[18px] leading-6">{children}</p>
    );

const ThongTinTaiKhoanTab = () => {
    const { t } = useLanguage();
    const authUser = useAppSelector((s) => s.auth.user as any);

    const [modalType, setModalType] = useState<AccountModalType | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);

    // Change password state
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showOldPw, setShowOldPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [changePwErrors, setChangePwErrors] = useState<ChangePasswordErrors>({});
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Update info state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState<Gender>(Gender.Male);
    const [address, setAddress] = useState('');
    const [bio, setBio] = useState('');

    const authUserId = Number(authUser?.id);
    const authUserFirstName = authUser?.firstName ?? '';
    const authUserLastName = authUser?.lastName ?? '';
    const authUserFullName = authUser?.fullName ?? '';
    const authUserUserName = authUser?.userName ?? '';
    const authUserPhone = authUser?.phoneNumber ?? '';
    const authUserEmail = authUser?.email ?? '';
    const authUserBirthDate = authUser?.birthDate ?? '';
    const authUserGender = authUser?.gender;
    const authUserAddress = authUser?.address ?? '';
    const authUserBio = authUser?.bio ?? '';
    const authUserDisplayName =
        authUserFirstName && authUserLastName ? `${authUserFirstName} ${authUserLastName}` : authUserFullName;
    const hasAuthProfile = Boolean(authUserPhone || authUserEmail || authUserFirstName || authUserFullName);

    React.useEffect(() => {
        const loadProfile = async () => {
            if (!authUserId) {
                setProfileLoading(false);
                return;
            }

            if (hasAuthProfile) {
                setName(authUserDisplayName);
                setPhone(authUserPhone);
                setEmail(authUserEmail);
                setDob(authUserBirthDate?.slice?.(0, 10) ?? '');
                setGender(normalizeGender(authUserGender));
                setAddress(authUserAddress);
                setBio(authUserBio);
                setProfileLoading(false);
                return;
            }

            setProfileLoading(true);
            try {
                const res = await getUserByIdAPI(authUserId);
                const user = unwrapApiData<any>(res);
                setName(
                    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.fullName ?? ''),
                );
                setPhone(user?.phoneNumber ?? '');
                setEmail(user?.email ?? '');
                setDob(user?.birthDate?.slice?.(0, 10) ?? '');
                setGender(normalizeGender(user?.gender));
                setAddress(user?.address ?? '');
                setBio(user?.bio ?? '');
            } catch {
                // fallback to current auth state values
                setName(authUserFullName || authUserUserName);
                setPhone(authUserPhone);
                setEmail(authUserEmail);
                setGender(normalizeGender(authUserGender));
            } finally {
                setProfileLoading(false);
            }
        };

        loadProfile();
    }, [
        authUserId,
        authUserPhone,
        authUserEmail,
        authUserFirstName,
        authUserLastName,
        authUserFullName,
        authUserUserName,
        authUserBirthDate,
        authUserGender,
        authUserAddress,
        authUserBio,
        authUserDisplayName,
        hasAuthProfile,
    ]);

    const openModal = (type: AccountModalType) => {
        if (type === 'change-password') {
            setChangePwErrors({});
        }
        setModalType(type);
        setIsModalVisible(true);
        setTimeout(() => setIsModalOpen(true), 20);
    };

    const closeModal = (force = false) => {
        if (!force && (isChangingPassword || isUpdatingProfile)) return;
        setIsModalOpen(false);
        setTimeout(() => {
            setIsModalVisible(false);
            setModalType(null);
        }, 250);
    };

    const handleChangePwSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isChangingPassword) return;
        setChangePwErrors({});
        const userId = Number(authUser?.id);
        if (!userId) {
            toast.error('Không xác định được tài khoản đăng nhập');
            return;
        }
        if (!oldPw || !newPw || !confirmPw) {
            setChangePwErrors({form: 'Vui lòng nhập đầy đủ thông tin mật khẩu'});
            toast.warning('Vui lòng nhập đầy đủ thông tin mật khẩu');
            return;
        }
        if (newPw !== confirmPw) {
            setChangePwErrors({confirmPassword: 'Mật khẩu xác nhận không khớp'});
            toast.warning('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await changePasswordAPI({
                userId,
                oldPassword: oldPw,
                newPassword: newPw,
            });
            const payload = unwrapApiData<ChangePasswordPayload>(res);

            if (payload?.isSuccess === false) {
                const message = getChangePasswordErrorMessage(payload);
                setChangePwErrors({
                    oldPassword: payload.oldPasswordError?.trim() || undefined,
                    newPassword: payload.newPasswordError?.trim() || undefined,
                    form: message,
                });
                toast.error(message);
                return;
            }

            toast.success('Đổi mật khẩu thành công');
            setOldPw('');
            setNewPw('');
            setConfirmPw('');
            setChangePwErrors({});
            closeModal(true);
        } catch (err: any) {
            const responseData = err?.response?.data;
            const payload = responseData ? unwrapApiData<ChangePasswordPayload>(responseData) : null;
            const responseMessage = responseData?.message?.trim?.();
            const message = getChangePasswordErrorMessage(
                payload,
                responseMessage && responseMessage.toLowerCase() !== 'success'
                    ? responseMessage
                    : 'Lỗi hệ thống, vui lòng thử lại sau.',
            );
            setChangePwErrors({
                oldPassword: payload?.oldPasswordError?.trim() || undefined,
                newPassword: payload?.newPasswordError?.trim() || undefined,
                form: message,
            });
            toast.error(message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleUpdateInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUpdatingProfile) return;
        const userId = Number(authUser?.id);
        if (!userId) {
            toast.error('Không xác định được tài khoản đăng nhập');
            return;
        }

        const [firstName, ...rest] = name.trim().split(' ');
        const lastName = rest.join(' ');

        setIsUpdatingProfile(true);
        try {
            await updateUserAPI(userId, {
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                email: email || undefined,
                phoneNumber: phone || undefined,
                birthDate: dob || undefined,
                address: address || undefined,
                bio: bio || undefined,
                gender,
            });
            toast.success('Cập nhật thông tin thành công');
            // Reload profile data after update
            const res = await getUserByIdAPI(userId);
            const user = unwrapApiData<any>(res);
            setName(user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.fullName ?? ''));
            setPhone(user?.phoneNumber ?? '');
            setEmail(user?.email ?? '');
            setDob(user?.birthDate?.slice?.(0, 10) ?? '');
            setGender(normalizeGender(user?.gender));
            setAddress(user?.address ?? '');
            setBio(user?.bio ?? '');
            closeModal(true);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Cập nhật thông tin thất bại');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const displayName = name || '-';
    const displayPhone = phone || '-';
    const displayEmail = email || '-';
    const displayDob = dob ? dob.split('-').reverse().join('/') : '-';
    const displayGender = getGenderLabel(gender, t);
    return (
        <>
            <div className="pt-1 lg:pt-[19px] font-source-serif-4 flex flex-col gap-5 sm:gap-6 text-[#DED1B9]">
                <p className="font-medium text-2xl sm:text-[26px] leading-none">{t('account.info.title', 'Thông tin tài khoản')}</p>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8 lg:flex lg:justify-start lg:gap-[142px]">
                    <div className="flex flex-col gap-5 sm:gap-[28px] min-w-0 lg:min-w-[190px]">
                        <div className="flex flex-col">
                            <p className="font-sans text-base">{t('account.info.fullName', 'Họ và tên')}</p>
                            <AccountInfoValue loading={profileLoading}>{displayName}</AccountInfoValue>
                        </div>
                        <div className="flex flex-col">
                            <p className="font-sans text-base">{t('account.info.phone', 'Số điện thoại')}</p>
                            <AccountInfoValue loading={profileLoading}>{displayPhone}</AccountInfoValue>
                        </div>
                        <div className="flex flex-col">
                            <p className="font-sans text-base">{t('account.info.email', 'Email')}</p>
                            <AccountInfoValue loading={profileLoading}>{displayEmail}</AccountInfoValue>
                        </div>
                    </div>
                    <div className="flex flex-col gap-5 sm:gap-[28px] min-w-0">
                        <div className="flex flex-col">
                            <p className="font-sans text-base">{t('account.info.dob', 'Ngày tháng năm sinh')}</p>
                            <AccountInfoValue loading={profileLoading}>{displayDob}</AccountInfoValue>
                        </div>
                        <div className="flex flex-col">
                            <p className="font-sans text-base">{t('account.info.gender', 'Giới tính')}</p>
                            <AccountInfoValue loading={profileLoading}>{displayGender}</AccountInfoValue>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-stretch justify-center gap-3 pt-[3px] sm:flex-row sm:items-center sm:gap-4">
                    <button
                        onClick={() => openModal('change-password')}
                        className="border border-[#F4F0E4] w-full sm:w-auto sm:min-w-[178px] h-[40px] rounded-full cursor-pointer hover:bg-white/10 transition font-sans font-semibold text-[#F4F0E4]"
                    >
                        {t('account.info.changePassword', 'Đổi mật khẩu')}
                    </button>
                    <button
                        onClick={() => openModal('update-info')}
                        className="w-full sm:w-auto sm:min-w-[178px] h-[40px] rounded-full bg-[#7F9635] text-[#F4F0E4] cursor-pointer hover:bg-[#8DA33D] transition font-sans font-semibold"
                    >
                        {t('account.info.updateInfo', 'Cập nhật thông tin')}
                    </button>
                </div>
            </div>

            {/* ── Modal Overlay ── */}
            {isModalVisible &&
                createPortal(
                    <div
                        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-250 ${
                            isModalOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{backgroundColor: 'rgba(0,0,0,0.45)'}}
                        onClick={() => closeModal()}
                    >
                        {/* ── ĐỔI MẬT KHẨU MODAL ── */}
                        {modalType === 'change-password' && (
                            <div
                                className={`relative w-full max-w-[526px] rounded-[5px] bg-[#F4F0E4] shadow-2xl transition-all duration-300 ease-out transform overflow-hidden ${
                                    isModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => closeModal()}
                                    className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/8 transition cursor-pointer"
                                    aria-label="Đóng"
                                >
                                    <CloseIcon />
                                </button>
                                <div className="max-h-[85vh] overflow-y-auto px-5 py-7 sm:px-8 lg:px-12 lg:py-9">
                                    <ModalTitle title={t('account.info.changePassword', 'Đổi mật khẩu')} />
                                    <form
                                        onSubmit={handleChangePwSubmit}
                                        className="space-y-4"
                                        noValidate
                                    >
                                        <div>
                                            <label className={labelClass}>{t('account.info.oldPassword', 'Mật khẩu cũ')}*</label>
                                            <div className="relative">
                                                <input
                                                    type={showOldPw ? 'text' : 'password'}
                                                    placeholder={t('account.info.enterOldPassword', 'Nhập mật khẩu cũ')}
                                                    value={oldPw}
                                                    disabled={isChangingPassword}
                                                    onChange={(e) => {
                                                        setOldPw(e.target.value);
                                                        setChangePwErrors((prev) => ({
                                                            ...prev,
                                                            oldPassword: undefined,
                                                            form: undefined,
                                                        }));
                                                    }}
                                                    className={inputClass + ' pr-10'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOldPw((v) => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                                                    tabIndex={-1}
                                                >
                                                    <EyeIcon show={showOldPw} />
                                                </button>
                                            </div>
                                            {changePwErrors.oldPassword ? (
                                                <p className="mt-1 text-xs text-red-600">{changePwErrors.oldPassword}</p>
                                            ) : (
                                                <p className="mt-1 text-xs italic text-[#7F9635]">Mật khẩu gồm ít nhất 6 ký tự</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t('account.info.newPassword', 'Mật khẩu mới')}*</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPw ? 'text' : 'password'}
                                                    placeholder={t('account.info.enterNewPassword', 'Nhập mật khẩu mới')}
                                                    value={newPw}
                                                    disabled={isChangingPassword}
                                                    onChange={(e) => {
                                                        setNewPw(e.target.value);
                                                        setChangePwErrors((prev) => ({
                                                            ...prev,
                                                            newPassword: undefined,
                                                            form: undefined,
                                                        }));
                                                    }}
                                                    className={inputClass + ' pr-10'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPw((v) => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                                                    tabIndex={-1}
                                                >
                                                    <EyeIcon show={showNewPw} />
                                                </button>
                                            </div>
                                            {changePwErrors.newPassword && (
                                                <p className="mt-1 text-xs text-red-600">{changePwErrors.newPassword}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t('account.info.confirmNewPassword', 'Xác nhận mật khẩu mới')}*</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPw ? 'text' : 'password'}
                                                    placeholder={t('account.info.enterConfirmPassword', 'Nhập lại mật khẩu mới')}
                                                    value={confirmPw}
                                                    disabled={isChangingPassword}
                                                    onChange={(e) => {
                                                        setConfirmPw(e.target.value);
                                                        setChangePwErrors((prev) => ({
                                                            ...prev,
                                                            confirmPassword: undefined,
                                                            form: undefined,
                                                        }));
                                                    }}
                                                    className={inputClass + ' pr-10'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPw((v) => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                                                    tabIndex={-1}
                                                >
                                                    <EyeIcon show={showConfirmPw} />
                                                </button>
                                            </div>
                                            {changePwErrors.confirmPassword && (
                                                <p className="mt-1 text-xs text-red-600">{changePwErrors.confirmPassword}</p>
                                            )}
                                        </div>
                                        {changePwErrors.form &&
                                            !changePwErrors.oldPassword &&
                                            !changePwErrors.newPassword &&
                                            !changePwErrors.confirmPassword && (
                                                <p className="text-center text-sm text-red-600">{changePwErrors.form}</p>
                                            )}
                                        <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
                                            <button
                                                type="button"
                                                onClick={() => closeModal()}
                                                disabled={isChangingPassword}
                                                className="h-9 min-w-[96px] rounded-full border border-[#3B5518] text-[#3B5518] text-sm font-medium transition hover:bg-[#3B5518]/10 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                            >
                                                {t('account.info.cancel', 'Huỷ')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isChangingPassword}
                                                className="h-9 min-w-[120px] rounded-full bg-[#3B5518] text-[#F4F0E4] text-sm font-medium transition hover:bg-[#4A6720] disabled:cursor-wait disabled:opacity-75 cursor-pointer"
                                            >
                                                {isChangingPassword ? (
                                                    <span className="inline-flex items-center justify-center gap-2">
                                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F4F0E4]/35 border-t-[#F4F0E4]" />
                                                        {t('auth.loggingIn', 'Đang xử lý')}
                                                    </span>
                                                ) : (
                                                    t('account.info.saveChanges', 'Xác nhận')
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* ── CẬP NHẬT THÔNG TIN MODAL ── */}
                        {modalType === 'update-info' && (
                            <div
                                className={`relative w-full max-w-[526px] rounded-[5px] bg-[#F4F0E4] shadow-2xl transition-all duration-300 ease-out transform overflow-hidden ${
                                    isModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => closeModal()}
                                    className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/8 transition cursor-pointer"
                                    aria-label="Đóng"
                                >
                                    <CloseIcon />
                                </button>
                                <div className="max-h-[85vh] overflow-y-auto px-5 py-7 sm:px-8 lg:px-12 lg:py-9">
                                    <ModalTitle title={t('account.info.updateInfo', 'Cập nhật thông tin tài khoản')} />
                                    <form
                                        onSubmit={handleUpdateInfoSubmit}
                                        className="space-y-4"
                                        noValidate
                                    >
                                        <div>
                                            <label className={labelClass}>{t('account.info.fullName', 'Họ và tên')}*</label>
                                            <input
                                                type="text"
                                                placeholder={t('account.info.enterFullName', 'Nhập họ và tên')}
                                                value={name}
                                                disabled={isUpdatingProfile}
                                                onChange={(e) => setName(e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t('account.info.phone', 'Số điện thoại')}*</label>
                                            <input
                                                type="tel"
                                                placeholder={t('account.info.phone', 'Số điện thoại')}
                                                value={phone}
                                                disabled={isUpdatingProfile}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className={`${inputClass} bg-[#DDEBAA]`}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t('account.info.email', 'Email')}*</label>
                                            <input
                                                type="email"
                                                placeholder={t('account.info.email', 'Email')}
                                                value={email}
                                                disabled={isUpdatingProfile}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t('account.info.dob', 'Ngày tháng năm sinh')}*</label>
                                            <input
                                                type="date"
                                                value={dob}
                                                disabled={isUpdatingProfile}
                                                onChange={(e) => setDob(e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t('account.info.gender', 'Giới tính')}*</label>
                                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-1 text-[#3B5518]">
                                                {GENDER_OPTIONS.map((item) => (
                                                    <label
                                                        key={item.value}
                                                        className="flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <span
                                                            className={`h-[18px] w-[18px] rounded-full border border-[#3B5518] flex items-center justify-center ${
                                                                gender === item.value ? 'bg-[#7F9635]' : 'bg-transparent'
                                                            }`}
                                                        >
                                                            {gender === item.value && <span className="h-[8px] w-[8px] rounded-full bg-[#F4F0E4]" />}
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            name="gender"
                                                            value={item.value}
                                                            checked={gender === item.value}
                                                            disabled={isUpdatingProfile}
                                                            onChange={(e) => setGender(Number(e.target.value) as Gender)}
                                                            className="sr-only"
                                                        />
                                                        <span className={`px-3 py-1 ${gender === item.value ? 'bg-[#7F9635] text-[#F4F0E4]' : 'bg-[#DDEBAA]'}`}>
                                                            {getGenderLabel(item.value, t)}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
                                            <button
                                                type="button"
                                                onClick={() => closeModal()}
                                                disabled={isUpdatingProfile}
                                                className="h-9 min-w-0 sm:min-w-[205px] rounded-full border border-[#3B5518] text-[#3B5518] text-sm font-medium transition hover:bg-[#3B5518]/10 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                            >
                                                {t('account.info.cancel', 'Huỷ')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isUpdatingProfile}
                                                className="h-9 min-w-0 sm:min-w-[205px] rounded-full bg-[#3B5518] text-[#F4F0E4] text-sm font-medium transition hover:bg-[#4A6720] disabled:cursor-wait disabled:opacity-75 cursor-pointer"
                                            >
                                                {isUpdatingProfile ? (
                                                    <span className="inline-flex items-center justify-center gap-2">
                                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F4F0E4]/35 border-t-[#F4F0E4]" />
                                                        {t('auth.loggingIn', 'Đang lưu')}
                                                    </span>
                                                ) : (
                                                    t('account.info.saveChanges', 'Xác nhận')
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>,
                    document.body,
                )}
        </>
    );
};

export default ThongTinTaiKhoanTab;
