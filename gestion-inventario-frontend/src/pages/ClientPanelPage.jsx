import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCashSession } from '../hooks/useCashSession';

import CashSessionModal from '../components/client/CashSessionModal';
import Notifications from '../components/Notifications';

import DashboardSection from '../components/client/DashboardSection';
import InventorySection from '../components/client/InventorySection';
import SalesSection from '../components/client/SalesSection';
import ProvidersSection from '../components/client/ProvidersSection';
import ReportsSection from '../components/client/ReportsSection';
import EmployeesSection from '../components/client/EmployeesSection';
import ReturnsSection from '../components/client/ReturnsSection';
import './ClientPanelPage.css';

function ClientPanelPage() {
    // Hooks at top
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const {
        session,
        isModalOpen,
        modalMode,
        handleOpenSession,
        handleCloseSession,
        showCloseModal,
        setModalOpen
    } = useCashSession();

    // Extraer roleKey (sin prefijo ROLE_)
    const roleKey = user?.role?.replace(/^ROLE_/, '') || '';

    // Mapeo de roles a secciones
    const ROLES = {
        CLIENT: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
        ADMINISTRADOR: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
        MULTIFUNCION: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
        CAJERO: ['dashboard', 'sales']
    };

    // Verifica permiso por sección
    const userCanView = (section) => ROLES[roleKey]?.includes(section);

    // Estado para sección activa, siempre inicializado
    const [activeSection, setActiveSection] = useState('dashboard');

    // Efecto: cuando user cambie, establecemos sección inicial según rol
    useEffect(() => {
        if (user) {
            const defaultSection = userCanView('dashboard') ? 'dashboard' : (ROLES[roleKey]?.[0] || 'dashboard');
            setActiveSection(defaultSection);
        }
    }, [user, roleKey]);

    // Efecto: si activeSection deja de ser válido, reajustar
    useEffect(() => {
        if (user && !userCanView(activeSection)) {
            setActiveSection(ROLES[roleKey]?.[0] || 'dashboard');
        }
    }, [user, roleKey, activeSection]);

    // Función para renderizar sección
    const renderSection = () => {
        switch (activeSection) {
            case 'inventory': return <InventorySection />;
            case 'sales':     return <SalesSection />;
            case 'providers': return <ProvidersSection />;
            case 'employees': return <EmployeesSection />;
            case 'returns':   return <ReturnsSection />;
            case 'reports':   return <ReportsSection />;
            default:          return <DashboardSection />;
        }
    };

    // Mostrar cargando si user aún no está definido
    if (!user) {
        return <div>Cargando...</div>;
    }

    // Acciones rápidas y navegación
    const goToNewEmployee = () => navigate('/employee-form');
    const goToNewSale     = () => navigate('/sale-form');
    const goToReturnSale  = () => navigate('/sale-form');

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        logout();
        navigate('/login', { replace: true });
    };

    // Flags de rol para UI
    const isCashierRole = ['CAJERO', 'MULTIFUNCION'].includes(roleKey);
    const isAdminRole   = ['CLIENT', 'ADMINISTRADOR', 'MULTIFUNCION'].includes(roleKey);

    return (
        <>
            {isModalOpen && isCashierRole && (
                <CashSessionModal
                    mode={modalMode}
                    onOpen={handleOpenSession}
                    onClose={handleCloseSession}
                    onCancel={() => setModalOpen(false)}
                    expectedAmount={session?.expectedAmount}
                />
            )}

            <div className="client-panel">
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <h3>Hola, {user.employeeName || 'Usuario'}</h3>
                        <div className="header-actions">
                            {isAdminRole && <Notifications />}
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        {userCanView('dashboard') && (
                            <button onClick={() => setActiveSection('dashboard')} className={activeSection === 'dashboard' ? 'active' : ''}>
                                Dashboard
                            </button>
                        )}
                        {userCanView('inventory') && (
                            <button onClick={() => setActiveSection('inventory')} className={activeSection === 'inventory' ? 'active' : ''}>
                                Inventario
                            </button>
                        )}
                        {userCanView('sales') && (
                            <button onClick={() => setActiveSection('sales')} className={activeSection === 'sales' ? 'active' : ''}>
                                Ventas
                            </button>
                        )}
                        {userCanView('providers') && (
                            <button onClick={() => setActiveSection('providers')} className={activeSection === 'providers' ? 'active' : ''}>
                                Proveedores
                            </button>
                        )}
                        {userCanView('reports') && (
                            <button onClick={() => setActiveSection('reports')} className={activeSection === 'reports' ? 'active' : ''}>
                                Reportes
                            </button>
                        )}
                        {userCanView('employees') && (
                            <button onClick={() => setActiveSection('employees')} className={activeSection === 'employees' ? 'active' : ''}>
                                Empleados
                            </button>
                        )}
                        {userCanView('returns') && (
                            <button onClick={() => setActiveSection('returns')} className={activeSection === 'returns' ? 'active' : ''}>
                                Devoluciones
                            </button>
                        )}
                    </nav>

                    <div className="quick-actions">
                        {isAdminRole && <button onClick={goToNewEmployee}>+ Nuevo empleado</button>}
                        {userCanView('sales') && (
                            <>
                                <button onClick={goToNewSale}>+ Registrar venta</button>
                                <button onClick={goToReturnSale}>↩ Devolución</button>
                            </>
                        )}
                    </div>

                    <div className="sidebar-footer">
                        {isCashierRole && session && (
                            <button onClick={showCloseModal} className="cash-button">
                                Cerrar Caja
                            </button>
                        )}
                        <button onClick={handleLogout} className="logout-button">
                            Cerrar Sesión
                        </button>
                    </div>
                </aside>

                <main className="main-content">
                    {renderSection()}
                </main>
            </div>
        </>
    );
}

export default ClientPanelPage;
