// src/services/api.ts
import axios, { AxiosInstance } from 'axios';

// Configuración de la URL base según entorno
const baseURL: string =
    process.env.NODE_ENV === 'development'
        ? '/api'
        : process.env.NEXT_PUBLIC_API_URL ?? '';

const apiClient: AxiosInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor para adjuntar JWT desde localStorage
apiClient.interceptors.request.use(
    config => {
        const token = typeof window !== 'undefined' && localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// ────────────────────────────────────────────────────────────────
// ENDPOINTS DE LA API
// ────────────────────────────────────────────────────────────────

// Auth
export const login = (credentials: Record<string, any>) =>
    apiClient.post('/auth/login', credentials);
export const logout = () => apiClient.post('/auth/logout');

// Superpanel (Super Admin)
export const getGlobalMetrics = () =>
    apiClient.get('/superpanel/metrics');

// Admin - Gestión de Clientes
export const getClients = () => apiClient.get('/admin/clients');
export const createClient = (clientData: Record<string, any>) =>
    apiClient.post('/admin/clients', clientData);
export const activateClient = (clientId: string) =>
    apiClient.patch(`/admin/clients/${clientId}/activate`);
export const deactivateClient = (clientId: string) =>
    apiClient.patch(`/admin/clients/${clientId}/inactive`);

// Alerts / Notificaciones
export const getAlerts = (clientId: string) =>
    apiClient.get(`/client-panel/${clientId}/alerts`);
export const markAlertAsRead = (
    clientId: string,
    alertId: string
) => apiClient.post(
    `/client-panel/${clientId}/alerts/${alertId}/mark-as-read`
);

// Dashboard Cliente
export const getClientDashboard = (clientId: string) =>
    apiClient.get(`/client-panel/${clientId}/dashboard`);

// Inventario - Productos
export const getProducts = (clientId: string) =>
    apiClient.get(`/client-panel/${clientId}/items`);
export const createProduct = (
    clientId: string,
    productData: Record<string, any>
) => apiClient.post(
    `/client-panel/${clientId}/items`,
    productData
);
export const updateProduct = (
    clientId: string,
    productId: string,
    productData: Record<string, any>
) => apiClient.put(
    `/client-panel/${clientId}/items/${productId}`,
    productData
);
export const deleteProduct = (
    clientId: string,
    productId: string
) => apiClient.delete(
    `/client-panel/${clientId}/items/${productId}`
);
export const getProductById = (
    clientId: string,
    productId: string
) => apiClient.get(
    `/client-panel/${clientId}/items/${productId}`
);

// Proveedores
export const getProviders = (clientId: string) =>
    apiClient.get(`/client-panel/${clientId}/providers`);
export const addProvider = (
    clientId: string,
    providerData: Record<string, any>
) => apiClient.post(
    `/client-panel/${clientId}/providers`,
    providerData
);

// Ventas
export const createSale = (
    clientId: string,
    saleData: Record<string, any>
) => apiClient.post(
    `/client-panel/${clientId}/sales`,
    saleData
);
export const getSales = (clientId: string) =>
    apiClient.get(`/client-panel/${clientId}/sales`);
export const createSaleReturn = (
    clientId: string,
    returnData: Record<string, any>
) => apiClient.post(
    `/client-panel/${clientId}/returns`,
    returnData
);
export const getSaleById = (
    clientId: string,
    saleId: string
) => apiClient.get(
    `/client-panel/${clientId}/sales/${saleId}`
);

// Reportes
export const getDailySalesSummary = (clientId: string) =>
    apiClient.get(
        `/client-panel/${clientId}/reports/daily-sales`
    );
export const getProfitabilitySummary = (clientId: string) =>
    apiClient.get(
        `/client-panel/${clientId}/reports/profitability`
    );
export const getBestSellers = (
    clientId: string,
    startDate: string,
    endDate: string
) => apiClient.get(
    `/client-panel/${clientId}/reports/best-sellers`,
    {
        params: {
            startDate: `${startDate}T00:00:00`,
            endDate: `${endDate}T23:59:59`,
        }
    }
);
export const getSalesByEmployee = (
    clientId: string,
    startDate: string,
    endDate: string
) => apiClient.get(
    `/client-panel/${clientId}/reports/sales-by-employee`,
    {
        params: {
            startDate: `${startDate}T00:00:00`,
            endDate: `${endDate}T23:59:59`,
        }
    }
);

// Reportes - Categorías y Movimientos Financieros
export const getCategories = (clientId: string) =>
    apiClient.get(
        `/client-panel/${clientId}/categories`
    );
export const getFinanceMovements = (
    clientId: string,
    from: string,
    to: string
) => apiClient.get(
    `/client-panel/${clientId}/finance/movements`,
    { params: { from, to } }
);
// Empleados
export const getEmployees  = (clientId: string) => apiClient.get(`/client-panel/${clientId}/employees`);
export const createEmployee = (clientId: string, data: Record<string, any>) =>
    apiClient.post(`/client-panel/${clientId}/employees`, data);
export const updateEmployee = (clientId: string, employeeId: string, data: Record<string, any>) =>
    apiClient.put(`/client-panel/${clientId}/employees/${employeeId}`, data);
export const deleteEmployee = (clientId: string, employeeId: string) =>
    apiClient.delete(`/client-panel/${clientId}/employees/${employeeId}`);


// Caja Registradora
export const openCashSession = (
    clientId: string,
    initialBalance: number
) => apiClient.post(
    `/client-panel/${clientId}/cash-session/open`,
    { initialBalance }
);
export const closeCashSession = (
    clientId: string,
    finalBalance: number
) => apiClient.post(
    `/client-panel/${clientId}/cash-session/close`,
    { finalBalance }
);
export const getActiveCashSession = (clientId: string) =>
    apiClient.get(
        `/client-panel/${clientId}/cash-session/active`
    );

export default apiClient;
