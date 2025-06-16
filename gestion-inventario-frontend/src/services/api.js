import axios from 'axios';

// Usamos una URL relativa para el entorno de desarrollo.
// Vite se encargará de redirigirla gracias a la configuración del proxy.
// Para producción, tomará la URL que configures en tus variables de entorno.
const baseURL = import.meta.env.DEV
    ? '/api'
    : import.meta.env.VITE_API_URL;

const apiClient = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// El interceptor para el token JWT se mantiene igual.
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ────────────────────────────────────────────────────────────────
// ENDPOINTS DE LA API
// ────────────────────────────────────────────────────────────────

// --- Auth ---
export const login = (credentials) => apiClient.post('/auth/login', credentials);
export const logout = () => apiClient.post('/auth/logout');

// --- Global Metrics (Superpanel) ---
export const getGlobalMetrics = () => apiClient.get('/superpanel/metrics');

// --- Admin - Client Management (NUEVA SECCIÓN) ---
// Estas son las funciones que necesitaba AccountsSection.jsx y su componente padre.
export const getClients = () => apiClient.get('/admin/clients');
export const createClient = (clientData) => apiClient.post('/admin/clients', clientData);
export const activateClient = (clientId) => apiClient.patch(`/admin/clients/${clientId}/activate`);
export const deactivateClient = (clientId) => apiClient.patch(`/admin/clients/${clientId}/inactive`);

// --- Alerts / Notifications ---
export const getAlerts = (clientId) => apiClient.get(`/client-panel/${clientId}/alerts`);
export const markAlertAsRead = (clientId, alertId) => apiClient.post(`/client-panel/${clientId}/alerts/${alertId}/mark-as-read`);


// --- Client Panel - Dashboard ---
export const getClientDashboard = (clientId) => apiClient.get(`/client-panel/${clientId}/dashboard`);

// --- Products ---
export const getProducts = (clientId) => apiClient.get(`/client-panel/${clientId}/products`);
export const createProduct = (clientId, productData) => apiClient.post(`/client-panel/${clientId}/products`, productData);
export const updateProduct = (clientId, productId, productData) => apiClient.put(`/client-panel/${clientId}/products/${productId}`, productData);
export const deleteProduct = (clientId, productId) => apiClient.delete(`/client-panel/${clientId}/products/${productId}`);
export const getProductById = (clientId, productId) => apiClient.get(`/client-panel/${clientId}/products/${productId}`);

// --- Providers ---
export const getProviders = (clientId) => apiClient.get(`/client-panel/${clientId}/providers`);
export const addProvider = (clientId, providerData) => apiClient.post(`/client-panel/${clientId}/providers`, providerData);

// --- Sales ---
export const createSale = (clientId, saleData) => apiClient.post(`/client-panel/${clientId}/sales`, saleData);
export const getSales = (clientId) => apiClient.get(`/client-panel/${clientId}/sales`);
export const createSaleReturn = (clientId, returnData) => apiClient.post(`/client-panel/${clientId}/returns`, returnData);
export const getSaleById = (clientId, saleId) => apiClient.get(`/client-panel/${clientId}/sales/${saleId}`);

// --- Reports ---
export const getDailySalesSummary = (clientId) => apiClient.get(`/client-panel/${clientId}/reports/daily-sales`);
export const getProfitabilitySummary = (clientId) => apiClient.get(`/client-panel/${clientId}/reports/profitability`);
// Hacemos que getBestSellers acepte un rango de fechas.
export const getBestSellers = (clientId, startDate, endDate) => apiClient.get(`/client-panel/${clientId}/reports/best-sellers`, {
    params: {
        startDate: `${startDate}T00:00:00`,
        endDate: `${endDate}T23:59:59`,
    }
});
export const getSalesByEmployee = (clientId, startDate, endDate) => apiClient.get(`/client-panel/${clientId}/reports/sales-by-employee`, {
    params: {
        startDate: `${startDate}T00:00:00`,
        endDate: `${endDate}T23:59:59`,
    }
});

// --- Cash Register ---
export const openCashSession = (clientId, initialBalance) => apiClient.post(`/client-panel/${clientId}/cash-session/open`, { initialBalance });
export const closeCashSession = (clientId, finalBalance) => apiClient.post(`/client-panel/${clientId}/cash-session/close`, { finalBalance });
export const getActiveCashSession = (clientId) => apiClient.get(`/client-panel/${clientId}/cash-session/active`);


export default apiClient;
