// src/components/LoginPage.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage(): JSX.Element {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]     = useState('');
    const router = useRouter();
    const { user, login } = useAuth();

    useEffect(() => {
        if (user) {
            router.replace('/');
        }
    }, [user, router]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            const response = await apiLogin({ username, password });
            const token = response.data?.token;
            if (!token) {
                throw new Error('No se recibió un token válido del servidor.');
            }
            login(token);
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.message ||
                'Error al iniciar sesión. Revisa tus credenciales.';
            console.error('Error en el login:', err);
            setError(message);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-container">
                <h2>Comercializa S.A.</h2>
                <form id="loginForm" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Ingrese su usuario"
                            required
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Ingrese su contraseña"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">Iniciar Sesión</button>
                    {error && (
                        <p id="error-message" className="error-msg">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
