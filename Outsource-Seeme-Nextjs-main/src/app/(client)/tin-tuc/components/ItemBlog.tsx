import Link from 'next/link';
import React from 'react';
import type {Blog} from '@/types/swagger.types';
import {resolveApiImageUrl} from '@/utils/imageUrl';

interface Props {
    blog: Blog;
}

const getImageUrl = (path?: string | null) => {
    return resolveApiImageUrl(path, '/images/blodemo.png');
};

const getPreview = (html?: string | null, maxLen = 100): string => {
    if (!html) return '';
    const text = html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
};

const ItemBlog = ({blog}: Props) => {
    if (!blog.id) return null;
    return (
        <Link
            href={`/tin-tuc/${blog.id}`}
            className="group bg-[#7B943E] rounded-lg flex flex-col overflow-hidden h-full transition-shadow duration-500 hover:shadow-xl"
        >
            <div className="overflow-hidden shrink-0 h-36 sm:h-44 lg:h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={getImageUrl(blog.coverImage ?? blog.thumbnail)}
                    alt={blog.title ?? 'blog'}
                    className="w-full h-full object-cover group-hover:scale-105"
                    style={{willChange: 'scale', transition: 'scale 0.3s ease-out'}}
                />
            </div>
            <div className="flex flex-col gap-1 px-2.5 sm:px-4 pt-2 pb-3.5 sm:pb-5 flex-1">
                <p className="text-[#F1EEE0] text-sm sm:text-lg font-medium font-source-serif-4 line-clamp-2 transition-colors duration-1000">
                    {blog.title}
                </p>
                <p className="text-[#F1EEE0] line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm mt-0 leading-relaxed opacity-90">
                    {blog.shortDescription ?? getPreview(blog.content)}
                </p>
            </div>
        </Link>
    );
};

export default ItemBlog;
