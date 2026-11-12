'use client';

import React from 'react';
import {cn} from '@/utils/cn';
import {useLanguage} from '@/context/LanguageContext';

type SectionHeadingProps = {
    title: string;
    eyebrow?: string;
    description?: React.ReactNode;
    align?: 'left' | 'center';
    tone?: 'light' | 'dark';
    className?: string;
    titleClassName?: string;
};

const HEADING_TRANSLATIONS: Record<string, string> = {
    'Bộ sưu tập cây trà': 'home.teaCollectionsTitle',
    'Sản phẩm trà thượng hạng': 'home.productsTitle',
    'Video về chúng tôi': 'home.videoTitle',
    'Đến thăm vườn - thưởng trà': 'home.visitTitle',
    'Tin tức': 'home.newsTitle',
    'Giá trị cốt lõi': 'home.coreValues',
    'Bạn có thể thích': 'detail.youMayLike',
};

export default function SectionHeading({
    title,
    eyebrow,
    description,
    align = 'center',
    tone = 'light',
    className,
    titleClassName,
}: SectionHeadingProps) {
    const { t } = useLanguage();
    const displayTitle = HEADING_TRANSLATIONS[title] ? t(HEADING_TRANSLATIONS[title], title) : title;
    const onDark = tone === 'dark';

    return (
        <div className={cn('flex flex-col gap-2', align === 'center' ? 'items-center text-center' : 'items-start text-left', className)}>
            {eyebrow && (
                <p className={cn('text-sm font-medium', onDark ? 'text-seeme-cream/70' : 'text-seeme-muted')}>
                    {eyebrow}
                </p>
            )}
            <h2 className={cn(onDark ? 'seeme-heading-on-dark' : 'seeme-heading', 'text-3xl font-semibold lg:text-[40px]', titleClassName)}>
                {displayTitle}
            </h2>
            {description && (
                <p className={cn('max-w-xl text-sm leading-6', onDark ? 'text-seeme-cream/75' : 'text-seeme-muted')}>
                    {description}
                </p>
            )}
        </div>
    );
}
