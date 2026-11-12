import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { loginAPI, registerAPI, forgotPasswordAPI, resetPasswordAPI } from '@/api/AuthAPI';
import { getUserByIdAPI } from '@/api/UserAPI';
import { setCookie, deleteCookie } from '@/utils/cookie';
import type {
    LoginModel,
    CreateUserModel,
    ForgotPasswordRequestModel,
    ResetPasswordWithOtpModel,
} from '@/types/swagger.types';
import type { User } from '@/types/user';
import type {RootState} from './index';

// ---- State ----
interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    error: null,
};

// ---- Thunks ----

/**
 * Login - POST /api/auth/login
 * Response.data: { success, data: { userId, accessToken, refreshToken }, message }
 */
export const loginThunk = createAsyncThunk(
    'auth/login',
    async (credentials: LoginModel, { rejectWithValue }) => {
        try {
            const res = await loginAPI(credentials);
            // interceptor unwraps: res = { data: {success, data:{...}, message}, statusCode, message }
            const payload = (res as any).data as {
                success: boolean;
                data: { userId: number; accessToken: string; refreshToken: string };
                message: string;
            };
            if (!payload?.success) {
                return rejectWithValue(payload?.message ?? 'Đăng nhập thất bại');
            }
            return payload;
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data?.message ?? 'Đăng nhập thất bại'
            );
        }
    }
);

/**
 * Register - POST /api/auth/register
 * Response.data: { isSuccess, passwordError, emailError, usernameError }
 */
export const registerThunk = createAsyncThunk(
    'auth/register',
    async (data: CreateUserModel, { rejectWithValue }) => {
        try {
            const res = await registerAPI(data);
            const payload = (res as any).data as {
                isSuccess: boolean;
                passwordError: string;
                emailError: string;
                usernameError: string;
            };
            if (!payload?.isSuccess) {
                const errMsg =
                    payload?.usernameError ||
                    payload?.emailError ||
                    payload?.passwordError ||
                    'Đăng ký thất bại';
                return rejectWithValue(errMsg);
            }
            return payload;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data?.message ?? 'Đăng ký thất bại');
        }
    }
);

/**
 * Forgot password - POST /api/auth/forgot-password
 * Response.data: string (OTP sent message)
 */
export const forgotPasswordThunk = createAsyncThunk(
    'auth/forgotPassword',
    async (data: ForgotPasswordRequestModel, { rejectWithValue }) => {
        try {
            const res = await forgotPasswordAPI(data);
            return (res as any).data as string;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data?.message ?? 'Gửi mã OTP thất bại');
        }
    }
);

/**
 * Reset password - POST /api/auth/reset-password
 * Response.data: any
 */
export const resetPasswordThunk = createAsyncThunk(
    'auth/resetPassword',
    async (data: ResetPasswordWithOtpModel, { rejectWithValue }) => {
        try {
            const res = await resetPasswordAPI(data);
            return (res as any).data;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data?.message ?? 'Đặt lại mật khẩu thất bại');
        }
    }
);

/**
 * Fetch user profile - GET /api/user/{id}
 * Response.data: User object
 */
export const fetchUserThunk = createAsyncThunk(
    'auth/fetchUser',
    async (userId: number, { rejectWithValue }) => {
        try {
            const res = await getUserByIdAPI(userId);
            return (res as any).data as User;
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data?.message ?? 'Không thể lấy thông tin người dùng'
            );
        }
    },
    {
        condition: (userId, {getState}) => {
            const {auth} = getState() as RootState;
            if (auth.isLoading) return false;
            if (Number(auth.user?.id) === userId && auth.user?.phoneNumber) return false;
            return true;
        },
    },
);

// ---- Slice ----
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.error = null;
            deleteCookie('accessToken');
            deleteCookie('refreshToken');
            deleteCookie('userId');
        },
        setCredentials(
            state,
            action: PayloadAction<{ accessToken: string; refreshToken: string }>
        ) {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // login
        builder
            .addCase(loginThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.accessToken = action.payload.data.accessToken;
                state.refreshToken = action.payload.data.refreshToken;
                // Store a minimal user object so components don't bail early
                const userId = action.payload.data.userId;
                state.user = { id: userId } as User;
                setCookie('accessToken', action.payload.data.accessToken, dayjs().add(1, 'day'));
                setCookie('refreshToken', action.payload.data.refreshToken, dayjs().add(30, 'day'));
                // Persist userId so we can restore user on page refresh
                setCookie('userId', String(userId), dayjs().add(30, 'day'));
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // register
        builder
            .addCase(registerThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerThunk.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(registerThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // fetchUser
        builder
            .addCase(fetchUserThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(fetchUserThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout, setCredentials, clearError } = authSlice.actions;
export type { LoginModel };
export default authSlice.reducer;


