// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * Decodifica un JWT sin depender de librerías externas.
 * Maneja padding y caracteres URL-safe.
 */
function decodeToken(token) {
    try {
        const payloadBase64Url = token.split('.')[1];
        const base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
        const json = atob(padded);
        return JSON.parse(json);
    } catch (e) {
        console.error('Error al decodificar token', e);
        return null;
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    /**
     * Convierte el payload del JWT en objeto user de la app
     */
    const buildUser = (decoded) => {
        if (!decoded) return null;
        const rolesArr = Array.isArray(decoded.roles)
            ? decoded.roles
            : [decoded.roles];

        return {
            clientId: decoded.clientId,
            employeeId: decoded.employeeId,
            roles: rolesArr,
            // compatibilidad con antigua propiedad "role"
            role: rolesArr[0] || null,
            sub: decoded.sub,
            clientName: decoded.clientName,
            employeeName: decoded.employeeName,
        };
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const decoded = decodeToken(token);
        const decodedUser = buildUser(decoded);
        if (decodedUser) {
            console.log('Decoded on mount →', decodedUser);
            setUser(decodedUser);
        } else {
            localStorage.removeItem('token');
        }
    }, []);

    const login = (token) => {
        console.log('%cPASO 1: AuthContext recibe el token', 'color: lightblue; font-size: 14px;', token);
        const decoded = decodeToken(token);
        const decodedUser = buildUser(decoded);
        if (!decodedUser) {
            console.error('%cERROR: Token inválido', 'color: red;');
            return;
        }
        console.log('%cPASO 2: Token decodificado exitosamente', 'color: #a2e0a2; font-size: 14px;', decodedUser);
        localStorage.setItem('token', token);
        setUser(decodedUser);
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

export const useAuth = () => useContext(AuthContext);
