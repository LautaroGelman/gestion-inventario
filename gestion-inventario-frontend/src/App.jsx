// src/App.jsx
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRedirector from './components/HomeRedirector';

// Importación de Páginas
import LoginPage from './pages/LoginPage';
import AdminPanelPage from './pages/AdminPanelPage';
import ClientPanelPage from './pages/ClientPanelPage';
import ArticleFormPage from './pages/ArticleFormPage';
import ProviderFormPage from './pages/ProviderFormPage';
import SaleFormPage from './pages/SaleFormPage';
import ReturnFormPage from './pages/ReturnFormPage';
import ClientFormPage from './pages/ClientFormPage';

function App() {
    const clientPanelRoles = ['ROLE_CLIENT', 'ROLE_ADMINISTRADOR', 'ROLE_CAJERO', 'ROLE_MULTIFUNCION'];

    return (
        <AuthProvider>
            <Routes>
                {/* Rutas Públicas */}
                <Route path="/login" element={<LoginPage />} />

                {/* Ruta Raíz Protegida - Redirige al panel correcto */}
                <Route path="/" element={<ProtectedRoute><HomeRedirector /></ProtectedRoute>} />

                {/* Panel de Administración */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><AdminPanelPage /></ProtectedRoute>} />
                <Route path="/register-client" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><ClientFormPage /></ProtectedRoute>} />

                {/* Panel de Negocio */}
                <Route path="/panel" element={<ProtectedRoute allowedRoles={clientPanelRoles}><ClientPanelPage /></ProtectedRoute>} />

                {/* Sub-rutas del Panel de Negocio */}
                <Route path="/inventory-form/:id?" element={<ProtectedRoute allowedRoles={['ROLE_CLIENT', 'ROLE_ADMINISTRADOR', 'ROLE_MULTIFUNCION']}><ArticleFormPage /></ProtectedRoute>} />
                <Route path="/provider-form/:id?" element={<ProtectedRoute allowedRoles={['ROLE_CLIENT', 'ROLE_ADMINISTRADOR', 'ROLE_MULTIFUNCION']}><ProviderFormPage /></ProtectedRoute>} />
                <Route path="/sale-form" element={<ProtectedRoute allowedRoles={['ROLE_CLIENT', 'ROLE_CAJERO', 'ROLE_MULTIFUNCION']}><SaleFormPage /></ProtectedRoute>} />
                <Route path="/return-sale/:saleId" element={<ProtectedRoute allowedRoles={['ROLE_CLIENT', 'ROLE_CAJERO', 'ROLE_MULTIFUNCION']}><ReturnFormPage /></ProtectedRoute>} />

                {/* Cualquier otra ruta redirige a la raíz */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
