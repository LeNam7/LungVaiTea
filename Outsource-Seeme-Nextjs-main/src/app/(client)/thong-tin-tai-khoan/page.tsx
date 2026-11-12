'use client';
import React from 'react';
import ThongTinTaiKhoanTab from './components/ThongTinTaiKhoanTab';
import LichSuDonHangTab from './components/LichSuDonHangTab';
import CayTraCuaToiTab from './components/CayTraCuaToiTab';
import DiaChiNhanHangTab from './components/DiaChiNhanHangTab';
import SanPhamYeuThichTab from './components/SanPhamYeuThichTab';
import SanPhamDaXemTab from './components/SanPhamDaXemTab';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {useRouter, useSearchParams} from 'next/navigation';
import {getCookie} from '@/utils/cookie';
import {fetchUserThunk} from '@/store/auth.store';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import {useLanguage} from '@/context/LanguageContext';

const TAB_KEYS: Record<TabType, string> = {
    'thong-tin': 'info',
    'lich-su-don-hang': 'orders',
    'cay-tra': 'trees',
    'dia-chi': 'address',
    'yeu-thich': 'favorites',
    'da-xem': 'viewed',
};

const SkContent = () => (
    <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
                <div className="bg-[#7F9635]/40 animate-pulse rounded h-4 w-24" />
                <div className="bg-[#7F9635]/40 animate-pulse rounded-lg h-11 w-full" />
            </div>
        ))}
    </div>
);

type TabType = 'thong-tin' | 'lich-su-don-hang' | 'cay-tra' | 'dia-chi' | 'yeu-thich' | 'da-xem';

const TABS: {id: TabType; title: string; breadcrumb: string; icon: React.ReactNode}[] = [
    {
        id: 'thong-tin',
        title: 'Thông tin tài khoản',
        breadcrumb: 'Home / Tài khoản / Thông tin tài khoản',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 13C14.396 13 16.575 13.694 18.178 14.671C18.978 15.161 19.662 15.736 20.156 16.361C20.642 16.977 21 17.713 21 18.5C21 19.345 20.589 20.011 19.997 20.486C19.437 20.936 18.698 21.234 17.913 21.442C16.335 21.859 14.229 22 12 22C9.771 22 7.665 21.86 6.087 21.442C5.302 21.234 4.563 20.936 4.003 20.486C3.41 20.01 3 19.345 3 18.5C3 17.713 3.358 16.977 3.844 16.361C4.338 15.736 5.021 15.161 5.822 14.671C7.425 13.694 9.605 13 12 13Z" fill="currentColor"/>
                <path d="M11.9997 2C15.8487 2 18.2547 6.167 16.3297 9.5C15.8909 10.2601 15.2597 10.8913 14.4997 11.3301C13.7396 11.7689 12.8774 12 11.9997 12C8.15075 12 5.74475 7.833 7.66975 4.5C8.10858 3.73992 8.73975 3.10875 9.49982 2.6699C10.2599 2.23106 11.1221 2.00002 11.9997 2Z" fill="currentColor"/>
            </svg>
        ),
    },
    {
        id: 'lich-su-don-hang',
        title: 'Lịch sử đơn hàng',
        breadcrumb: 'Home / Tài khoản / Lịch sử đơn hàng',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.636 18.3641C7.10845 19.8365 9.04594 20.7528 11.1183 20.9568C13.1906 21.1608 15.2696 20.6399 17.0009 19.4828C18.7322 18.3258 20.0087 16.6041 20.6129 14.6113C21.217 12.6185 21.1115 10.4779 20.3142 8.5542C19.5169 6.63051 18.0772 5.04282 16.2404 4.0617C14.4037 3.08057 12.2835 2.76673 10.2413 3.17364C8.19909 3.58056 6.36116 4.68305 5.04073 6.29325C3.72031 7.90344 2.99909 9.92169 3 12.0041V14.0001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 12L3 14L5 12M11 8V13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        id: 'cay-tra',
        title: 'Cây trà của tôi',
        breadcrumb: 'Home / Tài khoản / Cây trà của tôi',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.0002 7C18.0002 7.262 17.9835 7.52 17.9502 7.774C19.2608 8.51013 20.2474 9.71141 20.7147 11.1401C21.1819 12.5688 21.0959 14.1209 20.4736 15.4893C19.8513 16.8576 18.738 17.9425 17.3541 18.5293C15.9702 19.1161 14.4164 19.162 13.0002 18.658V22H11.0002V18.4C9.8474 18.9889 8.52381 19.1523 7.26238 18.8615C6.00095 18.5707 4.88253 17.8442 4.10397 16.81C3.3254 15.7758 2.93659 14.5001 3.00595 13.2074C3.07532 11.9147 3.59842 10.688 4.4832 9.743C4.87397 10.8128 5.48868 11.7869 6.2862 12.6L7.7142 11.2C6.61526 10.0782 5.99989 8.57035 6.0002 7C6.0002 5.4087 6.63234 3.88258 7.75756 2.75736C8.88278 1.63214 10.4089 1 12.0002 1C13.5915 1 15.1176 1.63214 16.2428 2.75736C17.3681 3.88258 18.0002 5.4087 18.0002 7Z" fill="currentColor"/>
            </svg>
        ),
    },
    {
        id: 'dia-chi',
        title: 'Địa chỉ nhận hàng',
        breadcrumb: 'Home / Tài khoản / Địa chỉ nhận hàng',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.9515 21.0645L10.7247 20.9109C9.58965 20.1167 8.53492 19.2135 7.57557 18.2142C5.88996 16.4482 4 13.8011 4 10.6768C4 6.83307 7.11961 3 11.678 3C16.2363 3 19.3559 6.83307 19.3559 10.678C19.3559 13.8023 17.466 16.4494 15.7803 18.213C14.821 19.2123 13.7663 20.1155 12.6312 20.9097C12.5351 20.9767 12.4595 21.0278 12.4044 21.0633C12.1646 21.2227 11.9201 21.3739 11.678 21.5275C11.4358 21.3739 11.1913 21.2227 10.9515 21.0645ZM11.678 13.0404C12.3045 13.0404 12.9054 12.7915 13.3485 12.3485C13.7915 11.9054 14.0404 11.3045 14.0404 10.678C14.0404 10.0514 13.7915 9.4505 13.3485 9.00745C12.9054 8.56441 12.3045 8.31551 11.678 8.31551C11.0514 8.31551 10.4505 8.56441 10.0075 9.00745C9.56441 9.4505 9.31551 10.0514 9.31551 10.678C9.31551 11.3045 9.56441 11.9054 10.0075 12.3485C10.4505 12.7915 11.0514 13.0404 11.678 13.0404Z" fill="currentColor"/>
            </svg>
        ),
    },
    {
        id: 'yeu-thich',
        title: 'Sản phẩm yêu thích',
        breadcrumb: 'Home / Tài khoản / Sản phẩm yêu thích',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M21.6603 8.7056C21.6291 6.5586 20.4117 4.44417 18.5429 3.57288C17.5385 3.10348 16.3926 3.03599 15.3401 3.38424C14.3833 3.68824 13.4238 4.31117 12.4996 5.29103C11.5754 4.31117 10.6159 3.6896 9.65908 3.38424C8.60652 3.03599 7.46063 3.10348 6.45622 3.57288C4.58744 4.44417 3.37008 6.5586 3.33887 8.7056V8.71646C3.33887 11.8474 5.20087 14.6214 7.17415 16.5689C8.06991 17.4593 9.06381 18.2451 10.1368 18.9113C10.5955 19.1895 11.0284 19.4135 11.4125 19.5709C11.7803 19.7202 12.163 19.8342 12.4996 19.8342C12.8362 19.8342 13.2189 19.7202 13.5853 19.5709C13.9707 19.4148 14.4037 19.1909 14.861 18.9113C15.9345 18.2452 16.9288 17.4593 17.825 16.5689C19.7983 14.6214 21.6603 11.8474 21.6603 8.71781V8.7056Z" fill="currentColor"/>
            </svg>
        ),
    },
    {
        id: 'da-xem',
        title: 'Sản phẩm đã xem',
        breadcrumb: 'Home / Tài khoản / Sản phẩm đã xem',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M1 12C3.028 7.848 7.192 5 12 5C16.808 5 20.972 7.848 23 12C20.972 16.152 16.808 19 12 19C7.192 19 3.028 16.152 1 12ZM12 15.5C12.4596 15.5 12.9148 15.4095 13.3394 15.2336C13.764 15.0577 14.1499 14.7999 14.4749 14.4749C14.7999 14.1499 15.0577 13.764 15.2336 13.3394C15.4095 12.9148 15.5 12.4596 15.5 12C15.5 11.5404 15.4095 11.0852 15.2336 10.6606C15.0577 10.236 14.7999 9.85013 14.4749 9.52513C14.1499 9.20012 13.764 8.94231 13.3394 8.76642C12.9148 8.59053 12.4596 8.5 12 8.5C11.0717 8.5 10.1815 8.86875 9.52513 9.52513C8.86875 10.1815 8.5 11.0717 8.5 12C8.5 12.9283 8.86875 13.8185 9.52513 14.4749C10.1815 15.1313 11.0717 15.5 12 15.5Z" fill="currentColor"/>
            </svg>
        ),
    },
];

const ButtonInfo = ({
    title,
    active,
    icon,
    onClick,
}: {
    title: string;
    active: boolean;
    icon?: React.ReactNode;
    onClick?: () => void;
}) => {
    return (
        <div
            onClick={onClick}
            className={`min-h-[48px] lg:h-[56px] px-4 rounded-[8px] gap-3 flex items-center cursor-pointer transition-all duration-200 text-sm lg:text-base ${
                active
                    ? 'bg-seeme-accent text-seeme-cream font-bold'
                    : 'bg-[linear-gradient(90deg,rgba(59,85,24,0)_0%,rgba(59,85,24,0.72)_42%,#3B5518_100%)] text-seeme-cream hover:bg-[linear-gradient(90deg,rgba(59,85,24,0)_0%,rgba(74,103,32,0.78)_42%,#4A6720_100%)]'
            }`}
        >
            {icon}
            {title}
        </div>
    );
};

const Page = () => {
    const { t, locale } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const user = useAppSelector((s) => s.auth.user);
    const isLoading = useAppSelector((s) => s.auth.isLoading);
    const userPhoneNumber = user?.phoneNumber;

    const requestedTab = searchParams.get('tab') as TabType | null;
    const activeTab = requestedTab && TABS.some((item) => item.id === requestedTab) ? requestedTab : 'thong-tin';
    const activeTabData = TABS.find((tab) => tab.id === activeTab)!;

    const getTabTitle = (tab: (typeof TABS)[0]) => {
        const key = TAB_KEYS[tab.id];
        return key ? t(`account.tabs.${key}`, tab.title) : tab.title;
    };

    const breadcrumbText = `Home / ${t('account.breadcrumbs.account', 'Tài khoản')} / ${getTabTitle(activeTabData)}`;

    const handleChangeTab = (nextTab: TabType) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', nextTab);
        const prefix = locale === 'en' ? '/en' : '';
        router.replace(`${prefix}/thong-tin-tai-khoan?${params.toString()}`, {scroll: false});
    };

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        const accessToken = getCookie('accessToken');
        const userId = getCookie('userId');
        if (!accessToken) {
            const prefix = locale === 'en' ? '/en' : '';
            router.replace(`${prefix}/tai-khoan`);
            return;
        }
        // If store has no full user data, fetch it
        if (userId && !userPhoneNumber) {
            dispatch(fetchUserThunk(Number(userId)));
        }
    }, [dispatch, router, userPhoneNumber, locale]);

    return (
        <div className="relative w-full overflow-hidden bg-[#DDD1B9]">
            <h1 className="sr-only">{getTabTitle(activeTabData)}</h1>
            <AbsoluteBackground
                src="/images/Rectangle.png"
                className="object-top mix-blend-multiply"
            />
            <div className="relative z-10 w-full flex flex-col px-4 sm:px-6 lg:px-[66px] pt-5 pb-12 sm:pb-16 lg:pb-[162px]">
                <p className="text-xs sm:text-sm text-[#3B5518] line-clamp-1">{breadcrumbText}</p>
                {/* Mobile tab pills */}
                <div className="mt-4 flex lg:hidden flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleChangeTab(tab.id)}
                            className={`flex min-h-10 flex-1 basis-[calc(50%-4px)] items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-center text-xs font-medium leading-tight transition-all sm:basis-[calc(33.333%-6px)] sm:text-sm [&_svg]:shrink-0 ${
                                activeTab === tab.id
                                    ? 'account-tab-pill-active'
                                    : 'account-tab-pill'
                            }`}
                        >
                            {tab.icon}
                            {getTabTitle(tab)}
                        </button>
                    ))}
                </div>
                <div className="account-panel mt-5 sm:mt-7 lg:mt-[44px] mx-auto w-full max-w-[1106px] min-h-[360px] lg:min-h-[408px] gap-5 lg:gap-[34px] rounded-xl p-4 sm:p-5 lg:p-[15px_22px_18px_9px] grid grid-cols-1 lg:grid-cols-[300px_1fr]">
                    {/* Desktop sidebar */}
                    <div className="hidden lg:flex text-[#F4F0E4] flex-col gap-3">
                        {TABS.map((tab) => (
                            <ButtonInfo
                                key={tab.id}
                                title={getTabTitle(tab)}
                                active={activeTab === tab.id}
                                icon={tab.icon}
                                onClick={() => handleChangeTab(tab.id)}
                            />
                        ))}
                    </div>
                    <div
                        key={activeTab}
                        className="min-w-0 animate-tab-fade-in"
                    >
                        {!mounted || (isLoading && !user) ? <SkContent /> : (
                            <>
                                {activeTab === 'thong-tin' && <ThongTinTaiKhoanTab />}
                                {activeTab === 'lich-su-don-hang' && <LichSuDonHangTab />}
                                {activeTab === 'cay-tra' && <CayTraCuaToiTab />}
                                {activeTab === 'dia-chi' && <DiaChiNhanHangTab />}
                                {activeTab === 'yeu-thich' && <SanPhamYeuThichTab />}
                                {activeTab === 'da-xem' && <SanPhamDaXemTab />}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;
