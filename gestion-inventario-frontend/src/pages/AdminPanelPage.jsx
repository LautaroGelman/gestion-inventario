import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminPanelPage.css';
// ✅ CORRECCIÓN: La ruta a la carpeta 'components' debe subir solo un nivel
import AccountsSection from '../components/admin/AccountsSection';
import AdminDashboard from '../components/admin/AdminDashboard';
// ✅ CORRECCIÓN: La ruta a la carpeta 'services' debe subir solo un nivel
import { getClients } from '../services/api';

function AdminPanelPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeSection, setActiveSection] = useState(location.hash.replace('#', '') || 'dashboard');
    const [clientData, setClientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getClients();
            setClientData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al cargar datos del panel.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Leemos la instrucción que viene del estado de navegación (desde el formulario).
        const targetSectionInState = location.state?.targetSection;
        // Leemos la sección que está en el hash de la URL (para la navegación normal).
        const sectionFromHash = location.hash.replace('#', '');

        // La sección que queremos mostrar es la que viene en el estado, o si no, la del hash.
        const desiredSection = targetSectionInState || sectionFromHash || 'dashboard';

        // Si la sección que queremos mostrar no es la que ya está activa, la actualizamos.
        if (activeSection !== desiredSection) {
            setActiveSection(desiredSection);
        }

        // ✅ LA CLAVE DE LA SOLUCIÓN:
        // Si la instrucción vino del estado y todavía no está en el hash de la URL,
        // la "guardamos" en el hash.
        if (targetSectionInState && targetSectionInState !== sectionFromHash) {
            // Usamos navigate para añadir el hash (#cuentas), pero manteniendo el estado
            // (que contiene el mensaje) para que AccountsSection lo pueda leer.
            navigate(location.pathname + '#' + targetSectionInState, {
                replace: true, // No añade una nueva entrada en el historial del navegador.
                state: location.state, // Mantenemos el estado para que se muestre el mensaje.
            });
        }
    }, [location, navigate, activeSection]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        // ...y de las cookies (si tuvieras un token HTTP-only cambialo por el nombre real)
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        // Redirigimos siempre al login
        navigate('/login', { replace: true });
    };

    const handleSectionChange = (section) => {
        navigate(`#${section}`);
    };

    const renderSection = () => {
        if (loading) return <div>Cargando...</div>;
        if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

        switch (activeSection) {
            case 'cuentas':
                return <AccountsSection initialAccounts={clientData?.clients} onUpdate={fetchData} />;
            case 'dashboard':
            default:
                // AdminDashboard sigue obteniendo sus propios datos
                return <AdminDashboard />;
        }
    };

    return (
        <div className="admin-container">
            <aside className="sidebar">
                <h2>Panel Admin</h2>
                <nav>
                    <button onClick={() => handleSectionChange('dashboard')}>Dashboard</button>
                    <button onClick={() => handleSectionChange('cuentas')}>Cuentas</button>
                </nav>
                <button id="logout-btn-admin" onClick={handleLogout}>Cerrar sesión</button>
            </aside>
            <main className="main-content">
                {renderSection()}
            </main>
        </div>
    );
}

export default AdminPanelPage;