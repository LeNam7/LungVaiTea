'use client';

import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {ArrowLeft, ArrowRight} from './icons';
import {generateTeaQrOnlyDataUrl} from '@/utils/teaQr';

const FALLBACK_IMG = '/images/shan-tuyet-tea-tree.jpg';

type Props = {
    images: string[];
    name: string;
    teaId?: number;
};

export default function ImageGallery({images, name, teaId}: Props) {
    const [activeImg, setActiveImg] = useState(0);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
    const mainImgRef = useRef<HTMLImageElement>(null);
    const galleryImages = useMemo(() => (teaId && qrImage ? [...images, qrImage] : images), [images, qrImage, teaId]);

    const handleImgError = useCallback((e: React.SyntheticEvent<HTMLImageElement> | HTMLImageElement) => {
        const img = 'currentTarget' in e ? e.currentTarget : e;
        img.onerror = null;
        img.src = FALLBACK_IMG;
        setLoadedImages((prev) => ({...prev, [img.src]: true, [FALLBACK_IMG]: true}));
    }, []);

    const markImageLoaded = useCallback((src: string) => {
        setLoadedImages((prev) => (prev[src] ? prev : {...prev, [src]: true}));
    }, []);

    const safeActiveImg = activeImg < galleryImages.length ? activeImg : 0;
    const activeSrc = galleryImages[safeActiveImg] ?? FALLBACK_IMG;
    const isActiveQrImage = Boolean(qrImage && activeSrc === qrImage);

    // Handle image 404 that fires before hydration
    useEffect(() => {
        const img = mainImgRef.current;
        if (img && img.complete && img.naturalWidth === 0) {
            img.src = FALLBACK_IMG;
        }
    }, [activeImg]);

    useEffect(() => {
        if (!galleryImages.length) return;
        const indexes = [safeActiveImg, safeActiveImg + 1, safeActiveImg - 1]
            .map((idx) => (idx + galleryImages.length) % galleryImages.length)
            .filter((idx, idxPos, arr) => arr.indexOf(idx) === idxPos);

        indexes.forEach((idx) => {
            const src = galleryImages[idx];
            if (!src || loadedImages[src]) return;
            const image = new Image();
            image.onload = () => markImageLoaded(src);
            image.onerror = () => markImageLoaded(src);
            image.src = src;
        });
    }, [galleryImages, loadedImages, markImageLoaded, safeActiveImg]);

    useEffect(() => {
        let mounted = true;
        if (!teaId) return;

        generateTeaQrOnlyDataUrl({id: teaId, name}, 920)
            .then((src) => {
                if (mounted) setQrImage(src);
            })
            .catch(() => {
                if (mounted) setQrImage(null);
            });

        return () => {
            mounted = false;
        };
    }, [name, teaId]);

    const prevImg = () => setActiveImg((p) => (p === 0 ? galleryImages.length - 1 : p - 1));
    const nextImg = () => setActiveImg((p) => (p === galleryImages.length - 1 ? 0 : p + 1));

    // Thumb vuông; hiện HẾT tất cả ảnh, nhiều thì cột tự cuộn (không còn
    // ô mờ "+N"). shrink-0 để flex không bóp thumb lại khi danh sách dài
    // hơn khung.

    // Zoom toàn ảnh khi hover: ảnh phóng to 2x, di chuột trong khung thì ảnh
    // di chuyển theo để xem cận cây (transform-origin chạy theo chuột).
    const [zoomOrigin, setZoomOrigin] = useState<{x: number; y: number} | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setZoomOrigin({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    };

    // Bấm Esc để đóng khung xem toàn ảnh.
    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen]);

    return (
        <>
            {/* Desktop: thumbnails left + main right. Khoi gallery neo theo
                khi cuon noi dung ben phai (chi desktop; mobile giu nguyen). */}
            <div className="flex gap-3 lg:sticky lg:top-24 lg:self-start">
                {/* Thumbnails - vertical on desktop, cuon rieng khi danh sach
                    dai qua anh chinh (anh chinh cao 480px o desktop). Cột neo
                    tuyệt đối vào khung gallery (top-0/bottom-0) để cao đúng
                    bằng ảnh lớn: flex stretch đã đo thực tế không giãn cột này. */}
                <div className="hidden lg:absolute lg:left-0 lg:top-0 lg:bottom-0 lg:flex flex-col justify-between gap-2 w-[90px] shrink-0 lg:overflow-y-auto custom-scroll pr-1">
                    {galleryImages.map((src, idx) => {
                        const isQrImage = Boolean(qrImage && src === qrImage);
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveImg(idx)}
                                aria-label={isQrImage ? `Xem mã QR ${name}` : `Xem ảnh ${idx + 1} của ${name}`}
                                className={`relative rounded-lg overflow-hidden border-2 transition-colors aspect-square shrink-0 ${
                                    safeActiveImg === idx ? 'border-[#7F9635]' : 'border-transparent'
                                }`}
                            >
                                {!loadedImages[src] && (
                                    <span className="block aspect-square w-full animate-pulse rounded-md bg-[#7F9635]/15" />
                                )}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={src}
                                    alt={isQrImage ? `QR ${name}` : ''}
                                    className={`h-full w-full transition-opacity duration-300 ${loadedImages[src] ? 'opacity-100' : 'absolute inset-0 opacity-0'} ${isQrImage ? 'object-contain' : 'object-cover'}`}
                                    loading="eager"
                                    onLoad={() => markImageLoaded(src)}
                                    onError={(e) => handleImgError(e)}
                                />
                            </button>
                        );
                    })}
                </div>

                {/* Main image - khung vuông, crop vừa khung, hover zoom 2x để xem
                    cận cây, bấm vào để xem toàn ảnh. Chừa chỗ cho cột thumb
                    neo tuyệt đối (90px + gap 12px). */}
                <div className="flex-1 lg:ml-[102px]">
                    <div
                        className="rounded-xl overflow-hidden relative bg-[#EDE1D4] aspect-square"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setZoomOrigin(null)}
                        onClick={() => setLightboxOpen(true)}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={mainImgRef}
                            src={activeSrc}
                            alt={isActiveQrImage ? `QR ${name}` : name}
                            className="w-full h-full object-cover cursor-zoom-in transition-transform duration-200 ease-out"
                            style={{
                                transform: zoomOrigin ? 'scale(2)' : 'scale(1)',
                                transformOrigin: zoomOrigin ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : 'center',
                            }}
                            loading="eager"
                            onLoad={() => markImageLoaded(activeSrc)}
                            onError={(e) => handleImgError(e)}
                        />
                        <div
                            className="absolute bottom-3 right-3 flex gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={prevImg}
                                className="h-11 w-11 rounded-full bg-primary/60 border border-[#E4D7BD]/30 flex items-center justify-center hover:bg-primary/80 transition-colors"
                                aria-label="Ảnh cây trà trước"
                            >
                                <ArrowLeft />
                            </button>
                            <button
                                onClick={nextImg}
                                className="h-11 w-11 rounded-full bg-primary/60 border border-[#E4D7BD]/30 flex items-center justify-center hover:bg-primary/80 transition-colors"
                                aria-label="Ảnh cây trà tiếp theo"
                            >
                                <ArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile thumbnails - horizontal */}
            <div className="flex gap-2 overflow-x-auto lg:hidden -mt-4 mb-2">
                {galleryImages.map((src, idx) => {
                    const isQrImage = Boolean(qrImage && src === qrImage);
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImg(idx)}
                            aria-label={isQrImage ? `Xem mã QR ${name}` : `Xem ảnh ${idx + 1} của ${name}`}
                            className={`relative rounded-lg overflow-hidden border-2 shrink-0 ${
                                safeActiveImg === idx ? 'border-[#7F9635]' : 'border-transparent'
                            }`}
                        >
                            {!loadedImages[src] && (
                                <span className="block h-16 w-16 animate-pulse rounded-md bg-[#7F9635]/15" />
                            )}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={src}
                                alt={isQrImage ? `QR ${name}` : ''}
                                className={`h-16 w-16 transition-opacity duration-300 ${loadedImages[src] ? 'opacity-100' : 'absolute inset-0 opacity-0'} ${isQrImage ? 'object-contain' : 'object-cover'}`}
                                loading="eager"
                                onLoad={() => markImageLoaded(src)}
                                onError={(e) => {
                                    const i = e.currentTarget;
                                    i.onerror = null;
                                    i.src = FALLBACK_IMG;
                                    markImageLoaded(FALLBACK_IMG);
                                }}
                            />
                        </button>
                    );
                })}
            </div>

            {/* Xem toàn ảnh: bấm vào ảnh chính để mở, bấm nền hoặc Esc để đóng. */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
                    onClick={() => setLightboxOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Xem toàn ảnh ${name}`}
                >
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            prevImg();
                        }}
                        className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
                        aria-label="Ảnh trước"
                    >
                        <ArrowLeft />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={activeSrc}
                        alt={isActiveQrImage ? `QR ${name}` : name}
                        className="max-h-[88vh] max-w-[88vw] rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => handleImgError(e)}
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            nextImg();
                        }}
                        className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
                        aria-label="Ảnh tiếp theo"
                    >
                        <ArrowRight />
                    </button>
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(false)}
                        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-white transition-colors hover:bg-white/30"
                        aria-label="Đóng"
                    >
                        ✕
                    </button>
                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                        {safeActiveImg + 1} / {galleryImages.length}
                    </span>
                </div>
            )}

        </>
    );
}
