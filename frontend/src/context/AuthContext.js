import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const DEFAULT_PASSWORDS = {
    owner: 'owner',
    employee: 'employee'
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [passwords, setPasswords] = useState(DEFAULT_PASSWORDS);

    useEffect(() => {
        // Check local storage on mount for user session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Check local storage for custom passwords
        const storedPasswords = localStorage.getItem('app_passwords');
        if (storedPasswords) {
            setPasswords(JSON.parse(storedPasswords));
        }

        setLoading(false);
    }, []);

    const login = (role, password) => {
        const validPassword = passwords[role];

        if (password === validPassword) {
            const userData = { role };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return true;
        } else {
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const changePassword = (role, newPassword) => {
        const updatedPasswords = {
            ...passwords,
            [role]: newPassword
        };
        setPasswords(updatedPasswords);
        localStorage.setItem('app_passwords', JSON.stringify(updatedPasswords));
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            changePassword,
            isAuthenticated: !!user,
            loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
