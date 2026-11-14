'use client';

import React from 'react';
import { preconnect, preload } from 'react-dom';
import HeroAnimate from '@/components/animations/HeroAnimate';
import { motion } from 'framer-motion';
import { HOME_COPY } from '@/constants/brand';
import { useLanguage } from '@/context/LanguageContext';

const VIDEO_ASSET_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_ASSET_BASE_URL || '/videos';
const BANNER_ASSET_VERSION = '20260729';
const DESKTOP_VIDEO_SRC = process.env.NEXT_PUBLIC_HOME_BANNER_VIDEO_DESKTOP || (VIDEO_ASSET_BASE_URL ? `${VIDEO_ASSET_BASE_URL}/home-banner-desktop-v7.mp4?v=${BANNER_ASSET_VERSION}` : undefined);
const MOBILE_VIDEO_SRC = process.env.NEXT_PUBLIC_HOME_BANNER_VIDEO_MOBILE || (VIDEO_ASSET_BASE_URL ? `${VIDEO_ASSET_BASE_URL}/home-banner-mobile-v7.mp4?v=${BANNER_ASSET_VERSION}` : undefined);
const DESKTOP_POSTER_SRC = process.env.NEXT_PUBLIC_HOME_BANNER_POSTER_DESKTOP || (VIDEO_ASSET_BASE_URL ? `${VIDEO_ASSET_BASE_URL}/home-banner-poster-desktop-v5.jpg?v=${BANNER_ASSET_VERSION}` : '/images/bghome.png');
const MOBILE_POSTER_SRC = process.env.NEXT_PUBLIC_HOME_BANNER_POSTER_MOBILE || (VIDEO_ASSET_BASE_URL ? `${VIDEO_ASSET_BASE_URL}/home-banner-poster-mobile-v5.jpg?v=${BANNER_ASSET_VERSION}` : '/images/bghome.png');

const getAssetOrigin = (url: string) => {
    try {
        if (!url.startsWith('http://') && !url.startsWith('https://')) return undefined;
        return new URL(url).origin;
    } catch {
        return undefined;
    }
};

const VIDEO_ASSET_ORIGIN = getAssetOrigin(VIDEO_ASSET_BASE_URL);

// Toggle to true when the banner copy overlay should be shown again.
const SHOW_BANNER_COPY = false;

const SectionBanner = () => {
    const { t } = useLanguage();
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const [videoReady, setVideoReady] = React.useState(false);
    const [posterError, setPosterError] = React.useState(false);

    if (VIDEO_ASSET_ORIGIN) {
        preconnect(VIDEO_ASSET_ORIGIN);
    }

    if (DESKTOP_POSTER_SRC) {
        preload(DESKTOP_POSTER_SRC, {
            as: 'image',
            fetchPriority: 'high',
            media: '(min-width: 1024px)',
        });
    }
    if (MOBILE_POSTER_SRC) {
        preload(MOBILE_POSTER_SRC, {
            as: 'image',
            fetchPriority: 'high',
            media: '(max-width: 1023px)',
        });
    }
    if (DESKTOP_VIDEO_SRC) {
        preload(DESKTOP_VIDEO_SRC, {
            as: 'video',
            type: 'video/mp4',
            fetchPriority: 'high',
            media: '(min-width: 1024px)',
        });
    }
    if (MOBILE_VIDEO_SRC) {
        preload(MOBILE_VIDEO_SRC, {
            as: 'video',
            type: 'video/mp4',
            fetchPriority: 'high',
            media: '(max-width: 1023px)',
        });
    }

    React.useEffect(() => {
        if (!DESKTOP_VIDEO_SRC && !MOBILE_VIDEO_SRC) return;
        const video = videoRef.current;
        if (!video) return;

        const markVideoReady = () => setVideoReady(true);
        const playVideo = () => {
            if (!video.paused) {
                markVideoReady();
                return;
            }

            // Banner luôn tắt tiếng: trước đây code thử phát có tiếng trước rồi
            // mới rơi về tắt tiếng khi trình duyệt chặn, nên khách nghe thấy tiếng.
            video.muted = true;
            video.play().then(() => {
                if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                    markVideoReady();
                }
            }).catch(() => {
                // Autoplay can still be blocked in some browser/privacy modes; poster remains visible.
            });
        };

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            markVideoReady();
        }

        playVideo();
        video.addEventListener('loadedmetadata', playVideo, { once: true });
        video.addEventListener('loadeddata', markVideoReady);
        video.addEventListener('canplay', markVideoReady);
        video.addEventListener('playing', markVideoReady);

        return () => {
            video.removeEventListener('loadedmetadata', playVideo);
            video.removeEventListener('loadeddata', markVideoReady);
            video.removeEventListener('canplay', markVideoReady);
            video.removeEventListener('playing', markVideoReady);
        };
    }, []);

    return (
        <div className="bg-primary">
            <h1 className="sr-only">
                {t('home.bannerTitle', HOME_COPY.bannerTitle)} - {t('home.bannerDescription', HOME_COPY.bannerDescription)}
            </h1>
            <div className="relative h-[435px] overflow-hidden sm:h-[560px] lg:h-[628px] xl:h-[640px]">
                <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {posterError ? (
                        <img
                            src="/images/bghome.png"
                            alt="Lùng Vài Tea"
                            aria-hidden="true"
                            fetchPriority="high"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <picture className="absolute inset-0 block h-full w-full">
                            <source
                                media="(max-width: 1023px)"
                                srcSet={MOBILE_POSTER_SRC}
                            />
                            <img
                                src={DESKTOP_POSTER_SRC}
                                alt="Lùng Vài Tea"
                                aria-hidden="true"
                                fetchPriority="high"
                                className="h-full w-full object-cover"
                                onError={() => setPosterError(true)}
                            />
                        </picture>
                    )}
                    {(DESKTOP_VIDEO_SRC || MOBILE_VIDEO_SRC) && (
                        <video
                            ref={videoRef}
                            aria-hidden="true"
                            autoPlay
                            muted
                            loop
                            playsInline
                            controls={false}
                            disablePictureInPicture
                            preload="auto"
                            poster={DESKTOP_POSTER_SRC}
                            onLoadedData={() => setVideoReady(true)}
                            onCanPlay={() => setVideoReady(true)}
                            onPlaying={() => setVideoReady(true)}
                            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                        >
                            {MOBILE_VIDEO_SRC && (
                                <source
                                    src={MOBILE_VIDEO_SRC}
                                    media="(max-width: 1023px)"
                                    type="video/mp4"
                                />
                            )}
                            {DESKTOP_VIDEO_SRC && (
                                <source
                                    src={DESKTOP_VIDEO_SRC}
                                    media="(min-width: 1024px)"
                                    type="video/mp4"
                                />
                            )}
                        </video>
                    )}
                </motion.div>
                {SHOW_BANNER_COPY && (
                    <>
                        <div className="absolute bottom-0 left-0 right-0 h-[90%] bg-[linear-gradient(180deg,rgba(59,85,24,0)_37.73%,rgba(59,85,24,0.8)_66.46%,rgba(59,85,24,0.95)_76.62%,#3B5518_85.52%)]" />
                        <div className="absolute bottom-[9%] left-[5%] w-[90%] sm:w-[70%] lg:bottom-auto lg:top-[50%] lg:w-[42%]">
                            <HeroAnimate delay={0.3}>
                                <p className="font-source-serif-4 text-3xl text-white sm:text-4xl lg:text-6xl">
                                    {t('home.bannerTitle', HOME_COPY.bannerTitle)}
                                </p>
                            </HeroAnimate>
                            <HeroAnimate delay={0.55}>
                                <p className="mt-2 text-xs leading-5 text-white sm:text-sm lg:text-base lg:leading-7">
                                    {t('home.bannerDescription', HOME_COPY.bannerDescription)}
                                </p>
                            </HeroAnimate>
                        </div>
                        <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 items-center gap-2 lg:flex">
                            {[0, 1, 2, 3, 4].map((dot) => (
                                <span
                                    key={dot}
                                    className={`h-2.5 w-2.5 rounded-full ${dot === 2 ? 'bg-[#DCE7C4]' : 'bg-[#7F9635]'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SectionBanner;
