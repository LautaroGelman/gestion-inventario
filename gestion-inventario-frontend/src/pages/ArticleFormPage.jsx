import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, createProduct, updateProduct } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./ArticleFormPage.css";

/**
 * Formulario de alta / edición de productos.
 * - Si la URL contiene /inventory-form/:id estamos en "edición" y cargamos los datos.
 * - Si no, el formulario se comporta como "nuevo producto".
 */
function ArticleFormPage() {
    const { user } = useAuth(); // Necesitamos clientId del usuario autenticado

    // ⚠️ La ruta está definida como "/inventory-form/:id" → usamos "id".
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    /** Estado del formulario */
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        quantity: 0,
        cost: 0,
        price: 0,
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(isEditing); // Solo mostramos spinner en modo edición hasta que llegue el GET

    /* --------------------------------------------------
     * Cargar datos actuales en modo edición
     * --------------------------------------------------*/
    useEffect(() => {
        if (!isEditing || !user?.clientId) return;

        (async () => {
            try {
                const { data } = await getProductById(user.clientId, id);
                /**
                 * El backend devuelve un ProductDto → lo usamos tal cual.
                 *   {
                 *      id, code, name, description, quantity, cost, price
                 *   }
                 */
                setFormData({
                    code: data.code ?? "",
                    name: data.name ?? "",
                    description: data.description ?? "",
                    quantity: data.quantity ?? 0,
                    cost: data.cost ?? 0,
                    price: data.price ?? 0,
                });
            } catch (err) {
                console.error("Error fetching product:", err);
                setError(
                    err.response?.data?.message || "No se pudieron cargar los datos del artículo."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isEditing, user]);

    /* --------------------------------------------------
     * Handlers
     * --------------------------------------------------*/
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?.clientId) {
            setError("No se pudo identificar al cliente. Por favor, recarga la página.");
            return;
        }

        try {
            if (isEditing) {
                await updateProduct(user.clientId, id, formData);
                alert("Artículo actualizado con éxito");
            } else {
                await createProduct(user.clientId, formData);
                alert("Artículo creado con éxito");
            }
            // Regresamos al panel de inventario
            navigate("/panel#inventory");
        } catch (err) {
            console.error("Error saving article:", err);
            setError(err.response?.data?.message || "Error al guardar el artículo.");
        }
    };

    /* --------------------------------------------------
     * Render
     * --------------------------------------------------*/
    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container-form">
            <header className="form-header">
                <h1>{isEditing ? "Editar Artículo" : "Nuevo Artículo"}</h1>
            </header>

            <main>
                <form id="form-articulo" onSubmit={handleSubmit}>
                    {/* Código */}
                    <div className="form-group">
                        <label htmlFor="code">Código:</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Nombre */}
                    <div className="form-group">
                        <label htmlFor="name">Nombre:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div className="form-group">
                        <label htmlFor="description">Descripción:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    {/* Stock */}
                    <div className="form-group">
                        <label htmlFor="quantity">Stock:</label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            min="0"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Costo */}
                    <div className="form-group">
                        <label htmlFor="cost">Costo:</label>
                        <input
                            type="number"
                            id="cost"
                            name="cost"
                            min="0"
                            step="0.01"
                            value={formData.cost}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Precio */}
                    <div className="form-group">
                        <label htmlFor="price">Precio:</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <div className="form-actions">
                        <button type="submit" className="btn-submit">
                            Guardar
                        </button>
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate("/panel#inventory")}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default ArticleFormPage;
