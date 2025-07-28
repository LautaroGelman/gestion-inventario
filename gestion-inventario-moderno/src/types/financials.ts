// Define la estructura de los datos que vienen del backend

export interface EstadoResultados {
    ingresosPorVentas: number;
    costoMercaderiaVendida: number;
    margenBruto: number;
    gastosOperativos: number;
    utilidadOperativa: number;
    detalleGastos: Record<string, number>;
}

export interface Nomina {
    costoTotalNomina: number;
    totalHorasTrabajadas: number;
    costoPromedioPorHora: number;
    costoLaboralSobreIngresos: number;
}

export interface MovimientoCaja {
    fecha: string;
    descripcion: string;
    categoria: string;
    monto: number;
}

export interface FlujoCaja {
    saldoInicial: number;
    entradas: number;
    salidas: number;
    saldoFinal: number;
    movimientos: MovimientoCaja[];
}

export interface AnalisisGastos {
    categoria: string;
    monto: number;
    porcentaje: number;
}

export interface ProductoValorizado {
    nombre: string;
    stockActual: number;
    costoUnitario: number;
    valorTotal: number;
}

export interface ValorInventario {
    valorTotalInventario: number;
    topProductosValorizados: ProductoValorizado[];
}