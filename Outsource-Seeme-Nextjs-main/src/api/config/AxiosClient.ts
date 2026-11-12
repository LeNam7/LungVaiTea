
import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { getCookie, setCookie, deleteCookie } from "@/utils/cookie";
import { DOMAINS } from "@/utils/domain";

// Instance riêng cho refresh - tránh circular dependency
const refreshInstance = axios.create({ baseURL: DOMAINS.API });
let refreshRequest: Promise<string> | null = null;

const clearSessionAndRedirect = () => {
    deleteCookie("accessToken");
    deleteCookie("refreshToken");
    deleteCookie("userId");

    if (typeof window !== "undefined" && window.location.pathname !== "/tai-khoan") {
        window.location.replace("/tai-khoan");
    }
};

const requestNewAccessToken = (refreshToken: string) => {
    if (refreshRequest) return refreshRequest;

    refreshRequest = refreshInstance
        .post('/api/auth/refresh-token', { refreshToken })
        .then((refreshResponse) => {
            const payload = refreshResponse.data?.data;
            const newAccessToken =
                typeof payload === 'string' ? payload : payload?.accessToken;

            if (!newAccessToken) {
                throw new Error("Không nhận được access token mới.");
            }

            setCookie("accessToken", newAccessToken);
            return newAccessToken;
        })
        .finally(() => {
            refreshRequest = null;
        });

    return refreshRequest;
};

export default function getInstanceAxios(baseAPI: string = "") {
    const instance = axios.create({
        baseURL: baseAPI || "",
    });

    instance.interceptors.request.use(
        function (config: InternalAxiosRequestConfig) {
            const accessToken = getCookie("accessToken");
            config.headers.Accept = "application/json";
            // For FormData, delete Content-Type so the browser sets multipart/form-data + boundary
            if (config.data instanceof FormData) {
                delete config.headers["Content-Type"];
            } else {
                config.headers["Content-Type"] = "application/json";
            }
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        },
        function (error) {
            return Promise.reject(error);
        }
    );

    instance.interceptors.response.use(
        function (response) {
            return response.data;
        },
        async function (error) {
            const originalRequest = error.config;
            const { response } = error;

            if (response && response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                const refreshToken = getCookie("refreshToken");

                if (!refreshToken) {
                    clearSessionAndRedirect();
                    return Promise.reject(error);
                }

                try {
                    const newAccessToken = await requestNewAccessToken(refreshToken);
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return await instance(originalRequest);
                } catch {
                    clearSessionAndRedirect();
                    return Promise.reject(error);
                }
            }
            return Promise.reject(error);
        }
    );

    return instance;
}
