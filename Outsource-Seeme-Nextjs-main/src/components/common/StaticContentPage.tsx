'use client';

import React from 'react';
import Link from 'next/link';
import {QrCode, Truck} from 'lucide-react';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import StaticContentToc from '@/components/common/StaticContentToc';
import {BRAND} from '@/constants/brand';
import {STATIC_PAGES, STATIC_PAGES_EN, type StaticPageSlug} from '@/constants/staticPages';
import {useLanguage} from '@/context/LanguageContext';

const STATIC_PAGE_TITLES_EN: Record<StaticPageSlug, string> = {
    'gioi-thieu': 'About Us',
    'chinh-sach-bao-mat': 'Privacy Policy',
    'chinh-sach-thanh-toan': 'Payment Policy',
    'chinh-sach-giao-hang': 'Shipping Policy',
    'chinh-sach-doi-tra-bao-hanh': 'Return & Warranty Policy',
    'dieu-khoan-su-dung': 'Terms of Service',
};

type StaticContentPageProps = {
    slug: StaticPageSlug;
};

type SectionInfo = {
    id: string;
    number: string;
    title: string;
};

const HIGHLIGHT_TERMS = [
    BRAND.fullName,
    BRAND.name,
    'thông tin cá nhân',
    'thanh toán trực tuyến',
    'Thanh toán khi nhận hàng',
    'COD',
    'QR',
    'toàn lãnh thổ Việt Nam',
    'giao nhanh trong ngày',
    '02 đến 07 ngày làm việc',
    '07 ngày',
    '24 giờ làm việc',
    '03 đến 05 ngày làm việc',
    'không bán, trao đổi hoặc tiết lộ',
    'quyền sở hữu trí tuệ',
    'Chính sách bảo mật',
    'Lùng Vài',
    'xã Phương Độ',
    'thành phố Hà Giang',
    'hơn 1200 mét',
    'Tây Côn Lĩnh',
    'rừng già nguyên sinh',
    'trà Shan Tuyết',
    'cội trà cổ thụ',
    'vùng trà di sản',
    '3 năm ròng rã',
    '5 Không',
    'không cắt tỉa',
    'không thuốc trừ sâu',
    'không phân bón hóa học',
    'không diệt cỏ',
    'không tận thu',
    'vụ xuân',
    'vụ thu',
    'Catechin',
    'Polyphenol',
    'khung giờ vàng',
    '7 giờ sáng đến 3 giờ chiều',
    'thức quà ngoại giao',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightRegex = new RegExp(
    `(${HIGHLIGHT_TERMS.filter(Boolean).sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})`,
    'gi',
);

const splitBlocks = (content: string) => content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

const normalizeBlocks = (blocks: string[]) => {
    const [firstBlock, ...restBlocks] = blocks;
    if (!firstBlock) return blocks;

    const firstLines = firstBlock.split('\n').map((line) => line.trim()).filter(Boolean);
    if (firstLines.length <= 1 || !isDocumentTitle(firstLines[0])) return blocks;

    return [...firstLines, ...restBlocks];
};

const isDocumentTitle = (block: string) => {
    const value = block.trim();
    if (value.length <= 8 || isTranslation(value)) return false;
    return value === value.toLocaleUpperCase('vi-VN') && /[A-ZĐÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÊỀẾỂỄỆÔỒỐỔỖỘƠỜỚỞỠỢƯỪỨỬỮỰÍÌỈĨỊÝỲỶỸỴ]/.test(value);
};

const isTranslation = (block: string) => /^\([^)]+\)$/.test(block);

const getSectionInfo = (block: string): SectionInfo | null => {
    const match = block.match(/^(\d+)\.\s+(.+)$/);
    if (!match) return null;

    return {
        id: `muc-${match[1]}`,
        number: match[1],
        title: match[2],
    };
};

const formatTitle = (value: string) => {
    const normalized = value.toLocaleLowerCase('vi-VN');
    return normalized.charAt(0).toLocaleUpperCase('vi-VN') + normalized.slice(1);
};

const isBulletBlock = (block: string) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    return lines.length > 0 && lines.every((line) => line.startsWith('* '));
};

// Khối ảnh riêng 1 dòng, cú pháp Markdown: ![chú thích](url)
// Hỗ trợ cả URL tuyệt đối lẫn đường dẫn nội bộ (/images/...)
const IMAGE_BLOCK_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

const getImageBlock = (block: string): {alt: string; src: string} | null => {
    const match = block.match(IMAGE_BLOCK_PATTERN);
    if (!match) return null;
    return {alt: match[1].trim(), src: match[2].trim()};
};

const isSubheading = (block: string) => {
    if (block.includes('\n') || getSectionInfo(block) || isTranslation(block)) return false;
    if (/^(Email|Hotline|Website|Địa chỉ):/i.test(block)) return false;
    if (block.length > 95) return false;
    return block.endsWith(':') || !/[.!?]$/.test(block);
};

const renderInline = (text: string) => {
    const contactMatch = text.match(/^(Email|Hotline|Website|Địa chỉ):\s*(.*)$/i);
    if (contactMatch) {
        return (
            <>
                <strong className="font-semibold text-[#24420F]">{contactMatch[1]}:</strong>{' '}
                <span className="text-[#3B5518]/82">{contactMatch[2]}</span>
            </>
        );
    }

    const parts = text.split(highlightRegex);
    return parts.map((part, index) => {
        if (!part) return null;
        highlightRegex.lastIndex = 0;
        const isHighlighted = highlightRegex.test(part);
        if (!isHighlighted) return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;

        return (
            <strong
                key={`${part}-${index}`}
                className="font-semibold text-[#24420F]"
            >
                {part}
            </strong>
        );
    });
};

const renderParagraphLines = (block: string) =>
    block.split('\n').map((line, index, lines) => (
        <React.Fragment key={`${line}-${index}`}>
            {renderInline(line)}
            {index < lines.length - 1 ? <br /> : null}
        </React.Fragment>
    ));

const renderContentBlock = (block: string, index: number) => {
    const image = getImageBlock(block);
    if (image) {
        return (
            <figure
                key={`image-${index}`}
                className="py-1"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    className="w-full rounded-[12px] object-cover"
                />
                {image.alt ? (
                    <figcaption className="mt-2 text-center text-[13px] leading-relaxed text-[#3B5518]/70 md:text-sm">
                        {image.alt}
                    </figcaption>
                ) : null}
            </figure>
        );
    }

    const section = getSectionInfo(block);
    if (section) {
        return (
            <h2
                key={`${section.id}-${index}`}
                id={section.id}
                className="scroll-mt-28 pt-2 font-source-serif-4 text-[25px] font-semibold leading-tight text-[#3B5518] md:text-[28px]"
            >
                {section.number}. {formatTitle(section.title)}
            </h2>
        );
    }

    if (isBulletBlock(block)) {
        const items = block.split('\n').map((line) => line.replace(/^\*\s*/, '').trim()).filter(Boolean);
        return (
            <ul
                key={`list-${index}`}
                className="space-y-0.5 text-[15px] leading-[1.45] text-[#3B5518] md:text-[16px] md:leading-[1.5]"
            >
                {items.map((item, itemIndex) => (
                    <li
                        key={`${item}-${itemIndex}`}
                        className="relative pl-3 before:absolute before:left-0 before:content-['*']"
                    >
                        {renderInline(item)}
                    </li>
                ))}
            </ul>
        );
    }

    if (isSubheading(block)) {
        return (
            <h3
                key={`subheading-${index}`}
                className="pt-0.5 text-[16px] font-semibold text-[#3B5518] md:text-[17px]"
            >
                {renderInline(block.replace(/:$/, ''))}
            </h3>
        );
    }

    return (
        <p
            key={`paragraph-${index}`}
            className="text-[15px] leading-[1.45] text-[#3B5518] md:text-[16px] md:leading-[1.5]"
        >
            {renderParagraphLines(block)}
        </p>
    );
};

const paymentCards = [
    {
        title: 'Thanh toán khi nhận hàng',
        description: 'Khách hàng thanh toán trực tiếp cho nhân viên giao hàng tại thời điểm nhận sản phẩm.',
        Icon: Truck,
    },
    {
        title: 'Thanh toán bằng mã QR thông qua các ứng dụng ngân hàng',
        description: 'Ngân hàng hoặc ví điện tử được hỗ trợ.',
        Icon: QrCode,
    },
];

const isPaymentMethodBlock = (block: string) => {
    const value = block.toLocaleLowerCase('vi-VN');
    return value.includes('thanh toán khi nhận hàng')
        || value.includes('nhân viên giao hàng')
        || value.includes('thanh toán trực tuyến')
        || value.includes('cổng thanh toán điện tử')
        || value.includes('thanh toán bằng mã qr');
};

const PaymentMethodCards = () => (
    <div className="grid gap-3 py-2 sm:grid-cols-2 md:max-w-[547px]">
        {paymentCards.map(({title, description, Icon}) => (
            <div
                key={title}
                className="flex min-h-[150px] flex-col items-center justify-center rounded-[8px] bg-[#7F9635] px-7 py-5 text-center text-white"
            >
                <Icon className="mb-3 h-8 w-8" strokeWidth={2.2} />
                <p className="font-source-serif-4 text-[17px] leading-tight">{title}</p>
                <p className="mt-2 text-[13px] leading-[1.55] text-white/86">{description}</p>
            </div>
        ))}
    </div>
);

const ABOUT_TOC_ITEMS_EN: Record<string, string> = {
    'Giới thiệu doanh nghiệp': 'About Us',
    'Danh sách cửa hàng': 'Store List',
    'Bộ sưu tập cây trà': 'Ancient Tea Tree Collection',
    'Sản phẩm trà': 'Tea Products',
    'Tour trải nghiệm': 'Experience Tours',
    'Workshop': 'Workshops',
};

// Mục lục riêng của trang Giới thiệu doanh nghiệp (Hải chốt 31/10/2026):
// mỗi mục là 1 trang khác, mở tab mới; mục chưa có trang thì để trống, bấm không ra gì.
const ABOUT_TOC_ITEMS: {title: string; href: string | null}[] = [
    {title: 'Giới thiệu doanh nghiệp', href: '/gioi-thieu'},
    {title: 'Danh sách cửa hàng', href: null},
    {title: 'Bộ sưu tập cây trà', href: '/bo-suu-tap-cay-tra'},
    {title: 'Sản phẩm trà', href: '/san-pham-tra'},
    {title: 'Tour trải nghiệm', href: null},
    {title: 'Workshop', href: null},
];

export default function StaticContentPage({slug}: StaticContentPageProps) {
    const { t, locale } = useLanguage();
    const localizePath = (path: string) => locale === 'en' ? (path.startsWith('/en') ? path : `/en${path === '/' ? '' : path}`) : path;
    const pageData = locale === 'en' && STATIC_PAGES_EN[slug] ? STATIC_PAGES_EN[slug]! : STATIC_PAGES[slug];
    const pageTitle = locale === 'en' ? (STATIC_PAGE_TITLES_EN[slug] || pageData.title) : pageData.title;
    const blocks = normalizeBlocks(splitBlocks(pageData.content));
    const translation = isTranslation(blocks[1] ?? '') ? blocks[1].replace(/[()]/g, '') : null;
    const bodyStartIndex = isDocumentTitle(blocks[0] ?? '') ? (translation ? 2 : 1) : 0;
    const bodyBlocks = blocks.slice(bodyStartIndex);
    const sections = bodyBlocks.map(getSectionInfo).filter((item): item is SectionInfo => Boolean(item));
    const isPaymentPage = slug === 'chinh-sach-thanh-toan';

    return (
        <main className="relative min-h-screen bg-[#DCCFB4] text-[#3B5518]">
            <section className="relative isolate min-h-[150px] overflow-hidden px-4 py-8 text-white sm:px-8 lg:min-h-[150px] lg:px-16">
                <AbsoluteBackground
                    src="/images/bghome.png"
                    className="object-center"
                />
                <div className="absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(31,74,49,0.08)_0%,rgba(48,94,31,0.46)_48%,rgba(35,72,15,0.94)_100%)]" />
                <div className="relative z-10 mx-auto flex min-h-[94px] max-w-[1110px] flex-col justify-end gap-5 sm:min-h-[110px] lg:min-h-[118px]">
                    <nav
                        aria-label="Breadcrumb"
                        className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#F4F0E4]/80 sm:text-sm"
                    >
                        <Link
                            href={localizePath('/')}
                            className="shrink-0 transition-colors hover:text-white"
                        >
                            {t('nav.home', 'Trang chủ')}
                        </Link>
                        <span className="text-[#DDEBAA]">/</span>
                        <span className="min-w-0 max-w-[250px] truncate text-white sm:max-w-[520px]">{pageTitle}</span>
                    </nav>
                </div>
            </section>

            <section className="relative isolate px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-10">
                <AbsoluteBackground
                    src="/images/bg-contact.png"
                    className="object-top opacity-100"
                />
                <div className="absolute inset-0 z-0 bg-[#DBCFB9]/68" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/tra_tri_cot_loi.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-32 top-[23rem] z-0 hidden w-[760px] rotate-[-8deg] opacity-[0.09] blur-[0.4px] lg:block"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/sptrathuonghang.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-40 bottom-6 z-0 hidden w-[700px] opacity-[0.07] blur-[0.4px] lg:block"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/tra_tri_cot_loi.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-32 top-[32rem] z-0 w-[520px] rotate-6 opacity-[0.075] blur-[0.4px] lg:hidden"
                />
                <div className="relative z-10 mx-auto grid max-w-[1110px] gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-[95px]">
                    <aside className="hidden self-start lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)]">
                        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto py-1 [scrollbar-width:thin] [scrollbar-color:#A7B36E_transparent]">
                            {slug === 'gioi-thieu' ? (
                                <nav
                                    aria-label="Mục lục"
                                    className="space-y-3.5"
                                >
                                    {ABOUT_TOC_ITEMS.map((item, index) => {
                                        const itemTitle = locale === 'en' ? (ABOUT_TOC_ITEMS_EN[item.title] || item.title) : item.title;
                                        const isActive = item.href === `/${slug}`;
                                        const className = `block w-fit border-b-2 pb-1 text-[16px] leading-[1.25] transition ${
                                            isActive
                                                ? 'border-[#7F9635] text-[#24420F]'
                                                : 'border-transparent text-[#3B5518]'
                                        }`;
                                        return item.href ? (
                                            <a
                                                key={item.title}
                                                href={localizePath(item.href)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`${className} hover:border-[#7F9635] hover:text-[#24420F]`}
                                            >
                                                {index + 1}. {itemTitle}
                                            </a>
                                        ) : (
                                            <span
                                                key={item.title}
                                                className={`cursor-default ${className}`}
                                            >
                                                {index + 1}. {itemTitle}
                                            </span>
                                        );
                                    })}
                                </nav>
                            ) : (
                                <StaticContentToc sections={sections} />
                            )}
                        </div>
                    </aside>

                    <article
                        aria-label={pageTitle}
                        className="max-w-[760px] pb-10"
                    >
                        <h1 className="mb-7 font-source-serif-4 text-[34px] font-semibold leading-tight text-[#3B5518] md:text-[38px]">
                            {pageTitle}
                        </h1>
                        <div className="space-y-3 md:space-y-3.5">
                            {bodyBlocks.map((block, index) => {
                                if (isPaymentPage && isPaymentMethodBlock(block)) return null;

                                return (
                                    <React.Fragment key={`content-${index}`}>
                                        {renderContentBlock(block, index)}
                                        {isPaymentPage && index === 1 ? <PaymentMethodCards /> : null}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </article>
                </div>
            </section>
        </main>
    );
}
