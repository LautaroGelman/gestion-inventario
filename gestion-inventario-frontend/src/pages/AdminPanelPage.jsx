import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminPanelPage.css';
import AccountsSection from '../components/admin/AccountsSection';
import AdminDashboard from '../components/admin/AdminDashboard';
// 1. IMPORTACIÓN CORREGIDA:
//    Importamos la función específica 'getClients' que necesita esta página.
import { getClients } from '../services/api';

function AdminPanelPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeSection, setActiveSection] = useState(location.hash.replace('#', '') || 'dashboard');

    const [clientData, setClientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Función para cargar o recargar todos los datos
    const fetchData = async () => {
        setLoading(true);
        try {
            // 2. LLAMADA A LA API CORREGIDA:
            //    Usamos la nueva función 'getClients'.
            const response = await getClients();
            // Axios devuelve los datos dentro de la propiedad 'data'.
            setClientData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al cargar datos del panel.');
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchData();
    }, []);

    // Actualizar la sección activa cuando cambia el hash
    useEffect(() => {
        const currentHash = location.hash.replace('#', '');
        setActiveSection(currentHash || 'dashboard');
    }, [location.hash]);

    const handleLogout = () => {
        // Al cerrar sesión, es mejor limpiar solo lo relacionado al usuario
        // y no todo el localStorage, por si hubiera otros datos.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleSectionChange = (section) => {
        navigate(`#${section}`);
    };

    const renderSection = () => {
        if (loading) return <div>Cargando...</div>;
        if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

        switch (activeSection) {
            case 'cuentas':
                // El backend devuelve { clients: [...] }, así que accedemos a esa propiedad.
                return <AccountsSection initialAccounts={clientData?.clients} onUpdate={fetchData} />;
            case 'dashboard':
            default:
                // El componente AdminDashboard ahora obtiene sus propios datos,
                // por lo que no necesita recibir props.
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