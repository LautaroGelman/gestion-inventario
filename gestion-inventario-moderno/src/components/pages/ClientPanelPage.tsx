// src/components/client/ClientPanelPage.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCashSession } from '@/hooks/useCashSession';

import CashSessionModal from '@/components/client/CashSessionModal';
import Notifications from '@/components/client/Notifications';
import DashboardSection from '@/components/client/DashboardSection';
import InventorySection from '@/components/client/InventorySection';
import SalesSection from '@/components/client/SalesSection';
import ProvidersSection from '@/components/client/ProvidersSection';
import ReportsSection from '@/components/client/ReportsSection';
import EmployeesSection from '@/components/client/EmployeesSection';
import ReturnsSection from '@/components/client/ReturnsSection';


const ROLE_TO_SECTIONS: Record<string, string[]> = {
    CLIENT:            ['dashboard','inventory','sales','providers','reports','employees','returns'],
    ADMINISTRADOR:     ['dashboard','inventory','sales','providers','reports','employees','returns'],
    MULTIFUNCION:      ['dashboard','inventory','sales','providers','reports','employees','returns'],
    CAJERO:            ['inventory','sales','returns'],
    INVENTARIO:        ['inventory','providers'],
    VENTAS_INVENTARIO: ['inventory','sales','providers','returns'],
};

const cleanRole = (r: string) => r.replace(/^ROLE_/, '');

export default function ClientPanelPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const {
        session,
        isModalOpen,
        modalMode,
        handleOpenSession,
        handleCloseSession,
        showCloseModal,
        setModalOpen,
    } = useCashSession();

    // Roles desde el token
    const roles = useMemo(() => user?.roles ?? [], [user]);

    // Secciones permitidas según roles
    const sectionsAllowed = useMemo(() => (
        Array.from(new Set(
            roles.map(cleanRole).flatMap(r => ROLE_TO_SECTIONS[r] ?? [])
        ))
    ), [roles]);

    const userCanView = (section: string) => sectionsAllowed.includes(section);

    const canHandleCash = useMemo(() =>
            roles.some(r => ['ROLE_CAJERO','ROLE_VENTAS_INVENTARIO','ROLE_MULTIFUNCION'].includes(r))
        , [roles]);

    const isAdminRole = useMemo(() =>
            roles.some(r => ['ROLE_CLIENT','ROLE_ADMINISTRADOR','ROLE_MULTIFUNCION'].includes(r))
        , [roles]);

    const [activeSection, setActiveSection] = useState<string>('dashboard');

    // Establecer sección por defecto
    useEffect(() => {
        if (sectionsAllowed.length === 0) return;
        const defaultSec = sectionsAllowed.includes('dashboard') ? 'dashboard' : sectionsAllowed[0];
        setActiveSection(defaultSec);
    }, [sectionsAllowed]);

    // Asegurar sección válida
    useEffect(() => {
        if (!sectionsAllowed.includes(activeSection)) {
            const fallback = sectionsAllowed.includes('dashboard') ? 'dashboard' : sectionsAllowed[0];
            setActiveSection(fallback);
        }
    }, [activeSection, sectionsAllowed]);

    // Renderizar cada sección
    const renderSection = () => {
        switch (activeSection) {
            case 'inventory':  return <InventorySection />;
            case 'sales':      return <SalesSection />;
            case 'providers':  return <ProvidersSection />;
            case 'employees':  return <EmployeesSection />;
            case 'returns':    return <ReturnsSection />;
            case 'reports':    return <ReportsSection clientId={user?.clientId} />;
            default:           return <DashboardSection />;
        }
    };

    const goToNewEmployee = () => router.push('/employee-form');
    const goToNewSale     = () => router.push('/sale-form');
    const goToReturnSale  = () => router.push('/return-sale/');

    const handleLogout = () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        logout();
        router.replace('/login');
    };

    if (!user) {
        return <div className="p-6">Cargando...</div>;
    }

    return (
        <>
            {isModalOpen && canHandleCash && (
                <CashSessionModal
                    mode={modalMode}
                    onOpen={handleOpenSession}
                    onClose={handleCloseSession}
                    onCancel={() => setModalOpen(false)}
                />
            )}

            <div className="client-panel">
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
                                {{
                                    dashboard:  'Dashboard',
                                    inventory:  'Inventario',
                                    sales:      'Ventas',
                                    providers:  'Proveedores',
                                    reports:    'Reportes',
                                    employees:  'Empleados',
                                    returns:    'Devoluciones',
                                }[section]}
                            </button>
                        ))}
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

                <main className="main-content">
                    {renderSection()}
                </main>
            </div>
        </>
    );
}
