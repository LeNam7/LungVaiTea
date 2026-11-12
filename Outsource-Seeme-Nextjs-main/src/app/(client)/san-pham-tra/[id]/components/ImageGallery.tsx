'use client';

import React, {useState} from 'react';
import {ArrowLeft, ArrowRight} from './icons';

type Props = {
    images: string[];
    name: string;
    /** Ảnh đang hiển thị, do component cha điều khiển khi gắn phân loại
     * với ảnh (chọn phân loại thì nhảy tới ảnh đó). Không có thì tự quản. */
    activeIndex?: number;
    onActiveIndexChange?: (index: number) => void;
};

export default function ImageGallery({images, name, activeIndex: controlledIndex, onActiveIndexChange}: Props) {
    const [internalIndex, setInternalIndex] = useState(0);
    const rawIndex = controlledIndex ?? internalIndex;
    const activeImg = images.length > 0 ? Math.min(Math.max(rawIndex, 0), images.length - 1) : 0;
    const setActiveImg = (index: number) => {
        if (onActiveIndexChange) onActiveIndexChange(index);
        else setInternalIndex(index);
    };

    const prevImg = () => setActiveImg(activeImg === 0 ? images.length - 1 : activeImg - 1);
    const nextImg = () => setActiveImg(activeImg === images.length - 1 ? 0 : activeImg + 1);

    // Thumb vuông; hiện HẾT tất cả ảnh, nhiều thì cột tự cuộn (không còn
    // ô mờ "+N"). shrink-0 để flex không bóp thumb lại khi danh sách dài
    // hơn khung.

    // Zoom toàn ảnh khi hover: ảnh phóng to 2x, di chuột trong khung thì ảnh
    // di chuyển theo để góc dưới chuột hiện ra (transform-origin chạy theo chuột).
    // Không phải kiểu ống kính tròn chỉ phóng 1 cục.
    const [zoomOrigin, setZoomOrigin] = useState<{x: number; y: number} | null>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setZoomOrigin({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    };

    return (
        <>
            {/* Desktop: thumbnails left + main right. Khoi gallery neo theo
                khi cuon noi dung ben phai (chi desktop; mobile giu nguyen). */}
            <div className="flex gap-3 lg:sticky lg:top-24 lg:self-start">
                {/* Thumbnails - vertical on desktop, cuon rieng khi danh sach
                    dai qua anh chinh de anh to luon hien du. Cột neo tuyệt đối
                    vào khung gallery (top-0/bottom-0) để cao đúng bằng ảnh
                    lớn: flex stretch đã đo thực tế không giãn cột này (cột
                    chỉ cao bằng nội dung, 462px so với ảnh lớn 544px). */}
                <div className="hidden lg:absolute lg:left-0 lg:top-0 lg:bottom-0 lg:flex flex-col justify-start gap-2 w-[90px] shrink-0 lg:overflow-y-auto custom-scroll pr-1">
                    {images.map((src, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveImg(idx)}
                            aria-label={`Xem ảnh ${idx + 1}`}
                            className={`relative rounded-lg overflow-hidden border-2 transition-colors aspect-square shrink-0 ${
                                activeImg === idx ? 'border-[#7F9635]' : 'border-transparent'
                            }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={src}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { const i = e.currentTarget; i.onerror = null; i.src = '/images/shan-tuyet-tea-tree.jpg'; }}
                            />
                        </button>
                    ))}
                </div>

                {/* Main image - chừa chỗ cho cột thumb neo tuyệt đối (90px + gap 12px) */}
                <div className="flex-1 lg:ml-[102px]">
                    <div
                        className="rounded-2xl overflow-hidden bg-[#EDE1D4] relative aspect-square"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setZoomOrigin(null)}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={images[activeImg]}
                            alt={name}
                            className="w-full h-full object-contain transition-transform duration-200 ease-out cursor-zoom-in"
                            style={{
                                transform: zoomOrigin ? 'scale(2)' : 'scale(1)',
                                transformOrigin: zoomOrigin ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : 'center',
                            }}
                            onError={(e) => { const i = e.currentTarget; i.onerror = null; i.src = '/images/shan-tuyet-tea-tree.jpg'; }}
                            onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth === 0) { i.src = '/images/shan-tuyet-tea-tree.jpg'; } }}
                        />
                        <div className="absolute bottom-3 right-3 z-20 flex gap-2">
                            <button
                                onClick={prevImg}
                                className="h-11 w-11 rounded-full bg-primary/70 border border-[#E4D7BD]/30 flex items-center justify-center hover:bg-primary transition-colors"
                                aria-label="Ảnh sản phẩm trước"
                            >
                                <ArrowLeft />
                            </button>
                            <button
                                onClick={nextImg}
                                className="h-11 w-11 rounded-full bg-primary/70 border border-[#E4D7BD]/30 flex items-center justify-center hover:bg-primary transition-colors"
                                aria-label="Ảnh sản phẩm tiếp theo"
                            >
                                <ArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile thumbnails - horizontal */}
            <div className="flex gap-2 overflow-x-auto lg:hidden -mt-4 mb-2">
                {images.map((src, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveImg(idx)}
                        className={`rounded-lg overflow-hidden border-2 shrink-0 ${
                            activeImg === idx ? 'border-[#7F9635]' : 'border-transparent'
                        }`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt=""
                            className="w-16 h-16 object-cover"
                            onError={(e) => { const i = e.currentTarget; i.onerror = null; i.src = '/images/shan-tuyet-tea-tree.jpg'; }}
                        />
                    </button>
                ))}
            </div>

        </>
    );
}
