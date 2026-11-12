import Link from "next/link";
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getBlogsPagingAPI } from "@/api/BlogAPI";
import { unwrapPagingData } from "@/api/response";
import { BlogType, type Blog } from "@/types/swagger.types";
import { resolveApiImageUrl } from "@/utils/imageUrl";
import ItemBlog from "./components/ItemBlog";
import FadeInUp from "@/components/animations/FadeInUp";
import StaggerContainer from "@/components/animations/StaggerContainer";
import BlogPagination from "@/components/ui/BlogPagination";
import AbsoluteBackground from "@/components/common/AbsoluteBackground";

export const dynamic = "force-dynamic";

const getImageUrl = (path?: string | null) => {
  return resolveApiImageUrl(path, "/images/blodemo.png");
};

const getPreview = (html?: string | null, maxLen = 130): string => {
  if (!html) return "";
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
};

const PAGE_SIZE = 10;

const parsePage = (value?: string) => {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

const BlogGridSkeleton = ({count = 10}: {count?: number}) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-10">
    {Array.from({length: count}).map((_, index) => (
      <div key={index} className="flex flex-col gap-2 animate-pulse bg-[#7B943E]/20 rounded-lg p-2 sm:p-3">
        <div className="h-36 sm:h-44 lg:h-48 rounded-lg bg-[#7F9635]/25" />
        <div className="h-5 rounded bg-[#7F9635]/25 mt-1" />
        <div className="h-4 w-4/5 rounded bg-[#7F9635]/20" />
      </div>
    ))}
  </div>
);

const BlogPageSkeleton = ({currentPage}: {currentPage: number}) => (
  <>
    {currentPage === 1 && (
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-10">
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-8 w-48 rounded bg-[#7F9635]/25" />
          <div className="h-56 sm:h-80 lg:h-96 rounded-xl bg-[#7F9635]/25" />
          <div className="h-6 rounded bg-[#7F9635]/25" />
          <div className="h-4 w-5/6 rounded bg-[#7F9635]/20" />
        </div>
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-8 w-52 rounded bg-[#7F9635]/25" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Array.from({length: 4}).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="h-28 sm:h-36 lg:h-44 rounded-lg bg-[#7F9635]/25" />
                <div className="h-4 rounded bg-[#7F9635]/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    <BlogGridSkeleton count={currentPage === 1 ? 10 : 10} />
  </>
);

const BlogPageContent = async ({currentPage}: {currentPage: number}) => {
  const cookieStore = await cookies();
  const headersList = await headers();
  const isEn = headersList.get('x-next-locale') === 'en' || cookieStore.get('NEXT_LOCALE')?.value === 'en';
  let featuredBlog: Blog | undefined;
  let mostViewedBlogs: Blog[] = [];
  let gridBlogs: Blog[] = [];
  let totalGridPages = 1;

  try {
    const allRes = await getBlogsPagingAPI({
      pageIndex: 1,
      pageSize: 200,
      isActive: true,
    });
    const allBlogs = unwrapPagingData<Blog>(allRes).data ?? [];

    if (allBlogs.length > 0) {
      // 1. Bài viết nổi bật: Ưu tiên blog có type === BlogType.Hot, nếu không có lấy bài đầu tiên
      featuredBlog =
        allBlogs.find((blog) => blog.type === BlogType.Hot) ?? allBlogs[0];

      // 2. Bài viết được xem nhiều nhất: Ưu tiên blog có type === BlogType.MostViewed (khác featuredBlog),
      // nếu thiếu thì bù các bài tiếp theo (khác featuredBlog) cho đủ tối đa 4 bài
      const candidateMostViewed = allBlogs.filter(
        (blog) => blog.id !== featuredBlog?.id && blog.type === BlogType.MostViewed
      );
      const remainingForHero = allBlogs.filter(
        (blog) =>
          blog.id !== featuredBlog?.id &&
          !candidateMostViewed.some((item) => item.id === blog.id)
      );
      mostViewedBlogs = [...candidateMostViewed, ...remainingForHero].slice(0, 4);

      // Hero IDs: tập hợp chính xác các bài hiển thị ở phần Hero (1 featured + tối đa 4 most viewed)
      const heroIds = new Set<number>();
      if (featuredBlog?.id) heroIds.add(featuredBlog.id);
      for (const blog of mostViewedBlogs) {
        if (blog.id) heroIds.add(blog.id);
      }

      // 3. Grid bài viết phía dưới: LOẠI BỎ TOÀN BỘ các bài đã xuất hiện ở Hero
      const remainingBlogs = allBlogs.filter(
        (blog) => typeof blog.id === "number" && !heroIds.has(blog.id)
      );

      totalGridPages = Math.max(1, Math.ceil(remainingBlogs.length / PAGE_SIZE));

      // Lấy danh sách cho trang hiện tại
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      gridBlogs = remainingBlogs.slice(startIndex, startIndex + PAGE_SIZE);
    }
  } catch {
    featuredBlog = undefined;
    mostViewedBlogs = [];
    gridBlogs = [];
    totalGridPages = 1;
  }

  if (currentPage > totalGridPages) {
    redirect(totalGridPages === 1 ? "/tin-tuc" : `/tin-tuc?page=${totalGridPages}`);
  }

  return (
    <>
      <h1 className="sr-only">{isEn ? "Lung Vai Tea News" : "Tin tức Lùng Vài Tea"}</h1>

      {/* Hero: 1 lớn + 4 nhỏ (chỉ hiển thị ở trang 1) */}
      {currentPage === 1 && featuredBlog?.id && (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-10">
          {/* Bài viết nổi bật */}
          <FadeInUp delay={0.1}>
            <h2 className="font-source-serif-4 text-2xl sm:text-3xl text-[#385713] mb-2">
              {isEn ? "Featured Article" : "Bài viết nổi bật"}
            </h2>
            <Link
              href={`/tin-tuc/${featuredBlog.id}`}
              className="group block"
            >
              <div className="overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(
                    featuredBlog.coverImage ?? featuredBlog.thumbnail,
                  )}
                  alt={featuredBlog.title ?? "featured"}
                  className="w-full h-56 sm:h-80 lg:h-96 object-cover group-hover:scale-105"
                  style={{
                    willChange: "scale",
                    transition: "scale 0.3s ease-out",
                  }}
                />
              </div>
              <p className="text-[#7d9642] font-medium text-base sm:text-xl mt-3 font-source-serif-4 line-clamp-2 group-hover:text-[#3B5518] transition-colors">
                {featuredBlog.title}
              </p>
              <p className="text-[#7d9642] mt-1 line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm leading-relaxed opacity-90">
                {featuredBlog.shortDescription ??
                  getPreview(featuredBlog.content)}
              </p>
            </Link>
          </FadeInUp>

          {/* Được xem nhiều nhất */}
          {mostViewedBlogs.length > 0 && (
            <div>
              <h2 className="font-source-serif-4 text-2xl sm:text-3xl text-[#385713] mb-2">
                {isEn ? "Most Viewed" : "Được xem nhiều nhất"}
              </h2>

              <StaggerContainer className="grid grid-cols-2 gap-3 sm:gap-4">
                {mostViewedBlogs.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/tin-tuc/${blog.id}`}
                    className="group flex flex-col gap-1.5"
                  >
                    <div className="overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(blog.coverImage ?? blog.thumbnail)}
                        alt={blog.title ?? "blog"}
                        className="w-full h-28 sm:h-36 lg:h-44 object-cover group-hover:scale-105"
                        style={{
                          willChange: "scale",
                          transition: "scale 0.3s ease-out",
                        }}
                      />
                    </div>
                    <p className="text-[#7d9642] font-medium text-xs sm:text-base font-source-serif-4 line-clamp-2 group-hover:text-[#3B5518] transition-colors leading-snug">
                      {blog.title}
                    </p>
                  </Link>
                ))}
              </StaggerContainer>
            </div>
          )}
        </div>
      )}

      {/* Grid bài viết + phân trang */}
      {gridBlogs.length > 0 && (
        <div className={currentPage === 1 ? "mt-6 sm:mt-10" : "mt-2"}>
          <StaggerContainer
            key={currentPage}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6"
          >
            {gridBlogs.map((blog) => (
              <ItemBlog key={blog.id} blog={blog} />
            ))}
          </StaggerContainer>
          <Suspense>
            <BlogPagination
              totalPages={totalGridPages}
              currentPage={currentPage}
            />
          </Suspense>
        </div>
      )}

      {!featuredBlog?.id && mostViewedBlogs.length === 0 && gridBlogs.length === 0 && (
        <p className="text-[#3B5518] text-center py-20">
          {isEn ? "No news updates yet." : "Chưa có bài viết nào."}
        </p>
      )}
    </>
  );
};

const page = async ({ searchParams }: Props) => {
  const { page: pageParam } = await searchParams;
  const currentPage = parsePage(pageParam);
  const cookieStore = await cookies();
  const headersList = await headers();
  const isEn = headersList.get('x-next-locale') === 'en' || cookieStore.get('NEXT_LOCALE')?.value === 'en';

  return (
    <div className="relative overflow-hidden bg-[#DCCFB4]">
      <AbsoluteBackground src="/images/Rectangle1.png" className="object-top" />
      <div className="relative z-10 px-4 sm:px-8 lg:px-10 py-6 flex flex-col gap-4">
        {/* Breadcrumb */}
        <FadeInUp>
          <p className="text-[#3B5518] text-sm">
            <Link href={isEn ? "/en" : "/"} className="hover:text-[#7F9635] transition-colors">
              {isEn ? "Home" : "Trang chủ"}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#7F9635]">{isEn ? "News" : "Tin tức"}</span>
          </p>
        </FadeInUp>

        <Suspense
          key={currentPage}
          fallback={<BlogPageSkeleton currentPage={currentPage} />}
        >
          <BlogPageContent currentPage={currentPage} />
        </Suspense>
      </div>
    </div>
  );
};

export default page;
