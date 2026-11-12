// Auth API request types
export interface RegisterRequest {
	email: string;
	password: string;
	name: string;
	phone: string;
	storeName: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RefreshTokenRequest {
	refreshToken: string;
}
