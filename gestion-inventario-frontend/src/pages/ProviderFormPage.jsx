import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. IMPORTACIONES CORREGIDAS:
//    Importamos la función para añadir proveedores y el hook de autenticación.
import { addProvider } from '../services/api';
import { useAuth } from '../context/AuthContext';
// Reutilizaremos los estilos del formulario de artículos
import './ArticleFormPage.css';

function ProviderFormPage() {
    const { user } = useAuth(); // Para obtener el clientId
    const navigate = useNavigate();

    // El formulario ahora solo maneja la creación, no la edición.
    const [formData, setFormData] = useState({
        name: '',
        contactInfo: '',
        paymentTerms: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.clientId) {
            setError('No se pudo identificar al cliente. Por favor, recarga la página.');
            return;
        }
        setError('');

        try {
            // 2. LLAMADA A LA API CORREGIDA:
            //    Usamos la función específica para crear un proveedor.
            await addProvider(user.clientId, formData);
            alert('Proveedor creado con éxito');
            // Navegamos de vuelta a la sección de proveedores en el panel.
            navigate('/panel-cliente#providers');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el proveedor.');
            console.error("Error creating provider:", err);
        }
    };

    return (
        <div className="container-form">
            <header className="form-header">
                {/* El título ahora es fijo, ya que solo creamos nuevos. */}
                <h1>Nuevo Proveedor</h1>
            </header>
            <main>
                <form id="form-proveedor" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Nombre:</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="contactInfo">Información de Contacto:</label>
                        <textarea id="contactInfo" name="contactInfo" value={formData.contactInfo} onChange={handleChange} rows="4"></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="paymentTerms">Términos de Pago:</label>
                        <textarea id="paymentTerms" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} rows="4"></textarea>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="form-actions">
                        <button type="submit" className="btn-submit">Guardar</button>
                        <button type="button" className="btn-cancel" onClick={() => navigate('/panel-cliente#providers')}>Cancelar</button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default ProviderFormPage;