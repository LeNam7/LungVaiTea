'use client';

import { BOOKING_URL } from '@/utils/domain';
import { MENUSCONST } from '@/utils/MENUS';
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import TeaMegaMenu from './TeaMegaMenu';
import { TEA_GROUPS, normalizeSearchText, type TeaGroup } from '@/lib/tea-taxonomy';
import { fetchTeaGroups } from '@/hooks/useTeaGroups';
import { getProductsPagingAPI } from '@/api/ProductAPI';
import { unwrapPagingData } from '@/api/response';
import type { Product } from '@/types/swagger.types';
import { parseApiImageList, resolveApiImageUrl } from '@/utils/imageUrl';
import HeartIcon from '../icons/HeartIcon';
import UserIcon from '../icons/UserIcon';
import CartIcon from '../icons/CartIcon';
import Link from 'next/link';
import Image from 'next/image';
import { HEADER_LOGO } from '@/constants/brandAssets';
import { BRAND } from '@/constants/brand';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    loginThunk,
    registerThunk,
    forgotPasswordThunk,
    resetPasswordThunk,
    fetchUserThunk,
    logout,
} from '@/store/auth.store';
import { getCookie } from '@/utils/cookie';
import { useCart } from '@/hooks/useCart';
import ButtonComponent from '@/components/form/ButtonComponent';
import ModalTitle from '@/components/ui/ModalTitle';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

type ModalType = 'login' | 'register' | 'forgot-password' | 'reset-password';

const ENABLE_GOOGLE_AUTH = false;

const GoogleIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M17.64 9.2045C17.64 8.5664 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z"
            fill="#4285F4"
        />
        <path
            d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
            fill="#34A853"
        />
        <path
            d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4068 3.78409 7.83 3.96409 7.29V4.9581H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4522 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z"
            fill="#7F9635"
        />
        <path
            d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9581L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z"
            fill="#EA4335"
        />
    </svg>
);

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

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B5518" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5 -3.5" />
    </svg>
);

const PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/;

const HamburgerIcon = () => (
    <svg
        width="22"
        height="18"
        viewBox="0 0 22 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M1 1H21M1 9H21M1 17H21"
            stroke="#3B5518"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

const MenuCloseIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M1 1L17 17M17 1L1 17"
            stroke="#3B5518"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

const EyeIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
            stroke="#9CA3AF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle
            cx="12"
            cy="12"
            r="3"
            stroke="#9CA3AF"
            strokeWidth="1.8"
        />
    </svg>
);

const EyeOffIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C19 4 23 12 23 12A18.5 18.5 0 0 1 20.71 15.68M14.12 14.12A3 3 0 1 1 9.88 9.88"
            stroke="#9CA3AF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <line
            x1="1"
            y1="1"
            x2="23"
            y2="23"
            stroke="#9CA3AF"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
    </svg>
);

const HeaderClient = () => {
    const { t, locale } = useLanguage();
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const getMenuTitle = (path: string, defaultTitle: string) => {
        switch (path) {
            case '/': return t('nav.home', defaultTitle);
            case '/gioi-thieu': return t('nav.about', defaultTitle);
            case '/bo-suu-tap-cay-tra': return t('nav.teaCollections', defaultTitle);
            case '/san-pham-tra': return t('nav.teaProducts', defaultTitle);
            case BOOKING_URL: return t('nav.bookTeaRoom', defaultTitle);
            case '/lien-he': return t('nav.contact', defaultTitle);
            case '/tin-tuc': return t('nav.news', defaultTitle);
            default: return defaultTitle;
        }
    };
    const user = useAppSelector((s) => s.auth.user);
    const { totalCount } = useCart();
    const [badgePop, setBadgePop] = React.useState(false);
    const prevCount = React.useRef(totalCount);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    // Chip nhóm trà trong menu mobile: tải nhóm động khi mở menu, lỗi thì giữ 5 nhóm cũ.
    const [mobileGroups, setMobileGroups] = React.useState<TeaGroup[]>(TEA_GROUPS);
    React.useEffect(() => {
        if (!mobileMenuOpen) return;
        let cancelled = false;
        void fetchTeaGroups().then((result) => {
            if (!cancelled) setMobileGroups(result);
        });
        return () => {
            cancelled = true;
        };
    }, [mobileMenuOpen]);

    // ── Search ở header (design 10/2026 + hiệu ứng kiểu folk-form: bấm icon
    // search thì thanh search mở rộng ngay trong header, Enter thì sang trang
    // kết quả, nút X / Esc đóng lại) ──
    const [searchOpen, setSearchOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    const closeSearch = React.useCallback(() => {
        setSearchOpen(false);
    }, []);

    // ── Tìm kiếm trực tiếp ở header: mở thanh search là tải 1 lần danh sách
    // sản phẩm, gõ tới đâu lọc tới đó (theo tên, không dấu), mỗi tên chỉ hiện
    // 1 dòng kèm ảnh - bấm dòng nào sang chi tiết sản phẩm đó, Enter hoặc
    // "Xem tất cả" thì sang trang kết quả như trước. ──
    const [searchProducts, setSearchProducts] = React.useState<Product[]>([]);
    const [searchLoaded, setSearchLoaded] = React.useState(false);
    React.useEffect(() => {
        if (!searchOpen || searchLoaded) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getProductsPagingAPI({pageIndex: 1, pageSize: 100, isActive: true} as any);
                if (!cancelled) setSearchProducts(unwrapPagingData<Product>(res).data.filter((p) => p.isActive !== false));
            } catch {
                // Lỗi tải thì dropdown báo "Đang tìm kiếm...", trang kết quả vẫn lọc được.
            } finally {
                if (!cancelled) setSearchLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [searchOpen, searchLoaded]);
    const searchDropdownItems = React.useMemo(() => {
        const q = normalizeSearchText(searchQuery);
        if (!q) return [];
        const seen = new Set<string>();
        const out: Product[] = [];
        for (const p of searchProducts) {
            const name = (p.name ?? '').trim();
            const key = normalizeSearchText(name);
            if (!name || seen.has(key)) continue;
            if (!key.includes(q)) continue;
            seen.add(key);
            out.push(p);
            if (out.length >= 8) break;
        }
        return out;
    }, [searchQuery, searchProducts]);
    const searchThumb = (p: Product): string =>
        resolveApiImageUrl(parseApiImageList(p.images)[0] ?? '', '/images/shan-tuyet-tea-tree.jpg');

    React.useEffect(() => {
        if (searchOpen) searchInputRef.current?.focus();
    }, [searchOpen]);

    React.useEffect(() => {
        if (!searchOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeSearch();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [searchOpen, closeSearch]);

    const submitSearch = (event?: React.FormEvent) => {
        event?.preventDefault();
        const query = searchQuery.trim();
        setMobileMenuOpen(false);
        closeSearch();
        router.push(query ? `/san-pham-tra?q=${encodeURIComponent(query)}` : '/san-pham-tra');
    };

    // ── Mega menu hover "Sản phẩm trà" (design 10/2026) ──
    const [megaMenuOpen, setMegaMenuOpen] = React.useState(false);
    const megaCloseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const openMegaMenu = React.useCallback(() => {
        if (megaCloseTimerRef.current) clearTimeout(megaCloseTimerRef.current);
        setMegaMenuOpen(true);
    }, []);

    const scheduleCloseMegaMenu = React.useCallback(() => {
        if (megaCloseTimerRef.current) clearTimeout(megaCloseTimerRef.current);
        megaCloseTimerRef.current = setTimeout(() => setMegaMenuOpen(false), 180);
    }, []);

    React.useEffect(
        () => () => {
            if (megaCloseTimerRef.current) clearTimeout(megaCloseTimerRef.current);
        },
        [],
    );


    React.useEffect(() => {
        if (totalCount > prevCount.current) {
            setBadgePop(false);
            /* micro-delay để reset class trước khi add lại */
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setBadgePop(true));
            });
            const t = setTimeout(() => setBadgePop(false), 500);
            prevCount.current = totalCount;
            return () => clearTimeout(t);
        }
        prevCount.current = totalCount;
    }, [totalCount]);

    // Restore session from cookie on first mount
    React.useEffect(() => {
        if (user) return;
        const token = getCookie('accessToken');
        if (!token) return;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = parseInt(payload.sub, 10);
            if (userId) dispatch(fetchUserThunk(userId));
        } catch {
            // invalid / expired token - ignore
        }
    }, [dispatch, user]);

    // Track which hash section is currently visible in viewport
    const [activeHash, setActiveHash] = React.useState<string | null>(null);

    React.useEffect(() => {
        const resetFrame = requestAnimationFrame(() => setActiveHash(null));

        const hashMenus = MENUSCONST.filter((m) => m.path.includes('#'));
        if (hashMenus.length === 0) return;

        const observers: IntersectionObserver[] = [];

        hashMenus.forEach((menu) => {
            const hash = menu.path.split('#')[1];
            const el = document.getElementById(hash);
            if (!el) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setActiveHash(hash);
                    } else {
                        setActiveHash((prev) => (prev === hash ? null : prev));
                    }
                },
                { threshold: 0.3 },
            );
            observer.observe(el);
            observers.push(observer);
        });

        return () => {
            cancelAnimationFrame(resetFrame);
            observers.forEach((o) => o.disconnect());
        };
    }, [pathname]);

    const localizePath = (path: string) => {
        if (locale === 'en') {
            return `/en${path === '/' ? '' : path}`;
        }
        return path;
    };

    const isMenuActive = (menuPath: string) => {
        const cleanPathname = pathname === '/en' ? '/' : (pathname.startsWith('/en/') ? pathname.slice(3) : pathname);
        if (menuPath.includes('#')) {
            const hash = menuPath.split('#')[1];
            return activeHash === hash;
        }
        const page = menuPath || '/';
        // Nếu đang có hash section active thì không active route '/'
        if (page === '/') return cleanPathname === '/' && !activeHash;
        return cleanPathname === page || cleanPathname.startsWith(page + '/');
    };

    const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        const cleanPathname = pathname === '/en' ? '/' : (pathname.startsWith('/en/') ? pathname.slice(3) : pathname);
        if (path === '/') {
            if (cleanPathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.history.replaceState(null, '', locale === 'en' ? '/en' : '/');
                setActiveHash(null);
            }
            return;
        }
        if (!path.includes('#')) return;
        const [pagePath, hash] = path.split('#');
        const targetPage = pagePath || '/';
        if (cleanPathname === targetPage) {
            e.preventDefault();
            const target = document.getElementById(hash);
            if (!target) return;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.pushState(null, '', `${locale === 'en' ? '/en' : ''}${targetPage === '/' ? '' : targetPage}#${hash}`);
        }
    };

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<ModalType>('login');
    const modalVisibilityTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const modalFlowTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleModalVisibility = React.useCallback((callback: () => void, delay: number) => {
        if (modalVisibilityTimerRef.current) clearTimeout(modalVisibilityTimerRef.current);
        modalVisibilityTimerRef.current = setTimeout(() => {
            modalVisibilityTimerRef.current = null;
            callback();
        }, delay);
    }, []);

    const scheduleModalFlow = React.useCallback((callback: () => void, delay: number) => {
        if (modalFlowTimerRef.current) clearTimeout(modalFlowTimerRef.current);
        modalFlowTimerRef.current = setTimeout(() => {
            modalFlowTimerRef.current = null;
            callback();
        }, delay);
    }, []);

    React.useEffect(
        () => () => {
            if (modalVisibilityTimerRef.current) clearTimeout(modalVisibilityTimerRef.current);
            if (modalFlowTimerRef.current) clearTimeout(modalFlowTimerRef.current);
        },
        [],
    );

    // Password visibility state
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [showRegPw, setShowRegPw] = useState(false);
    const [showRegConfirmPw, setShowRegConfirmPw] = useState(false);
    const [showResetPw, setShowResetPw] = useState(false);
    const [showResetConfirmPw, setShowResetConfirmPw] = useState(false);

    // Login state
    const [loginPhone, setLoginPhone] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginPhoneError, setLoginPhoneError] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginServerError, setLoginServerError] = useState('');

    // Register state
    const [regName, setRegName] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [regPhoneError, setRegPhoneError] = useState(false);
    const [regFieldError, setRegFieldError] = useState('');
    const [regAgreed, setRegAgreed] = useState(false);
    const [regAgreedError, setRegAgreedError] = useState('');
    const [regLoading, setRegLoading] = useState(false);
    const [regServerError, setRegServerError] = useState('');
    const [regSuccess, setRegSuccess] = useState(false);

    // Forgot password state (email-based)
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotEmailError, setForgotEmailError] = useState(false);
    const [forgotEmailForReset, setForgotEmailForReset] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotServerError, setForgotServerError] = useState('');

    // Reset password (OTP) state
    const [otpCode, setOtpCode] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetServerError, setResetServerError] = useState('');

    React.useEffect(() => {
        const handler = () => {
            setModalType('login');
            setLoginServerError('');
            setRegServerError('');
            setForgotServerError('');
            setResetServerError('');
            setRegAgreedError('');
            setRegFieldError('');
            setRegSuccess(false);
            setIsModalVisible(true);
            scheduleModalVisibility(() => setIsModalOpen(true), 20);
        };
        window.addEventListener('open-auth-modal', handler);
        return () => window.removeEventListener('open-auth-modal', handler);
    }, [scheduleModalVisibility]);

    const openModal = (type: ModalType) => {
        setModalType(type);
        setLoginServerError('');
        setRegServerError('');
        setForgotServerError('');
        setResetServerError('');
        setRegAgreedError('');
        setRegFieldError('');
        setRegSuccess(false);
        setIsModalVisible(true);
        scheduleModalVisibility(() => setIsModalOpen(true), 20);
    };

    const switchModal = (type: ModalType) => {
        setLoginServerError('');
        setRegServerError('');
        setForgotServerError('');
        setResetServerError('');
        setRegAgreedError('');
        setRegFieldError('');
        setRegSuccess(false);
        setModalType(type);
    };

    const closeModal = React.useCallback(() => {
        setIsModalOpen(false);
        scheduleModalVisibility(() => setIsModalVisible(false), 250);
    }, [scheduleModalVisibility]);

    React.useEffect(() => {
        if (!isModalVisible) return;

        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusFrame = requestAnimationFrame(() => {
            const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
            const preferredField = dialog?.querySelector<HTMLElement>('input, select, textarea');
            const fallbackControl = dialog?.querySelector<HTMLElement>('button, a[href]');
            (preferredField ?? fallbackControl)?.focus();
        });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeModal();
                return;
            }

            if (event.key !== 'Tab') return;
            const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
            if (!dialog) return;
            const focusable = Array.from(
                dialog.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            ).filter((element) => element.offsetParent !== null);
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, [closeModal, isModalVisible, modalType]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loginLoading) return;
        const phoneErr = !PHONE_REGEX.test(loginPhone);
        setLoginPhoneError(phoneErr);
        if (phoneErr || !loginPassword.trim()) {
            setLoginServerError(phoneErr ? 'Số điện thoại không hợp lệ' : 'Vui lòng nhập mật khẩu');
            return;
        }
        setLoginLoading(true);
        setLoginServerError('');
        try {
            const result = await dispatch(loginThunk({ phoneNumber: loginPhone, password: loginPassword })).unwrap();
            await dispatch(fetchUserThunk(result.data.userId));
            closeModal();
        } catch (err: any) {
            setLoginServerError(err ?? 'Đăng nhập thất bại');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (regLoading) return;
        const trimmedName = regName.trim();
        const trimmedEmail = regEmail.trim();
        const phoneErr = !PHONE_REGEX.test(regPhone);
        setRegPhoneError(phoneErr);
        if (!trimmedName) {
            setRegFieldError('Vui lòng nhập họ và tên');
            return;
        }
        if (phoneErr) {
            setRegFieldError('Số điện thoại không hợp lệ');
            return;
        }
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setRegFieldError('Email không hợp lệ');
            return;
        }
        if (regPassword.length < 8 || regPassword.trim() !== regPassword) {
            setRegFieldError('Mật khẩu phải có ít nhất 8 ký tự và không có khoảng trắng đầu/cuối');
            return;
        }
        if (regPassword !== regConfirmPassword) {
            setRegFieldError('Xác nhận mật khẩu chưa khớp');
            return;
        }
        if (!regAgreed) {
            setRegAgreedError('Vui lòng đồng ý với điều khoản và chính sách trước khi đăng ký');
            return;
        }
        setRegLoading(true);
        setRegServerError('');
        setRegAgreedError('');
        setRegFieldError('');
        setRegSuccess(false);
        try {
            await dispatch(
                registerThunk({
                    phoneNumber: regPhone,
                    email: regEmail,
                    fullName: regName,
                    password: regPassword,
                }),
            ).unwrap();
            setRegSuccess(true);
            scheduleModalFlow(() => switchModal('login'), 1800);
        } catch (err: any) {
            setRegServerError(err ?? 'Đăng ký thất bại');
        } finally {
            setRegLoading(false);
        }
    };

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailErr = !EMAIL_REGEX.test(forgotEmail);
        setForgotEmailError(emailErr);
        if (emailErr) return;
        setForgotLoading(true);
        setForgotServerError('');
        try {
            await dispatch(forgotPasswordThunk({ email: forgotEmail })).unwrap();
            setForgotEmailForReset(forgotEmail);
            switchModal('reset-password');
        } catch (err: any) {
            setForgotServerError(err ?? 'Gửi mã OTP thất bại');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode || !resetNewPassword || resetNewPassword !== resetConfirmPassword) {
            setResetServerError('Vui lòng kiểm tra lại thông tin.');
            return;
        }
        setResetLoading(true);
        setResetServerError('');
        try {
            await dispatch(
                resetPasswordThunk({
                    email: forgotEmailForReset,
                    otpCode,
                    newPassword: resetNewPassword,
                }),
            ).unwrap();
            switchModal('login');
        } catch (err: any) {
            setResetServerError(err ?? 'Đặt lại mật khẩu thất bại');
        } finally {
            setResetLoading(false);
        }
    };

    const inputClass = 'seeme-input px-3 py-2.5 text-sm';

    const labelClass = 'mb-1 block text-sm font-medium text-seeme-accent';

    return (
        <>
            {/* ── Header ── */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-[#ddd1b9] font-semibold border-b border-[#3B5518]/10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="mx-auto flex h-[60px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:h-[70px] lg:px-6 xl:px-8 2xl:px-[50px]">
                <Link
                    href={locale === 'en' ? '/en' : '/'}
                    aria-label={`${BRAND.name} - ${t('nav.home', 'Trang chủ')}`}
                    className="flex shrink-0 items-center justify-center p-0.5 transition-opacity hover:opacity-85"
                    onClick={() => {
                        const cleanPath = pathname === '/en' ? '/' : (pathname.startsWith('/en/') ? pathname.slice(3) : pathname);
                        if (cleanPath === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <Image
                        src={HEADER_LOGO}
                        alt={`${BRAND.name} Logo`}
                        width={180}
                        height={40}
                        priority
                        className="h-[34px] w-auto object-contain lg:h-[36px] xl:h-[40px]"
                    />
                </Link>
                {/* Desktop nav: 3 khối logo / menu / nút phải dàn đều bằng
                    justify-between của container - menu nằm giữa logo và
                    cụm nút (đúng vị trí Figma), cụm nút sát mép phải. */}
                <div className="hidden shrink-0 items-center justify-center lg:flex">
                    <div className="flex items-center justify-center gap-3.5 xl:gap-6 2xl:gap-8">
                        {MENUSCONST.map((menu, index) => {
                            const active = isMenuActive(menu.path);
                            if (menu.path === '/san-pham-tra') {
                                return (
                                    <div
                                        key={index}
                                        onMouseEnter={openMegaMenu}
                                        onMouseLeave={scheduleCloseMegaMenu}
                                    >
                                        <Link
                                            href={localizePath(menu.path)}
                                            onClick={(e) => handleMenuClick(e, menu.path)}
                                            className={`nav-link cursor-pointer text-xs xl:text-sm whitespace-nowrap transition-colors duration-200 ${active
                                                ? 'text-[#3b5518] font-semibold nav-link-active'
                                                : 'text-[#3b5518] font-normal'
                                                }`}
                                        >
                                            {getMenuTitle(menu.path, menu.title)}
                                        </Link>
                                        <TeaMegaMenu open={megaMenuOpen} onNavigate={() => setMegaMenuOpen(false)} />
                                    </div>
                                );
                            }
                            return (
                                <Link
                                    href={localizePath(menu.path)}
                                    onClick={(e) => handleMenuClick(e, menu.path)}
                                    className={`nav-link cursor-pointer text-xs xl:text-sm whitespace-nowrap transition-colors duration-200 ${active
                                        ? 'text-[#3b5518] font-semibold nav-link-active'
                                        : 'text-[#3b5518] font-normal'
                                        }`}
                                    key={index}
                                >
                                    {getMenuTitle(menu.path, menu.title)}
                                </Link>
                            );
                        })}
                    </div>
                </div>
                {/* Cụm nút phải desktop: tìm kiếm + tài khoản + giỏ, sát mép phải */}
                <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3 2xl:gap-4">
                    <button
                        type="button"
                        onClick={() => setSearchOpen((v) => !v)}
                        aria-label="Tìm kiếm sản phẩm trà"
                        className="flex h-8 w-8 xl:h-9 xl:w-9 cursor-pointer items-center justify-center rounded-full transition hover:bg-[#3B5518]/10"
                    >
                        <SearchIcon />
                    </button>
                    <div className="flex items-center justify-center gap-2 xl:gap-3 2xl:gap-4">
                        {user ? (
                            <div className="flex items-center gap-2 xl:gap-2.5">
                                <span className="text-[#3B5518] text-xs xl:text-sm font-normal max-w-[85px] xl:max-w-[130px] truncate" title={user.firstName || user.userName || 'Khách'}>
                                    {t('auth.hello', 'Xin chào')}, {user.firstName || user.userName || 'Khách'}
                                </span>
                                <button
                                    onClick={() => dispatch(logout())}
                                    className="bg-transparent border border-[#3B5518] text-[#3B5518] text-xs px-2.5 py-1 xl:px-3.5 xl:py-1 rounded-full font-medium transition hover:bg-[#3B5518]/10 cursor-pointer whitespace-nowrap"
                                >
                                    {t('auth.logout', 'Đăng xuất')}
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => openModal('register')}
                                    className="bg-transparent border border-[#3B5518] text-[#3B5518] text-xs px-3 py-1 xl:px-4 xl:py-1.5 rounded-full font-medium transition hover:bg-[#3B5518]/10 cursor-pointer whitespace-nowrap"
                                >
                                    {t('nav.register', 'Đăng ký')}
                                </button>
                                <button
                                    onClick={() => openModal('login')}
                                    className="bg-[#3B5518] border border-[#3B5518] text-[#DED1B9] text-xs px-3 py-1 xl:px-4 xl:py-1.5 rounded-full font-medium transition hover:bg-[#4A6720] cursor-pointer whitespace-nowrap"
                                >
                                    {t('nav.login', 'Đăng nhập')}
                                </button>
                            </>
                        )}
                        {user && (
                            <Link
                                href={localizePath('/thong-tin-tai-khoan?tab=yeu-thich')}
                                aria-label="Sản phẩm yêu thích"
                                className="cursor-pointer shrink-0"
                            >
                                <HeartIcon />
                            </Link>
                        )}
                        {user && (
                            <Link href={localizePath('/thong-tin-tai-khoan')} className="shrink-0">
                                <UserIcon />
                            </Link>
                        )}
                        <div className="shrink-0">
                            <LanguageSwitcher />
                        </div>
                        <Link
                            href={localizePath('/gio-hang')}
                            aria-label="Giỏ hàng"
                            className="relative shrink-0"
                        >
                            <CartIcon />
                            {totalCount > 0 && (
                                <span
                                    className={`absolute -top-2 -right-2 min-w-4.5 h-4.5 rounded-full bg-[#7F9635] text-white text-[10px] font-bold flex items-center justify-center px-1 ${badgePop ? 'cart-badge-pop' : ''}`}
                                >
                                    {totalCount > 99 ? '99+' : totalCount}
                                </span>
                            )}
                        </Link>
                        <a
                            href={BOOKING_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-[#3B5518] px-2.5 py-1 text-xs font-semibold text-[#DED1B9] shadow-sm transition hover:bg-[#4A6720] hover:text-white shrink-0 cursor-pointer xl:gap-1.5 xl:px-3.5 xl:py-1.5 whitespace-nowrap"
                        >
                            <span>{t('nav.bookTeaRoom', 'Đặt phòng trà')}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                        </a>
                    </div>
                </div>
                {/* Mobile: cart + hamburger */}
                <div className="flex lg:hidden items-center gap-2 sm:gap-3">
                    <LanguageSwitcher />
                    <Link
                        href={localizePath('/gio-hang')}
                        aria-label="Giỏ hàng"
                        className="cursor-pointer relative"
                    >
                        <CartIcon />
                        {totalCount > 0 && (
                            <span
                                className={`absolute -top-2 -right-2 min-w-4.5 h-4.5 rounded-full bg-[#7F9635] text-white text-[10px] font-bold flex items-center justify-center px-1 ${badgePop ? 'cart-badge-pop' : ''}`}
                            >
                                {totalCount > 99 ? '99+' : totalCount}
                            </span>
                        )}
                    </Link>
                    <button
                        type="button"
                        onClick={() => setSearchOpen((v) => !v)}
                        aria-label="Tìm kiếm sản phẩm trà"
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full"
                    >
                        <SearchIcon />
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen((v) => !v)}
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full"
                        aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                    >
                        {mobileMenuOpen ? <MenuCloseIcon /> : <HamburgerIcon />}
                    </button>
                </div>
                </div>
                {/* Thanh search mở rộng trong header (design 10/2026) */}
                {searchOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#ddd1b9] px-[5%]">
                        <form
                            onSubmit={submitSearch}
                            role="search"
                            className="flex w-full max-w-[623px] items-center gap-2 rounded-[5px] bg-[#d1c2a6] px-4 py-1"
                        >
                            <input
                                ref={searchInputRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm sản phẩm trà"
                                aria-label="Tìm kiếm sản phẩm trà"
                                className="h-8 min-w-0 flex-1 bg-transparent text-sm text-[#3B5518] outline-none placeholder:text-[#3B5518]/70"
                            />
                            <button
                                type="submit"
                                aria-label="Tìm kiếm"
                                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-[#3B5518]/10"
                            >
                                <SearchIcon />
                            </button>
                        </form>
                        <button
                            type="button"
                            onClick={closeSearch}
                            aria-label="Đóng tìm kiếm"
                            className="ml-3 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-xl leading-none text-[#3B5518] hover:bg-[#3B5518]/10"
                        >
                            ×
                        </button>
                        {searchQuery.trim() && (
                            <div className="absolute left-1/2 top-full z-50 w-[min(720px,94vw)] -translate-x-1/2 pt-2">
                                <div className="seeme-menu-pop max-h-[70vh] overflow-y-auto rounded-lg bg-white p-2 shadow-[0_16px_40px_rgba(47,68,19,0.25)]">
                                    <p className="px-3 pb-1 pt-2 text-xs font-semibold tracking-wide text-[#3B5518]/70">
                                        SẢN PHẨM
                                    </p>
                                    {searchDropdownItems.length === 0 ? (
                                        <p className="px-3 py-3 text-sm text-[#3B5518]/70">
                                            {searchLoaded
                                                ? `Không tìm thấy sản phẩm nào cho “${searchQuery.trim()}”.`
                                                : 'Đang tìm kiếm...'}
                                        </p>
                                    ) : (
                                        <ul className="divide-y divide-[#7F9635]/10">
                                            {searchDropdownItems.map((p) => (
                                                <li key={p.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            closeSearch();
                                                            router.push(`/san-pham-tra/${p.id}`);
                                                        }}
                                                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[#F1EEE0]"
                                                    >
                                                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[#F1EEE0]">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={searchThumb(p)}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                                onError={(e) => {
                                                                    const img = e.currentTarget;
                                                                    img.onerror = null;
                                                                    img.src = '/images/shan-tuyet-tea-tree.jpg';
                                                                }}
                                                            />
                                                        </span>
                                                        <span className="line-clamp-2 min-w-0 text-sm font-medium leading-snug text-[#3B5518]">{p.name}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => submitSearch()}
                                        className="mt-1 w-full cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-semibold text-[#7B943E] hover:bg-[#F1EEE0]"
                                    >
                                        Xem tất cả kết quả cho “{searchQuery.trim()}”
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Mobile menu drawer */}
            <div
                className={`lg:hidden fixed top-[60px] left-0 right-0 z-30 bg-[#DED1B9] shadow-xl flex flex-col px-6 pt-4 pb-6 gap-1 transition-all duration-300 ease-out ${mobileMenuOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto max-h-[90vh]'
                    : 'opacity-0 -translate-y-3 pointer-events-none max-h-0 overflow-hidden'
                    }`}
            >
                <form
                    onSubmit={submitSearch}
                    role="search"
                    className="mb-2 flex items-center gap-2 rounded-lg bg-[#d1c2a6] px-3 py-1"
                >
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('nav.searchPlaceholder', 'Tìm kiếm sản phẩm trà...')}
                        aria-label="Tìm kiếm sản phẩm trà"
                        className="h-9 min-w-0 flex-1 bg-transparent text-sm text-[#3B5518] outline-none placeholder:text-[#3B5518]/70"
                    />
                    <button
                        type="submit"
                        aria-label="Tìm kiếm"
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center"
                    >
                        <SearchIcon />
                    </button>
                </form>
                {MENUSCONST.map((menu, index) => {
                    const active = isMenuActive(menu.path);
                    return (
                        <React.Fragment key={index}>
                            <Link
                                href={localizePath(menu.path)}
                                onClick={(e) => {
                                    handleMenuClick(e, menu.path);
                                    setMobileMenuOpen(false);
                                }}
                                className={`text-base py-3 border-b border-[#3B5518]/20 last:border-none transition-colors duration-200 ${active ? 'text-[#3B5518] font-semibold' : 'text-[#3B5518] font-normal'
                                    }`}
                                style={{ animationDelay: `${index * 40}ms` }}
                            >
                                {getMenuTitle(menu.path, menu.title)}
                            </Link>
                            {menu.path === '/san-pham-tra' && (
                                <div className="flex flex-wrap gap-2 pb-3">
                                    {mobileGroups.map((group) => (
                                        <Link
                                            key={group.id}
                                            href={localizePath(`/san-pham-tra?group=${group.id}`)}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="rounded-full border border-[#3B5518]/40 px-3 py-1 text-xs font-medium text-[#3B5518]"
                                        >
                                            {t(`teaGroups.${group.id}`, group.name)}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
                <div className="pt-3 pb-1">
                    <a
                        href={BOOKING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl bg-[#3B5518] px-4 py-2.5 text-sm font-semibold text-[#DED1B9] shadow-sm transition hover:bg-[#4A6720] hover:text-white"
                    >
                        <span>{t('nav.bookTeaRoom', 'Đặt phòng trà')}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </a>
                </div>
                <div className="flex items-center gap-3 pt-4">
                    {user ? (
                        <div className="flex items-center gap-3 w-full">
                            <span className="text-[#3B5518] text-sm font-normal flex-1">
                                {t('auth.hello', 'Xin chào')}, {user.firstName || user.userName || 'Bạn'}
                            </span>
                            <button
                                onClick={() => {
                                    dispatch(logout());
                                    setMobileMenuOpen(false);
                                }}
                                className="min-h-11 bg-transparent border border-[#3B5518] text-[#3B5518] text-sm px-4 py-2 rounded-full font-medium transition cursor-pointer"
                            >
                                {t('auth.logout', 'Đăng xuất')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    openModal('register');
                                    setMobileMenuOpen(false);
                                }}
                                className="min-h-11 flex-1 bg-transparent border border-[#3B5518] text-[#3B5518] text-sm px-5 py-2 rounded-full font-medium transition cursor-pointer"
                            >
                                {t('auth.register', 'Đăng ký')}
                            </button>
                            <button
                                onClick={() => {
                                    openModal('login');
                                    setMobileMenuOpen(false);
                                }}
                                className="min-h-11 flex-1 bg-[#3B5518] text-[#DED1B9] text-sm px-5 py-2 rounded-full font-medium transition cursor-pointer"
                            >
                                {t('auth.login', 'Đăng nhập')}
                            </button>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-5 pt-3">
                    {user && (
                        <Link
                            href="/thong-tin-tai-khoan?tab=yeu-thich"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label="Sản phẩm yêu thích"
                            className="cursor-pointer"
                        >
                            <HeartIcon />
                        </Link>
                    )}
                    {user && (
                        <Link
                            href="/thong-tin-tai-khoan"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <UserIcon />
                        </Link>
                    )}
                </div>
            </div>

            {/* ── Modal Overlay ── */}
            {isModalVisible && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-250 ${isModalOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{ backgroundColor: 'rgba(0,0,0,0.50)' }}
                    onClick={closeModal}
                >
                    {/* ── LOGIN MODAL ── */}
                    {modalType === 'login' && (
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="auth-login-title"
                            className={`relative w-full max-w-110 rounded-2xl bg-[#F4F0E4] shadow-2xl transition-all duration-300 ease-out transform overflow-hidden ${isModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={closeModal}
                                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/8 transition cursor-pointer"
                                aria-label="Đóng"
                            >
                                <CloseIcon />
                            </button>

                            <div className="px-8 py-7">
                                <ModalTitle id="auth-login-title" title={t('auth.loginTitle', 'Đăng nhập')} />

                                {ENABLE_GOOGLE_AUTH && (
                                    <>
                                        {/* Google */}
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#f8f8f0] py-2.5 text-sm font-medium text-[#3b5518] shadow-xs transition hover:bg-gray-50 active:scale-[0.99] cursor-pointer"
                                        >
                                            <GoogleIcon />
                                            Đăng nhập bằng Google Mail
                                        </button>

                                        {/* Divider */}
                                        <div className="my-4 flex items-center gap-3">
                                            <div className="h-px flex-1 bg-[#7b953e]" />
                                            <span className="text-xs text-[#7b953e] whitespace-nowrap">
                                                {t('auth.orPhone', 'hoặc đăng nhập bằng số điện thoại')}
                                            </span>
                                            <div className="h-px flex-1 bg-[#7b953e]" />
                                        </div>
                                    </>
                                )}

                                <form
                                    onSubmit={handleLoginSubmit}
                                    className="space-y-4"
                                    noValidate
                                >
                                    {/* Phone */}
                                    <div>
                                        <label className={labelClass}>
                                            {t('auth.phone', 'Số điện thoại')}<span className="text-seeme-accent">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder={t('auth.enterPhone', 'Nhập số điện thoại')}
                                            value={loginPhone}
                                            onChange={(e) => {
                                                setLoginPhone(e.target.value);
                                                setLoginPhoneError(false);
                                            }}
                                            className={`${inputClass} ${loginPhoneError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                                        />
                                        {loginPhoneError && (
                                            <p className="mt-1 text-xs text-[#DC2626]">
                                                {t('auth.invalidPhone', 'Vui lòng nhập đúng định dạng số điện thoại')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <label className={labelClass}>
                                                {t('auth.password', 'Mật khẩu')}<span className="text-seeme-accent">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => switchModal('forgot-password')}
                                                className="text-xs text-[#7B943E] hover:underline cursor-pointer"
                                            >
                                                {t('auth.forgotPassword', 'Quên mật khẩu?')}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showLoginPw ? 'text' : 'password'}
                                                placeholder={t('auth.enterPassword', 'Nhập mật khẩu')}
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                className={`${inputClass} pr-10`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowLoginPw((v) => !v)}
                                                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center"
                                                aria-label={showLoginPw ? t('auth.hidePassword', 'Ẩn mật khẩu') : t('auth.showPassword', 'Hiện mật khẩu')}
                                            >
                                                {showLoginPw ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember */}
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="h-4 w-4 accent-[#7B943E] cursor-pointer"
                                        />
                                        <span className="text-sm text-[#7B943E]">{t('auth.rememberMe', 'Lưu tài khoản')}</span>
                                    </label>

                                    {loginServerError && (
                                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                                            {loginServerError}
                                        </div>
                                    )}

                                    <ButtonComponent
                                        type="submit"
                                        loading={loginLoading}
                                        shape="rounded"
                                        className="w-full py-2.5"
                                        title={loginLoading ? t('auth.loggingIn', 'Đang đăng nhập...') : t('auth.loginTitle', 'Đăng nhập')}
                                    />
                                </form>

                                <p className="mt-4 text-center text-sm text-[#7B943E]">
                                    {t('auth.noAccount', 'Bạn chưa có tài khoản?')}{' '}
                                    <button
                                        onClick={() => switchModal('register')}
                                        className="font-medium text-[#7B943E] underline italic cursor-pointer"
                                    >
                                        {t('auth.registerNow', 'Đăng ký ngay')}
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── REGISTER MODAL ── */}
                    {modalType === 'register' && (
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="auth-register-title"
                            className={`relative w-full max-w-110 rounded-2xl bg-[#F4F0E4] shadow-2xl transition-all duration-300 ease-out transform overflow-hidden ${isModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={closeModal}
                                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/8 transition cursor-pointer"
                                aria-label="Đóng"
                            >
                                <CloseIcon />
                            </button>

                            <div className="px-8 py-7 max-h-[90vh] overflow-y-auto">
                                <ModalTitle id="auth-register-title" title={t('auth.registerTitle', 'Đăng ký')} />

                                {ENABLE_GOOGLE_AUTH && (
                                    <>
                                        {/* Google */}
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#f8f8f0] py-2.5 text-sm font-medium text-[#3b5518] shadow-xs transition hover:bg-gray-50 active:scale-[0.99] cursor-pointer"
                                        >
                                            <GoogleIcon />
                                            Đăng nhập bằng Google Mail
                                        </button>

                                        {/* Divider */}
                                        <div className="my-4 flex items-center gap-3">
                                            <div className="h-px flex-1 bg-[#7b953e]" />
                                            <span className="text-xs text-[#7b953e] whitespace-nowrap">
                                                {t('auth.orPhone', 'hoặc đăng ký bằng số điện thoại')}
                                            </span>
                                            <div className="h-px flex-1 bg-[#7b953e]" />
                                        </div>
                                    </>
                                )}

                                <form
                                    onSubmit={handleRegisterSubmit}
                                    className="space-y-4"
                                    noValidate
                                >
                                    {/* Full name */}
                                    <div>
                                        <label className={labelClass}>
                                            {t('auth.fullName', 'Họ và tên')}<span className="text-seeme-accent">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={t('auth.enterFullName', 'Nhập họ và tên')}
                                            value={regName}
                                            onChange={(e) => {
                                                setRegName(e.target.value);
                                                setRegFieldError('');
                                            }}
                                            className={inputClass}
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className={labelClass}>
                                            {t('auth.phone', 'Số điện thoại')}<span className="text-seeme-accent">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder={t('auth.enterPhone', 'Nhập số điện thoại')}
                                            value={regPhone}
                                            onChange={(e) => {
                                                setRegPhone(e.target.value);
                                                setRegPhoneError(false);
                                            }}
                                            className={`${inputClass} ${regPhoneError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                                        />
                                        {regPhoneError && (
                                            <p className="mt-1 text-xs text-[#DC2626]">
                                                {t('auth.invalidPhone', 'Vui lòng nhập đúng định dạng số điện thoại')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className={labelClass}>
                                            {t('auth.email', 'Email')}<span className="text-seeme-accent">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder={t('auth.enterEmail', 'Nhập email')}
                                            value={regEmail}
                                            onChange={(e) => {
                                                setRegEmail(e.target.value);
                                                setRegFieldError('');
                                            }}
                                            className={inputClass}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className={labelClass}>
                                            {t('auth.password', 'Mật khẩu')}<span className="text-seeme-accent">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showRegPw ? 'text' : 'password'}
                                                placeholder={t('auth.enterPassword', 'Nhập mật khẩu')}
                                                value={regPassword}
                                                onChange={(e) => {
                                                    setRegPassword(e.target.value);
                                                    setRegFieldError('');
                                                }}
                                                className={`${inputClass} pr-10`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegPw((v) => !v)}
                                                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center"
                                                aria-label={showRegPw ? t('auth.hidePassword', 'Ẩn mật khẩu') : t('auth.showPassword', 'Hiện mật khẩu')}
                                            >
                                                {showRegPw ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm password */}
                                    <div>
                                        <label className={labelClass}>
                                            {t('auth.confirmPassword', 'Xác nhận mật khẩu')}<span className="text-seeme-accent">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showRegConfirmPw ? 'text' : 'password'}
                                                placeholder={t('auth.enterConfirmPassword', 'Nhập mật khẩu')}
                                                value={regConfirmPassword}
                                                onChange={(e) => {
                                                    setRegConfirmPassword(e.target.value);
                                                    setRegFieldError('');
                                                }}
                                                className={`${inputClass} pr-10`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegConfirmPw((v) => !v)}
                                                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center"
                                                aria-label={showRegConfirmPw ? t('auth.hidePassword', 'Ẩn mật khẩu xác nhận') : t('auth.showPassword', 'Hiện mật khẩu xác nhận')}
                                            >
                                                {showRegConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Terms checkbox */}
                                    <label className="flex cursor-pointer items-start gap-2.5">
                                        <input
                                            type="checkbox"
                                            checked={regAgreed}
                                            onChange={(e) => {
                                                setRegAgreed(e.target.checked);
                                                if (e.target.checked) setRegAgreedError('');
                                            }}
                                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#7B943E] cursor-pointer"
                                        />
                                        <span className="text-xs text-[#7B943E] leading-relaxed">
                                            {t('auth.agreeTerms', 'Bằng việc đăng ký tài khoản, bạn đồng ý với')}{' '}
                                            <a
                                                href="/dieu-khoan-su-dung"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline italic"
                                            >
                                                {t('auth.termsAndConditions', 'Điều khoản và Điều kiện')}
                                            </a>{' '}
                                            và{' '}
                                            <a
                                                href="/chinh-sach-bao-mat"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline italic"
                                            >
                                                Chính sách An toàn và Bảo mật
                                            </a>{' '}
                                            của chúng tôi.
                                        </span>
                                    </label>
                                    {regAgreedError && <p className="-mt-2 text-xs text-[#DC2626]">{regAgreedError}</p>}
                                    {regFieldError && <p className="-mt-2 text-xs text-[#DC2626]">{regFieldError}</p>}

                                    {regSuccess && (
                                        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                                            Đăng ký thành công! Đang chuyển sang đăng nhập...
                                        </div>
                                    )}
                                    {regServerError && (
                                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                                            {regServerError}
                                        </div>
                                    )}

                                    <ButtonComponent
                                        type="submit"
                                        loading={regLoading}
                                        shape="rounded"
                                        className="w-full py-2.5"
                                        title={regLoading ? t('auth.registering', 'Đang đăng ký...') : t('auth.registerTitle', 'Đăng ký')}
                                    />
                                </form>

                                <p className="mt-4 text-center text-sm text-[#7B943E]">
                                    {t('auth.hasAccount', 'Bạn đã có tài khoản?')}{' '}
                                    <button
                                        onClick={() => switchModal('login')}
                                        className="font-medium text-[#7B943E] underline italic cursor-pointer"
                                    >
                                        {t('auth.loginNow', 'Đăng nhập ngay')}
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── FORGOT PASSWORD MODAL ── */}
                    {modalType === 'forgot-password' && (
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="auth-forgot-title"
                            className={`relative w-full max-w-110 rounded-2xl bg-[#F4F0E4] shadow-2xl transition-all duration-300 ease-out transform overflow-hidden ${isModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={closeModal}
                                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/8 transition cursor-pointer"
                                aria-label="Đóng"
                            >
                                <CloseIcon />
                            </button>

                            <div className="px-7 py-7">
                                <ModalTitle id="auth-forgot-title" title="Quên mật khẩu" />
                                <p className="text-center text-sm text-gray-500 mb-6">
                                    Nhập email để nhận mã OTP đặt lại mật khẩu.
                                </p>

                                <form
                                    onSubmit={handleForgotSubmit}
                                    className="space-y-5"
                                    noValidate
                                >
                                    {/* Email */}
                                    <div>
                                        <label className={labelClass}>
                                            Email<span className="text-seeme-accent">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="Nhập email"
                                            value={forgotEmail}
                                            onChange={(e) => {
                                                setForgotEmail(e.target.value);
                                                setForgotEmailError(false);
                                            }}
                                            className={`${inputClass} ${forgotEmailError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                                        />
                                        {forgotEmailError && (
                                            <p className="mt-1 text-xs text-[#DC2626]">
                                                Vui lòng nhập đúng định dạng email
                                            </p>
                                        )}
                                    </div>

                                    {forgotServerError && (
                                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                                            {forgotServerError}
                                        </div>
                                    )}

                                    <ButtonComponent
                                        type="submit"
                                        loading={forgotLoading}
                                        shape="rounded"
                                        className="w-full py-2.5"
                                        title={forgotLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                                    />
                                </form>

                                <p className="mt-5 text-center text-sm text-[#7B943E]">
                                    Quay trở lại{' '}
                                    <button
                                        onClick={() => switchModal('login')}
                                        className="font-medium text-[#7B943E] italic underline cursor-pointer"
                                    >
                                        Đăng nhập
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── RESET PASSWORD MODAL ── */}
                    {modalType === 'reset-password' && (
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="auth-reset-title"
                            className={`relative w-full max-w-110 rounded-2xl bg-[#F4F0E4] shadow-2xl transition-all duration-300 ease-out transform overflow-hidden ${isModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={closeModal}
                                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/8 transition cursor-pointer"
                                aria-label="Đóng"
                            >
                                <CloseIcon />
                            </button>

                            <div className="px-7 py-7">
                                <ModalTitle id="auth-reset-title" title="Đặt lại mật khẩu" />
                                <p className="text-center text-sm text-gray-500 mb-6">
                                    Nhập mã OTP đã được gửi đến <strong>{forgotEmailForReset}</strong> và mật khẩu mới.
                                </p>

                                <form
                                    onSubmit={handleResetPasswordSubmit}
                                    className="space-y-4"
                                    noValidate
                                >
                                    {/* OTP */}
                                    <div>
                                        <label className={labelClass}>
                                            Mã OTP<span className="text-seeme-accent">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nhập mã OTP"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>

                                    {/* New password */}
                                    <div>
                                        <label className={labelClass}>
                                            Mật khẩu mới<span className="text-seeme-accent">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showResetPw ? 'text' : 'password'}
                                                placeholder="Nhập mật khẩu mới"
                                                value={resetNewPassword}
                                                onChange={(e) => setResetNewPassword(e.target.value)}
                                                className={`${inputClass} pr-10`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPw((v) => !v)}
                                                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center"
                                                aria-label={showResetPw ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                                            >
                                                {showResetPw ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm new password */}
                                    <div>
                                        <label className={labelClass}>
                                            Xác nhận mật khẩu<span className="text-seeme-accent">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showResetConfirmPw ? 'text' : 'password'}
                                                placeholder="Nhập lại mật khẩu mới"
                                                value={resetConfirmPassword}
                                                onChange={(e) => setResetConfirmPassword(e.target.value)}
                                                className={`${inputClass} pr-10 ${resetConfirmPassword && resetConfirmPassword !== resetNewPassword
                                                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                                                    : ''
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowResetConfirmPw((v) => !v)}
                                                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center"
                                                aria-label={showResetConfirmPw ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                                            >
                                                {showResetConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                        {resetConfirmPassword && resetConfirmPassword !== resetNewPassword && (
                                            <p className="mt-1 text-xs text-[#DC2626]">Mật khẩu xác nhận không khớp</p>
                                        )}
                                    </div>

                                    {resetServerError && (
                                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                                            {resetServerError}
                                        </div>
                                    )}

                                    <ButtonComponent
                                        type="submit"
                                        loading={resetLoading}
                                        shape="rounded"
                                        className="w-full py-2.5"
                                        title={resetLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                    />
                                </form>

                                <p className="mt-5 text-center text-sm text-[#7B943E]">
                                    Quay trở lại{' '}
                                    <button
                                        onClick={() => switchModal('login')}
                                        className="font-medium text-[#7B943E] underline italic cursor-pointer"
                                    >
                                        Đăng nhập
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default HeaderClient;
