import React, { useState, useEffect } from 'react'; // 1. Importa useEffect
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, login } = useAuth(); // 2. Obtén el estado 'user' del contexto

    // 3. Este efecto se ejecutará cada vez que el estado 'user' cambie
    useEffect(() => {
        // Si el objeto 'user' existe, significa que el inicio de sesión fue exitoso.
        if (user) {
            // Ahora es seguro navegar. El componente HomeRedirector se encargará
            // de enviar al usuario al panel correcto (/admin o /panel).
            navigate('/', { replace: true });
        }
    }, [user, navigate]); // El efecto depende de 'user' y 'navigate'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/api/auth/login', { username, password });
            const token = response.token;

            if (!token) {
                throw new Error('No se recibió un token del servidor.');
            }

            // 4. Llama a login. El hook useEffect se encargará de la navegación.
            login(token);

        } catch (err) {
            // Se mejora un poco el mensaje de error para ser más claro
            const errorMessage = err.response?.data?.message || err.message || 'Error al iniciar sesión. Revisa tus credenciales.';
            setError(errorMessage);
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