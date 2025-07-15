import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. IMPORTACIONES CORREGIDAS:
//    Importamos la función específica para obtener proveedores y el hook de autenticación.
import { getProviders } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
// Usaremos los mismos estilos que la sección de inventario para consistencia
import './InventorySection.css';

function ProvidersSection() {
    const { user } = useAuth(); // Para obtener el clientId
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Nos aseguramos de tener el clientId antes de la llamada.
        if (!user?.clientId) return;

        const fetchProviders = async () => {
            try {
                setLoading(true);
                // 2. LLAMADA A LA API CORREGIDA:
                //    Usamos la función getProviders con el clientId.
                const response = await getProviders(user.clientId);
                setProviders(response.data); // Axios anida la respuesta en 'data'
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudo cargar la lista de proveedores.');
                console.error("Error fetching providers:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProviders();
    }, [user]); // El efecto depende del 'user' para obtener el clientId

    /*
    // --- FUNCIONALIDAD DE ELIMINAR COMENTADA ---
    // He comentado esta función porque no parece existir un endpoint en el backend
    // para eliminar un proveedor (DELETE /api/client-panel/{clientId}/providers/{providerId}).
    // Si en el futuro lo creas, puedes descomentar esta sección.
    const handleDelete = async (providerId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
            try {
                // Aquí iría la llamada a una función como deleteProvider(user.clientId, providerId);
                await api.delete(`/client/providers/${providerId}`);
                setProviders(currentProviders => currentProviders.filter(p => p.id !== providerId));
            } catch (err) {
                alert('Error al eliminar el proveedor: ' + (err.message || 'Error desconocido.'));
            }
        }
    };
    */

    const handleEdit = (providerId) => {
        navigate(`/form-proveedor/${providerId}`);
    };

    const handleNew = () => {
        navigate('/form-proveedor');
    };

    if (loading) {
        return <div>Cargando proveedores...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="inventory-section"> {/* Reutilizamos la clase para estilos */}
            <div className="section-header">
                <h2>Proveedores</h2>
                <button className="btn-new" onClick={handleNew}>Nuevo Proveedor</button>
            </div>
            <table>
                <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Términos de Pago</th>
                    {/* La columna 'Fecha de Alta' no existe en el DTO del backend */}
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {providers.map(p => (
                    <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.contactInfo}</td>
                        <td>{p.paymentTerms}</td>
                        <td>
                            <button className="btn-edit" onClick={() => handleEdit(p.id)}>Editar</button>
                            {/*
                            <button className="btn-delete" onClick={() => handleDelete(p.id)}>Eliminar</button>
                            */}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default ProvidersSection;