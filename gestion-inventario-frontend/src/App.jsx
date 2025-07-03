// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRedirector from './components/HomeRedirector';

/* ---- Páginas ---- */
import LoginPage from './pages/LoginPage';
import AdminPanelPage from './pages/AdminPanelPage';
import ClientPanelPage from './pages/ClientPanelPage';
import ArticleFormPage from './pages/ArticleFormPage';
import ProviderFormPage from './pages/ProviderFormPage';
import SaleFormPage from './pages/SaleFormPage';
import ReturnFormPage from './pages/ReturnFormPage';
import ClientFormPage from './pages/ClientFormPage';
import ReturnsHistory from './components/client/ReturnsHistory';   // ← NUEVO
import ReturnsSection from './components/client/ReturnsSection';

/* --------------------------------------------------
 * Roles agrupados para mejor mantenimiento
 * --------------------------------------------------*/
const ADMIN_ROLES = ['ROLE_ADMIN', 'ROLE_ADMINISTRADOR'];

const CLIENT_PANEL_ROLES = [
    'ROLE_CLIENT',
    'ROLE_ADMINISTRADOR',
    'ROLE_CAJERO',
    'ROLE_MULTIFUNCION',
    'ROLE_INVENTARIO',
    'ROLE_VENTAS_INVENTARIO',
];

const INVENTORY_FORM_ROLES = [
    'ROLE_CLIENT',
    'ROLE_ADMINISTRADOR',
    'ROLE_MULTIFUNCION',
    'ROLE_INVENTARIO',
    'ROLE_CAJERO',
    'ROLE_VENTAS_INVENTARIO',
];

const PROVIDER_FORM_ROLES = [
    'ROLE_CLIENT',
    'ROLE_ADMINISTRADOR',
    'ROLE_MULTIFUNCION',
    'ROLE_INVENTARIO',
    'ROLE_VENTAS_INVENTARIO',
];

const SALE_ROLES = [
    'ROLE_CLIENT',
    'ROLE_CAJERO',
    'ROLE_MULTIFUNCION',
    'ROLE_VENTAS_INVENTARIO',
];

export default function App() {
    return (
        /* El BrowserRouter está en main.jsx */
        <AuthProvider>
            <Routes>
                {/* ---------------- Públicas ---------------- */}
                <Route path="/login" element={<LoginPage />} />

                {/* Raíz → decide panel */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <HomeRedirector />
                        </ProtectedRoute>
                    }
                />

                {/* ------------- Panel super-admin ------------- */}
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                            <AdminPanelPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/register-client"
                    element={
                        <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                            <ClientFormPage />
                        </ProtectedRoute>
                    }
                />

                {/* ------------- Panel de negocio ------------- */}
                <Route
                    path="/panel/*"
                    element={
                        <ProtectedRoute allowedRoles={CLIENT_PANEL_ROLES}>
                            <ClientPanelPage />
                        </ProtectedRoute>
                    }
                />

                {/* ---- Sub-rutas del panel ---- */}
                <Route
                    path="/inventory-form/:id?"
                    element={
                        <ProtectedRoute allowedRoles={INVENTORY_FORM_ROLES}>
                            <ArticleFormPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/provider-form/:id?"
                    element={
                        <ProtectedRoute allowedRoles={PROVIDER_FORM_ROLES}>
                            <ProviderFormPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sale-form"
                    element={
                        <ProtectedRoute allowedRoles={SALE_ROLES}>
                            <SaleFormPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/return-sale/:saleId"
                    element={
                        <ProtectedRoute allowedRoles={SALE_ROLES}>
                            <ReturnFormPage />
                        </ProtectedRoute>
                    }
                />

                {/* ---- Historial de devoluciones ---- */}
                <Route
                    path="/returns-history"
                    element={
                        <ProtectedRoute allowedRoles={CLIENT_PANEL_ROLES}>
                            <ReturnsHistory />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/returns"
                    element={
                        <ProtectedRoute allowedRoles={CLIENT_PANEL_ROLES}>
                            <ReturnsSection />   {/* ← listado + botón */}
                        </ProtectedRoute>
                    }
                />

                {/* ----------- Catch-all (404) ----------- */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}

