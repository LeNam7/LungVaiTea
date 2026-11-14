import Link from "next/link";
import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getBlogByIdAPI, getBlogsPagingAPI } from "@/api/BlogAPI";
import { unwrapApiData, unwrapPagingData } from "@/api/response";
import type { Blog } from "@/types/swagger.types";
import { resolveApiImageUrl } from "@/utils/imageUrl";
import ItemBlog from "../components/ItemBlog";
import FadeInUp from "@/components/animations/FadeInUp";
import StaggerContainer from "@/components/animations/StaggerContainer";
import BlogPagination from "@/components/ui/BlogPagination";
import AbsoluteBackground from "@/components/common/AbsoluteBackground";

export const dynamic = "force-dynamic";

const getImageUrl = (path?: string | null) => {
  return resolveApiImageUrl(path, "/images/blogdetail.png");
};

const RELATED_PAGE_SIZE = 5;

const parsePage = (value?: string) => {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

const RelatedBlogsSkeleton = () => (
  <div className="flex flex-col gap-6 mt-4">
    <h2 className="font-source-serif-4 text-2xl sm:text-3xl text-[#385713] text-center">
      Tin tức liên quan
    </h2>
    <div className="grid grid-cols-2 lg:grid-cols-5 lg:gap-6 gap-3">
      {Array.from({length: RELATED_PAGE_SIZE}).map((_, index) => (
        <div key={index} className="flex flex-col gap-2 animate-pulse">
          <div className="h-44 rounded-lg bg-[#7F9635]/25" />
          <div className="h-5 rounded bg-[#7F9635]/25" />
          <div className="h-4 w-4/5 rounded bg-[#7F9635]/20" />
        </div>
      ))}
    </div>
  </div>
);

const RelatedBlogsSection = async ({blogId, currentPage, isEn}: {blogId: number; currentPage: number; isEn?: boolean}) => {
  let relatedBlogs: Blog[] = [];
  let totalRelatedPages = 1;

  try {
    const relatedLookupSize = currentPage * RELATED_PAGE_SIZE + 1;
    const relatedRes = await getBlogsPagingAPI({
      pageIndex: 1,
      pageSize: relatedLookupSize,
      isActive: true,
    });
    const relatedPaging = unwrapPagingData<Blog>(relatedRes);
    const relatedStart = (currentPage - 1) * RELATED_PAGE_SIZE;

    relatedBlogs = relatedPaging.data
      .filter((item) => item.id !== blogId)
      .slice(relatedStart, relatedStart + RELATED_PAGE_SIZE);
    totalRelatedPages = Math.max(
      1,
      Math.ceil(
        Math.max(0, relatedPaging.totalRecords - 1) / RELATED_PAGE_SIZE,
      ),
    );
  } catch {
    relatedBlogs = [];
    totalRelatedPages = 1;
  }

  if (currentPage > totalRelatedPages) {
    redirect(`/tin-tuc/${blogId}?page=${totalRelatedPages}`);
  }

  if (relatedBlogs.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 mt-4">
      <FadeInUp>
        <h2 className="font-source-serif-4 text-2xl sm:text-3xl text-[#385713] text-center">
          {isEn ? "Related News" : "Tin tức liên quan"}
        </h2>
      </FadeInUp>
      <StaggerContainer
        key={currentPage}
        className="grid grid-cols-2 lg:grid-cols-5 lg:gap-6 gap-3"
      >
        {relatedBlogs.map((item) => (
          <ItemBlog key={item.id} blog={item} />
        ))}
      </StaggerContainer>
      <Suspense>
        <BlogPagination
          totalPages={totalRelatedPages}
          currentPage={currentPage}
          scroll={false}
        />
      </Suspense>
    </div>
  );
};

const Page = async ({ params, searchParams }: Props) => {
  const [{ id }, { page: pageParam }] = await Promise.all([
    params,
    searchParams,
  ]);
  const blogId = Number(id);
  const currentPage = parsePage(pageParam);
  const cookieStore = await cookies();
  const headersList = await headers();
  const isEn = headersList.get('x-next-locale') === 'en' || cookieStore.get('NEXT_LOCALE')?.value === 'en';

  let blog: Blog | null = null;
  let latestBlogs: Blog[] = [];

  try {
    const res = await getBlogByIdAPI(blogId);
    blog = unwrapApiData<Blog>(res);
  } catch {
    blog = null;
  }

  if (!blog?.id || blog.isActive === false) notFound();

  try {
    const latestRes = await getBlogsPagingAPI({ pageIndex: 1, pageSize: 4, isActive: true });
    const latestPaging = unwrapPagingData<Blog>(latestRes);

    latestBlogs = latestPaging.data
      .filter((item) => item.id !== blogId)
      .slice(0, 3);
  } catch {
    latestBlogs = [];
  }

  return (
    <div className="relative overflow-hidden bg-[#DACEB8]">
      <AbsoluteBackground
        src="/images/bg-detail-blog.png"
        className="object-top"
      />
      <div className="relative z-10 px-4 sm:px-8 lg:px-10 py-5 flex flex-col gap-8">
        <FadeInUp>
          <div className="flex items-center gap-1 text-[#3B5518] text-sm min-w-0">
            <Link
              href={isEn ? "/en" : "/"}
              className="hover:text-[#7F9635] transition-colors whitespace-nowrap"
            >
              {isEn ? "Home" : "Trang chủ"}
            </Link>
            <span className="shrink-0">/</span>
            <Link
              href={isEn ? "/en/tin-tuc" : "/tin-tuc"}
              className="hover:text-[#7F9635] transition-colors whitespace-nowrap"
            >
              {isEn ? "News" : "Tin tức"}
            </Link>
            <span className="shrink-0">/</span>
            <span className="text-[#7F9635] truncate">{blog.title}</span>
          </div>
        </FadeInUp>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-10 w-full">
          <FadeInUp
            delay={0.1}
            className="col-span-1 lg:col-span-7 flex flex-col gap-5"
          >
            <h1 className="text-[#3c541a] font-source-serif-4 text-2xl sm:text-3xl">
              {blog.title}
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(blog.coverImage ?? blog.thumbnail)}
              alt={blog.title ?? "blog"}
              className="mx-auto w-full lg:max-w-[800px] max-h-[75vh] object-cover rounded-xl"
            />
            <div
              className="blog-content max-w-none text-[#3B5518]"
              dangerouslySetInnerHTML={{
                __html: blog.content ?? (isEn ? "<p>Content is being updated...</p>" : "<p>Đang cập nhật nội dung...</p>"),
              }}
            />
          </FadeInUp>

          <FadeInUp
            delay={0.15}
            className="col-span-1 lg:col-span-3 flex flex-col gap-4"
          >
            <span className="font-source-serif-4 text-2xl text-[#3c541a]">
              {isEn ? "Latest Articles" : "Tin tức mới nhất"}
            </span>
            <div className="flex flex-col gap-5">
              {latestBlogs.map((item) => (
                <Link
                  key={item.id}
                  href={isEn ? `/en/tin-tuc/${item.id}` : `/tin-tuc/${item.id}`}
                  className="group flex flex-col gap-2"
                >
                  <div className="overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(item.coverImage ?? item.thumbnail)}
                      alt={item.title ?? "blog"}
                      className="w-full h-44 object-cover group-hover:scale-105"
                      style={{
                        willChange: "scale",
                        transition: "scale 0.3s ease-out",
                      }}
                    />
                  </div>
                  <p className="text-[#7d9642] font-medium font-source-serif-4 line-clamp-2 group-hover:text-[#3B5518] transition-colors">
                    {item.title}
                  </p>
                </Link>
              ))}
            </div>
          </FadeInUp>
        </div>

        <Suspense
          key={`${blogId}-${currentPage}`}
          fallback={<RelatedBlogsSkeleton />}
        >
          <RelatedBlogsSection
            blogId={blogId}
            currentPage={currentPage}
            isEn={isEn}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default Page;
