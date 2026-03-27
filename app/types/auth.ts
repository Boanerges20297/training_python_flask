/*Arquivo para conter as interfaces de autenticação */

export type UserRole = "ADMIN" | "BARBER" | "CLIENT" | "GUEST";

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    address?: string;
    cep?: string;
    number?: string;
    birthDate?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface UserProps {
    data: User;
    isLoading: boolean;
    errorMensage: string | null;
}

export const AUTH_VERSION = '1.0.0';