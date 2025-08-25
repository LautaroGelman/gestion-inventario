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
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import DashboardSection from '@/components/client/DashboardSection';
import InventorySection from '@/components/client/InventorySection';
import SalesSection from '@/components/client/SalesSection';
import ProvidersSection from '@/components/client/ProvidersSection';
import ReportsSection from '@/components/client/ReportsSection';
import EmployeesSection from '@/components/client/EmployeesSection';
import ReturnsSection from '@/components/client/ReturnsSection';
import SucursalSelector from '@/components/layout/SucursalSelector'; // ⬅️ NUEVO: usamos el selector con creación

// Mantenemos el tipo local si lo usás en otros lados
type SucursalDto = { id: number | string; name: string };

// Mapa de secciones por rol (sin prefijo ROLE_)
const ROLE_TO_SECTIONS: Record<string, string[]> = {
    PROPIETARIO: ['dashboard', 'inventory', 'sales', 'providers', 'reports', 'employees', 'returns'],
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

// 🔐 Secciones que requieren sucursal: incluye dashboard y reports
const SECTIONS_REQUIRE_SUCURSAL = new Set(['dashboard', 'reports', 'inventory', 'sales', 'employees', 'returns']);

export default function ClientPanelPage() {
    const { user, logout, isOwner } = useAuth();
    const router = useRouter();
    const { isModalOpen, modalMode, handleOpenSession, handleCloseSession, setModalOpen } = useCashSession();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const roles = useMemo(() => user?.roles ?? [], [user]);
    const sectionsAllowed = useMemo(
      () => [...new Set(roles.map(cleanRole).flatMap(r => ROLE_TO_SECTIONS[r] || []))],
      [roles]
    );
    const [activeSection, setActiveSection] = useState('dashboard');

    useEffect(() => {
        const defaultSection = sectionsAllowed.includes('dashboard') ? 'dashboard' : sectionsAllowed[0] || '';
        setActiveSection(defaultSection);
    }, [sectionsAllowed]);

    const requiresSucursal = (section: string) => SECTIONS_REQUIRE_SUCURSAL.has(section);

    const renderSection = () => {
        // Gate por sucursal: evita llamadas sin sucursal y 500 en backend
        if (requiresSucursal(activeSection)) {
            const hasSucursal = !(user?.sucursalId == null || user?.sucursalId === 'null' || user?.sucursalId === '');
            if (!hasSucursal) {
                if (isOwner) {
                    return (
                      <div className="p-6 border rounded-lg bg-card/50">
                          <p className="font-medium mb-2">Selecciona una sucursal para continuar</p>
                          <p className="text-sm text-muted-foreground">
                              Esta vista requiere trabajar sobre una sucursal. Usá el selector de la esquina superior derecha.
                          </p>
                      </div>
                    );
                }
                return (
                  <div className="p-6 border rounded-lg bg-card/50">
                      <p className="font-medium mb-2">No se encontró sucursal asociada a tu usuario.</p>
                      <p className="text-sm text-muted-foreground">Contacta al administrador para asignarte una sucursal.</p>
                  </div>
                );
            }
        }

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
                                <p className="text-sm font-semibold">{user.employeeName || 'Usuario'}</p>
                                <p className="text-xs text-muted-foreground">{user.sub}</p>
                            </div>
                          )}
                      </div>
                      <Button variant="ghost" className="w-full mt-4 flex items-center" onClick={handleLogout}>
                          <LogOut size={20} />
                          {!sidebarCollapsed && <span className="ml-3">Cerrar Sesión</span>}
                      </Button>
                  </div>
              </aside>

              {/* CONTENIDO PRINCIPAL */}
              <div className="flex-1 flex flex-col">
                  <header className="flex items-center h-16 px-6 border-b bg-card gap-3">
                      <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                          {sidebarCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
                      </Button>

                      {/* Right side controls */}
                      <div className="ml-auto flex items-center gap-3">
                          {/* ⬇️ Reemplazamos el selector plano por el componente con creación */}
                          <SucursalSelector />
                          <ThemeToggleButton />
                      </div>
                  </header>

                  <main className="flex-1 p-6 overflow-auto">{renderSection()}</main>
              </div>
          </div>
      </>
    );
}
