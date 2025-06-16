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
        const currentHash = location.hash.replace('#', '');
        setActiveSection(currentHash || 'dashboard');
    }, [location.hash]);

    const handleLogout = () => {
        // Limpiamos el token al cerrar sesión
        localStorage.removeItem('token');
        // No es necesario borrar 'user', ya que se deriva del token
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