'use client';

import React from 'react';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import ImageGallery from './ImageGallery';
import GiftProductInfo from './GiftProductInfo';
import RelatedProducts from './RelatedProducts';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import {getFirstApiImageUrl, parseApiImageList, resolveApiImageUrl} from '@/utils/imageUrl';
import {GIFT_COLLECTIONS, giftsFromApiProducts, type GiftPackaging, type GiftProduct} from '@/lib/tea-taxonomy';
import {getProductsPagingAPI} from '@/api/ProductAPI';
import {unwrapPagingData} from '@/api/response';
import type {Product} from '@/types/swagger.types';

/** Trang chi tiết set quà tặng. Nguồn duy nhất là API (prop gift); link slug cũ (gift-...) đối chiếu sang set quà thật trên API theo tên. */
export default function GiftDetail({slug, gift: apiGift, relatedGifts, initialPackagingId}: {slug: string; gift?: GiftProduct; relatedGifts?: GiftProduct[]; initialPackagingId?: number}) {
    const [apiGiftBySlug, setApiGiftBySlug] = useState<GiftProduct | null>(null);
    const [apiRelated, setApiRelated] = useState<GiftProduct[] | null>(null);
    // Danh sách ảnh gallery LUÔN đủ ngay từ đầu: ảnh quy cách + TẤT CẢ ảnh màu
    // của quy cách đang chọn (không đợi bấm màu mới hiện ảnh màu). Lưu kèm slug
    // để đổi set khác thì tự về ảnh mặc định của set đó mà không cần effect reset
    // (tránh lỗi lint set-state-in-effect); callback đổi quy cách mới set state này.
    const [galleryOverride, setGalleryOverride] = useState<{slug: string; images: string[]} | null>(null);
    const [galleryActiveIndex, setGalleryActiveIndex] = useState(0);
    // Link slug cũ (gift-...) ưu tiên đối chiếu sang set quà thật trên API nếu tên khớp, để không còn 2 bản Huyền Nhất song song.
    useEffect(() => {
        if (apiGift) return;
        let ignore = false;
        getProductsPagingAPI({pageIndex: 1, pageSize: 100, isActive: true} as any)
            .then((res) => {
                if (ignore) return;
                const all = unwrapPagingData<Product>(res).data;
                const gifts = giftsFromApiProducts(all);
                const match = gifts.find((g) => g.slug === slug) ?? null;
                setApiGiftBySlug(match);
                if (match) setApiRelated(gifts.filter((g) => g.collectionId === match.collectionId && g.slug !== match.slug));
            })
            .catch(() => {
                /* fallback local */
            });
        return () => {
            ignore = true;
        };
    }, [apiGift, slug]);
    const gift = apiGift ?? apiGiftBySlug;

    if (!gift) {
        return (
            <div className="bg-[#3B5518] min-h-screen text-[#E4D7BD] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-source-serif-4 text-4xl text-[#7F9635] mb-4">Không tìm thấy set quà tặng</h1>
                    <Link href="/san-pham-tra?group=set-qua-tang" className="text-[#E4D7BD] underline">
                        Quay lại danh sách set quà tặng
                    </Link>
                </div>
            </div>
        );
    }

    const collection = GIFT_COLLECTIONS.find((c) => c.id === gift.collectionId);
    const defaultImages = parseApiImageList(gift.image).map((image) => resolveApiImageUrl(image, '/images/shan-tuyet-tea-tree.jpg'));
    const defaultOrFallback = defaultImages.length > 0 ? defaultImages : ['/images/shan-tuyet-tea-tree.jpg'];
    // Ảnh của 1 quy cách = ảnh quy cách + ảnh của mọi màu thuộc quy cách đó (trừ
    // trùng), giống đúng tập màu ô "Chọn màu" đang hiện, để danh sách ảnh con hiện
    // full ngay từ đầu, kể cả ảnh màu.
    const packagingGalleryImages = (pkg: GiftPackaging | undefined): string[] => {
        const imgs = parseApiImageList(pkg?.image).map((image) => resolveApiImageUrl(image, '/images/shan-tuyet-tea-tree.jpg'));
        const colorImgs = (pkg?.colors ?? gift.colors)
            .map((c) => c.image)
            .filter((image): image is string => !!image)
            .map((image) => resolveApiImageUrl(image, '/images/shan-tuyet-tea-tree.jpg'));
        return [...imgs, ...colorImgs.filter((image) => !imgs.includes(image))];
    };
    const initialPackaging = gift.packagings.find((p) => p.apiId === initialPackagingId) ?? gift.packagings[0];
    const initialPkgImages = packagingGalleryImages(initialPackaging);
    const images =
        galleryOverride && galleryOverride.slug === gift.slug
            ? galleryOverride.images.length > 0
                ? galleryOverride.images
                : defaultOrFallback
            : initialPkgImages.length > 0
              ? initialPkgImages
              : defaultOrFallback;
    const galleryIndex = Math.min(Math.max(galleryActiveIndex, 0), images.length - 1);
    const accordionItems = [
        {title: 'Thông tin sản phẩm', content: gift.description || 'Đang cập nhật.'},
        {
            title: 'Quy cách & Khối lượng',
            content:
                gift.packagings.length > 1
                    ? `Các quy cách đóng gói của set này:\n${gift.packagings
                          .map((p) => `- ${p.packaging}: ${p.price.toLocaleString('vi-VN')} VND`)
                          .join('\n')}`
                    : `Quy cách đóng gói: ${gift.packaging}\nKhối lượng tịnh: ${gift.gram}g / set`,
        },
        {title: 'Hướng dẫn sử dụng', content: gift.userManual || 'Đang cập nhật.'},
        {title: 'Hướng dẫn bảo quản', content: gift.storageInstructions || 'Đang cập nhật.'},
    ];

    const related: GiftProduct[] = relatedGifts ?? apiRelated ?? [];

    return (
        <div className="relative min-h-screen overflow-clip bg-[#DCCFB4] text-[#3B5518]">
            <AbsoluteBackground src="/images/bg-sptrapage.png" className="object-top" />
            <div className="relative z-10 h-[140px] sm:h-[170px] lg:h-[220px] -mt-11 lg:-mt-18">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/bghome.png" alt="banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(59,85,24,0)_28%,rgba(59,85,24,0.42)_62%,#DCCFB4_100%)]" />
            </div>

            {/* Breadcrumb phân cấp mới: Danh mục trà / Set quà tặng / Bộ sưu tập / Sản phẩm */}
            <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-[50px] -mt-6 pb-2 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                <Link href="/" className="hover:text-[#7F9635] opacity-70 transition-colors">
                    Home
                </Link>
                <span className="opacity-70">/</span>
                <Link href="/san-pham-tra" className="hover:text-[#7F9635] opacity-70 transition-colors">
                    Danh mục trà
                </Link>
                <span className="opacity-70">/</span>
                <Link
                    href="/san-pham-tra?group=set-qua-tang"
                    className="hover:text-[#7F9635] opacity-70 transition-colors"
                >
                    Set quà tặng
                </Link>
                {collection ? (
                    <>
                        <span className="opacity-70">/</span>
                        <Link
                            href={`/san-pham-tra?group=set-qua-tang&collection=${collection.id}`}
                            className="hover:text-[#7F9635] opacity-70 transition-colors"
                        >
                            {collection.name}
                        </Link>
                    </>
                ) : null}
                <span className="opacity-70">/</span>
                <span className="font-semibold text-[#3B5518] truncate max-w-[200px]">{gift.name}</span>
            </div>

            <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-[50px] py-6 lg:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                    <ImageGallery
                        images={images}
                        name={gift.name}
                        activeIndex={galleryIndex}
                        onActiveIndexChange={setGalleryActiveIndex}
                    />
                    <GiftProductInfo
                        gift={gift}
                        index={0}
                        accordionItems={accordionItems}
                        initialPackagingId={initialPackagingId}
                        onPackagingChange={(pkg) => {
                            setGalleryOverride({slug: gift.slug, images: packagingGalleryImages(pkg)});
                            setGalleryActiveIndex(0);
                        }}
                        onColorChange={(color) => {
                            // Ảnh màu đã có sẵn trong danh sách từ đầu nên chỉ cần
                            // nhảy ảnh to tới đúng vị trí của ảnh màu đó.
                            if (!color?.image) return;
                            const idx = images.indexOf(resolveApiImageUrl(color.image, '/images/shan-tuyet-tea-tree.jpg'));
                            if (idx >= 0) setGalleryActiveIndex(idx);
                        }}
                    />
                </div>
            </div>

            {related.length > 0 && (
                <div className="relative z-10 mt-8 border-t border-[#E4D7BD]/10 pt-10">
                    <RelatedProducts
                        related={related.map((g) => ({
                            id: g.apiId ?? 0,
                            href: g.apiId ? `/san-pham-tra/${g.apiId}` : `/san-pham-tra/${g.slug}`,
                            name: g.name,
                            price: g.priceMin,
                            weight: `${g.gram}g`,
                            image: getFirstApiImageUrl(g.image, '/images/shan-tuyet-tea-tree.jpg'),
                        }))}
                    />
                </div>
            )}
        </div>
    );
}
