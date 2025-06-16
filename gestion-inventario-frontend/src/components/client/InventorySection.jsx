import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. IMPORTACIONES CORREGIDAS:
//    Importamos las funciones específicas de la API y el hook de autenticación.
import { getProducts, deleteProduct } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './InventorySection.css';

function InventorySection() {
    const { user } = useAuth(); // Para obtener el clientId
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Nos aseguramos de tener el clientId antes de hacer la llamada
        if (!user?.clientId) return;

        const fetchItems = async () => {
            try {
                setLoading(true);
                // 2. LLAMADA A LA API CORREGIDA:
                //    Usamos la función getProducts con el clientId.
                const response = await getProducts(user.clientId);
                setItems(response.data); // Axios anida la respuesta en 'data'
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudo cargar el inventario.');
                console.error("Error fetching inventory:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [user]); // El efecto depende del 'user' para obtener el clientId

    const handleDelete = async (productId) => {
        if (!user?.clientId) {
            alert('Error: No se pudo identificar al cliente.');
            return;
        }

        if (window.confirm('¿Estás seguro de que quieres eliminar el producto?')) {
            try {
                // 3. LLAMADA A LA API CORREGIDA:
                //    Usamos la función deleteProduct con clientId y productId.
                await deleteProduct(user.clientId, productId);
                // Actualizamos el estado local para reflejar el cambio.
                setItems(currentItems => currentItems.filter(item => item.id !== productId));
            } catch (err) {
                alert('Error al eliminar el producto: ' + (err.response?.data?.message || 'Error desconocido.'));
                console.error("Error deleting product:", err);
            }
        }
    };

    const handleEdit = (productId) => {
        navigate(`/form-articulo/${productId}`);
    };

    const handleNew = () => {
        navigate('/form-articulo');
    };

    const filteredItems = items.filter(item =>
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div>Cargando inventario...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="inventory-section">
            <div className="section-header">
                <h2>Inventario</h2>
                <button className="btn-new" onClick={handleNew}>Nuevo artículo</button>
            </div>

            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <table>
                <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {/* El backend devuelve ProductDto con: code, name, description, stock, price */}
                {filteredItems.map(it => (
                    <tr key={it.id}>
                        <td>{it.code}</td>
                        <td>{it.name}</td>
                        <td>{it.description}</td>
                        <td>{it.stock}</td>
                        <td>${it.price.toFixed(2)}</td>
                        <td>
                            <button className="btn-edit" onClick={() => handleEdit(it.id)}>Editar</button>
                            <button className="btn-delete" onClick={() => handleDelete(it.id)}>Eliminar</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default InventorySection;