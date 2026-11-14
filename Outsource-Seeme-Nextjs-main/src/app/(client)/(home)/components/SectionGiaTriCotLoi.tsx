'use client';

import React from 'react';
import NextImage from 'next/image';
import FadeInUp from '@/components/animations/FadeInUp';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import { HOME_COPY } from '@/constants/brand';
import { BOOKING_URL } from '@/utils/domain';
import { useLanguage } from '@/context/LanguageContext';

const CORE_VALUE_SLIDES = [
    '/imageSlide/optimized/core-value-20260709-01.jpg',
    '/imageSlide/optimized/core-value-20260709-05.jpg',
    '/imageSlide/optimized/core-value-20260709-02.jpg',
    '/imageSlide/optimized/core-value-20260709-03.jpg',
    '/imageSlide/optimized/core-value-20260709-04.jpg',
    '/imageSlide/optimized/core-value-20260709-06.jpg',
    '/imageSlide/optimized/core-value-20260709-07.jpg',
    '/imageSlide/optimized/core-value-20260709-08.jpg',
    '/imageSlide/optimized/core-value-20260709-09.jpg',
];

const CoreValueImageMarquee = ({
    className = '',
    id,
    style,
}: {
    className?: string;
    id?: string;
    style?: React.CSSProperties;
}) => {
    const [imagesReady, setImagesReady] = React.useState(false);
    const slides = [...CORE_VALUE_SLIDES, ...CORE_VALUE_SLIDES];

    React.useEffect(() => {
        let cancelled = false;

        Promise.all(
            CORE_VALUE_SLIDES.map(
                (src) =>
                    new Promise<void>((resolve) => {
                        const image = new Image();
                        image.onload = () => resolve();
                        image.onerror = () => resolve();
                        image.src = src;
                    }),
            ),
        ).then(() => {
            if (!cancelled) setImagesReady(true);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div
            id={id}
            className={`core-value-marquee mx-auto w-full shrink-0 overflow-hidden scroll-mt-24 ${className}`}
            style={style}
        >
            <div className={`core-value-marquee-track flex w-max items-center gap-3 lg:gap-4 ${imagesReady ? 'is-ready' : ''}`}>
                {slides.map((src, index) => (
                    <div
                        key={`${src}-${index}`}
                        className="core-value-marquee-card relative h-[106px] w-[137px] shrink-0 overflow-hidden rounded-[8px] bg-[#C8BDA4] lg:h-[194px] lg:w-[250px]"
                    >
                        {/* Native img avoids Next preloading all marquee assets ahead of the hero video. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt=""
                            loading="eager"
                            decoding="sync"
                            draggable={false}
                            className="core-value-marquee-image h-full w-full object-cover"
                        />
                    </div>
                ))}
            </div>
            <style jsx>{`
                .core-value-marquee-track {
                    animation: coreValueMarquee 120s linear infinite;
                    animation-play-state: paused;
                    backface-visibility: hidden;
                    will-change: transform;
                }

                .core-value-marquee-track.is-ready {
                    animation-play-state: running;
                }

                .core-value-marquee-image {
                    display: block;
                    transform: none;
                }

                .core-value-marquee:hover .core-value-marquee-track {
                    animation-play-state: paused;
                }

                @keyframes coreValueMarquee {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .core-value-marquee-track {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
};

const SectionGiaTriCotLoi = () => {
    const { t } = useLanguage();
    const coreValues = [
        {
            title: t('home.values.traditionalTitle', 'TRUYỀN THỐNG'),
            description: t('home.values.traditionalDesc', HOME_COPY.values.traditional),
        },
        {
            title: t('home.values.delicateTitle', 'TINH TẾ'),
            description: t('home.values.delicateDesc', HOME_COPY.values.delicate),
        },
        {
            title: t('home.values.originalTitle', 'NGUYÊN BẢN'),
            description: t('home.values.originalDesc', HOME_COPY.values.original),
        },
    ];

    return (
        <div
            id="gia-tri-cot-loi"
            className="relative overflow-hidden bg-[#d8ccb2]"
        >
            <AbsoluteBackground src="/images/bggiatricotloi.png" />
            {/* ── Mobile layout (< lg) ── */}
            <div className="relative z-10 lg:hidden flex flex-col items-center py-12 px-4 gap-8">
                <FadeInUp>
                    <TitleComponent
                        title={t('home.coreValues', 'Giá trị cốt lõi')}
                        size="text-3xl"
                    />
                </FadeInUp>
                <FadeInUp delay={0.1}>
                    <div className="w-full">
                        <NextImage
                            src="/images/tra_tri_cot_loi.svg"
                            alt=""
                            width={1200}
                            height={800}
                            className="w-full object-cover rounded-xl"
                        />
                    </div>
                </FadeInUp>
                <div className="flex flex-col gap-7 w-full">
                    <FadeInUp delay={0.15}>
                        <div>
                            <TitleComponent
                                title={coreValues[0].title}
                                size="text-2xl"
                                uppercase
                            />
                            <p className="mt-2 text-[#3B5518]">{coreValues[0].description}</p>
                        </div>
                    </FadeInUp>
                    <FadeInUp delay={0.22}>
                        <div>
                            <TitleComponent
                                title={coreValues[1].title}
                                size="text-2xl"
                                uppercase
                            />
                            <p className="mt-2 text-[#3B5518]">{coreValues[1].description}</p>
                        </div>
                    </FadeInUp>
                    <FadeInUp delay={0.29}>
                        <div>
                            <TitleComponent
                                title={coreValues[2].title}
                                size="text-2xl"
                                uppercase
                            />
                            <p className="mt-2 text-[#3B5518]">{coreValues[2].description}</p>
                        </div>
                    </FadeInUp>
                    <FadeInUp delay={0.34} className="pt-2 flex justify-center w-full">
                        <a
                            href={BOOKING_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#2F4413] via-[#3B5518] to-[#4A6720] px-6 py-3 text-sm font-semibold text-[#FDFBF7] border border-[#C5A869]/50 shadow-[0_8px_24px_rgba(47,68,19,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-300 hover:border-[#E5C77D] hover:shadow-[0_12px_30px_rgba(59,85,24,0.45),0_0_20px_rgba(197,168,105,0.35)] hover:scale-[1.03] whitespace-nowrap cursor-pointer"
                        >
                            <span className="tracking-wide">{t('home.bookTeaRoomBtn', 'Đặt phòng trà trực tuyến')}</span>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C5A869]/25 border border-[#C5A869]/40 text-[#FDFBF7] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#C5A869]/40">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </span>
                        </a>
                    </FadeInUp>
                </div>
                <CoreValueImageMarquee
                    id="gia-tri-cot-loi-slide-mobile"
                    style={{ width: 'calc(100vw - 16px)' }}
                />
            </div>

            {/* ── Desktop layout (lg+) ── */}
            <div className="hidden lg:block relative z-10">
                <NextImage
                    src="/images/bggiatricotloi.png"
                    alt="giá trị cốt lõi"
                    width={1920}
                    height={1080}
                    className="h-auto w-full"
                />
                <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
                    <div className="w-[80%] h-full relative flex flex-col items-center justify-around">
                        <FadeInUp>
                            <TitleComponent
                                title={t('home.coreValues', 'Giá trị cốt lõi')}
                                size="text-[40px]"
                            />
                        </FadeInUp>
                        <div className="w-[100%] flex items-center justify-center relative">
                            {/* Item 1: TRUYỀN THỐNG (Top Left) */}
                            <FadeInUp
                                delay={0.1}
                                className="absolute top-[28%] left-0 w-[26%] -translate-y-1/2"
                            >
                                <TitleComponent
                                    title={coreValues[0].title}
                                    size="text-[30px]"
                                    uppercase
                                />
                                <p className="mt-2 text-sm leading-5 text-[#3B5518]">{coreValues[0].description}</p>
                            </FadeInUp>

                            {/* CTA: Đặt phòng trà trực tuyến (Bottom Left - Red Box Location) */}
                            <FadeInUp
                                delay={0.25}
                                className="absolute top-[85%] left-0 w-auto -translate-y-1/2"
                            >
                                <a
                                    href={BOOKING_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-3.5 rounded-full bg-gradient-to-r from-[#2B3E12] via-[#3B5518] to-[#4A6720] px-7 py-3.5 text-sm xl:text-base font-semibold text-[#FDFBF7] border border-[#C5A869]/60 shadow-[0_10px_28px_rgba(47,68,19,0.35),0_0_15px_rgba(197,168,105,0.2),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-300 hover:border-[#E5C77D] hover:shadow-[0_14px_36px_rgba(47,68,19,0.5),0_0_24px_rgba(229,199,125,0.4)] hover:scale-[1.03] whitespace-nowrap cursor-pointer"
                                >
                                    <span className="tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{t('home.bookTeaRoomBtn', 'Đặt phòng trà trực tuyến')}</span>
                                    <span className="flex h-7 w-7 xl:h-8 xl:w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#C5A869]/20 border border-[#C5A869]/60 text-[#FDFBF7] shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:border-[#E5C77D] group-hover:bg-[#D4AF37]/45 group-hover:shadow-[0_0_12px_rgba(229,199,125,0.5)]">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                            <polyline points="15 3 21 3 21 9" />
                                            <line x1="10" y1="14" x2="21" y2="3" />
                                        </svg>
                                    </span>
                                </a>
                            </FadeInUp>

                            {/* Center Teapot Illustration */}
                            <FadeInUp
                                delay={0.2}
                                className="w-[60%]"
                            >
                                <NextImage
                                    src="/images/tra_tri_cot_loi.svg"
                                    alt=""
                                    width={1200}
                                    height={800}
                                    className="w-full h-full object-cover"
                                />
                            </FadeInUp>
                            <FadeInUp
                                delay={0.15}
                                className="absolute top-[25%] -right-10 w-[26%] -translate-y-1/2"
                            >
                                <TitleComponent
                                    title={coreValues[1].title}
                                    size="text-[30px]"
                                    uppercase
                                />
                                <p className="mt-2 text-sm leading-5 text-[#3B5518]">{coreValues[1].description}</p>
                            </FadeInUp>
                            <FadeInUp
                                delay={0.2}
                                className="absolute top-[85%] right-20 w-[26%] -translate-y-1/2"
                            >
                                <TitleComponent
                                    title={coreValues[2].title}
                                    size="text-[30px]"
                                    uppercase
                                />
                                <p className="mt-2 text-sm leading-5 text-[#3B5518]">{coreValues[2].description}</p>
                            </FadeInUp>
                        </div>
                        <FadeInUp
                            delay={0.24}
                            className="mt-5 flex w-full justify-center"
                        >
                            <CoreValueImageMarquee
                                id="gia-tri-cot-loi-slide-desktop"
                                style={{ width: 'calc(100vw - 32px)' }}
                            />
                        </FadeInUp>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TitleComponent = ({title, size, uppercase = false}: {title: string; size: string; uppercase?: boolean}) => {
    return (
        <div className={`seeme-heading ${size} font-semibold ${uppercase ? 'uppercase' : ''}`}>
            <h2>{title}</h2>
        </div>
    );
};

export default SectionGiaTriCotLoi;
