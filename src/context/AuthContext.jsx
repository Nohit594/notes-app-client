import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const { loginWithPopup, loginWithRedirect, user: auth0User, logout: auth0Logout, isLoading: auth0Loading } = useAuth0();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Initial Local Token Check
    const [syncingGoogle, setSyncingGoogle] = useState(false); // Auth0 -> Backend Syncing

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);

        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    if (error.response.status === 403 && error.response.data.message === 'Account Suspended') {
                        alert('Your account has been suspended by the administrator.');
                        logout();
                    } else if (error.response.status === 401) {
                        // Only logout if it's not a retry or specific public EP? 
                        // For now keep as is, but be careful with Auth0 flow.
                        logout();
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    // Sync Auth0 User with Backend
    useEffect(() => {
        if (auth0User) {
            setSyncingGoogle(true);
            syncGoogleUser(auth0User).finally(() => {
                setSyncingGoogle(false);
            });
        }
    }, [auth0User]);

    const syncGoogleUser = async (googleUser) => {
        try {
            const res = await axios.post('/api/auth/google', {
                email: googleUser.email,
                username: googleUser.name || googleUser.email.split('@')[0], // Fallback username
                auth0Id: googleUser.sub,
                picture: googleUser.picture
            });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
        } catch (error) {
            console.error('Google Sync Error:', error);
            alert('Failed to sync Google Account with Backend.');
            auth0Logout(); // Logout from Auth0 if backend sync fails
        }
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (username, email, password) => {
        try {
            const res = await axios.post('/api/auth/register', { username, email, password });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        // Also logout from Auth0
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };

    const loginWithGoogle = async () => {
        try {
            await loginWithRedirect();
            // The useEffect will handle the rest when `auth0User` updates after redirect
        } catch (error) {
            console.error('Auth0 Login Failed:', error);
        }
    };

    // Derived loading state to prevent race conditions (Effect runs after render)
    const isAuth0Syncing = loading || auth0Loading || (auth0User && !user);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loginWithGoogle, loading: isAuth0Syncing }}>
            {!isAuth0Syncing && children}
        </AuthContext.Provider>
    );
};
