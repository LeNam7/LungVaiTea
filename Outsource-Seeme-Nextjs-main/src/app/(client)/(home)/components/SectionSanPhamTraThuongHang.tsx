'use client';

import ButtonComponent from '@/components/form/ButtonComponent';
import React from 'react';
import Link from 'next/link';
import {getProductsPagingAPI} from '@/api/ProductAPI';
import {useTeaGroups} from '@/hooks/useTeaGroups';
import {unwrapPagingData} from '@/api/response';
import type {Product} from '@/types/swagger.types';
import {groupGiftProducts, groupProductsIntoLines, type GiftProduct, type ProductLine} from '@/lib/tea-taxonomy';
import {getFirstApiImageUrl} from '@/utils/imageUrl';
import FadeInUp from '@/components/animations/FadeInUp';
import TeaProductCard from '@/components/common/TeaProductCard';
import {formatVndDesign, withTimeout} from '@/utils/designFallbacks';
import type {TeaProductTag} from '@/components/common/TeaProductCard';
import SectionHeading from '@/components/ui/SectionHeading';
import {HOME_COPY} from '@/constants/brand';
import {useLanguage} from '@/context/LanguageContext';

const FEATURED_TAGS: Record<number, TeaProductTag> = {
    0: 'sold-out',
    1: 'new',
    2: 'best-seller',
    3: 'best-seller',
};

const HOME_PRODUCT_LIMIT = 5;

let allProductsCache: Product[] | null = null;
let allProductsRequest: Promise<Product[]> | null = null;

const getImageUrl = (images?: string | null) => {
    return getFirstApiImageUrl(images, '/images/shan-tuyet-tea-tree.jpg');
};

// Cùng cách hiện của trang list: 1 giá thì hiện 1 giá, khác nhau thì hiện khoảng giá.
const priceLabel = (min: number, max: number): string => {
    return min === max ? formatVndDesign(min) : `${formatVndDesign(min)} - ${formatVndDesign(max)}`;
};

type HomeItem =
    | {kind: 'line'; line: ProductLine; newest: number}
    | {kind: 'gift'; gift: GiftProduct; newest: number};

const getHomeProducts = () => {
    if (allProductsCache) return Promise.resolve(allProductsCache);
    if (allProductsRequest) return allProductsRequest;

    // BE paging hiện không lọc theo isActive (trả cả set đang ẩn) - lấy 100
    // rồi lọc active ở dưới. Tổng sản phẩm hiện ~78 nên 1 lần gọi là đủ hết.
    allProductsRequest = withTimeout(
        getProductsPagingAPI({pageIndex: 1, pageSize: 100, isActive: true} as any),
        10000,
    )
        .then((res) => unwrapPagingData<Product>(res).data)
        .then((products) => products.filter((product) => product.isActive !== false))
        .then((products) => {
            allProductsCache = products;
            return products;
        })
        .finally(() => {
            allProductsRequest = null;
        });

    return allProductsRequest;
};

const ProductSkeletonGrid = ({desktop = false}: {desktop?: boolean}) => (
    <div className={desktop ? 'mt-[22px] grid w-full grid-cols-5 gap-[28px]' : 'grid w-full grid-cols-2 gap-4'}>
        {Array.from({length: desktop ? 5 : 4}).map((_, index) => (
            <div
                key={index}
                className="aspect-[0.82] animate-pulse rounded-[8px] bg-white/65"
            />
        ))}
    </div>
);

const SectionSanPhamTraThuongHang = () => {
    const {t, locale} = useLanguage();
    const localizePath = (path: string) => (locale === 'en' ? `/en${path === '/' ? '' : path}` : path);
    const [allProducts, setAllProducts] = React.useState<Product[]>([]);
    const [activeGroupId, setActiveGroupId] = React.useState<string | null>(null);
    const [loadingProducts, setLoadingProducts] = React.useState(true);
    // Cùng nguồn nhóm trà với sidebar trang list (API nhóm trà, lỗi thì rơi về
    // 5 nhóm cũ) nên nút lọc ở đây khớp đúng thứ tự/tên với trang list.
    const {groups} = useTeaGroups();

    React.useEffect(() => {
        let cancelled = false;

        getHomeProducts()
            .then((nextProducts) => {
                if (!cancelled) setAllProducts(nextProducts);
            })
            .catch(() => {
                if (!cancelled) setAllProducts([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingProducts(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Gom các phân loại thành dòng/set bằng đúng helper của trang list, rồi
    // xếp theo độ mới của biến thể mới nhất - tab Tất cả vẫn hiện sản phẩm
    // mới nhất trước như cũ, chỉ khác là mỗi dòng/set chỉ còn 1 thẻ duy nhất
    // với khoảng giá + khoảng gram, không tách lẻ từng phân loại nữa.
    const homeItems: HomeItem[] = React.useMemo(() => {
        const position = new Map<number, number>();
        allProducts.forEach((product, index) => {
            if (product.id !== undefined && product.id !== null && !position.has(product.id)) {
                position.set(product.id, index);
            }
        });
        const lineItems: HomeItem[] = groupProductsIntoLines(allProducts, groups).map((line) => ({
            kind: 'line',
            line,
            newest: Math.min(...line.variants.map((variant) => position.get(variant.id ?? -1) ?? Number.POSITIVE_INFINITY)),
        }));
        const giftItems: HomeItem[] = groupGiftProducts(allProducts).map((gift) => ({
            kind: 'gift',
            gift,
            newest: Math.min(...gift.packagings.map((packaging) => position.get(packaging.apiId) ?? Number.POSITIVE_INFINITY)),
        }));
        return [...lineItems, ...giftItems].sort((a, b) => a.newest - b.newest);
    }, [allProducts, groups]);

    // Lọc theo nhóm ngay trên dữ liệu đã tải (không gọi API lại) nên chuyển tab
    // không hiện skeleton, đúng chuẩn chuyển tab mềm của trang list.
    const displayedItems = React.useMemo(() => {
        if (activeGroupId === null) return homeItems.slice(0, HOME_PRODUCT_LIMIT);
        return homeItems
            .filter((item) => (item.kind === 'line' ? item.line.groupId : 'set-qua-tang') === activeGroupId)
            .slice(0, HOME_PRODUCT_LIMIT);
    }, [homeItems, activeGroupId]);

    const handleGroupChange = (groupId: string | null) => {
        setActiveGroupId(groupId);
    };

    const groupButtons = (
        <>
            <button
                type="button"
                onClick={() => handleGroupChange(null)}
                className={`h-[34px] min-w-[104px] whitespace-nowrap rounded-full px-4 text-[13px] font-medium leading-none sm:h-[40px] sm:min-w-[150px] sm:text-sm lg:min-w-[180px] ${
                    activeGroupId === null ? 'bg-[#3B5518] text-white font-semibold' : 'bg-[#7F9635] text-white'
                }`}
            >
                {t('teaGroups.all', 'Tất cả')}
            </button>
            {groups.map((group) => (
                <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupChange(group.id)}
                    className={`h-[34px] min-w-[104px] whitespace-nowrap rounded-full px-4 text-[13px] font-medium leading-none sm:h-[40px] sm:min-w-[150px] sm:text-sm lg:min-w-[180px] ${
                        activeGroupId === group.id
                            ? 'bg-[#3B5518] text-white font-semibold'
                            : 'bg-[#7F9635] text-white'
                    }`}
                >
                    {t(`teaGroups.${group.id}`, group.name)}
                </button>
            ))}
        </>
    );

    const renderItems = (limit: number) => {
        if (!displayedItems.length) {
            return (
                <p className={`${limit === 5 ? 'col-span-5' : 'col-span-2'} text-center text-[#3B5518]`}>
                    {t('products.empty', 'Chưa có sản phẩm.')}
                </p>
            );
        }

        return displayedItems.slice(0, limit).map((item, index) => {
            if (item.kind === 'gift') {
                const gift = item.gift;
                return (
                    <TeaProductCard
                        key={gift.slug}
                        href={localizePath(gift.apiId ? `/san-pham-tra/${gift.apiId}` : `/san-pham-tra/${gift.slug}`)}
                        imageSrc={getImageUrl(gift.image)}
                        name={gift.name}
                        price={priceLabel(gift.priceMin, gift.priceMax)}
                        weight={
                            gift.minGram
                                ? gift.minGram === gift.maxGram
                                    ? `${gift.minGram}g`
                                    : `${gift.minGram}g - ${gift.maxGram}g`
                                : undefined
                        }
                        tag={FEATURED_TAGS[index]}
                    />
                );
            }
            const line = item.line;
            const firstVariant = line.variants[0];
            return (
                <TeaProductCard
                    key={line.key}
                    href={localizePath(`/san-pham-tra/${firstVariant?.id ?? ''}`)}
                    imageSrc={getImageUrl(line.image)}
                    name={line.name}
                    price={priceLabel(line.minPrice, line.maxPrice)}
                    weight={
                        line.minGram
                            ? line.minGram === line.maxGram
                                ? `${line.minGram}g`
                                : `${line.minGram}g - ${line.maxGram}g`
                            : undefined
                    }
                    tag={FEATURED_TAGS[index]}
                />
            );
        });
    };

    return (
        <div className="relative overflow-hidden bg-[#ddd1b9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/images/sptrathuonghang.png"
                alt=""
                className="pointer-events-none absolute left-0 top-0 hidden h-[730px] w-[692px] lg:block"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/images/sptrathuonghang.png"
                alt=""
                className="pointer-events-none absolute left-0 top-2 h-[460px] w-[460px] object-contain object-left-top opacity-65 sm:h-[520px] sm:w-[520px] lg:hidden"
            />
            {/* Mobile layout (< lg) */}
            <div className="relative flex flex-col items-center gap-5 px-4 py-10 lg:hidden">
                <FadeInUp>
                    <SectionHeading title={t('home.productsTitle', 'Sản phẩm trà thượng hạng')} />
                </FadeInUp>
                <FadeInUp delay={0.1}>
                    <p className="max-w-[330px] text-center text-sm leading-5 text-[#7F9635]">
                        {t('home.productsDesc', HOME_COPY.products)}
                    </p>
                </FadeInUp>
                <div className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-2.5 pb-1">
                    {groupButtons}
                </div>
                {loadingProducts ? (
                    <ProductSkeletonGrid />
                ) : (
                    // Lưới KHÔNG dùng StaggerContainer: wrapper whileInView + once của nó
                    // giữ các thẻ mới khi đổi tab ở trạng thái ẩn (opacity 0) dù đã có
                    // trong DOM - đúng lỗi tab Lục trà trắng trơn ngày 04/11/2026.
                    // Lưới đổi tab phải hiện ngay như trang list.
                    <div className="grid w-full grid-cols-2 gap-4">{renderItems(4)}</div>
                )}
                <FadeInUp delay={0.2}>
                    <Link href={localizePath('/san-pham-tra')}>
                        <ButtonComponent title={t('products.viewAll', 'Xem tất cả')} />
                    </Link>
                </FadeInUp>
            </div>
            {/* Desktop layout (lg+) */}
            <div className="relative hidden min-h-[730px] flex-col items-center px-[5%] pb-[64px] pt-[48px] lg:flex">
                <FadeInUp>
                    <SectionHeading title={t('home.productsTitle', 'Sản phẩm trà thượng hạng')} />
                </FadeInUp>
                <FadeInUp delay={0.1}>
                    <p className="mx-auto mt-4 w-full max-w-[960px] text-center leading-5 text-[#7F9635]">
                        {t('home.productsDesc', HOME_COPY.products)}
                    </p>
                </FadeInUp>
                <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-4">
                    {groupButtons}
                </div>
                {loadingProducts ? (
                    <ProductSkeletonGrid desktop />
                ) : (
                    // Như lưới mobile: không dùng StaggerContainer để thẻ đổi tab
                    // không bị kẹt ở trạng thái ẩn (xem ghi chú ở lưới mobile).
                    <div className="mt-[22px] grid w-full grid-cols-5 gap-[28px]">{renderItems(5)}</div>
                )}
                <FadeInUp
                    delay={0.25}
                    className="mt-[52px]"
                >
                    <Link href={localizePath('/san-pham-tra')}>
                        <ButtonComponent
                            title={t('products.viewAll', 'Xem tất cả')}
                            variant="dark"
                        />
                    </Link>
                </FadeInUp>
            </div>
        </div>
    );
};

export default SectionSanPhamTraThuongHang;
