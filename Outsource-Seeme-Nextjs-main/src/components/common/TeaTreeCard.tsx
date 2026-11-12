'use client';

import Link from 'next/link';
import Image from 'next/image';
import {useRef, useEffect} from 'react';
import {useLanguage} from '@/context/LanguageContext';

export type TeaTreeTag = 'sold-out' | 'new' | 'best-seller';

type Props = {
    href: string;
    imageSrc: string;
    code: string;
    name: string;
    price: string;
    yieldInfo?: string;
    teaType?: string | null;
    buyers?: string;
    tag?: TeaTreeTag;
};

const TAG_CONFIG: Record<TeaTreeTag, {label: string; className: string}> = {
    'sold-out': {
        label: 'ĐÃ CÓ CHỦ',
        className: 'bg-gray-500 text-white',
    },
    new: {
        label: 'MỚI',
        className: 'bg-[#3E9E4A] text-white',
    },
    'best-seller': {
        label: 'NỔI BẬT',
        className: 'bg-red-600 text-white',
    },
};


const FALLBACK_IMG = '/images/shan-tuyet-tea-tree.jpg';

export default function TeaTreeCard({href, imageSrc, code, name, price, yieldInfo, teaType, buyers, tag}: Props) {
    const {t, locale} = useLanguage();
    const badge = tag ? TAG_CONFIG[tag] : null;
    const badgeLabel = badge
        ? tag === 'sold-out'
            ? locale === 'en'
                ? 'OWNED'
                : 'ĐÃ CÓ CHỦ'
            : tag === 'new'
              ? locale === 'en'
                  ? 'NEW'
                  : 'MỚI'
              : locale === 'en'
                ? 'FEATURED'
                : 'NỔI BẬT'
        : null;

    const finalHref = locale === 'en' && !href.startsWith('/en') ? `/en${href}` : href;
    const imgRef = useRef<HTMLImageElement>(null);

    // Handle case where image 404 fires before hydration (onError missed)
    useEffect(() => {
        const img = imgRef.current;
        if (img && img.complete && img.naturalWidth === 0) {
            img.src = FALLBACK_IMG;
        }
    }, []);

    return (
        <Link
            href={finalHref}
            className="group flex flex-col bg-white p-2 rounded-xl overflow-hidden border border-[#C9D2A7] shadow-sm hover:shadow-lg transition-shadow h-full cursor-pointer"
        >
            {/* Image */}
            <div className="relative overflow-hidden rounded-xl">
                <Image
                    ref={imgRef}
                    src={imageSrc}
                    alt={name}
                    width={640}
                    height={480}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="w-full aspect-[4/3] object-cover group-hover:scale-105"
                    style={{willChange: 'scale', transition: 'scale 0.3s ease-out'}}
                    onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = FALLBACK_IMG;
                    }}
                />
                {/* Product code badge */}
                <span className="absolute top-3 right-3 bg-[#3B5518] text-white text-[11px] font-bold px-2.5 py-1 rounded-sm tracking-wide">
                    {code}
                </span>
                {/* Tag badge */}
                {badge && (
                    <span
                        className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-sm tracking-wide ${badge.className}`}
                    >
                        {badgeLabel}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="py-3 px-1 flex flex-col gap-1.5 flex-1 bg-white">
                <p className="text-[#1a1a1a] text-sm font-semibold leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-[#3B5518]">{name}</p>
                <span className="text-[#3B5518] font-bold text-base leading-tight">{price}</span>
                {yieldInfo && (
                    <div className="flex items-center justify-between mt-auto pt-0.5">
                        <span className="text-gray-400 text-xs">{yieldInfo}</span>
                    </div>
                )}
                {teaType && <p className="text-xs font-medium text-[#6F8532]">{locale === 'en' ? 'Tree type:' : 'Loại cây:'} {teaType}</p>}
                {buyers && <p className="text-[#3E9E4A] text-xs font-medium">{buyers}</p>}
            </div>
        </Link>
    );
}
