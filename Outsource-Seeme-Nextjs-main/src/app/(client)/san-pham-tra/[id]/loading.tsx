import Image from 'next/image';

const Sk = ({className}: {className?: string}) => (
    <div className={`skeleton-shimmer bg-[#2F4413] rounded ${className ?? ''}`} />
);

export default function Loading() {
    return (
        <div className="bg-[#3B5518] min-h-screen text-[#E4D7BD]">
            {/* Banner */}
            <div className="relative h-[140px] sm:h-[170px] lg:h-[220px] -mt-11 lg:-mt-18">
                <Image src="/images/bghome.png" alt="" fill sizes="100vw" className="object-cover" priority />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(59,85,24,0)_30%,rgba(59,85,24,0.6)_60%,#3B5518_100%)]" />
            </div>

            {/* Breadcrumb */}
            <div className="px-4 sm:px-8 lg:px-16 -mt-6 pb-2 flex items-center gap-2">
                <Sk className="h-3 w-48" />
            </div>

            {/* Product section */}
            <div className="px-4 sm:px-8 lg:px-16 py-6 lg:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                    {/* Image gallery */}
                    <div className="flex flex-col gap-3">
                        <Sk className="w-full aspect-square rounded-xl" />
                        <div className="flex gap-2">
                            {[...Array(4)].map((_, i) => (
                                <Sk key={i} className="w-16 h-16 rounded-lg shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Product info */}
                    <div className="flex flex-col gap-4">
                        {/* Title */}
                        <Sk className="h-8 w-3/4" />
                        {/* Price */}
                        <Sk className="h-8 w-40" />
                        {/* Unit + qty */}
                        <div className="flex items-center gap-4">
                            <Sk className="h-9 w-24 rounded-lg" />
                            <div className="flex items-center gap-2">
                                <Sk className="w-8 h-8 rounded" />
                                <Sk className="w-10 h-8 rounded" />
                                <Sk className="w-8 h-8 rounded" />
                            </div>
                            <Sk className="h-4 w-12" />
                        </div>
                        {/* Buttons */}
                        <div className="flex gap-3 mt-2">
                            <Sk className="h-12 w-52 rounded-lg" />
                            <Sk className="h-12 flex-1 rounded-lg" />
                        </div>
                        {/* Accordion stubs */}
                        <div className="mt-4 space-y-3">
                            {['Thông tin sản phẩm', 'Hướng dẫn sử dụng', 'Hướng dẫn bảo quản'].map((_, i) => (
                                <div key={i} className="border border-[#7F9635]/20 rounded-lg px-4 py-3.5 flex justify-between items-center">
                                    <Sk className="h-4 w-40" />
                                    <Sk className="h-4 w-4 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Related products */}
            <div className="px-4 sm:px-8 lg:px-16 py-8 border-t border-[#E4D7BD]/10">
                <Sk className="h-7 w-48 mb-6 mx-auto" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <Sk className="w-full aspect-square rounded-xl" />
                            <Sk className="h-4 w-3/4" />
                            <Sk className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
