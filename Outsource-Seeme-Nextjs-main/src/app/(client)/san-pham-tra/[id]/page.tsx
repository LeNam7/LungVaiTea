import Link from 'next/link';
import TeaDetailView from './components/TeaDetailView';
import GiftDetail from './components/GiftDetail';
import RelatedProducts from './components/RelatedProducts';
import {getProductByIdAPI, getProductsPagingAPI} from '@/api/ProductAPI';
import {getTeaGroupsPagingAPI} from '@/api/TeaGroupAPI';
import {unwrapApiData, unwrapPagingData} from '@/api/response';
import type {Product, TeaGroupRecord} from '@/types/swagger.types';
import {
    TEA_GROUPS,
    collectionIdForName,
    giftFromApiProduct,
    groupGiftProducts,
    groupIdForProduct,
    groupProductsIntoLines,
    lineKeyForProduct,
    mapTeaGroupRecords,
    normalizeLineName,
} from '@/lib/tea-taxonomy';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import {getFirstApiImageUrl, parseApiImageList, resolveApiImageUrl} from '@/utils/imageUrl';
import {toTitleCaseVn} from '@/utils/text';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getImages(images: string | null | undefined): string[] {
    const list = parseApiImageList(images).map((image) => resolveApiImageUrl(image, '/images/shan-tuyet-tea-tree.jpg'));
    return list.length > 0 ? list : ['/images/shan-tuyet-tea-tree.jpg'];
}

function getFirstImage(images: string | null | undefined): string {
    return getImages(images)[0];
}

/* ── Page Component ──────────────────────────────────────────────────────── */

export default async function ChiTietSanPhamTraPage({params}: {params: Promise<{id: string}>}) {
    const {id: idStr} = await params;

    // Set quà tặng dùng slug (ví dụ gift-huyen-nhat), không phải id số của API.
    if (idStr.startsWith('gift-')) {
        return <GiftDetail slug={idStr} />;
    }

    const id = parseInt(idStr, 10);

    let product: Product | null = null;
    let groups = TEA_GROUPS;
    let relatedProducts: Product[] = [];
    // Thứ tự gốc của API (để sắp xếp ảnh: ảnh bìa trà khô + ảnh nước trà
    // luôn đứng trước các hộp; xem phần sắp xếp variants bên dưới).
    const apiOrderById = new Map<number, number>();

    // API thỉnh thoảng trượt 1 lần (đã gặp thực tế: 1050 báo "Không tìm thấy"
    // rồi gọi lại thì đủ dữ liệu) - thử lại tối đa 3 lần mới kết luận.
    for (let attempt = 0; attempt < 3 && !product; attempt++) {
        try {
            const res = await getProductByIdAPI(id);
            product = unwrapApiData<Product>(res);
        } catch {
            if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
    }
    if (!product) {
        return (
            <div className="bg-[#3B5518] min-h-screen text-[#E4D7BD] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-source-serif-4 text-4xl text-[#7F9635] mb-4">Không tìm thấy sản phẩm</h1>
                    <Link href="/san-pham-tra" className="text-[#E4D7BD] underline">
                        Quay lại danh sách sản phẩm
                    </Link>
                </div>
            </div>
        );
    }

    // Nhóm trà cho breadcrumb + gom dòng (fallback 5 nhóm cũ khi API lỗi).
    try {
        const groupRes = await getTeaGroupsPagingAPI({pageIndex: 1, pageSize: 100} as any);
        const mapped = mapTeaGroupRecords(
            unwrapPagingData<TeaGroupRecord>(groupRes).data.filter((g) => g.isActive !== false),
        );
        if (mapped.length > 0) groups = mapped;
    } catch {
        /* silent */
    }

    try {
        const rRes = await getProductsPagingAPI({pageIndex: 1, pageSize: 100, isActive: true} as any);
        const all = unwrapPagingData<Product>(rRes).data;
        all.forEach((p, idx) => {
            if (p.id != null) apiOrderById.set(p.id, idx);
        });
        relatedProducts = all.filter((p) => p.id !== id && p.isActive !== false);
    } catch {
        /* silent */
    }

    // Set quà tặng từ API (isGiftSet) hiển thị dạng set quà, không phải dạng trà thường.
    // Gom các row cùng set thành 1 set với nhiều quy cách; quy cách mở đầu là row
    // khách vừa bấm vào (id trên URL), các quy cách khác chọn bằng select.
    if (product.isGiftSet) {
        const grouped = groupGiftProducts([...relatedProducts, product]);
        const gift =
            grouped.find((g) => g.packagings.some((p) => p.apiId === product!.id)) ?? giftFromApiProduct(product);
        const relatedGifts = grouped.filter((g) => g.collectionId === gift.collectionId && g.slug !== gift.slug);
        return <GiftDetail slug={gift.slug} gift={gift} relatedGifts={relatedGifts} initialPackagingId={product!.id} />;
    }

    // Các biến thể cùng dòng trà (cùng nhóm + cùng tên) để chọn quy cách.
    const lineKey = lineKeyForProduct(product, groups);
    const baseVariants = relatedProducts
        .filter((p) => lineKeyForProduct(p, groups) === lineKey)
        .concat(product)
        .map((p) => ({
            id: p.id!,
            price: p.price ?? 0,
            gram: Number(p.quantity ?? 0) > 0 ? Number(p.quantity) : null,
            stock: p.total ?? null,
            images: p.images ?? null,
            packagingName: p.packagingName ?? null,
            variantName: p.variantName ?? null,
            apiOrder: apiOrderById.get(p.id!) ?? 9999,
        }));
    // Ô chọn "Quy cách đóng gói" sắp theo GIÁ: rẻ trước, đắt sau (cùng giá
    // thì giữ thứ tự gốc của API). Trước đây chỉ sắp theo giá mà không có
    // tiebreak nên các phân loại cùng giá bị xáo trộn tùy theo id trên URL
    // (bấm vào biến thể nào thì biến thể đó bị đẩy xuống cuối).
    const variants = [...baseVariants].sort((a, b) => a.price - b.price || a.apiOrder - b.apiOrder);
    // Sản phẩm gợi ý: loại luôn các biến thể cùng dòng (đã nằm ở phần chọn quy cách).
    const relatedLineProducts = relatedProducts.filter((p) => lineKeyForProduct(p, groups) !== lineKey);

    const groupId = groupIdForProduct(product, groups);
    const groupName = groups.find((g) => g.id === groupId)?.name ?? 'Sản phẩm trà';
    // Mỗi phân loại gắn với đúng 1 ảnh (ảnh bao bì của chính biến thể đó).
    // Thứ tự ẢNH trong gallery khác với ô chọn quy cách: ảnh trà khô (ảnh
    // bìa, row đầu tiên của dòng trên API) rồi tới ảnh nước trà (các phân
    // loại không có khối lượng, giữ đúng thứ tự gốc của API), sau đó các
    // hộp sắp theo khối lượng tăng dần (cùng khối lượng thì giá tăng dần).
    const variantImages = [...baseVariants]
        .sort((a, b) => {
            const aBox = a.gram != null;
            const bBox = b.gram != null;
            if (aBox !== bBox) return aBox ? 1 : -1;
            if (!aBox && !bBox) return a.apiOrder - b.apiOrder;
            if (a.gram !== b.gram) return (a.gram ?? 0) - (b.gram ?? 0);
            if (a.price !== b.price) return a.price - b.price;
            return a.apiOrder - b.apiOrder;
        })
        .map((v) => ({
            variantId: v.id,
            image: getFirstImage(v.images),
        }));

    const accordionItems = [
        {
            title: 'Thông tin sản phẩm',
            content: product.description || 'Đang cập nhật.',
        },
        ...(variants.length > 0
            ? [
                  {
                      title: 'Quy cách & Khối lượng',
                      content: `Các quy cách đóng gói của dòng này:\n${variants
                          .map((v) => `- ${v.packagingName?.trim() ? `${v.packagingName.trim()} ` : ''}${v.gram ? `${v.gram}g` : 'Theo hộp'}: ${(v.price ?? 0).toLocaleString('vi-VN')} VND`)
                          .join('\n')}`,
                  },
              ]
            : []),
        {
            title: 'Hướng dẫn sử dụng',
            content: product.userManual || 'Đang cập nhật.',
        },
        {
            title: 'Hướng dẫn bảo quản',
            content: product.storageInstructions || 'Đang cập nhật.',
        },
    ];

    // Gợi ý chỉ hiện 1 đại diện mỗi sản phẩm, không tách từng phân loại thành
    // thẻ riêng: gom các biến thể cùng dòng trà (cùng nhóm + cùng tên) và các
    // row cùng set quà thành 1 thẻ, giữ nguyên thứ tự xuất hiện đầu tiên.
    // Trước đây Thanh Sơn hiện 2 thẻ 108k (18g) + 810k (100g) vì mỗi phân loại
    // là 1 thẻ riêng.
    const teaLines = groupProductsIntoLines(relatedLineProducts, groups);
    const lineByKey = new Map(teaLines.map((l) => [l.key, l]));
    const giftSets = groupGiftProducts(relatedLineProducts);
    const setByKey = new Map(giftSets.map((g) => [`${g.collectionId}::${g.name.toLowerCase()}`, g]));
    const seenRelatedKeys = new Set<string>();
    const relatedItems: {
        id: number;
        href?: string;
        name: string;
        price: number;
        weight?: string;
        image: string;
    }[] = [];
    for (const p of relatedLineProducts) {
        if (p.isGiftSet) {
            const key = `${collectionIdForName(p.collectionName)}::${normalizeLineName(p.name).toLowerCase()}`;
            if (seenRelatedKeys.has(key)) continue;
            seenRelatedKeys.add(key);
            const g = setByKey.get(key);
            if (!g) continue;
            relatedItems.push({
                id: g.apiId ?? 0,
                href: g.apiId ? `/san-pham-tra/${g.apiId}` : `/san-pham-tra/${g.slug}`,
                name: g.name,
                price: g.priceMin,
                weight: `${g.gram}g`,
                image: getFirstApiImageUrl(g.image, '/images/shan-tuyet-tea-tree.jpg'),
            });
        } else {
            const key = lineKeyForProduct(p, groups);
            if (seenRelatedKeys.has(key)) continue;
            seenRelatedKeys.add(key);
            const line = lineByKey.get(key);
            if (!line) continue;
            const firstVariant = line.variants[0];
            relatedItems.push({
                id: firstVariant?.id ?? 0,
                name: line.name,
                price: line.minPrice,
                weight: line.minGram ? `${line.minGram}g` : undefined,
                image: getFirstImage(line.image),
            });
        }
    }

    return (
        <div className="relative min-h-screen overflow-clip bg-[#DCCFB4] text-[#3B5518]">
            <AbsoluteBackground
                src="/images/bg-sptrapage.png"
                className="object-top"
            />
            {/* ── Banner ── */}
            <div className="relative z-10 h-[140px] sm:h-[170px] lg:h-[220px] -mt-11 lg:-mt-18">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/bghome.png" alt="banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(59,85,24,0)_28%,rgba(59,85,24,0.42)_62%,#DCCFB4_100%)]" />
            </div>

            {/* ── Breadcrumb ── */}
            <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-[50px] -mt-6 pb-2 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                <Link href="/" className="hover:text-[#7F9635] opacity-70 transition-colors">
                    Home
                </Link>
                <span className="opacity-70">/</span>
                <Link href="/san-pham-tra" className="hover:text-[#7F9635] opacity-70 transition-colors">
                    Sản phẩm trà
                </Link>
                <span className="opacity-70">/</span>
                {groupId ? (
                    <Link
                        href={`/san-pham-tra?group=${groupId}`}
                        className="hover:text-[#7F9635] opacity-70 transition-colors"
                    >
                        {groupName}
                    </Link>
                ) : (
                    <span className="opacity-70">{groupName}</span>
                )}
                <span className="opacity-70">/</span>
                <span className="font-semibold text-[#3B5518] truncate max-w-[200px]">{toTitleCaseVn(product.name ?? '')}</span>
            </div>

            {/* ── Product Section ── */}
            <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-[50px] py-6 lg:py-10">
                <TeaDetailView
                    name={product.name ?? ''}
                    productId={product.id!}
                    price={product.price ?? 0}
                    weight={product.quantity ? `${product.quantity}g` : undefined}
                    images={product.images}
                    accordionItems={accordionItems}
                    variants={variants}
                    variantImages={variantImages}
                />
            </div>

            {/* ── Related Products ── */}
            {relatedItems.length > 0 && (
                <div className="relative z-10 mt-8 border-t border-[#E4D7BD]/10 pt-10">
                    <RelatedProducts related={relatedItems} />
                </div>
            )}
        </div>
    );
}
