'use client';

import React from 'react';
import Image from 'next/image';
import FadeInUp from '@/components/animations/FadeInUp';
import StaggerContainer from '@/components/animations/StaggerContainer';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import SectionHeading from '@/components/ui/SectionHeading';
import { useLanguage } from '@/context/LanguageContext';

type YoutubePlayer = {
    seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
    playVideo?: () => void;
    pauseVideo?: () => void;
    getCurrentTime?: () => number;
    mute?: () => void;
    destroy?: () => void;
};

type YoutubePlayerConstructor = new (
    element: HTMLElement,
    options: {
        videoId: string;
        width?: string;
        height?: string;
        playerVars?: Record<string, number | string>;
        events?: {
            onReady?: () => void;
            onStateChange?: (event: { data: number }) => void;
        };
    },
) => YoutubePlayer;

declare global {
    interface Window {
        YT?: {
            Player: YoutubePlayerConstructor;
        };
        onYouTubeIframeAPIReady?: () => void;
    }
}

const VIDEO_ID = 'Fg4RYjgKjhs';
const PREVIEW_IMAGE = `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const PLAYER_STATE = {
    playing: 1,
    paused: 2,
};

const videoItems = [
    {
        number: '01',
        title: 'Toàn bộ cảnh thiên nhiên',
        description: 'Vượt mây qua cây cầu treo độc đạo, mở lối vào vùng đất mờ sương.',
        start: 0,
        end: 25,
    },
    {
        number: '02',
        title: 'Vùng trà / Cây trà cổ thụ',
        description: 'Nơi những gốc trà cổ thụ ngàn năm tuổi âm thầm giữ trọn nét hoang sơ.',
        start: 25,
        end: 85,
    },
    {
        number: '03',
        title: 'Cảnh hái trà',
        description: 'Những đôi tay mộc mạc nâng niu, thu hái từng búp non tinh túy của đất trời.',
        start: 85,
        end: 153,
    },
    {
        number: '04',
        title: 'Cảnh xưởng / Sao trà thủ công',
        description: 'Giữ lửa bếp truyền thống, nơi Lùng Vài Trà gói trọn trân quý hương vị đại ngàn.',
        start: 153,
        end: Number.POSITIVE_INFINITY,
    },
];

const getActiveIndexByTime = (time: number) => {
    const index = videoItems.findIndex((item) => time >= item.start && time < item.end);
    return index >= 0 ? index : videoItems.length - 1;
};

const canUsePlayer = (player: YoutubePlayer | null) =>
    Boolean(player && typeof player.playVideo === 'function' && typeof player.seekTo === 'function');

const playPlayer = (player: YoutubePlayer | null) => {
    if (typeof player?.playVideo === 'function') player.playVideo();
};

const pausePlayer = (player: YoutubePlayer | null) => {
    if (typeof player?.pauseVideo === 'function') player.pauseVideo();
};

const mutePlayer = (player: YoutubePlayer | null) => {
    if (typeof player?.mute === 'function') player.mute();
};

const SectionVideoVeChungToi = () => {
    const { t } = useLanguage();
    const sectionRef = React.useRef<HTMLDivElement | null>(null);
    const playerHostRef = React.useRef<HTMLDivElement | null>(null);
    const playerRef = React.useRef<YoutubePlayer | null>(null);
    const pendingSeekRef = React.useRef<number | null>(null);
    const pendingAutoplayRef = React.useRef(false);
    const isInViewportRef = React.useRef(false);
    const pauseByViewportRef = React.useRef(false);
    const userPausedRef = React.useRef(false);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [hasStarted, setHasStarted] = React.useState(false);

    const localizedVideoItems = React.useMemo(() => [
        {
            number: '01',
            title: t('videos.item1Title', videoItems[0].title),
            description: t('videos.item1Desc', videoItems[0].description),
            start: 0,
            end: 25,
        },
        {
            number: '02',
            title: t('videos.item2Title', videoItems[1].title),
            description: t('videos.item2Desc', videoItems[1].description),
            start: 25,
            end: 85,
        },
        {
            number: '03',
            title: t('videos.item3Title', videoItems[2].title),
            description: t('videos.item3Desc', videoItems[2].description),
            start: 85,
            end: 153,
        },
        {
            number: '04',
            title: t('videos.item4Title', videoItems[3].title),
            description: t('videos.item4Desc', videoItems[3].description),
            start: 153,
            end: Number.POSITIVE_INFINITY,
        },
    ], [t]);

    React.useEffect(() => {
        let cancelled = false;

        const createPlayer = () => {
            if (cancelled || !window.YT?.Player || !playerHostRef.current || playerRef.current) return;

            playerRef.current = new window.YT.Player(playerHostRef.current, {
                videoId: VIDEO_ID,
                width: '100%',
                height: '100%',
                playerVars: {
                    playsinline: 1,
                    rel: 0,
                    modestbranding: 1,
                    enablejsapi: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: () => {
                        const pendingSeek = pendingSeekRef.current;
                        if (pendingSeek !== null) {
                            playerRef.current?.seekTo?.(pendingSeek, true);
                            playPlayer(playerRef.current);
                            pendingSeekRef.current = null;
                        } else if (pendingAutoplayRef.current) {
                            mutePlayer(playerRef.current);
                            playPlayer(playerRef.current);
                            pendingAutoplayRef.current = false;
                        }
                    },
                    onStateChange: (event) => {
                        if (event.data === PLAYER_STATE.playing) {
                            userPausedRef.current = false;
                            return;
                        }

                        if (event.data !== PLAYER_STATE.paused) return;

                        if (pauseByViewportRef.current) {
                            pauseByViewportRef.current = false;
                            return;
                        }

                        if (isInViewportRef.current) {
                            userPausedRef.current = true;
                        }
                    },
                },
            });
        };

        if (window.YT?.Player) {
            createPlayer();
        } else {
            const previousReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                previousReady?.();
                createPlayer();
            };

            if (!document.getElementById('youtube-iframe-api')) {
                const script = document.createElement('script');
                script.id = 'youtube-iframe-api';
                script.src = 'https://www.youtube.com/iframe_api';
                script.async = true;
                document.body.appendChild(script);
            }
        }

        return () => {
            cancelled = true;
            playerRef.current?.destroy?.();
            playerRef.current = null;
        };
    }, []);

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            const currentTime = playerRef.current?.getCurrentTime?.();
            if (typeof currentTime !== 'number' || Number.isNaN(currentTime)) return;
            setActiveIndex(getActiveIndexByTime(currentTime));
        }, 500);

        return () => window.clearInterval(timer);
    }, []);

    React.useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                isInViewportRef.current = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.25);

                if (!entry?.isIntersecting || entry.intersectionRatio < 0.25) {
                    pauseByViewportRef.current = true;
                    pausePlayer(playerRef.current);
                    return;
                }

                if (entry.intersectionRatio < 0.45 || userPausedRef.current) return;

                setHasStarted(true);

                if (!canUsePlayer(playerRef.current)) {
                    pendingAutoplayRef.current = true;
                    return;
                }

                mutePlayer(playerRef.current);
                playPlayer(playerRef.current);
            },
            { threshold: [0.45] },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    const handleSelect = (index: number) => {
        const nextStart = videoItems[index].start;
        setActiveIndex(index);
        setHasStarted(true);
        userPausedRef.current = false;

        if (!canUsePlayer(playerRef.current)) {
            pendingSeekRef.current = nextStart;
            return;
        }

        const player = playerRef.current;
        player?.seekTo?.(nextStart, true);
        playPlayer(player);
    };

    const handlePlayPreview = () => {
        setHasStarted(true);
        userPausedRef.current = false;

        if (!canUsePlayer(playerRef.current)) {
            pendingSeekRef.current = 0;
            return;
        }

        playPlayer(playerRef.current);
    };

    return (
        <div
            ref={sectionRef}
            id="ve-chung-toi"
            className="relative overflow-hidden bg-[#dacdb6] scroll-mt-[30px] lg:scroll-mt-[50px]"
        >
            <AbsoluteBackground src="/images/Rectangle.png" />
            <div className="pointer-events-none absolute right-5 top-0 hidden h-full items-center justify-center lg:flex">
                <Image
                    src="/images/Group124.png"
                    alt=""
                    width={220}
                    height={720}
                    className="max-h-[88%] w-auto"
                />
            </div>

            <div className="relative z-10 flex flex-col items-center mt-0 px-4 py-10 sm:px-6 lg:min-h-[730px] lg:px-[6%] lg:pb-[64px] lg:pt-[48px]">
                <FadeInUp>
                    <SectionHeading title={t('home.videoTitle', 'Video về chúng tôi')} />
                </FadeInUp>

                <div className="mt-6 grid w-full grid-cols-1 gap-6 lg:mt-[60px] lg:grid-cols-2 lg:gap-10">
                    <FadeInUp
                        delay={0.1}
                        className="w-full"
                    >
                        <div className="seeme-youtube-frame relative aspect-video w-full overflow-hidden rounded-[8px] bg-black shadow-[0_12px_28px_rgba(59,85,24,0.16)]">
                            <div
                                ref={playerHostRef}
                                className="absolute inset-0 h-full w-full"
                            />
                            {!hasStarted && (
                                <button
                                    type="button"
                                    onClick={handlePlayPreview}
                                    className="absolute inset-0 z-10 block h-full w-full overflow-hidden bg-black"
                                    aria-label="Phát video về chúng tôi"
                                >
                                    <Image
                                        src={PREVIEW_IMAGE}
                                        alt=""
                                        fill
                                        sizes="(min-width: 1024px) 50vw, 100vw"
                                        unoptimized
                                        className="object-cover"
                                        onError={(event) => {
                                            event.currentTarget.src = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;
                                        }}
                                    />
                                    <span className="absolute inset-0 bg-black/5" />
                                    <span className="absolute left-1/2 top-1/2 flex h-16 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[18px] bg-[#ff0000] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:scale-105">
                                        <span className="ml-1 h-0 w-0 border-y-[13px] border-l-[21px] border-y-transparent border-l-white" />
                                    </span>
                                </button>
                            )}
                        </div>
                    </FadeInUp>

                    <StaggerContainer className="flex w-full flex-col gap-3 lg:min-h-full lg:justify-between">
                        {localizedVideoItems.map((item, index) => (
                            <ItemVideo
                                key={item.number}
                                number={item.number}
                                title={item.title}
                                description={item.description}
                                isActive={activeIndex === index}
                                onClick={() => handleSelect(index)}
                            />
                        ))}
                    </StaggerContainer>
                </div>
            </div>
            <style jsx>{`
                .seeme-youtube-frame :global(iframe) {
                    position: absolute;
                    inset: 0;
                    display: block;
                    width: 100% !important;
                    height: 100% !important;
                }
            `}</style>
        </div>
    );
};

const ItemVideo = ({
    number,
    title,
    description,
    isActive,
    onClick,
}: {
    number: string;
    title: string;
    description: string;
    isActive?: boolean;
    onClick: () => void;
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-4 text-left transition-colors duration-200 sm:gap-6 lg:min-h-[80px] lg:gap-10 lg:px-4 ${isActive ? 'bg-[#7F9635]' : 'hover:bg-[#7F9635]/15'
                }`}
        >
            <span
                className={`shrink-0 font-source-serif-4 text-3xl sm:text-4xl lg:text-5xl ${isActive ? 'text-white' : 'text-[#3B5518]'}`}
            >
                {number}
            </span>
            <span
                className={`w-24 shrink-0 text-center font-source-serif-4 font-bold text-balance sm:w-32 ${isActive ? 'text-white' : 'text-[#3B5518]'
                    }`}
            >
                {title}
            </span>
            <span className={`flex-1 text-center text-sm text-pretty ${isActive ? 'text-white' : 'text-[#3B5518]'}`}>
                {description}
            </span>
        </button>
    );
};

export default SectionVideoVeChungToi;
