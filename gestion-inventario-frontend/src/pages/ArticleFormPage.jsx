import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// 1. IMPORTACIONES CORREGIDAS:
//    Importamos todas las funciones necesarias y el hook de autenticación.
import { getProductById, createProduct, updateProduct } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ArticleFormPage.css';

function ArticleFormPage() {
    const { user } = useAuth(); // Para obtener el clientId
    const { productId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(productId);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        stock: 0, // El DTO del backend usa 'stock'
        cost: 0,
        price: 0,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(isEditing);

    useEffect(() => {
        // Solo cargamos datos si estamos editando y tenemos el clientId
        if (isEditing && user?.clientId) {
            const fetchProduct = async () => {
                try {
                    // 2. LLAMADA GET CORREGIDA:
                    const response = await getProductById(user.clientId, productId);
                    setFormData(response.data); // El DTO del producto coincide con el estado
                } catch (err) {
                    setError(err.response?.data?.message || 'No se pudieron cargar los datos del artículo.');
                    console.error("Error fetching product:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [productId, isEditing, user]); // Dependemos del 'user' para el clientId

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Convertimos a número si el campo es de tipo number
        const val = e.target.type === 'number' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.clientId) {
            setError('No se pudo identificar al cliente. Por favor, recarga la página.');
            return;
        }
        setError('');

        try {
            // 3. LLAMADAS POST/PUT CORREGIDAS:
            if (isEditing) {
                await updateProduct(user.clientId, productId, formData);
                alert('Artículo actualizado con éxito');
            } else {
                await createProduct(user.clientId, formData);
                alert('Artículo creado con éxito');
            }
            navigate('/panel-cliente#inventory'); // Volvemos a la sección de inventario
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el artículo.');
            console.error("Error saving article:", err);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container-form">
            <header className="form-header">
                <h1>{isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}</h1>
            </header>
            <main>
                <form id="form-articulo" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="code">Código:</label>
                        <input type="text" id="code" name="code" value={formData.code} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Nombre:</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Descripción:</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3"></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="stock">Stock:</label>
                        <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} min="0" required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="cost">Costo:</label>
                        <input type="number" id="cost" name="cost" value={formData.cost} onChange={handleChange} min="0" step="0.01" required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="price">Precio:</label>
                        <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" required />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <div className="form-actions">
                        <button type="submit" className="btn-submit">Guardar</button>
                        <button type="button" className="btn-cancel" onClick={() => navigate('/panel-cliente#inventory')}>Cancelar</button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default ArticleFormPage;