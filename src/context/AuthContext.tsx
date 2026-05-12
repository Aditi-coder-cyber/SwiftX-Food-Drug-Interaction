import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isGuest: boolean;
    riskProfile: {
        age: string;
        conditions: string[];
        allergies: string[];
    } | null;
}

interface TwoFactorChallenge {
    tempToken: string;
    method: 'email' | 'totp';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    twoFactorPending: TwoFactorChallenge | null;
    login: (email: string, password: string) => Promise<boolean | '2fa'>;
    signup: (name: string, email: string, password: string) => Promise<boolean>;
    verify2FA: (code: string) => Promise<boolean>;
    resend2FAOTP: () => Promise<boolean>;
    cancel2FA: () => void;
    loginAsGuest: () => void;
    logout: () => void;
    clearError: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [twoFactorPending, setTwoFactorPending] = useState<TwoFactorChallenge | null>(null);

    // Auto-load user on mount if token exists
    useEffect(() => {
        const loadUser = async () => {
            const token = api.getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const res = await api.getMe();
            if (res.success && res.data) {
                setUser({
                    ...res.data.user,
                    isGuest: false,
                });
            } else {
                // Token is invalid or expired
                api.logout();
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const refreshUser = useCallback(async () => {
        const res = await api.getMe();
        if (res.success && res.data) {
            setUser({
                ...res.data.user,
                isGuest: false,
            });
        }
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean | '2fa'> => {
        setError(null);
        const res = await api.login(email, password);

        if (res.success && res.data) {
            // 2FA required
            if (res.data.requires2FA) {
                setTwoFactorPending({
                    tempToken: res.data.tempToken!,
                    method: res.data.method as 'email' | 'totp',
                });
                return '2fa';
            }

            // No 2FA — direct login
            setUser({
                ...res.data.user,
                isGuest: false,
            });
            return true;
        }

        setError(res.error?.message || 'Login failed');
        return false;
    }, []);

    const verify2FA = useCallback(async (code: string): Promise<boolean> => {
        if (!twoFactorPending) return false;
        setError(null);

        const res = await api.verify2FA(twoFactorPending.tempToken, code);
        if (res.success && res.data) {
            setUser({
                ...res.data.user,
                isGuest: false,
            });
            setTwoFactorPending(null);
            return true;
        }

        setError(res.error?.message || 'Verification failed');
        return false;
    }, [twoFactorPending]);

    const resend2FAOTP = useCallback(async (): Promise<boolean> => {
        if (!twoFactorPending) return false;
        setError(null);

        const res = await api.send2FAOTP(twoFactorPending.tempToken);
        if (res.success) return true;

        setError(res.error?.message || 'Failed to resend OTP');
        return false;
    }, [twoFactorPending]);

    const cancel2FA = useCallback(() => {
        setTwoFactorPending(null);
        setError(null);
    }, []);

    const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
        setError(null);
        const res = await api.register(name, email, password);

        if (res.success && res.data) {
            setUser({
                ...res.data.user,
                isGuest: false,
            });
            return true;
        }

        setError(res.error?.message || 'Signup failed');
        return false;
    }, []);

    const loginAsGuest = useCallback(() => {
        setUser({
            id: 'guest',
            name: 'Guest',
            email: '',
            role: 'user',
            isGuest: true,
            riskProfile: null,
        });
    }, []);

    const logout = useCallback(() => {
        api.logout();
        setUser(null);
        setError(null);
        setTwoFactorPending(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                twoFactorPending,
                login,
                signup,
                verify2FA,
                resend2FAOTP,
                cancel2FA,
                loginAsGuest,
                logout,
                clearError,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
