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

@Service
public class ReportesFinancierosService {

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

    /**
     * Calcula el estado de resultados (Pérdidas y Ganancias) para un período.
     */
    @Transactional(readOnly = true)
    public EstadoResultadosDTO calcularEstadoResultados(Long clientId, LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.atTime(23, 59, 59, 999999999);

        // 1. Ingresos por ventas
        List<Sale> sales = saleRepository.findByClientId(clientId).stream()
                .filter(s -> !s.getCreatedAt().isBefore(start) && !s.getCreatedAt().isAfter(end))
                .collect(Collectors.toList());
        BigDecimal ingresosPorVentas = sales.stream()
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Costo de mercadería vendida (CMV)
        BigDecimal costoMercaderiaVendida = sales.stream()
                .flatMap(s -> s.getItems().stream())
                .map(item -> item.getProduct().getCost().multiply(new BigDecimal(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal margenBruto = ingresosPorVentas.subtract(costoMercaderiaVendida);

        // 3. Gastos operativos (son negativos en la DB)
        List<Expense> expenses = expenseRepository.findByClientIdAndDateBetweenOrderByDateAsc(clientId, from, to);
        Map<String, BigDecimal> detalleGastos = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        BigDecimal gastosOperativos = detalleGastos.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal utilidadOperativa = margenBruto.add(gastosOperativos);

        EstadoResultadosDTO dto = new EstadoResultadosDTO();
        dto.setIngresosPorVentas(ingresosPorVentas);
        dto.setCostoMercaderiaVendida(costoMercaderiaVendida);
        dto.setMargenBruto(margenBruto);
        dto.setGastosOperativos(gastosOperativos.negate()); // Se muestra como positivo
        dto.setUtilidadOperativa(utilidadOperativa);
        dto.setDetalleGastos(detalleGastos.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().negate())));

        return dto;
    }

    /**
     * Calcula las métricas de nómina para un período.
     */
    @Transactional(readOnly = true)
    public NominaDTO calcularMetricasNomina(Long clientId, LocalDate from, LocalDate to) {
        Client client = clientRepository.findById(clientId).orElseThrow();
        NominaDTO dto = new NominaDTO();

        BigDecimal costoTotalNomina = BigDecimal.ZERO;
        BigDecimal totalHoras = BigDecimal.ZERO;

        for (Employee emp : client.getEmployees()) {
            List<HoursWorked> hoursList = emp.getHoursWorked().stream()
                    .filter(hw -> {
                        LocalDate hwDate = LocalDate.of(hw.getYear(), hw.getMonth(), 1);
                        return !hwDate.isBefore(from.withDayOfMonth(1)) && !hwDate.isAfter(to.withDayOfMonth(1));
                    }).collect(Collectors.toList());

            for(HoursWorked hw : hoursList) {
                totalHoras = totalHoras.add(hw.getHours());
                SalaryRate rate = salaryRateRepository
                        .findTopByEmployeeIdAndDate(emp.getId(), LocalDate.of(hw.getYear(), hw.getMonth(), 1).withDayOfMonth(28))
                        .orElse(null);

                if(rate != null) {
                    costoTotalNomina = costoTotalNomina.add(hw.getHours().multiply(rate.getHourlyRate()));
                }
            }
        }

        dto.setCostoTotalNomina(costoTotalNomina);
        dto.setTotalHorasTrabajadas(totalHoras);

        if (totalHoras.compareTo(BigDecimal.ZERO) > 0) {
            dto.setCostoPromedioPorHora(costoTotalNomina.divide(totalHoras, 2, RoundingMode.HALF_UP));
        } else {
            dto.setCostoPromedioPorHora(BigDecimal.ZERO);
        }

        BigDecimal ingresos = saleRepository.totalRevenueSinceClient(clientId, from.atStartOfDay());
        if(ingresos.compareTo(BigDecimal.ZERO) > 0){
            double ratio = costoTotalNomina.divide(ingresos, 4, RoundingMode.HALF_UP).doubleValue() * 100;
            dto.setCostoLaboralSobreIngresos(ratio);
        } else {
            dto.setCostoLaboralSobreIngresos(0);
        }

        return dto;
    }

    /**
     * Calcula el flujo de caja para un período.
     */
    @Transactional(readOnly = true)
    public FlujoCajaDTO calcularFlujoCaja(Long clientId, LocalDate from, LocalDate to) {
        FlujoCajaDTO dto = new FlujoCajaDTO();
        // NOTA: Saldo inicial requeriría una lógica más compleja (ej. cierre de caja anterior).
        // Por ahora, lo simplificamos a 0.
        dto.setSaldoInicial(BigDecimal.ZERO);

        List<Expense> expenses = expenseRepository.findByClientIdAndDateBetweenOrderByDateAsc(clientId, from, to);
        List<Sale> sales = saleRepository.findByClientId(clientId).stream()
                .filter(s -> !s.getCreatedAt().toLocalDate().isBefore(from) && !s.getCreatedAt().toLocalDate().isAfter(to))
                .collect(Collectors.toList());

        BigDecimal entradas = sales.stream().map(Sale::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salidas = expenses.stream()
                .filter(e -> e.getAmount().compareTo(BigDecimal.ZERO) < 0)
                .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add).negate();

        dto.setEntradas(entradas);
        dto.setSalidas(salidas);
        dto.setSaldoFinal(entradas.subtract(salidas));

        // Combinar movimientos
        Stream<FlujoCajaDTO.MovimientoCajaDTO> movVentas = sales.stream().map(s -> {
            FlujoCajaDTO.MovimientoCajaDTO mov = new FlujoCajaDTO.MovimientoCajaDTO();
            mov.setFecha(s.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE));
            mov.setDescripcion("Venta #" + s.getId());
            mov.setCategoria("Ventas");
            mov.setMonto(s.getTotalAmount());
            return mov;
        });

        Stream<FlujoCajaDTO.MovimientoCajaDTO> movGastos = expenses.stream().map(e -> {
            FlujoCajaDTO.MovimientoCajaDTO mov = new FlujoCajaDTO.MovimientoCajaDTO();
            mov.setFecha(e.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE));
            mov.setDescripcion(e.getDescription());
            mov.setCategoria(e.getCategory().getName());
            mov.setMonto(e.getAmount());
            return mov;
        });

        List<FlujoCajaDTO.MovimientoCajaDTO> todosLosMovimientos = Stream.concat(movVentas, movGastos)
                .sorted(Comparator.comparing(FlujoCajaDTO.MovimientoCajaDTO::getFecha).reversed())
                .collect(Collectors.toList());

        dto.setMovimientos(todosLosMovimientos);

        return dto;
    }

    /**
     * Agrupa los gastos por categoría.
     */
    @Transactional(readOnly = true)
    public List<AnalisisGastosDTO> analizarGastos(Long clientId, LocalDate from, LocalDate to) {
        List<Expense> expenses = expenseRepository.findByClientIdAndDateBetweenOrderByDateAsc(clientId, from, to);

        BigDecimal totalGastos = expenses.stream()
                .filter(e -> e.getAmount().compareTo(BigDecimal.ZERO) < 0)
                .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add).negate();

        if (totalGastos.compareTo(BigDecimal.ZERO) == 0) return Collections.emptyList();

        return expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ))
                .entrySet().stream()
                .map(entry -> new AnalisisGastosDTO(
                        entry.getKey(),
                        entry.getValue().negate(),
                        entry.getValue().negate().divide(totalGastos, 4, RoundingMode.HALF_UP).doubleValue() * 100
                ))
                .sorted(Comparator.comparing(AnalisisGastosDTO::getMonto).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Calcula el valor total del inventario actual y un top 5 de productos.
     */
    @Transactional(readOnly = true)
    public ValorInventarioDTO calcularValorInventario(Long clientId) {
        List<Product> productos = productRepository.findByClientId(clientId);

        BigDecimal valorTotal = productos.stream()
                .map(p -> p.getCost().multiply(new BigDecimal(p.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ValorInventarioDTO.ProductoValorizadoDTO> topProductos = productos.stream()
                .map(p -> {
                    ValorInventarioDTO.ProductoValorizadoDTO item = new ValorInventarioDTO.ProductoValorizadoDTO();
                    item.setNombre(p.getName());
                    item.setStockActual(p.getQuantity());
                    item.setCostoUnitario(p.getCost());
                    item.setValorTotal(p.getCost().multiply(new BigDecimal(p.getQuantity())));
                    return item;
                })
                .sorted(Comparator.comparing(ValorInventarioDTO.ProductoValorizadoDTO::getValorTotal).reversed())
                .limit(5)
                .collect(Collectors.toList());

        ValorInventarioDTO dto = new ValorInventarioDTO();
        dto.setValorTotalInventario(valorTotal);
        dto.setTopProductosValorizados(topProductos);
        return dto;
    }
}