/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getCurrentUser } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const bootstrapAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (!storedToken) {
                setLoading(false);
                return;
            }

            setToken(storedToken);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            try {
                const data = await getCurrentUser();
                if (data?.user) {
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrapAuth();
    }, []);

    const login = ({ user: userData, token: authToken }) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
