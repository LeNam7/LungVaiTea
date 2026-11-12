import AbsoluteBackground from '@/components/common/AbsoluteBackground';

const Sk = ({className}: {className?: string}) => (
    <div className={`skeleton-shimmer bg-[#2F4413] rounded ${className ?? ''}`} />
);

const BlogCardSk = () => (
    <div className="flex flex-col gap-2">
        <Sk className="w-full aspect-video rounded-lg" />
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-3/4" />
        <Sk className="h-3 w-1/3" />
    </div>
);

const SmallBlogCardSk = () => (
    <div className="flex flex-col gap-2">
        <Sk className="w-full aspect-video rounded-lg" />
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-2/3" />
    </div>
);

export default function Loading() {
    return (
        <div className="relative overflow-hidden bg-[#3B5518]">
            <AbsoluteBackground
                src="/images/Rectangle1.png"
                className="object-top"
            />
            <div className="relative z-10 px-4 sm:px-8 lg:px-10 py-5 gap-5 flex flex-col">
                {/* Breadcrumb */}
                <Sk className="h-3 w-28" />

                {/* Top grid: featured + most viewed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-10">
                    {/* Featured blog */}
                    <div className="flex flex-col gap-3">
                        <Sk className="h-7 w-48" />
                        <Sk className="w-full h-65 rounded-lg mt-3" />
                        <Sk className="h-5 w-full mt-2" />
                        <Sk className="h-5 w-4/5" />
                        <Sk className="h-4 w-full" />
                        <Sk className="h-4 w-5/6" />
                        <Sk className="h-4 w-2/3" />
                    </div>

                    {/* Most viewed */}
                    <div className="flex flex-col gap-3">
                        <Sk className="h-7 w-52" />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            {[...Array(4)].map((_, i) => (
                                <SmallBlogCardSk key={i} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Blog grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 mb-10">
                    {[...Array(12)].map((_, i) => (
                        <BlogCardSk key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
