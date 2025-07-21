// src/components/pages/AdminPanelPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getClients } from '@/services/api';
import AccountsSection from '@/components/admin/AccountsSection';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useAuth } from '@/context/AuthContext';

const ADMIN_ROUTES = ['dashboard', 'cuentas'] as const;
type Section = typeof ADMIN_ROUTES[number];

export default function AdminPanelPage() {
    const router      = useRouter();
    const pathname    = usePathname();
    const { user, loading, logout } = useAuth();     // ← loading, no isLoading

    // ────────────────────────
    // 1) Seguridad de acceso
    // ────────────────────────
    useEffect(() => {
        if (loading) return;                           // aún no sé el rol
        if (!user || !user.roles.includes('ROLE_ADMIN')) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    // ────────────────────────
    // 2) Sección activa (hash)
    // ────────────────────────
    const [activeSection, setActiveSection] = useState<Section>('dashboard');
    useEffect(() => {
        const first = window.location.hash.replace('#', '') as Section;
        const initial = ADMIN_ROUTES.includes(first) ? first : 'dashboard';
        setActiveSection(initial);
        window.history.replaceState(null, '', `${pathname}#${initial}`);
    }, [pathname]);

    // ────────────────────────
    // 3) Datos de clientes
    // ────────────────────────
    const [clientData, setClientData] = useState<any>(null);
    const [fetching,   setFetching]   = useState(false);
    const [error,      setError]      = useState('');

    const fetchData = async () => {
        setFetching(true);
        try {
            const { data } = await getClients();
            setClientData(data);
            setError('');
        } catch (err: any) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                err.message ||
                'Error al cargar los clientes.'
            );
        } finally {
            setFetching(false);
        }
    };

    // Solo dispara la petición cuando:
    //   - ya terminó de cargar el contexto
    //   - el usuario existe y es ROLE_ADMIN
    useEffect(() => {
        if (!loading && user && user.roles.includes('ROLE_ADMIN')) {
            fetchData();
        }
    }, [loading, user]);          // <- depende de loading/user

    // ────────────────────────
    // 4) Render
    // ────────────────────────
    if (loading || !user) return <div>Cargando usuario…</div>;
    if (!user.roles.includes('ROLE_ADMIN')) return null; // safety

    const renderSection = () => {
        if (fetching) return <div>Cargando datos…</div>;
        if (error)    return <div className="error-message">Error: {error}</div>;

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

    const handleSectionChange = (sec: Section) => {
        setActiveSection(sec);
        window.history.replaceState(null, '', `${pathname}#${sec}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        logout();
        router.replace('/login');
    };

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
                <button id="logout-btn-admin" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </aside>
            <main className="main-content">{renderSection()}</main>
        </div>
    );
}
