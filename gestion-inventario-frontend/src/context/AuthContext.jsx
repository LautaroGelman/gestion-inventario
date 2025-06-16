import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                setUser(decodedUser);
            } catch (error) {
                console.error("Token inválido en localStorage", error);
                localStorage.removeItem('token');
            }
        }
    }, []);

    const login = (token) => {
        // ---- INICIO DEL CÓDIGO DE DEPURACIÓN ----
        console.log('%cPASO 1: AuthContext recibe el token', 'color: lightblue; font-size: 14px;', token);
        // ---- FIN DEL CÓDIGO DE DEPURACIÓN ----
        try {
            const decodedUser = jwtDecode(token);
            // ---- INICIO DEL CÓDIGO DE DEPURACIÓN ----
            console.log('%cPASO 2: Token decodificado exitosamente', 'color: #a2e0a2; font-size: 14px;', decodedUser);
            // ---- FIN DEL CÓDIGO DE DEPURACIÓN ----
            localStorage.setItem('token', token);
            setUser(decodedUser);
        } catch (error) {
            // ---- INICIO DEL CÓDIGO DE DEPURACIÓN ----
            console.error('%cERROR: Fallo al decodificar el token en AuthContext', 'color: red; font-size: 14px;', error);
            // ---- FIN DEL CÓDIGO DE DEPURACIÓN ----
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};