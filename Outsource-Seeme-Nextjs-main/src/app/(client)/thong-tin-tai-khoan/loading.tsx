import AbsoluteBackground from '@/components/common/AbsoluteBackground';

const Sk = ({className}: {className?: string}) => (
    <div className={`bg-[#7F9635]/40 animate-pulse rounded ${className ?? ''}`} />
);

const SkDark = ({className}: {className?: string}) => (
    <div className={`skeleton-shimmer bg-[#2F4413]/75 rounded ${className ?? ''}`} />
);

export default function Loading() {
    return (
        <div className="relative w-full overflow-hidden bg-[#DCCFB4]">
            <AbsoluteBackground
                src="/images/Rectangle.png"
                className="object-top"
            />
            <div className="relative z-10 w-full flex flex-col gap-5 px-4 sm:px-6 lg:px-[12%] py-8 sm:py-10">
                {/* Breadcrumb */}
                <SkDark className="h-3 w-64" />

                {/* Mobile tab pills */}
                <div className="flex lg:hidden flex-wrap gap-2">
                    {[...Array(6)].map((_, i) => (
                        <SkDark key={i} className="h-10 flex-1 basis-[calc(50%-4px)] rounded-[10px] sm:basis-[calc(33.333%-6px)]" />
                    ))}
                </div>

                {/* Main card */}
                <div className="bg-[linear-gradient(90deg,#2F5514_0%,#1E2812_100%)] gap-5 lg:gap-12 rounded-xl p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-11">
                    {/* Desktop sidebar */}
                    <div className="hidden lg:flex col-span-3 flex-col gap-3">
                        {[...Array(6)].map((_, i) => (
                            <Sk key={i} className="h-14 w-full rounded-2xl" />
                        ))}
                    </div>

                    {/* Content area - personal info form skeleton */}
                    <div className="col-span-1 lg:col-span-8 flex flex-col gap-4">
                        <Sk className="h-7 w-52 mb-2" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Sk className="h-4 w-24" />
                                <Sk className="h-11 w-full rounded-lg" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Sk className="h-4 w-24" />
                                <Sk className="h-11 w-full rounded-lg" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Sk className="h-4 w-16" />
                            <Sk className="h-11 w-full rounded-lg" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Sk className="h-4 w-20" />
                                <Sk className="h-11 w-full rounded-lg" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Sk className="h-4 w-20" />
                                <Sk className="h-11 w-full rounded-lg" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Sk className="h-4 w-20" />
                            <Sk className="h-11 w-full rounded-lg" />
                        </div>
                        <div className="flex justify-end mt-2">
                            <Sk className="h-11 w-32 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
