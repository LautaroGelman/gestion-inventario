// src/components/pages/ClientPanelPage.tsx
'use client';

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCashSession } from '@/hooks/useCashSession';
import {
    LayoutDashboard, Archive, ShoppingCart, Users, LineChart, LogOut,
    Building, Undo2, ChevronsLeft, ChevronsRight, UserCircle,
} from 'lucide-react';
import CashSessionModal from '@/components/client/CashSessionModal';
import { Button } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton'; // Ruta correcta
import DashboardSection from '@/components/client/DashboardSection';
import InventorySection from '@/components/client/InventorySection';
import SalesSection from '@/components/client/SalesSection';
import ProvidersSection from '@/components/client/ProvidersSection';
import ReportsSection from '@/components/client/ReportsSection';
import EmployeesSection from '@/components/client/EmployeesSection';
import ReturnsSection from '@/components/client/ReturnsSection';

const ROLE_TO_SECTIONS: Record<string, string[]> = {
    CLIENT: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
    ADMINISTRADOR: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
    MULTIFUNCION: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
    CAJERO: ['inventory', 'sales', 'returns'],
    INVENTARIO: ['inventory', 'providers'],
    VENTAS_INVENTARIO: ['inventory', 'sales', 'providers', 'returns'],
};
const cleanRole = (r: string) => r.replace(/^ROLE_/, '');

const sectionConfig: { [key: string]: { icon: ReactNode; label: string } } = {
    dashboard: { icon: <LayoutDashboard size={30} />, label: 'Dashboard' },
    inventory: { icon: <Archive size={30} />, label: 'Inventario' },
    sales: { icon: <ShoppingCart size={30} />, label: 'Ventas' },
    providers: { icon: <Building size={30} />, label: 'Proveedores' },
    reports: { icon: <LineChart size={30} />, label: 'Reportes' },
    employees: { icon: <Users size={30} />, label: 'Empleados' },
    returns: { icon: <Undo2 size={30} />, label: 'Devoluciones' },
};

export default function ClientPanelPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { session, isModalOpen, modalMode, handleOpenSession, handleCloseSession, showCloseModal, setModalOpen } = useCashSession();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const roles = useMemo(() => user?.roles ?? [], [user]);
    const sectionsAllowed = useMemo(() => [...new Set(roles.map(cleanRole).flatMap(r => ROLE_TO_SECTIONS[r] || []))], [roles]);
    const [activeSection, setActiveSection] = useState('dashboard');

    useEffect(() => {
        const defaultSection = sectionsAllowed.includes('dashboard') ? 'dashboard' : sectionsAllowed[0] || '';
        setActiveSection(defaultSection);
    }, [sectionsAllowed]);

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
                    <div className="flex items-center h-16 px-4 border-b">
                        {!sidebarCollapsed && <h1 className="text-lg font-bold">Sistema POS</h1>}
                    </div>
                    <nav className="flex-1 px-4 py-4 space-y-2">
                        {sectionsAllowed.map(section => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`flex items-center w-full px-3 py-4 text-xl font-medium rounded-md transition-colors ${
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
                        <div className="ml-auto">
                            <ThemeToggleButton />
                        </div>
                    </header>
                    <main className="flex-1 p-6 overflow-auto">
                        {renderSection()}
                    </main>
                </div>
            </div>
        </>
    );
}