// src/components/pages/AdminPanelPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getClients } from '@/services/api';
import AccountsSection from '@/components/admin/AccountsSection';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useAuth } from '@/context/AuthContext';

const ADMIN_ROUTES = ['dashboard', 'cuentas'] as const;
type Section = typeof ADMIN_ROUTES[number];

export default function AdminPanelPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, isLoading, logout } = useAuth(); // asume isLoading en el context

    // Inicializa sección desde el hash solo al montar
    const [activeSection, setActiveSection] = useState<Section>('dashboard');
    useEffect(() => {
        const fromHash = window.location.hash.replace('#', '') as Section;
        const initial = ADMIN_ROUTES.includes(fromHash) ? fromHash : 'dashboard';
        setActiveSection(initial);
        window.history.replaceState(null, '', `${pathname}#${initial}`);
    }, [pathname]);

    const [clientData, setClientData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getClients();
            setClientData(response.data);
            setError('');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Error al cargar datos del panel.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSectionChange = (section: Section) => {
        setActiveSection(section);
        window.history.replaceState(null, '', `${pathname}#${section}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        logout();
        router.replace('/login');
    };

    const renderSection = () => {
        if (loading) return <div>Cargando...</div>;
        if (error)   return <div className="error-message">Error: {error}</div>;

        switch (activeSection) {
            case 'cuentas':
                return (
                    <AccountsSection
                        initialAccounts={clientData?.clients}
                        onUpdate={fetchData}
                    />
                );
            case 'dashboard':
            default:
                return <AdminDashboard />;
        }
    };

    // Espera a que el context cargue el usuario
    if (isLoading) {
        return <div>Cargando usuario…</div>;
    }
    if (!user || !user.roles.includes('ROLE_ADMIN')) {
        router.replace('/login');
        return null;
    }

    return (
        <div className="admin-container">
            <aside className="sidebar">
                <h2>Panel Admin</h2>
                <nav>
                    <button
                        className={activeSection === 'dashboard' ? 'active' : ''}
                        onClick={() => handleSectionChange('dashboard')}
                    >
                        Dashboard
                    </button>
                    <button
                        className={activeSection === 'cuentas' ? 'active' : ''}
                        onClick={() => handleSectionChange('cuentas')}
                    >
                        Cuentas
                    </button>
                </nav>
                <button
                    id="logout-btn-admin"
                    onClick={handleLogout}
                >
                    Cerrar sesión
                </button>
            </aside>
            <main className="main-content">
                {renderSection()}
            </main>
        </div>
    );
}
