import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="flex min-h-[65vh] items-center justify-center bg-[#DED1B9] px-4 py-16 text-center text-[#3B5518]">
            <div className="max-w-xl rounded-2xl border border-[#7F9635]/25 bg-[#F1E8D2] px-6 py-10 shadow-[0_12px_34px_rgba(59,85,24,0.12)] sm:px-10">
                <p className="font-source-serif-4 text-2xl text-[#7F9635]">404</p>
                <h1 className="mt-2 font-source-serif-4 text-4xl">Không tìm thấy trang</h1>
                <p className="mt-4 text-sm leading-6 text-[#3B5518]/75">
                    Nội dung bạn tìm kiếm không tồn tại, đã bị ẩn hoặc đường dẫn không còn hợp lệ.
                </p>
                <Link
                    href="/"
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7F9635] px-5 py-3 font-semibold text-white transition hover:bg-[#6f8532]"
                >
                    Về trang chủ
                </Link>
            </div>
        </main>
    );
}
