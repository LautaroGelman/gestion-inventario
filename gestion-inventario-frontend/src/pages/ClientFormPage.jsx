import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. IMPORTACIÓN CORREGIDA:
//    Importamos la función específica 'createClient' desde la API.
import { createClient } from '../services/api';
import './ClientFormPage.css';

function ClientFormPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        telefono: '',
        plan: 'BASICO', // Valor por defecto
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
            // 2. LLAMADA A LA API CORREGIDA:
            //    Usamos la nueva función 'createClient' y le pasamos los datos del formulario.
            await createClient(formData);
            alert('Cliente creado con éxito');
            // Navegamos de vuelta a la sección 'Cuentas' del panel de admin.
            navigate('/panel-admin#cuentas');
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

                    {/* El campo 'estado' se elimina del formulario porque es manejado por el backend */}

                    {error && <p className="error-message">{error}</p>}
                    <div className="form-actions">
                        <button type="submit">Guardar Cliente</button>
                        <button type="button" onClick={() => navigate('/panel-admin#cuentas')}>Cancelar</button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default ClientFormPage;