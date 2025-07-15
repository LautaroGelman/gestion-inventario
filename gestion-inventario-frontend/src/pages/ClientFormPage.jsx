import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../services/api';
import './ClientFormPage.css';

function ClientFormPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        telefono: '',
        plan: 'BASICO',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.password) {
            setError('La contraseña es obligatoria para nuevos clientes.');
            return;
        }

        try {
            await createClient(formData);

            // ✅ CORRECCIÓN DEFINITIVA:
            // Navegamos a '/admin' y pasamos la sección deseada ('cuentas')
            // y el mensaje en el objeto 'state'. Es más robusto que usar el hash '#'.
            navigate('/admin#cuentas', {
                state: {
                    message: 'Cliente creado exitosamente.',
                    type: 'success',
                    targetSection: 'cuentas' // Instrucción directa para mostrar la sección de cuentas
                }
            });

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al crear el cliente.');
            console.error("Error al crear cliente:", err);
        }
    };

    return (
        <div className="client-form-page-container">
            <main className="main-content">
                <header><h1>Registro de Cliente</h1></header>
                <form id="clienteForm" onSubmit={handleSubmit}>
                    <label htmlFor="name">Nombre completo</label>
                    <input type="text" id="name" name="name" onChange={handleChange} value={formData.name} required />

                    <label htmlFor="email">Correo electrónico</label>
                    <input type="email" id="email" name="email" onChange={handleChange} value={formData.email} required />

                    <label htmlFor="password">Contraseña</label>
                    <input type="password" id="password" name="password" onChange={handleChange} value={formData.password} required />

                    <label htmlFor="telefono">Teléfono</label>
                    <input type="text" id="telefono" name="telefono" onChange={handleChange} value={formData.telefono} />

                    <label htmlFor="plan">Plan asignado</label>
                    <select id="plan" name="plan" onChange={handleChange} value={formData.plan}>
                        <option value="BASICO">Básico</option>
                        <option value="INTERMEDIO">Intermedio</option>
                        <option value="PREMIUM">Premium</option>
                    </select>

                    {error && <p className="error-message">{error}</p>}
                    <div className="form-actions">
                        <button type="submit">Guardar Cliente</button>
                        {/* El botón cancelar ahora apunta a la ruta correcta con hash */}
                        <button type="button" onClick={() => navigate('/admin#cuentas')}>Cancelar</button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default ClientFormPage;