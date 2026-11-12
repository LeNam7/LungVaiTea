// ---- Entity ----
/** Matches /api/user/{id} response shape */
export interface User {
    id: number;
    userName: string | null;
    firstName: string | null;
    lastName: string | null;
    birthDate: string | null;
    email: string | null;
    role: number;
    departmentId: number | null;
    departmentName: string | null;
    bio: string | null;
    phoneNumber: string | null;
    address: string | null;
    gender?: number | null;
    isBlock: boolean;
}
