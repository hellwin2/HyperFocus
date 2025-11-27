import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    // 1. Get Token
                    const formData = new FormData();
                    formData.append('username', email);
                    formData.append('password', password);

                    const response = await api.post('/login/access-token', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });

                    const { access_token } = response.data;
                    set({ token: access_token, isAuthenticated: true });

                    // 2. Get User Details
                    const userResponse = await api.get('/users/me');
                    set({ user: userResponse.data, isLoading: false });

                    return true;
                } catch (error) {
                    set({
                        error: error.response?.data?.detail || 'Login failed',
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
