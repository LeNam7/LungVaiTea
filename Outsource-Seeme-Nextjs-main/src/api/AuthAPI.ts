import APIBase from './config/APIBase';
import type {
    LoginModel,
    RefreshTokenModel,
    CreateUserModel,
    ChangePasswordInputModel,
    ForgotPasswordRequestModel,
    ResetPasswordWithOtpModel,
} from '@/types/swagger.types';

/** POST /api/auth/login - Đăng nhập hệ thống */
export const loginAPI = (data: LoginModel) =>
    APIBase.post('/api/auth/login', data);

/** POST /api/auth/refresh-token - Làm mới token */
export const refreshTokenAPI = (data: RefreshTokenModel) =>
    APIBase.post('/api/auth/refresh-token', data);

/** POST /api/auth/register - Tạo mới người dùng */
export const registerAPI = (data: CreateUserModel) =>
    APIBase.post('/api/auth/register', data);

/** PUT /api/auth/change-password - Thay đổi mật khẩu */
export const changePasswordAPI = (data: ChangePasswordInputModel) =>
    APIBase.put('/api/auth/change-password', data);

/** POST /api/auth/forgot-password - Gửi mã OTP quên mật khẩu tới email */
export const forgotPasswordAPI = (data: ForgotPasswordRequestModel) =>
    APIBase.post('/api/auth/forgot-password', data);

/** POST /api/auth/reset-password - Đặt lại mật khẩu bằng OTP */
export const resetPasswordAPI = (data: ResetPasswordWithOtpModel) =>
    APIBase.post('/api/auth/reset-password', data);

/** GET /api/auth/{userId} - Lấy thông tin người dùng theo Id */
export const getUserByIdAPI = (userId: number) =>
    APIBase.get(`/api/auth/${userId}`);

/** @deprecated use refreshTokenAPI */
export const getUser = refreshTokenAPI;


