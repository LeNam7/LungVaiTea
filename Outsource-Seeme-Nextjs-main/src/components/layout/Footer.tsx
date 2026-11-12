'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import FacebookIcon from '../icons/FacebookIcon';
import IgIcon from '../icons/IgIcon';
import ZaloIcon from '../icons/ZaloIcon';
import TiktokIcon from '../icons/TiktokIcon';
import YoutubeIcon from '../icons/YoutubeIcon';
import { Mail, MapPin, Phone } from 'lucide-react';
import { BRAND, FOOTER_SLOGAN } from '@/constants/brand';
import { FOOTER_LOGO } from '@/constants/brandAssets';
import { useLanguage } from '@/context/LanguageContext';

const socialLinks = [
    { label: 'Facebook', href: BRAND.facebook, Icon: FacebookIcon },
    { label: 'Instagram', href: BRAND.instagram, Icon: IgIcon },
    { label: 'Zalo', href: BRAND.zalo, Icon: ZaloIcon },
    { label: 'TikTok', href: BRAND.tiktok, Icon: TiktokIcon },
    { label: 'YouTube', href: BRAND.youtube, Icon: YoutubeIcon },
].filter(({ href }) => href);

const Footer = () => {
    const { t, locale } = useLanguage();
    const localizePath = (path: string) => (locale === 'en' ? `/en${path === '/' ? '' : path}` : path);

    const aboutLinks = [
        { title: t('footer.aboutTitle', 'Về Lùng Vài Trà'), href: localizePath('/gioi-thieu') },
        { title: t('nav.teaCollections', 'Bộ sưu tập cây trà'), href: localizePath('/bo-suu-tap-cay-tra') },
        { title: t('nav.teaProducts', 'Sản phẩm trà'), href: localizePath('/san-pham-tra') },
        { title: t('nav.contact', 'Liên hệ'), href: localizePath('/lien-he') },
        { title: t('nav.news', 'Tin tức'), href: localizePath('/tin-tuc') },
    ];

    const policyLinks = [
        { title: t('footer.privacyPolicy', 'Chính sách bảo mật'), href: localizePath('/chinh-sach-bao-mat') },
        { title: t('footer.paymentPolicy', 'Chính sách thanh toán'), href: localizePath('/chinh-sach-thanh-toan') },
        { title: t('footer.shippingPolicy', 'Chính sách giao hàng'), href: localizePath('/chinh-sach-giao-hang') },
        { title: t('footer.returnPolicy', 'Chính sách đổi trả/bảo hành'), href: localizePath('/chinh-sach-doi-tra-bao-hanh') },
        { title: t('footer.termsOfUse', 'Điều khoản sử dụng'), href: localizePath('/dieu-khoan-su-dung') },
    ];

    const slogan = t('footer.slogan', FOOTER_SLOGAN);
    const companyName = t('footer.companyName', '@ CÔNG TY CỔ PHẦN TRÀ LÙNG VÀI');
    const companyTax = t('footer.taxCode', 'Mã số thuế: 0108721663. Nơi cấp: Sở Tài chính Thành phố Hà Nội.');
    const address = t('brand.address', BRAND.address);

    return (
        <>
            <footer>
                <div className="bg-[linear-gradient(90deg,#315414_0%,#2A2112_100%)] pb-6 pt-9 text-[#F4F0E4] lg:min-h-[310px] lg:pb-10 lg:pt-[72px]">
                    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:hidden">
                        <div className="flex items-center gap-6">
                            <Image
                                src={FOOTER_LOGO}
                                alt={`${BRAND.name} Logo`}
                                sizes="100px"
                                className="h-[100px] w-auto shrink-0 object-contain"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs leading-5 text-[#F4F0E4]/90">
                                    {slogan}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 text-xs text-[#F4F0E4]/95">
                            <nav className="space-y-2.5">
                                {aboutLinks.map(({ title, href }) => (
                                    <Link
                                        key={title}
                                        href={href}
                                        className="block leading-5 transition-colors hover:text-white"
                                    >
                                        {title}
                                    </Link>
                                ))}
                            </nav>

                            <nav className="space-y-2.5">
                                {policyLinks.map(({ title, href }) => (
                                    <Link
                                        key={title}
                                        href={href}
                                        className="block leading-5 transition-colors hover:text-white"
                                    >
                                        {title}
                                    </Link>
                                ))}
                            </nav>

                            <div className="col-span-2 space-y-3 rounded-2xl border border-[#F4F0E4]/15 bg-white/5 p-4">
                                <div className="flex flex-wrap items-center gap-3 pb-1">
                                    {socialLinks.map(({ label, href, Icon }) => (
                                        <a
                                            key={label}
                                            href={href}
                                            target={href.startsWith('http') ? '_blank' : undefined}
                                            rel={href.startsWith('http') ? 'noreferrer' : undefined}
                                            aria-label={label}
                                            className="inline-flex rounded-full transition-transform duration-200 hover:-translate-y-0.5"
                                        >
                                            <Icon />
                                        </a>
                                    ))}
                                </div>
                                <p className="flex gap-2 leading-5">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{address}</span>
                                </p>
                                <a
                                    href={`mailto:${BRAND.email}`}
                                    className="flex items-center gap-2 leading-5 transition-colors hover:text-white"
                                >
                                    <Mail className="h-4 w-4 shrink-0" />
                                    <span className="min-w-0 break-all">{BRAND.email}</span>
                                </a>
                                <a
                                    href={`tel:${BRAND.phone}`}
                                    className="flex items-center gap-2 leading-5 transition-colors hover:text-white"
                                >
                                    <Phone className="h-4 w-4 shrink-0" />
                                    {BRAND.phoneDisplay}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mx-auto hidden max-w-[1440px] grid-cols-[2fr_1fr_1fr_1.8fr] gap-10 px-6 lg:grid lg:px-[50px]">
                        <div>
                            <div className="flex items-center gap-6">
                                <Image
                                    src={FOOTER_LOGO}
                                    alt={`${BRAND.name} Logo`}
                                    sizes="120px"
                                    className="h-[120px] w-auto shrink-0 object-contain"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm leading-7 text-[#F4F0E4]/90">
                                        {slogan}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-1 space-y-3 text-sm">
                            {aboutLinks.map(({ title, href }) => (
                                <Link
                                    key={title}
                                    href={href}
                                    className="block w-fit leading-7 text-[#F4F0E4]/95 transition-colors hover:text-white"
                                >
                                    {title}
                                </Link>
                            ))}
                        </div>

                        <div className="mt-1 space-y-3 text-sm">
                            {policyLinks.map(({ title, href }) => (
                                <Link
                                    key={title}
                                    href={href}
                                    className="block leading-7 text-[#F4F0E4]/95 transition-colors hover:text-white"
                                >
                                    {title}
                                </Link>
                            ))}
                        </div>

                        <div className="-mt-7 space-y-3 text-sm text-[#F4F0E4]/95">
                            <div className="flex items-center gap-2 pb-1">
                                {socialLinks.map(({ label, href, Icon }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target={href.startsWith('http') ? '_blank' : undefined}
                                        rel={href.startsWith('http') ? 'noreferrer' : undefined}
                                        aria-label={label}
                                        className="inline-flex rounded-full transition-transform duration-200 hover:-translate-y-0.5"
                                    >
                                        <Icon />
                                    </a>
                                ))}
                            </div>
                            <p className="flex gap-2 leading-7">
                                <MapPin className="mt-1.5 h-[18px] w-[18px] shrink-0" />
                                <span>{address}</span>
                            </p>
                            <a
                                href={`mailto:${BRAND.email}`}
                                className="flex w-fit items-center gap-2 leading-7 transition-colors hover:text-white"
                            >
                                <Mail className="h-[18px] w-[18px] shrink-0" />
                                {BRAND.email}
                            </a>
                            <a
                                href={`tel:${BRAND.phone}`}
                                className="flex w-fit items-center gap-2 leading-7 transition-colors hover:text-white"
                            >
                                <Phone className="h-[18px] w-[18px] shrink-0" />
                                {BRAND.phoneDisplay}
                            </a>
                        </div>
                    </div>

                    <div className="mx-auto mt-8 max-w-[1440px] px-4 text-xs leading-5 text-[#F4F0E4]/70 sm:px-6 lg:mt-12 lg:px-[50px]">
                        <p className="text-[#F4F0E4]/90">{companyName}</p>
                        <p className="mt-1">{companyTax}</p>
                    </div>
                </div>

                <div className="flex min-h-[54px] items-center justify-center bg-[#DCCFB4] px-6 py-3 text-center text-xs leading-5 text-[#3B5518] md:px-10 lg:min-h-[43px] lg:py-0 lg:text-sm">
                    Copyright © 2026 {BRAND.name}. All Rights Reserved.
                </div>
            </footer>
        </>
    );
};

export default Footer;
