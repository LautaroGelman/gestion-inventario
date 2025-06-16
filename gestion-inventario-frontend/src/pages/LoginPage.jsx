import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/api/auth/login', { username, password });
            const token = response.token;

            if (!token) {
                throw new Error('No se recibió un token del servidor.');
            }

            login(token);

            // CAMBIO CLAVE: Siempre redirige a la raíz.
            navigate('/', { replace: true });

        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión. Revisa tus credenciales.');
            console.error(err);
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
                            onChange={(e) => setUsername(e.target.value)}
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
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">Iniciar Sesión</button>
                    {error && <p id="error-message" className="error-msg">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default LoginPage;