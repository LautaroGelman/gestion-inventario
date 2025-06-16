import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. IMPORTACIÓN CORREGIDA:
//    Importamos la función 'login' específica desde nuestro servicio de API.
//    La renombramos a 'apiLogin' para no confundirla con la función 'login' del contexto.
import { login as apiLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    // La función 'login' del contexto se usa para guardar el estado de autenticación.
    const { user, login } = useAuth();

    useEffect(() => {
        if (user) {
            // HomeRedirector se encarga de la lógica de redirección.
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // La llamada a la API devuelve { data: { token: '...' } }
            const response = await apiLogin({ username, password });

            // Extraemos el string del token de la respuesta.
            const token = response.data?.token;

            if (!token) {
                throw new Error('No se recibió un token válido del servidor.');
            }

            // ✅ CORRECCIÓN DEFINITIVA:
            // Pasamos únicamente el STRING del token a la función de login del contexto.
            login(token);

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al iniciar sesión. Revisa tus credenciales.';
            setError(errorMessage);
            console.error("Error en el login:", err);
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