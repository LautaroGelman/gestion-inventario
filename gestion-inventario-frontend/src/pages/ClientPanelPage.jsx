
// src/pages/ClientPanelPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCashSession } from '../hooks/useCashSession';

import CashSessionModal from '../components/client/CashSessionModal';
import Notifications    from '../components/Notifications';

import DashboardSection from '../components/client/DashboardSection';
import InventorySection from '../components/client/InventorySection';
import SalesSection     from '../components/client/SalesSection';
import ProvidersSection from '../components/client/ProvidersSection';
import ReportsSection   from '../components/client/ReportsSection';
import EmployeesSection from '../components/client/EmployeesSection';
import ReturnsSection   from '../components/client/ReturnsSection';

import './ClientPanelPage.css';

/* -------------------- CONSTANTES -------------------- */
const ROLE_TO_SECTIONS = {
    CLIENT:            ['dashboard','inventory','sales','providers','reports','employees','returns'],
    ADMINISTRADOR:     ['dashboard','inventory','sales','providers','reports','employees','returns'],
    MULTIFUNCION:      ['dashboard','inventory','sales','providers','reports','employees','returns'],
    CAJERO:            ['inventory','sales','returns'],
    INVENTARIO:        ['inventory','providers'],
    VENTAS_INVENTARIO: ['inventory','sales','providers','returns']
};
const cleanRole = r => r.replace(/^ROLE_/, '');

/* -------------------- COMPONENTE -------------------- */
function ClientPanelPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    /* ----------- HOOK personalizado de caja ----------- */
    const {
        session,
        isModalOpen,
        modalMode,
        handleOpenSession,
        handleCloseSession,
        showCloseModal,
        setModalOpen
    } = useCashSession();

    /* ---------------- ROLES & PERMISOS ---------------- */
    const roles = useMemo(() => user?.roles ?? [], [user]);

    const sectionsAllowed = useMemo(() => (
        [...new Set(
            roles
                .map(cleanRole)
                .flatMap(r => ROLE_TO_SECTIONS[r] || [])
        )]
    ), [roles]);

    const userCanView = section => sectionsAllowed.includes(section);

    const canHandleCash = useMemo(() => (
        roles.some(r =>
            ['ROLE_CAJERO','ROLE_VENTAS_INVENTARIO','ROLE_MULTIFUNCION'].includes(r)
        )
    ), [roles]);

    const isAdminRole = useMemo(() => (
        roles.some(r =>
            ['ROLE_CLIENT','ROLE_ADMINISTRADOR','ROLE_MULTIFUNCION'].includes(r)
        )
    ), [roles]);

    /* ----------------- SECCIÓN ACTIVA ----------------- */
    const [activeSection, setActiveSection] = useState('dashboard');

    useEffect(() => {
        if (sectionsAllowed.length === 0) return;

        const defaultSection = sectionsAllowed.includes('dashboard')
            ? 'dashboard'
            : sectionsAllowed[0];

        setActiveSection(defaultSection);
    }, [sectionsAllowed]);

    useEffect(() => {
        if (!sectionsAllowed.includes(activeSection)) {
            setActiveSection(
                sectionsAllowed.includes('dashboard') ? 'dashboard' : sectionsAllowed[0]
            );
        }
    }, [activeSection, sectionsAllowed]);

    /* ------------- RENDER DE CADA SECCIÓN ------------- */
    const renderSection = () => {
        switch (activeSection) {
            case 'inventory':  return <InventorySection />;
            case 'sales':      return <SalesSection />;
            case 'providers':  return <ProvidersSection />;
            case 'employees':  return <EmployeesSection />;
            case 'returns':    return <ReturnsSection />;
            case 'reports': return <ReportsSection clientId={user?.clientId} />;
            default:           return <DashboardSection />;
        }
    };

    /* -------------------- HANDLERS -------------------- */
    const goToNewEmployee = () => navigate('/employee-form');
    const goToNewSale     = () => navigate('/sale-form');
    const goToReturnSale  = () => navigate('/sale-form');

    const handleLogout = () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        logout();
        navigate('/login', { replace: true });
    };

    /* ---------------------- UI ------------------------ */
    if (!user) return <div>Cargando...</div>;

    return (
        <>
            {/* Modal de apertura/cierre de caja */}
            {isModalOpen && canHandleCash && (
                <CashSessionModal
                    mode={modalMode}
                    onOpen={handleOpenSession}
                    onClose={handleCloseSession}
                    onCancel={() => setModalOpen(false)}
                    expectedAmount={session?.expectedAmount}
                />
            )}

            <div className="client-panel">
                {/* -------------- SIDEBAR / MENÚ -------------- */}
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <h3>Hola, {user.employeeName || 'Usuario'}</h3>
                        {isAdminRole && <Notifications />}
                    </div>

                    <nav className="sidebar-nav">
                        {sectionsAllowed.map(section => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={activeSection === section ? 'active' : ''}
                            >
                                {({
                                    dashboard:  'Dashboard',
                                    inventory:  'Inventario',
                                    sales:      'Ventas',
                                    providers:  'Proveedores',
                                    reports:    'Reportes',
                                    employees:  'Empleados',
                                    returns:    'Devoluciones'
                                })[section]}
                            </button>
                        ))}
                    </nav>

                    <div className="quick-actions">
                        {isAdminRole && (
                            <button onClick={goToNewEmployee}>+ Nuevo empleado</button>
                        )}
                        {userCanView('sales') && (
                            <>
                                <button onClick={goToNewSale}>+ Registrar venta</button>
                                <button onClick={goToReturnSale}>↩ Devolución</button>
                            </>
                        )}
                    </div>

                    <div className="sidebar-footer">
                        {canHandleCash && session && (
                            <button onClick={showCloseModal} className="cash-button">
                                Cerrar Caja
                            </button>
                        )}
                        <button onClick={handleLogout} className="logout-button">
                            Cerrar Sesión
                        </button>
                    </div>
                </aside>

                {/* -------------- CONTENIDO MAIN -------------- */}
                <main className="main-content">
                    {renderSection()}
                </main>
            </div>
        </>
    );
}

export default ClientPanelPage;

