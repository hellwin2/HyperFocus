import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    // 1. Get Token (Use URLSearchParams for application/x-www-form-urlencoded)
                    const params = new URLSearchParams();
                    params.append('username', email);
                    params.append('password', password);

                    const response = await api.post('/login/access-token', params, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });

                    const { access_token } = response.data;
                    set({ token: access_token, isAuthenticated: true });

                    // 2. Get User Details
                    const userResponse = await api.get('/users/me');
                    set({ user: userResponse.data, isLoading: false });

                    return true;
                } catch (error) {
                    let errorMessage = 'Login failed';
                    if (error.response?.data?.detail) {
                        const detail = error.response.data.detail;
                        // Handle array of errors (validation errors)
                        if (Array.isArray(detail)) {
                            errorMessage = detail.map(err => err.msg).join(', ');
                        } else {
                            errorMessage = detail;
                        }
                    }

                    set({
                        error: errorMessage,
                        isLoading: false,
                        token: null,
                        isAuthenticated: false
                    });
                    return false;
                }
            },

            register: async (name, email, password) => {
                set({ isLoading: true, error: null });
                try {
                    await api.post('/register', { name, email, password });
                    // Auto login after register? Or redirect to login. Let's redirect.
                    set({ isLoading: false });
                    return true;
                } catch (error) {
                    set({
                        error: error.response?.data?.detail || 'Registration failed',
                        isLoading: false
                    });
                    return false;
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
