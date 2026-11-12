/**
 * Skeleton card for product loading state.
 * Pure CSS pulse animation - no JS needed.
 */
const SkeletonProductCard = () => (
    <div className="flex flex-col bg-white rounded-lg gap-1 p-2 animate-pulse">
        <div className="w-full h-44 bg-gray-200 rounded" />
        <div className="h-6 bg-gray-200 rounded mt-2 w-3/4" />
        <div className="flex items-center justify-between mt-1">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
    </div>
);

export default SkeletonProductCard;
