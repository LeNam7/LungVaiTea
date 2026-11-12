'use client';

import React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {toast} from '@/utils/toast';
import {forgotPasswordAPI, resetPasswordAPI} from '@/api/AuthAPI';
import {loginThunk, registerThunk, fetchUserThunk} from '@/store/auth.store';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {Eye, EyeOff} from 'lucide-react';

type Tab = 'login' | 'register' | 'forgot' | 'reset';
const PHONE_REGEX = /^(0[35789])\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TaiKhoanPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const {isLoading, user} = useAppSelector((s) => s.auth);

    const [tab, setTab] = React.useState<Tab>('login');

    // Login
    const [loginPhone, setLoginPhone] = React.useState('');
    const [loginPassword, setLoginPassword] = React.useState('');
    const [showLoginPassword, setShowLoginPassword] = React.useState(false);

    // Register
    const [registerName, setRegisterName] = React.useState('');
    const [registerPhone, setRegisterPhone] = React.useState('');
    const [registerEmail, setRegisterEmail] = React.useState('');
    const [registerPassword, setRegisterPassword] = React.useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = React.useState('');
    const [showRegisterPassword, setShowRegisterPassword] = React.useState(false);
    const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = React.useState(false);
    const [registerLoading, setRegisterLoading] = React.useState(false);

    // Forgot password
    const [forgotEmail, setForgotEmail] = React.useState('');
    const [forgotLoading, setForgotLoading] = React.useState(false);

    // Reset password
    const [resetEmail, setResetEmail] = React.useState('');
    const [resetOtp, setResetOtp] = React.useState('');
    const [resetNewPw, setResetNewPw] = React.useState('');
    const [resetConfirmPw, setResetConfirmPw] = React.useState('');
    const [resetLoading, setResetLoading] = React.useState(false);

    React.useEffect(() => {
        if (user?.id) {
            router.push('/thong-tin-tai-khoan');
        }
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        const normalizedPhone = loginPhone.trim();
        if (!PHONE_REGEX.test(normalizedPhone) || !loginPassword.trim()) {
            toast.warning(!PHONE_REGEX.test(normalizedPhone) ? 'Số điện thoại không hợp lệ' : 'Vui lòng nhập mật khẩu');
            return;
        }

        const resultAction = await dispatch(
            loginThunk({
                phoneNumber: normalizedPhone,
                password: loginPassword,
            }),
        );

        if (loginThunk.fulfilled.match(resultAction)) {
            // Fetch full user profile
            await dispatch(fetchUserThunk(resultAction.payload.data.userId));
            toast.success('Đăng nhập thành công');
            router.push('/thong-tin-tai-khoan');
        } else {
            toast.error((resultAction.payload as string) ?? 'Đăng nhập thất bại');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (registerLoading) return;
        const normalizedName = registerName.trim();
        const normalizedPhone = registerPhone.trim();
        const normalizedEmail = registerEmail.trim();
        if (!normalizedName || !normalizedPhone || !normalizedEmail || !registerPassword || !registerConfirmPassword) {
            toast.warning('Vui lòng nhập đầy đủ thông tin đăng ký');
            return;
        }

        if (!PHONE_REGEX.test(normalizedPhone)) {
            toast.warning('Số điện thoại không hợp lệ');
            return;
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            toast.warning('Email không hợp lệ');
            return;
        }

        if (registerPassword.length < 6) {
            toast.warning('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (registerPassword !== registerConfirmPassword) {
            toast.warning('Mật khẩu xác nhận không khớp');
            return;
        }

        setRegisterLoading(true);
        try {
            await dispatch(registerThunk({
                fullName: normalizedName,
                phoneNumber: normalizedPhone,
                email: normalizedEmail,
                password: registerPassword,
            })).unwrap();
            toast.success('Đăng ký thành công, vui lòng đăng nhập');
            setTab('login');
            setLoginPhone(normalizedPhone);
            setRegisterName('');
            setRegisterPhone('');
            setRegisterEmail('');
            setRegisterPassword('');
            setRegisterConfirmPassword('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Đăng ký thất bại');
        } finally {
            setRegisterLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (forgotLoading) return;
        const normalizedEmail = forgotEmail.trim();
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            toast.warning('Email không hợp lệ');
            return;
        }
        setForgotLoading(true);
        try {
            await forgotPasswordAPI({email: normalizedEmail});
            toast.success('Mã OTP đã được gửi đến email của bạn');
            setResetEmail(normalizedEmail);
            setTab('reset');
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Gửi mã OTP thất bại');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (resetLoading) return;
        const normalizedEmail = resetEmail.trim();
        const normalizedOtp = resetOtp.trim();
        if (!EMAIL_REGEX.test(normalizedEmail) || !normalizedOtp || !resetNewPw || !resetConfirmPw) {
            toast.warning('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (resetNewPw.length < 6) {
            toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        if (resetNewPw !== resetConfirmPw) {
            toast.warning('Mật khẩu xác nhận không khớp');
            return;
        }
        setResetLoading(true);
        try {
            await resetPasswordAPI({
                email: normalizedEmail,
                otpCode: normalizedOtp,
                newPassword: resetNewPw,
            });
            toast.success('Đặt lại mật khẩu thành công, vui lòng đăng nhập');
            setTab('login');
            setResetEmail('');
            setResetOtp('');
            setResetNewPw('');
            setResetConfirmPw('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Đặt lại mật khẩu thất bại');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#3B5518] text-[#E4D7BD] relative">
            <h1 className="sr-only">Tài khoản khách hàng</h1>
            <div className="absolute top-0 left-0 right-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/bg-contact.png"
                    alt=""
                    className="w-full"
                />
            </div>

            <div className="relative px-6 md:px-16 py-8">
                <p className="mb-4 text-sm">
                    <Link href="/">Home</Link> / Tài khoản
                </p>

                <div className="max-w-[760px] mx-auto bg-[#E4D7BD] text-[#3B5518] rounded-2xl shadow-xl overflow-hidden">
                    {/* Tabs: only login/register on top */}
                    {(tab === 'login' || tab === 'register') && (
                        <div className="grid grid-cols-2 bg-[#D8C9A8]">
                            <button
                                onClick={() => setTab('login')}
                                className={`py-4 font-semibold transition ${tab === 'login' ? 'bg-[#E4D7BD]' : 'hover:bg-[#E8DCC3]'}`}
                            >
                                Đăng nhập
                            </button>
                            <button
                                onClick={() => setTab('register')}
                                className={`py-4 font-semibold transition ${tab === 'register' ? 'bg-[#E4D7BD]' : 'hover:bg-[#E8DCC3]'}`}
                            >
                                Đăng ký
                            </button>
                        </div>
                    )}

                    {/* Login */}
                    {tab === 'login' && (
                        <form
                            onSubmit={handleLogin}
                            className="p-6 md:p-8 flex flex-col gap-4"
                        >
                            <h2 className="font-source-serif-4 text-3xl">Đăng nhập tài khoản</h2>
                            <input
                                name="loginPhone"
                                aria-label="Số điện thoại đăng nhập"
                                autoComplete="tel"
                                inputMode="tel"
                                value={loginPhone}
                                onChange={(e) => setLoginPhone(e.target.value)}
                                placeholder="Số điện thoại"
                                className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 outline-none"
                            />
                            <div className="relative">
                                <input
                                    name="loginPassword"
                                    aria-label="Mật khẩu đăng nhập"
                                    autoComplete="current-password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    type={showLoginPassword ? 'text' : 'password'}
                                    placeholder="Mật khẩu"
                                    className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 pr-12 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLoginPassword((value) => !value)}
                                    className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#7F9635] transition hover:text-[#3B5518]"
                                    aria-label={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setTab('forgot')}
                                    className="inline-flex min-h-11 items-center text-sm text-[#3B5518] hover:underline"
                                >
                                    Quên mật khẩu?
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-2 bg-[#3B5518] text-[#E4D7BD] rounded-xl py-3 font-semibold hover:opacity-95 disabled:opacity-60"
                            >
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                        </form>
                    )}

                    {/* Register */}
                    {tab === 'register' && (
                        <form
                            onSubmit={handleRegister}
                            className="p-6 md:p-8 flex flex-col gap-4"
                        >
                            <h2 className="font-source-serif-4 text-3xl">Tạo tài khoản mới</h2>
                            <input
                                name="fullName"
                                aria-label="Họ và tên"
                                autoComplete="name"
                                value={registerName}
                                onChange={(e) => setRegisterName(e.target.value)}
                                placeholder="Họ và tên"
                                className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 outline-none"
                            />
                            <input
                                name="phone"
                                aria-label="Số điện thoại đăng ký"
                                autoComplete="tel"
                                inputMode="tel"
                                value={registerPhone}
                                onChange={(e) => setRegisterPhone(e.target.value)}
                                placeholder="Số điện thoại"
                                className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 outline-none"
                            />
                            <input
                                name="email"
                                aria-label="Email đăng ký"
                                autoComplete="email"
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                type="email"
                                placeholder="Email"
                                className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 outline-none"
                            />
                            <div className="relative">
                                <input
                                    name="password"
                                    aria-label="Mật khẩu đăng ký"
                                    autoComplete="new-password"
                                    value={registerPassword}
                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                    type={showRegisterPassword ? 'text' : 'password'}
                                    placeholder="Mật khẩu"
                                    className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 pr-12 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterPassword((value) => !value)}
                                    className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#7F9635] transition hover:text-[#3B5518]"
                                    aria-label={showRegisterPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showRegisterPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    name="confirmPassword"
                                    aria-label="Xác nhận mật khẩu đăng ký"
                                    autoComplete="new-password"
                                    value={registerConfirmPassword}
                                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                                    type={showRegisterConfirmPassword ? 'text' : 'password'}
                                    placeholder="Nhập lại mật khẩu"
                                    className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 pr-12 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterConfirmPassword((value) => !value)}
                                    className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#7F9635] transition hover:text-[#3B5518]"
                                    aria-label={showRegisterConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                                >
                                    {showRegisterConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={registerLoading}
                                className="mt-2 bg-[#3B5518] text-[#E4D7BD] rounded-xl py-3 font-semibold hover:opacity-95 disabled:opacity-60"
                            >
                                {registerLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                            </button>
                        </form>
                    )}

                    {/* Forgot Password */}
                    {tab === 'forgot' && (
                        <form
                            onSubmit={handleForgotPassword}
                            className="p-6 md:p-8 flex flex-col gap-4"
                        >
                            <h2 className="font-source-serif-4 text-3xl">Quên mật khẩu</h2>
                            <p className="text-sm text-[#3B5518]/70">
                                Nhập email đăng ký tài khoản để nhận mã OTP đặt lại mật khẩu.
                            </p>
                            <input
                                name="forgotEmail"
                                aria-label="Email nhận mã đặt lại mật khẩu"
                                autoComplete="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                type="email"
                                placeholder="Email của bạn"
                                className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 outline-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setTab('login')}
                                    className="flex-1 border border-[#3B5518] text-[#3B5518] rounded-xl py-3 font-semibold hover:opacity-80"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="flex-1 bg-[#3B5518] text-[#E4D7BD] rounded-xl py-3 font-semibold hover:opacity-95 disabled:opacity-60"
                                >
                                    {forgotLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                                </button>
                            </div>
                            <p className="text-center text-sm">
                                Đã có mã OTP?{' '}
                                <button
                                    type="button"
                                    onClick={() => setTab('reset')}
                                    className="text-[#3B5518] underline"
                                >
                                    Đặt lại mật khẩu
                                </button>
                            </p>
                        </form>
                    )}

                    {/* Reset Password */}
                    {tab === 'reset' && (
                        <form
                            onSubmit={handleResetPassword}
                            className="p-6 md:p-8 flex flex-col gap-4"
                        >
                            <h2 className="font-source-serif-4 text-3xl">Đặt lại mật khẩu</h2>
                            <p className="text-sm text-[#3B5518]/70">
                                Nhập mã OTP đã được gửi đến email của bạn và mật khẩu mới.
                            </p>
                            <input
                                name="resetEmail"
                                aria-label="Email đặt lại mật khẩu"
                                autoComplete="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                type="email"
                                placeholder="Email"
                                className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 outline-none"
                            />
                            <input
                                name="otp"
                                aria-label="Mã OTP"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={resetOtp}
                                onChange={(e) => setResetOtp(e.target.value)}
                                placeholder="Mã OTP"
                                className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 outline-none"
                            />
                            <input
                                name="newPassword"
                                aria-label="Mật khẩu mới"
                                autoComplete="new-password"
                                value={resetNewPw}
                                onChange={(e) => setResetNewPw(e.target.value)}
                                type="password"
                                placeholder="Mật khẩu mới"
                                className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 outline-none"
                            />
                            <input
                                name="confirmNewPassword"
                                aria-label="Xác nhận mật khẩu mới"
                                autoComplete="new-password"
                                value={resetConfirmPw}
                                onChange={(e) => setResetConfirmPw(e.target.value)}
                                type="password"
                                placeholder="Nhập lại mật khẩu mới"
                                className="w-full bg-white border border-[#8DA05B] rounded-xl px-4 py-3 outline-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setTab('forgot')}
                                    className="flex-1 border border-[#3B5518] text-[#3B5518] rounded-xl py-3 font-semibold hover:opacity-80"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="flex-1 bg-[#3B5518] text-[#E4D7BD] rounded-xl py-3 font-semibold hover:opacity-95 disabled:opacity-60"
                                >
                                    {resetLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
