'use client';

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

const ItemBlogTitle = ({blog}: Props) => {
    if (!blog.id) return null;
    return (
        <Link
            href={`/tin-tuc/${blog.id}`}
            className="group cursor-pointer block"
        >
            <div className="overflow-hidden rounded-lg h-44">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={getImageUrl(blog.coverImage ?? blog.thumbnail)}
                    alt={blog.title ?? 'blog'}
                    onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = '/images/blodemo.png';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105"
                    style={{willChange: 'scale', transition: 'scale 0.3s ease-out'}}
                />
            </div>
            <p className="text-[#E4D7BD] font-bold text-xl mt-2 font-source-serif-4 line-clamp-2 transition-colors duration-1000 group-hover:text-white">
                {blog.title}
            </p>
        </Link>
    );
};

export default ItemBlogTitle;
