'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {getBlogsPagingAPI} from '@/api/BlogAPI';
import {unwrapPagingData} from '@/api/response';
import {BlogType, type Blog} from '@/types/swagger.types';
import {resolveApiImageUrl} from '@/utils/imageUrl';
import FadeInUp from '@/components/animations/FadeInUp';
import StaggerContainer from '@/components/animations/StaggerContainer';
import SectionHeading from '@/components/ui/SectionHeading';
import {HOME_COPY} from '@/constants/brand';
import {useLanguage} from '@/context/LanguageContext';

const getImageUrl = (path?: string | null) => {
    return resolveApiImageUrl(path, '/images/shan-tuyet-tea-tree.jpg');
};

// Lấy text preview từ HTML content (vì API không lưu shortDescription)
const getPreview = (html?: string | null, maxLen = 120): string => {
    if (!html) return '';
    const text = html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
};

const SectionTinTuc = () => {
    const { t, locale } = useLanguage();
    const localizePath = (path: string) => (locale === 'en' ? `/en${path === '/' ? '' : path}` : path);
    const [blogs, setBlogs] = useState<Blog[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [hotRes, mostViewedRes, allRes] = await Promise.all([
                    getBlogsPagingAPI({pageIndex: 1, pageSize: 1, type: BlogType.Hot, isActive: true}),
                    getBlogsPagingAPI({pageIndex: 1, pageSize: 4, type: BlogType.MostViewed, isActive: true}),
                    getBlogsPagingAPI({pageIndex: 1, pageSize: 5, isActive: true}),
                ]);
                if (cancelled) return;
                const hotBlogs = unwrapPagingData<Blog>(hotRes).data;
                const mostViewedBlogs = unwrapPagingData<Blog>(mostViewedRes).data;
                const allBlogs = unwrapPagingData<Blog>(allRes).data;
                const featured = hotBlogs[0] ?? allBlogs[0];
                const others = [
                    ...mostViewedBlogs.filter((item) => item.id !== featured?.id),
                    ...allBlogs.filter(
                        (item) => item.id !== featured?.id && !mostViewedBlogs.some((blog) => blog.id === item.id),
                    ),
                ].slice(0, 4);

                setBlogs(featured ? [featured, ...others] : allBlogs);
            } catch {
                if (!cancelled) setBlogs([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const featured = blogs[0];
    const others = blogs.slice(1, 5);

    return (
        <div className="bg-[#DED1B9] relative overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 z-0 opacity-90 lg:left-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/Group125.png"
                    alt=""
                    className="h-[118px] w-auto lg:h-auto"
                />
            </div>
            <div className="pointer-events-none absolute right-0 top-0 z-0 opacity-90 lg:right-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/Group126.png"
                    alt=""
                    className="h-[132px] w-auto lg:h-auto"
                />
            </div>

            <div className="relative z-10 w-full py-10 flex flex-col items-center gap-2 lg:gap-8">
                <FadeInUp>
                    <SectionHeading title={t('home.newsTitle', 'Tin tức & Câu chuyện')} />
                </FadeInUp>
                <FadeInUp delay={0.1}>
                    <p className="w-full max-w-xl px-4 text-center text-[#7F9635]">
                        {t('home.newsDesc', HOME_COPY.news)}
                    </p>
                </FadeInUp>

                <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] mt-4 px-4 lg:px-[6%] gap-6 lg:gap-8 w-full">
                    {/* Bài nổi bật - ảnh lớn, có preview nội dung */}
                    <FadeInUp delay={0.12}>
                        {featured?.id ? (
                            <Link
                                href={localizePath(`/tin-tuc/${featured.id}`)}
                                className="group block h-full"
                            >
                                <div className="overflow-hidden rounded-xl">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={getImageUrl(featured.coverImage ?? featured.thumbnail)}
                                        alt={featured.title ?? 'blog'}
                                        className="w-full h-80 lg:h-96 object-cover group-hover:scale-105"
                                        style={{willChange: 'scale', transition: 'scale 0.3s ease-out'}}
                                    />
                                </div>
                                <p className="text-[#7d9642] font-medium text-lg mt-3 font-source-serif-4 line-clamp-2 group-hover:text-[#3B5518] transition-colors">
                                    {featured.title}
                                </p>
                                <p className="text-[#7d9642] mt-0 line-clamp-3 text-sm leading-relaxed opacity-90">
                                    {featured.shortDescription ?? getPreview(featured.content)}
                                </p>
                            </Link>
                        ) : (
                            <p className="text-[#7d9642]">{t('news.empty', 'Chưa có tin tức mới.')}</p>
                        )}
                    </FadeInUp>

                    {/* 4 bài nhỏ - 2x2 grid */}
                    <StaggerContainer className="grid grid-cols-2 gap-3">
                        {others.map((blog) => (
                            <Link
                                key={blog.id}
                                href={localizePath(`/tin-tuc/${blog.id}`)}
                                className="flex flex-col gap-2 group"
                            >
                                <div className="overflow-hidden rounded-lg">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={getImageUrl(blog.coverImage ?? blog.thumbnail)}
                                        alt={blog.title ?? 'blog'}
                                        className="w-full h-36 lg:h-44 object-cover group-hover:scale-105"
                                        style={{willChange: 'scale', transition: 'scale 0.3s ease-out'}}
                                    />
                                </div>
                                <p className="text-[#7d9642] font-medium font-source-serif-4 line-clamp-2 group-hover:text-[#3B5518] transition-colors">
                                    {blog.title}
                                </p>
                            </Link>
                        ))}
                    </StaggerContainer>
                </div>
            </div>
        </div>
    );
};

export default SectionTinTuc;
