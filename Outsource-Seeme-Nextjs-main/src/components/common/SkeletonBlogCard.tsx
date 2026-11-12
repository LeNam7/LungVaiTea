/**
 * Skeleton card for blog/news loading state.
 */
const SkeletonBlogCard = () => (
    <div className="flex flex-col gap-2 animate-pulse">
        <div className="w-full h-44 bg-[#6F8532]/30 rounded" />
        <div className="h-5 bg-[#6F8532]/30 rounded w-4/5" />
        <div className="h-4 bg-[#6F8532]/20 rounded w-full" />
        <div className="h-4 bg-[#6F8532]/20 rounded w-3/4" />
    </div>
);

export default SkeletonBlogCard;
