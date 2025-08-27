// src/services/api.ts
// ✅ MULTISUCURSAL alineado con tus controllers actuales:
//    - Dashboard y reportes por sucursal usan la ruta anidada /sucursales/{sucursalId}/...
//    - Reportes financieros agregados por cliente mantienen /client-panel/{clientId}/reports/...
//    - Interceptores: token + manejo 401/403

import axios, { AxiosInstance } from 'axios';
import type {
  EstadoResultados,
  Nomina,
  FlujoCaja,
  AnalisisGastos,
  ValorInventario,
} from '@/types/financials';

// ────────────────────────────────────────────────────────────────
// Config base
// ────────────────────────────────────────────────────────────────
const baseURL: string =
  process.env.NODE_ENV === 'development'
    ? '/api' // proxy en dev → /api/... => backend /api/...
    : process.env.NEXT_PUBLIC_API_URL ?? '';

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

const mustId = (v: string | number | null | undefined, name: string) => {
  const s = v === null || v === undefined ? '' : String(v);
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
    throw new Error(`Falta ${name} (no se seleccionó ${name === 'sucursalId' ? 'la sucursal' : name})`);
  }
  return s;
};

// ────────────────────────────────────────────────────────────────
/** Interceptores: agrega Bearer y maneja 401/403 */
// ────────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      let token = sessionStorage.getItem('token');
      if (!token) token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        document.cookie = 'token=; Max-Age=0; path=/';
      } catch {}
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

// ────────────────────────────────────────────────────────────────
/** Helpers de rutas */
// ────────────────────────────────────────────────────────────────
const baseCliente = (clientId: string | number) => `/client-panel/${mustId(clientId, 'clientId')}`;
const baseSucursal = (clientId: string | number, sucursalId: string | number) =>
  `/client-panel/${mustId(clientId, 'clientId')}/sucursales/${mustId(sucursalId, 'sucursalId')}`;

// ────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────
export const login = (credentials: Record<string, any>) =>
  apiClient.post('/auth/login', credentials);

export const logout = () => apiClient.post('/auth/logout');

// ────────────────────────────────────────────────────────────────
// Superpanel (Super Admin)
// ────────────────────────────────────────────────────────────────
export const getGlobalMetrics = () => apiClient.get('/superpanel/metrics');

// ────────────────────────────────────────────────────────────────
// Admin - Gestión de Clientes
// ────────────────────────────────────────────────────────────────
export const getClients = () => apiClient.get('/admin/clients');

export const createClient = (clientData: Record<string, any>) =>
  apiClient.post('/admin/clients', clientData);

export const activateClient = (clientId: string | number) =>
  apiClient.patch(`/admin/clients/${clientId}/activate`);

export const deactivateClient = (clientId: string | number) =>
  apiClient.patch(`/admin/clients/${clientId}/inactive`);

// ────────────────────────────────────────────────────────────────
// Cliente — Sucursales (selector del propietario)
// ────────────────────────────────────────────────────────────────
export const getSucursales = (clientId: string | number) =>
  apiClient.get(`${baseCliente(clientId)}/sucursales`);

export const getBranches = getSucursales; // alias por compat
export const createBranch = (
  clientId: string | number,
  data: { name?: string; address?: string }
) => apiClient.post(`${baseCliente(clientId)}/sucursales`, data);

// ────────────────────────────────────────────────────────────────
// Alerts / Notificaciones (nivel cliente)
// ────────────────────────────────────────────────────────────────
export const getAlerts = (clientId: string | number) =>
  apiClient.get(`${baseCliente(clientId)}/alerts`);

export const markAlertAsRead = (clientId: string | number, alertId: string | number) =>
  apiClient.post(`${baseCliente(clientId)}/alerts/${alertId}/mark-as-read`);

// ────────────────────────────────────────────────────────────────
// DASHBOARD — POR SUCURSAL (según tu ClientPanelController)
// ────────────────────────────────────────────────────────────────
export const getSucursalDashboard = (
  clientId: string | number,
  sucursalId: string | number
) => apiClient.get(`${baseSucursal(clientId, sucursalId)}/dashboard`);

export const getDashboardOverview = getSucursalDashboard;

// ────────────────────────────────────────────────────────────────
// INVENTARIO — Productos (POR SUCURSAL)
// ────────────────────────────────────────────────────────────────
export const getProducts = (clientId: string | number, sucursalId: string | number) =>
  apiClient.get(`${baseSucursal(clientId, sucursalId)}/items`);

export const createProduct = (
  clientId: string | number,
  sucursalId: string | number,
  productData: Record<string, any>
) => apiClient.post(`${baseSucursal(clientId, sucursalId)}/items`, productData);

export const updateProduct = (
  clientId: string | number,
  sucursalId: string | number,
  productId: string | number,
  productData: Record<string, any>
) => apiClient.put(`${baseSucursal(clientId, sucursalId)}/items/${productId}`, productData);

export const deleteProduct = (
  clientId: string | number,
  sucursalId: string | number,
  productId: string | number
) => apiClient.delete(`${baseSucursal(clientId, sucursalId)}/items/${productId}`);

export const getProductById = (
  clientId: string | number,
  sucursalId: string | number,
  productId: string | number
) => apiClient.get(`${baseSucursal(clientId, sucursalId)}/items/${productId}`);

// ────────────────────────────────────────────────────────────────
// Proveedores (NIVEL CLIENTE, compat)
// ────────────────────────────────────────────────────────────────
export const getProviders = (clientId: string | number) =>
  apiClient.get(`${baseCliente(clientId)}/providers`);

export const addProvider = (clientId: string | number, providerData: Record<string, any>) =>
  apiClient.post(`${baseCliente(clientId)}/providers`, providerData);

// ────────────────────────────────────────────────────────────────
// VENTAS (POR SUCURSAL)
// ────────────────────────────────────────────────────────────────
export const createSale = (
  clientId: string | number,
  sucursalId: string | number,
  saleData: Record<string, any>
) => apiClient.post(`${baseSucursal(clientId, sucursalId)}/sales`, saleData);

export const getSales = (
  clientId: string | number,
  sucursalId: string | number,
  params?: any
) => apiClient.get(`${baseSucursal(clientId, sucursalId)}/sales`, { params });

export const getSaleById = (
  clientId: string | number,
  sucursalId: string | number,
  saleId: string | number
) => apiClient.get(`${baseSucursal(clientId, sucursalId)}/sales/${saleId}`);

// ────────────────────────────────────────────────────────────────
/** DEVOLUCIONES de venta (POR SUCURSAL) */
// ────────────────────────────────────────────────────────────────
export const createSaleReturn = (
  clientId: string | number,
  sucursalId: string | number,
  returnData: {
    saleId: number;
    reason?: string;
    items: { saleItemId: number; quantity: number }[];
  }
) => apiClient.post(`${baseSucursal(clientId, sucursalId)}/returns`, returnData);

export const getSaleReturns = (
  clientId: string | number,
  sucursalId: string | number,
  params: { from: string; to: string; saleId?: string | number }
) => apiClient.get(`${baseSucursal(clientId, sucursalId)}/returns`, { params });

// ────────────────────────────────────────────────────────────────
// EMPLEADOS (POR SUCURSAL)
// ────────────────────────────────────────────────────────────────
export const getEmployees = (clientId: string | number, sucursalId: string | number) =>
  apiClient.get(`${baseSucursal(clientId, sucursalId)}/employees`);

export const createEmployee = (
  clientId: string | number,
  sucursalId: string | number,
  data: Record<string, any>
) => apiClient.post(`${baseSucursal(clientId, sucursalId)}/employees`, data);

export const updateEmployee = (
  clientId: string | number,
  sucursalId: string | number,
  employeeId: string | number,
  data: Record<string, any>
) => apiClient.put(`${baseSucursal(clientId, sucursalId)}/employees/${employeeId}`, data);

export const deleteEmployee = (
  clientId: string | number,
  sucursalId: string | number,
  employeeId: string | number
) => apiClient.delete(`${baseSucursal(clientId, sucursalId)}/employees/${employeeId}`);

// ────────────────────────────────────────────────────────────────
// HORAS TRABAJADAS / TARIFA (POR SUCURSAL)
// ────────────────────────────────────────────────────────────────
export const addHoursWorked = (
  clientId: string | number,
  sucursalId: string | number,
  employeeId: string | number,
  body: { year: number; month: number; hours: number }
) => apiClient.post(`${baseSucursal(clientId, sucursalId)}/employees/${employeeId}/hours-worked`, body);

export const setSalaryRate = (
  clientId: string | number,
  sucursalId: string | number,
  employeeId: string | number,
  body: { hourlyRate: number; effectiveFrom: string } // YYYY-MM-DD
) => apiClient.post(`${baseSucursal(clientId, sucursalId)}/employees/${employeeId}/salary-rate`, body);

// ────────────────────────────────────────────────────────────────
// CAJA REGISTRADORA (NIVEL CLIENTE – si moviste a sucursal, cambia a baseSucursal)
// ────────────────────────────────────────────────────────────────
export const openCashSession = (clientId: string | number, initialBalance: number) =>
  apiClient.post(`${baseCliente(clientId)}/cash-session/open`, { initialBalance });

export const closeCashSession = (clientId: string | number, finalBalance: number) =>
  apiClient.post(`${baseCliente(clientId)}/cash-session/close`, { finalBalance });

export const getActiveCashSession = (clientId: string | number) =>
  apiClient.get(`${baseCliente(clientId)}/cash-session/active`);

// ────────────────────────────────────────────────────────────────
// REPORTES — POR SUCURSAL (según tu ClientPanelController)
// ────────────────────────────────────────────────────────────────
export const getDailySalesByDays = (
  clientId: string | number,
  sucursalId: string | number,
  days = 30
) =>
  apiClient.get(`${baseSucursal(clientId, sucursalId)}/reports/daily-sales`, {
    params: { days },
  });

export const getProfitabilityLastDays = (
  clientId: string | number,
  sucursalId: string | number,
  days = 30
) =>
  apiClient.get(`${baseSucursal(clientId, sucursalId)}/reports/profitability`, {
    params: { days },
  });

export const getSalesByEmployee = (
  clientId: string | number,
  sucursalId: string | number,
  startDate: string,
  endDate: string
) =>
  apiClient.get(`${baseSucursal(clientId, sucursalId)}/reports/sales-by-employee`, {
    params: { startDate, endDate },
  });

// ────────────────────────────────────────────────────────────────
// REPORTES & FINANZAS — NIVEL CLIENTE (agregan TODAS las sucursales)
// (según tu ReportesController)
// ────────────────────────────────────────────────────────────────
interface DateRangeParamsClient {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export const getEstadoResultados = (clientId: string | number, params: DateRangeParamsClient) =>
  apiClient.get<EstadoResultados>(`${baseCliente(clientId)}/reports/estado-resultados`, { params });

export const getNomina = (clientId: string | number, params: DateRangeParamsClient) =>
  apiClient.get<Nomina>(`${baseCliente(clientId)}/reports/nomina`, { params });

export const getFlujoCaja = (clientId: string | number, params: DateRangeParamsClient) =>
  apiClient.get<FlujoCaja>(`${baseCliente(clientId)}/reports/flujo-caja`, { params });

export const getAnalisisGastos = (clientId: string | number, params: DateRangeParamsClient) =>
  apiClient.get<AnalisisGastos[]>(`${baseCliente(clientId)}/reports/analisis-gastos`, { params });

export const getValorInventario = (clientId: string | number) =>
  apiClient.get<ValorInventario>(`${baseCliente(clientId)}/reports/valor-inventario`);

export const getCategories = (clientId: string | number) =>
  apiClient.get(`${baseCliente(clientId)}/categories`);

export const getFinanceMovements = (clientId: string | number, from: string, to: string) =>
  apiClient.get(`${baseCliente(clientId)}/finance/movements`, { params: { from, to } });


export const getSucursalProviders = (clientId: string|number, sucursalId: string|number) =>
  apiClient.get(`${baseSucursal(clientId, sucursalId)}/providers`);

export const linkProviderToBranch = (clientId: string|number, sucursalId: string|number, providerId: string|number) =>
  apiClient.post(`${baseSucursal(clientId, sucursalId)}/providers/${providerId}`);

export const unlinkProviderFromBranch = (clientId: string|number, sucursalId: string|number, providerId: string|number) =>
  apiClient.delete(`${baseSucursal(clientId, sucursalId)}/providers/${providerId}`);

export default apiClient;
