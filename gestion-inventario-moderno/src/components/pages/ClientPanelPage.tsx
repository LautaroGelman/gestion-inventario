// src/components/pages/ClientPanelPage.tsx
'use client';

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCashSession } from '@/hooks/useCashSession';

// Importamos los iconos de lucide-react (asegúrate de tenerlo instalado)
import {
    LayoutDashboard,
    Archive,
    ShoppingCart,
    Users,
    LineChart,
    LogOut,
    Building,
    Undo2,
    ChevronsLeft,
    ChevronsRight,
    UserCircle,
} from 'lucide-react';

// Importamos los componentes de UI
import CashSessionModal from '@/components/client/CashSessionModal';
import { Button } from '@/components/ui/button';

// Importamos las secciones
import DashboardSection from '@/components/client/DashboardSection';
import InventorySection from '@/components/client/InventorySection';
import SalesSection from '@/components/client/SalesSection';
import ProvidersSection from '@/components/client/ProvidersSection';
import ReportsSection from '@/components/client/ReportsSection';
import EmployeesSection from '@/components/client/EmployeesSection';
import ReturnsSection from '@/components/client/ReturnsSection';

// --- Lógica de roles y secciones (sin cambios) ---
const ROLE_TO_SECTIONS: Record<string, string[]> = {
    CLIENT: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
    ADMINISTRADOR: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
    MULTIFUNCION: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
    CAJERO: ['inventory', 'sales', 'returns'],
    INVENTARIO: ['inventory', 'providers'],
    VENTAS_INVENTARIO: ['inventory', 'sales', 'providers', 'returns'],
};
const cleanRole = (r: string) => r.replace(/^ROLE_/, '');

// --- Mapeo de secciones a iconos y nombres ---
const sectionConfig: { [key: string]: { icon: ReactNode; label: string } } = {
    dashboard: { icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    inventory: { icon: <Archive size={20} />, label: 'Inventario' },
    sales: { icon: <ShoppingCart size={20} />, label: 'Ventas' },
    providers: { icon: <Building size={20} />, label: 'Proveedores' },
    reports: { icon: <LineChart size={20} />, label: 'Reportes' },
    employees: { icon: <Users size={20} />, label: 'Empleados' },
    returns: { icon: <Undo2 size={20} />, label: 'Devoluciones' },
};

export default function ClientPanelPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { session, isModalOpen, modalMode, handleOpenSession, handleCloseSession, showCloseModal, setModalOpen } = useCashSession();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // --- Lógica de roles y sección activa (sin cambios) ---
    const roles = useMemo(() => user?.roles ?? [], [user]);
    const sectionsAllowed = useMemo(() => [...new Set(roles.map(cleanRole).flatMap(r => ROLE_TO_SECTIONS[r] || []))], [roles]);
    const [activeSection, setActiveSection] = useState('dashboard');

    useEffect(() => {
        const defaultSection = sectionsAllowed.includes('dashboard') ? 'dashboard' : sectionsAllowed[0] || '';
        setActiveSection(defaultSection);
    }, [sectionsAllowed]);

    // --- Renderizado de sección (sin cambios) ---
    const renderSection = () => {
        switch (activeSection) {
            case 'inventory': return <InventorySection />;
            case 'sales': return <SalesSection />;
            case 'providers': return <ProvidersSection />;
            case 'employees': return <EmployeesSection />;
            case 'returns': return <ReturnsSection />;
            case 'reports': return <ReportsSection clientId={user?.clientId} />;
            default: return <DashboardSection />;
        }
    };

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    if (!user) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

    return (
        <>
            {isModalOpen && (
                <CashSessionModal
                    mode={modalMode}
                    onOpen={handleOpenSession}
                    onClose={handleCloseSession}
                    onCancel={() => setModalOpen(false)}
                />
            )}
            <div className="flex h-screen bg-background">
                {/* SIDEBAR */}
                <aside className={`flex flex-col bg-card text-card-foreground transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
                    {/* Encabezado del Sidebar */}
                    <div className="flex items-center h-16 px-4 border-b">
                        {!sidebarCollapsed && <h1 className="text-lg font-bold">Sistema POS</h1>}
                    </div>

                    {/* Navegación Principal */}
                    <nav className="flex-1 px-4 py-4 space-y-2">
                        {sectionsAllowed.map(section => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeSection === section
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                            >
                                {sectionConfig[section]?.icon}
                                {!sidebarCollapsed && <span className="ml-3">{sectionConfig[section]?.label}</span>}
                            </button>
                        ))}
                    </nav>

                    {/* Footer del Sidebar */}
                    <div className="px-4 py-4 border-t">
                        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
                            <UserCircle size={sidebarCollapsed ? 32 : 40} />
                            {!sidebarCollapsed && (
                                <div className="ml-3">
                                    <p className="text-sm font-semibold">{user.employeeName || 'Admin User'}</p>
                                    <p className="text-xs text-muted-foreground">{user.sub}</p>
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" className="w-full mt-4 flex items-center" onClick={handleLogout}>
                            <LogOut size={20}/>
                            {!sidebarCollapsed && <span className="ml-3">Cerrar Sesión</span>}
                        </Button>
                    </div>
                </aside>

                {/* CONTENIDO PRINCIPAL */}
                <div className="flex-1 flex flex-col">
                    <header className="flex items-center h-16 px-6 border-b bg-card">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                            {sidebarCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
                        </Button>
                        {/* Aquí puedes agregar más elementos al header si lo necesitas */}
                    </header>
                    <main className="flex-1 p-6 overflow-auto">
                        {renderSection()}
                    </main>
                </div>
            </div>
        </>
    );
}