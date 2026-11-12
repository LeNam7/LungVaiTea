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
            <div className="px-4 sm:px-8 lg:px-[10%] py-6 lg:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    {/* Image gallery skeleton */}
                    <div className="flex flex-col gap-3">
                        <Sk className="w-full aspect-square rounded-xl" />
                        <div className="flex gap-2">
                            {[...Array(4)].map((_, i) => (
                                <Sk key={i} className="w-16 h-16 rounded-lg shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Product info skeleton */}
                    <div className="flex flex-col gap-4">
                        {/* Title */}
                        <Sk className="h-8 w-3/4" />
                        {/* Price */}
                        <Sk className="h-8 w-48" />
                        {/* Ownership table */}
                        <div className="border border-[#7F9635]/20 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-3 bg-[#2F4413]/50">
                                {['Hình thức', 'Chi phí', 'Sản lượng'].map((_, i) => (
                                    <div key={i} className="px-3 py-2.5 border-r border-[#7F9635]/20 last:border-r-0">
                                        <Sk className="h-4 w-full" />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 border-t border-[#7F9635]/20">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="px-3 py-3 border-r border-[#7F9635]/20 last:border-r-0">
                                        <Sk className="h-4 w-full mb-1" />
                                        <Sk className="h-3 w-2/3" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Harvest count */}
                        <div className="flex items-center gap-3">
                            <Sk className="h-5 w-48" />
                            <Sk className="h-9 w-20 rounded-lg" />
                            <Sk className="h-4 w-16" />
                        </div>
                        {/* Season blocks x2 */}
                        {[...Array(2)].map((_, s) => (
                            <div key={s} className="mt-1">
                                <Sk className="h-6 w-24 mb-3" />
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-3">
                                        <Sk className="h-5 w-28" />
                                        <Sk className="h-9 w-44 rounded-lg" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Sk className="h-5 w-28" />
                                        <Sk className="h-9 w-32 rounded-lg" />
                                        <Sk className="h-4 w-24" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Buttons */}
                        <div className="flex gap-3 mt-2">
                            <Sk className="h-12 w-52 rounded-lg" />
                            <Sk className="h-12 flex-1 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs section */}
            <div className="px-4 sm:px-8 lg:px-[10%]">
                {/* Tab bar */}
                <div className="border-b border-[#E4D7BD]/20 flex gap-2 pb-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex-1 py-4 flex justify-center">
                            <Sk className="h-4 w-32" />
                        </div>
                    ))}
                </div>
                {/* Tab content */}
                <div className="py-10">
                    <Sk className="h-8 w-56 mx-auto mb-6" />
                    <div className="space-y-2 max-w-2xl mx-auto mb-2">
                        <Sk className="h-4 w-full" />
                        <Sk className="h-4 w-5/6" />
                        <Sk className="h-4 w-4/5" />
                    </div>
                    {/* Info table */}
                    <div className="max-w-2xl mx-auto mt-8 border border-[#7F9635]/20 rounded-lg overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="grid grid-cols-[180px_1fr] border-t border-[#7F9635]/20 first:border-t-0">
                                <div className="px-4 py-3 border-r border-[#7F9635]/20">
                                    <Sk className="h-4 w-24" />
                                </div>
                                <div className="px-4 py-3">
                                    <Sk className="h-4 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Related products */}
            <div className="px-4 sm:px-8 lg:px-[10%] py-8">
                <Sk className="h-7 w-48 mb-6" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
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
