'use client';

import React from 'react';
import ImageGallery from './ImageGallery';
import ProductInfo, {type ProductVariantOption} from './ProductInfo';
import type {AccordionItem} from './ProductInfo';

/**
 * Khung chi tiết trà: mỗi phân loại (biến thể) GẮN VỚI 1 ẢNH.
 * Chọn phân loại bên phải thì ảnh chính bên trái nhảy tới đúng ảnh của
 * phân loại đó; bấm thumbnail bên trái thì phân loại tương ứng cũng được
 * chọn theo. Ảnh hiển thị lấy từ chính biến thể API (mỗi biến thể có ảnh
 * bao bì riêng), không dùng chung 1 ảnh cho cả dòng trà.
 */
type Props = {
    name: string;
    productId: number;
    price: number;
    weight?: string;
    images?: string | null;
    accordionItems: AccordionItem[];
    variants: ProductVariantOption[];
    variantImages: {variantId: number; image: string}[];
};

export default function TeaDetailView({
    name,
    productId,
    price,
    weight,
    images,
    accordionItems,
    variants,
    variantImages,
}: Props) {
    const galleryImages = React.useMemo(() => {
        const seen = new Set<string>();
        const list: string[] = [];
        for (const entry of variantImages) {
            if (entry.image && !seen.has(entry.image)) {
                seen.add(entry.image);
                list.push(entry.image);
            }
        }
        return list.length > 0 ? list : ['/images/shan-tuyet-tea-tree.jpg'];
    }, [variantImages]);

    const imageIndexForVariant = React.useCallback(
        (variantId: number) => {
            const entry = variantImages.find((v) => v.variantId === variantId);
            if (!entry) return 0;
            const idx = galleryImages.indexOf(entry.image);
            return idx >= 0 ? idx : 0;
        },
        [variantImages, galleryImages],
    );

    // Dòng nhiều phân loại mở lên chưa chọn phân loại nào (giá hiện khoảng
    // min–max, bấm thêm vào giỏ sẽ bắt chọn); dòng chỉ 1 phân loại thì chọn
    // sẵn luôn vì không có gì để chọn.
    const [selectedVariantId, setSelectedVariantId] = React.useState<number | null>(() =>
        variants.length > 1 ? null : productId,
    );
    const [activeIndex, setActiveIndex] = React.useState<number>(() =>
        variants.length > 1 ? 0 : imageIndexForVariant(productId),
    );

    const handleVariantChange = React.useCallback(
        (variantId: number) => {
            setSelectedVariantId(variantId);
            setActiveIndex(imageIndexForVariant(variantId));
        },
        [imageIndexForVariant],
    );

    const handleGalleryIndexChange = React.useCallback(
        (index: number) => {
            setActiveIndex(index);
            const src = galleryImages[index];
            const entry = variantImages.find((v) => v.image === src);
            if (entry) setSelectedVariantId(entry.variantId);
        },
        [galleryImages, variantImages],
    );

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
            <ImageGallery images={galleryImages} name={name} activeIndex={activeIndex} onActiveIndexChange={handleGalleryIndexChange} />
            <ProductInfo
                key={productId}
                id={productId}
                name={name}
                price={price}
                unit="hộp"
                weight={weight}
                images={images}
                accordionItems={accordionItems}
                variants={variants}
                selectedVariantId={selectedVariantId}
                onVariantChange={handleVariantChange}
            />
        </div>
    );
}
