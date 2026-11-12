import Link from 'next/link';
import ImageGallery from './components/ImageGallery';
import ProductInfo from './components/ProductInfo';
import ProductTabs from './components/ProductTabs';
import RelatedProducts from './components/RelatedProducts';
import {getTeaByIdAPI} from '@/api/TeaAPI';
import {getTeasPagingAPI} from '@/api/TeaAPI';
import {getGardenByIdAPI} from '@/api/GardenAPI';
import {unwrapApiData, unwrapPagingData} from '@/api/response';
import type {Tea, Garden} from '@/types/swagger.types';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import {parseApiImageList, resolveApiImageUrl} from '@/utils/imageUrl';
import {formatTeaVolume, formatTeaCost, formatGardenCode, formatTeaDescription, isTeaPurchasable, isTeaContactPrice, isTeaAvailableForClient} from '@/utils/teaFields';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const FALLBACK_IMG = '/images/shan-tuyet-tea-tree.jpg';

/** Parse images string (JSON array or comma-separated) */
function parseImages(images: string | null | undefined): string[] {
    return parseApiImageList(images).map((image) => resolveApiImageUrl(image, FALLBACK_IMG));
}

/** Check if a URL returns a valid response (server-side) */
async function isImageReachable(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, {method: 'HEAD', next: {revalidate: 60}});
        return res.ok;
    } catch {
        return false;
    }
}

/** Get validated images - replace unreachable URLs with fallback */
async function getImages(images: string | null | undefined): Promise<string[]> {
    const urls = parseImages(images);
    if (urls.length === 0) return [FALLBACK_IMG];
    if (urls[0].startsWith('/')) return urls;

    // Check first image only (all images usually from same server)
    const reachable = await isImageReachable(urls[0]);
    return reachable ? urls : [FALLBACK_IMG];
}

const DEFAULT_FAQ = [
    {
        q: 'Khi nào tôi nhận được trà?',
        a: 'Trà sẽ được giao đến bạn trong vòng 7-14 ngày kể từ khi thu hoạch. Chúng tôi cam kết giao hàng đúng thời gian và chất lượng.',
    },
    {
        q: 'Cách kiểm tra sản lượng cây nhận được từ chính cây đã mua hay không?',
        a: '• Minh bạch và rõ ràng trong quản lý\nMỗi cây đều được gắn một mã định danh riêng, giúp khách hàng chủ động theo dõi toàn bộ quá trình sinh trưởng, chăm sóc và thu hoạch.\n• Tăng cường trải nghiệm và kết nối với thiên nhiên\nChúng tôi khuyến khích khách hàng trực tiếp tham gia vào các hoạt động thực tế như thu hái và chế biến nông sản.',
    },
    {
        q: 'Nếu sản lượng thấp hơn cam kết thì sao?',
        a: 'Chúng tôi sẽ bồi thường phần chênh lệch bằng sản phẩm trà tương đương hoặc hoàn tiền theo tỷ lệ cam kết.',
    },
    {
        q: 'Tôi có thể đến thăm vườn trà không?',
        a: 'Hoàn toàn có thể! Chúng tôi tổ chức các chuyến tham quan vườn trà định kỳ. Liên hệ hotline để đặt lịch tham quan.',
    },
];

const DEFAULT_HARVEST = [{label: 'Vụ Xuân', time: '15/3 - 30/4'}];


/* ── Page Component ──────────────────────────────────────────────────────── */

export default async function ChiTietCayTraPage({params}: {params: Promise<{id: string}>}) {
    const {id: idStr} = await params;
    const id = parseInt(idStr, 10);

    // Fetch tea data
    let tea: Tea | null = null;
    let garden: Garden | null = null;
    let relatedTeas: Tea[] = [];

    // API thỉnh thoảng trượt 1 lần (đã gặp thực tế: 1190 báo "chưa mở bán"
    // rồi gọi lại thì đủ dữ liệu) - thử lại tối đa 3 lần mới kết luận.
    for (let attempt = 0; attempt < 3 && !tea; attempt++) {
        try {
            const res = await getTeaByIdAPI(id);
            tea = unwrapApiData<Tea>(res);
        } catch {
            if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
    }

    if (!tea || !isTeaAvailableForClient(tea)) {
        return (
            <div className="bg-[#3B5518] min-h-screen text-[#E4D7BD] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-source-serif-4 text-4xl text-[#7F9635] mb-4">Cây trà chưa mở bán</h1>
                    <p className="mb-4 text-[#E4D7BD]/80">Cây trà này hiện chưa mở bán hoặc đang được cập nhật thông tin.</p>
                    <Link href="/bo-suu-tap-cay-tra" className="text-[#E4D7BD] underline hover:text-white">
                        Quay lại bộ sưu tập
                    </Link>
                </div>
            </div>
        );
    }

    // Fetch garden info
    if (tea.gardenId) {
        try {
            const gRes = await getGardenByIdAPI(tea.gardenId);
            garden = unwrapApiData<Garden>(gRes);
        } catch {
            /* silent */
        }
    }

    // Fetch related teas (same garden first, fallback to latest)
    try {
        const rRes = await getTeasPagingAPI({pageIndex: 1, pageSize: 50});
        const all = unwrapPagingData<Tea>(rRes).data.filter(isTeaAvailableForClient);
        // Prefer same-garden teas
        const sameGarden = all.filter((t) => t.id !== id && t.gardenId === tea!.gardenId && !t.sold);
        const others = all.filter((t) => t.id !== id && t.gardenId !== tea!.gardenId && !t.sold);
        relatedTeas = [...sameGarden, ...others].slice(0, 5);
    } catch {
        /* silent */
    }

    /* Derived values */
    const images = await getImages(tea.images);
    const gardenName = formatGardenCode(garden);
    const gardenAddr = garden?.address ?? '';

    const infoTable = [
        {label: 'Mã cây', value: tea.name ?? `#${tea.id}`},
        {label: 'ID hệ thống', value: `#${tea.id}`},
        {label: 'Sản lượng', value: formatTeaVolume(tea, '-')},
        {label: 'Loại cây', value: tea.type || '1 lá'},
        {label: 'Tuổi cây', value: tea.yearOld && tea.yearOld > 0 ? `${tea.yearOld} năm` : '-'},
        {label: 'Vườn trà', value: gardenName},
        {label: 'Khu vực', value: gardenAddr || gardenName},
        {label: 'Thông số cây', value: tea.aspect ?? 'Đông Nam'},
        {
            label: 'Tình trạng',
            value: tea.sold
                ? 'Đã bán'
                : isTeaContactPrice(tea)
                  ? 'Giá liên hệ'
                  : isTeaPurchasable(tea)
                    ? 'Còn bán'
                    : 'Chưa mở bán',
        },
        {label: 'Trạng thái', value: tea.isActive ? 'Đang hoạt động' : 'Tạm ẩn'},
        {label: 'Tọa độ', value: tea.lat && tea.long ? `${tea.lat}°N, ${tea.long}°E` : '-'},
    ];

    const relatedItems = await Promise.all(
        relatedTeas.map(async (t) => {
            const imgs = await getImages(t.images);
            return {
                id: t.id!,
                code: t.name ?? `#${t.id}`,
                name: t.name ?? `Cây trà #${t.id}`,
                priceRange: formatTeaCost(t),
                yield: t.volume && t.volume > 0 ? `${t.volume.toLocaleString('vi-VN')} kg/năm` : '',
                teaType: t.type,
                buyers: t.sold ? 'Đã bán' : '',
                images: imgs[0],
            };
        }),
    );

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
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(59,85,24,0)_30%,rgba(59,85,24,0.48)_60%,#3B5518_100%)]" />
                <nav
                    aria-label="Breadcrumb"
                    className="absolute inset-x-0 bottom-3 z-20 px-4 text-xs leading-[18px] text-white sm:bottom-4 sm:px-8 sm:text-sm sm:leading-5 lg:px-16"
                >
                    <div className="flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 overflow-hidden lg:flex-nowrap">
                        <Link href="/" className="shrink-0 transition-colors hover:text-[#7F9635]">
                            Home
                        </Link>
                        <span className="shrink-0">/</span>
                        <Link href="/bo-suu-tap-cay-tra" className="shrink-0 transition-colors hover:text-[#7F9635]">
                            Bộ sưu tập cây trà
                        </Link>
                        <span className="shrink-0">/</span>
                        <span className="block max-w-[180px] shrink-0 truncate sm:max-w-[260px] lg:max-w-[320px]">
                            {gardenName}
                        </span>
                        <span className="shrink-0">/</span>
                        <span
                            className="block min-w-0 max-w-[300px] truncate sm:max-w-[420px] lg:max-w-[45vw]"
                            title={tea.name ?? ''}
                        >
                            {tea.name}
                        </span>
                    </div>
                </nav>
            </div>

            {/* ── Product Section ── */}
            <div className="relative z-10 px-4 sm:px-8 lg:px-[10%] py-6 lg:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    <ImageGallery
                        images={images}
                        name={tea.name ?? ''}
                        teaId={tea.id}
                    />
                    <ProductInfo
                        name={tea.name ?? ''}
                        gardenName={gardenName}
                        price={tea.price ?? 0}
                        volume={tea.volume}
                        teaType={tea.type}
                        teaId={tea.id!}
                        sold={tea.sold ?? false}
                        images={tea.images}
                    />
                </div>
            </div>

            {/* ── Tabs Section ── */}
            <ProductTabs
                description={formatTeaDescription(tea.description || 'Cây trà cổ thụ đặc sản được chăm sóc theo phương pháp truyền thống, cho chất lượng trà thượng hạng.') }
                infoTable={infoTable}
                harvestPhases={DEFAULT_HARVEST}
                faqData={DEFAULT_FAQ}
            />

            {/* ── Related ── */}
            {relatedItems.length > 0 && <RelatedProducts related={relatedItems} />}
        </div>
    );
}
