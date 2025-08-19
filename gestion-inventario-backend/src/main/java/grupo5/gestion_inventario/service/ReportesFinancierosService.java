package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.clientpanel.model.Expense;
import grupo5.gestion_inventario.clientpanel.model.HoursWorked;
import grupo5.gestion_inventario.clientpanel.model.SalaryRate;
import grupo5.gestion_inventario.clientpanel.model.Sale;
import grupo5.gestion_inventario.clientpanel.repository.ExpenseRepository;
import grupo5.gestion_inventario.clientpanel.repository.HoursWorkedRepository;
import grupo5.gestion_inventario.clientpanel.repository.SalaryRateRepository;
import grupo5.gestion_inventario.clientpanel.repository.SaleRepository;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.Product;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Servicio de reportes financieros a nivel CLIENTE.
 *
 * Notas de diseño:
 * - Multi-sucursal: todas las consultas derivan por relación {@code sucursal -> client}
 *   (p.ej., {@code findBySucursalClientId(...)}) para mantener coherencia con el modelo actual.
 * - No se usan métodos de repositorios deprecados.
 * - No se cambia ninguna firma pública; se agregan utilidades privadas para mejorar legibilidad.
 */
@Service
public class ReportesFinancierosService {

    /* -------------------------------------------------------------------------
     *  Repositorios (inyección por constructor)
     * ------------------------------------------------------------------------- */
    private final SaleRepository saleRepository;
    private final ExpenseRepository expenseRepository;
    private final ProductRepository productRepository;
    private final ClientRepository clientRepository;
    private final HoursWorkedRepository hoursWorkedRepository;
    private final SalaryRateRepository salaryRateRepository;

    public ReportesFinancierosService(SaleRepository saleRepository,
                                      ExpenseRepository expenseRepository,
                                      ProductRepository productRepository,
                                      ClientRepository clientRepository,
                                      HoursWorkedRepository hoursWorkedRepository,
                                      SalaryRateRepository salaryRateRepository) {
        this.saleRepository = saleRepository;
        this.expenseRepository = expenseRepository;
        this.productRepository = productRepository;
        this.clientRepository = clientRepository;
        this.hoursWorkedRepository = hoursWorkedRepository;
        this.salaryRateRepository = salaryRateRepository;
    }

    /* =========================================================================
     *  1) ESTADO DE RESULTADOS (Pérdidas y Ganancias)
     * =========================================================================
     * - Ingresos por ventas = sum(totalAmount) en el rango [from..to]
     * - CMV = sum(cost * qty) de los items vendidos en el rango
     * - Gastos operativos = sum(expenses) (en DB vienen negativos → se invierten para mostrar)
     * - Utilidad operativa = margen bruto + gastos (recordar que gastos son negativos)
     * ========================================================================= */
    @Transactional(readOnly = true)
    public EstadoResultadosDTO calcularEstadoResultados(Long clientId, LocalDate from, LocalDate to) {
        LocalDateTime start = startOfDay(from);
        LocalDateTime end   = endOfDay(to);

        // 1) Ventas del cliente en el período
        List<Sale> sales = saleRepository
                .findBySucursalClientIdAndCreatedAtBetween(clientId, start, end);

        // Ingresos por ventas
        BigDecimal ingresosPorVentas = sales.stream()
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2) CMV: costo unitario * cantidad por cada item vendido
        BigDecimal costoMercaderiaVendida = sales.stream()
                .flatMap(s -> s.getItems().stream())
                .map(item -> safe(item.getProduct().getCost())
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal margenBruto = ingresosPorVentas.subtract(costoMercaderiaVendida);

        // 3) Gastos operativos por categoría (DB guarda montos negativos para egresos)
        List<Expense> expenses = expenseRepository
                .findByClientIdAndDateBetweenOrderByDateAsc(clientId, from, to);

        Map<String, BigDecimal> gastosPorCategoria = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        BigDecimal gastosOperativos = gastosPorCategoria.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal utilidadOperativa = margenBruto.add(gastosOperativos);

        // 4) DTO resultado
        EstadoResultadosDTO dto = new EstadoResultadosDTO();
        dto.setIngresosPorVentas(ingresosPorVentas);
        dto.setCostoMercaderiaVendida(costoMercaderiaVendida);
        dto.setMargenBruto(margenBruto);
        dto.setGastosOperativos(gastosOperativos.negate()); // Mostrar como positivo
        dto.setUtilidadOperativa(utilidadOperativa);
        dto.setDetalleGastos(
                gastosPorCategoria.entrySet().stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().negate()))
        );
        return dto;
    }

    /* =========================================================================
     *  2) NÓMINA
     * =========================================================================
     * - Recorre empleados del cliente y horas trabajadas en el período.
     * - Aplica la tarifa efectiva (SalaryRate) por mes (búsqueda por fecha).
     * - Calcula:
     *    * costoTotalNomina = sum(horas * tarifa)
     *    * totalHoras
     *    * costoPromedioPorHora
     *    * costoLaboralSobreIngresos = costoTotalNomina / ingresosDesdeFrom * 100
     * ========================================================================= */
    @Transactional(readOnly = true)
    public NominaDTO calcularMetricasNomina(Long clientId, LocalDate from, LocalDate to) {
        Client client = clientRepository.findById(clientId).orElseThrow();
        NominaDTO dto = new NominaDTO();

        BigDecimal costoTotalNomina = BigDecimal.ZERO;
        BigDecimal totalHoras       = BigDecimal.ZERO;

        // Empleados del cliente (no se filtra por sucursal; es un agregado a nivel cliente)
        for (Employee emp : client.getEmployees()) {

            // Horas del empleado en el período (comparamos por Year/Month)
            List<HoursWorked> horasPeriodo = emp.getHoursWorked().stream()
                    .filter(hw -> {
                        LocalDate hwMonth = LocalDate.of(hw.getYear(), hw.getMonth(), 1);
                        return !hwMonth.isBefore(from.withDayOfMonth(1)) &&
                                !hwMonth.isAfter(to.withDayOfMonth(1));
                    })
                    .collect(Collectors.toList());

            for (HoursWorked hw : horasPeriodo) {
                totalHoras = totalHoras.add(safe(hw.getHours()));

                // Tarifa efectiva para el mes (se busca hacia fin de mes para asegurar vigencia)
                LocalDate rateDate = LocalDate.of(hw.getYear(), hw.getMonth(), 1).withDayOfMonth(28);
                SalaryRate rate = salaryRateRepository
                        .findTopByEmployeeIdAndDate(emp.getId(), rateDate)
                        .orElse(null);

                if (rate != null) {
                    BigDecimal costo = safe(hw.getHours()).multiply(safe(rate.getHourlyRate()));
                    costoTotalNomina = costoTotalNomina.add(costo);
                }
            }
        }

        dto.setCostoTotalNomina(costoTotalNomina);
        dto.setTotalHorasTrabajadas(totalHoras);

        // Costo promedio por hora
        dto.setCostoPromedioPorHora(
                totalHoras.compareTo(BigDecimal.ZERO) > 0
                        ? costoTotalNomina.divide(totalHoras, 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO
        );

        // Ingresos desde "from" hasta ahora (ventas a nivel cliente)
        BigDecimal ingresos = saleRepository
                .findBySucursalClientIdAndCreatedAtBetween(clientId, startOfDay(from), LocalDateTime.now())
                .stream()
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Costo laboral sobre ingresos (en %)
        dto.setCostoLaboralSobreIngresos(
                ingresos.compareTo(BigDecimal.ZERO) > 0
                        ? costoTotalNomina.divide(ingresos, 4, RoundingMode.HALF_UP).doubleValue() * 100
                        : 0d
        );

        return dto;
    }

    /* =========================================================================
     *  3) FLUJO DE CAJA
     * =========================================================================
     * - Entradas = sum(ventas en período)
     * - Salidas  = sum(abs(gastos negativos) en período)
     * - Movimientos: combina ventas + gastos para una vista cronológica
     * ========================================================================= */
    @Transactional(readOnly = true)
    public FlujoCajaDTO calcularFlujoCaja(Long clientId, LocalDate from, LocalDate to) {
        FlujoCajaDTO dto = new FlujoCajaDTO();

        // Saldo inicial simplificado (0). Un cierre de caja real requeriría lógica adicional.
        dto.setSaldoInicial(BigDecimal.ZERO);

        // Gastos del período
        List<Expense> expenses = expenseRepository
                .findByClientIdAndDateBetweenOrderByDateAsc(clientId, from, to);

        // Ventas del período (sin deprecados)
        List<Sale> sales = saleRepository
                .findBySucursalClientIdAndCreatedAtBetween(
                        clientId, startOfDay(from), endOfDay(to)
                );

        // Entradas (ventas)
        BigDecimal entradas = sales.stream()
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Salidas (egresos; en DB negativos → tomamos valor absoluto total)
        BigDecimal salidas = expenses.stream()
                .filter(e -> e.getAmount().compareTo(BigDecimal.ZERO) < 0)
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .negate();

        dto.setEntradas(entradas);
        dto.setSalidas(salidas);
        dto.setSaldoFinal(entradas.subtract(salidas));

        // Movimientos combinados (ordenados desc por fecha)
        Stream<FlujoCajaDTO.MovimientoCajaDTO> movVentas = sales.stream().map(s -> {
            FlujoCajaDTO.MovimientoCajaDTO m = new FlujoCajaDTO.MovimientoCajaDTO();
            m.setFecha(s.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE));
            m.setDescripcion("Venta #" + s.getId());
            m.setCategoria("Ventas");
            m.setMonto(s.getTotalAmount());
            return m;
        });

        Stream<FlujoCajaDTO.MovimientoCajaDTO> movGastos = expenses.stream().map(e -> {
            FlujoCajaDTO.MovimientoCajaDTO m = new FlujoCajaDTO.MovimientoCajaDTO();
            m.setFecha(e.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE));
            m.setDescripcion(e.getDescription());
            m.setCategoria(e.getCategory().getName());
            m.setMonto(e.getAmount());
            return m;
        });

        List<FlujoCajaDTO.MovimientoCajaDTO> movimientos = Stream.concat(movVentas, movGastos)
                .sorted(Comparator.comparing(FlujoCajaDTO.MovimientoCajaDTO::getFecha).reversed())
                .collect(Collectors.toList());

        dto.setMovimientos(movimientos);
        return dto;
    }

    /* =========================================================================
     *  4) ANÁLISIS DE GASTOS POR CATEGORÍA
     * =========================================================================
     * - Devuelve (categoría, monto, % respecto al total de gastos del período)
     * ========================================================================= */
    @Transactional(readOnly = true)
    public List<AnalisisGastosDTO> analizarGastos(Long clientId, LocalDate from, LocalDate to) {
        List<Expense> expenses = expenseRepository
                .findByClientIdAndDateBetweenOrderByDateAsc(clientId, from, to);

        BigDecimal totalGastos = expenses.stream()
                .filter(e -> e.getAmount().compareTo(BigDecimal.ZERO) < 0)
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .negate();

        if (totalGastos.compareTo(BigDecimal.ZERO) == 0) {
            return Collections.emptyList();
        }

        return expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ))
                .entrySet().stream()
                .map(entry -> new AnalisisGastosDTO(
                        entry.getKey(),
                        entry.getValue().negate(), // mostrar positivo
                        entry.getValue().negate()
                                .divide(totalGastos, 4, RoundingMode.HALF_UP)
                                .doubleValue() * 100
                ))
                .sorted(Comparator.comparing(AnalisisGastosDTO::getMonto).reversed())
                .collect(Collectors.toList());
    }

    /* =========================================================================
     *  5) VALOR DE INVENTARIO
     * =========================================================================
     * - Suma (costo * cantidad) de todos los productos del cliente.
     * - Top 5 de productos por valor total.
     * ========================================================================= */
    @Transactional(readOnly = true)
    public ValorInventarioDTO calcularValorInventario(Long clientId) {
        // Navega relación sucursal -> client
        List<Product> productos = productRepository.findBySucursalClientId(clientId);

        BigDecimal valorTotal = productos.stream()
                .map(p -> safe(p.getCost()).multiply(BigDecimal.valueOf(p.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ValorInventarioDTO.ProductoValorizadoDTO> top = productos.stream()
                .map(p -> {
                    ValorInventarioDTO.ProductoValorizadoDTO item = new ValorInventarioDTO.ProductoValorizadoDTO();
                    item.setNombre(p.getName());
                    item.setStockActual(p.getQuantity());
                    item.setCostoUnitario(safe(p.getCost()));
                    item.setValorTotal(safe(p.getCost()).multiply(BigDecimal.valueOf(p.getQuantity())));
                    return item;
                })
                .sorted(Comparator.comparing(ValorInventarioDTO.ProductoValorizadoDTO::getValorTotal).reversed())
                .limit(5)
                .collect(Collectors.toList());

        ValorInventarioDTO dto = new ValorInventarioDTO();
        dto.setValorTotalInventario(valorTotal);
        dto.setTopProductosValorizados(top);
        return dto;
    }

    /* -------------------------------------------------------------------------
     *  Utilidades privadas (claridad y DRY)
     * ------------------------------------------------------------------------- */

    /** Inicio del día (00:00:00.000) */
    private static LocalDateTime startOfDay(LocalDate d) {
        return d.atStartOfDay();
    }

    /** Fin del día (23:59:59.999999999) */
    private static LocalDateTime endOfDay(LocalDate d) {
        return d.atTime(23, 59, 59, 999_999_999);
    }

    /** Evitar NPE en operaciones con BigDecimal */
    private static BigDecimal safe(BigDecimal bd) {
        return bd != null ? bd : BigDecimal.ZERO;
    }
}
