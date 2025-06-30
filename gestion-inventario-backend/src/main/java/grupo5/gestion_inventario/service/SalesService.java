package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.clientpanel.model.Sale;
import grupo5.gestion_inventario.clientpanel.model.SaleItem;
import grupo5.gestion_inventario.clientpanel.repository.SaleRepository;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.Product;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Lógica de ventas: registrar, listar y generar reportes.
 */
@Service
public class SalesService {

    private final SaleRepository     saleRepo;
    private final ClientRepository   clientRepo;
    private final ProductRepository  productRepo;
    private final EmployeeRepository employeeRepo;

    public SalesService(SaleRepository saleRepo,
                        ClientRepository clientRepo,
                        ProductRepository productRepo,
                        EmployeeRepository employeeRepo) {
        this.saleRepo     = saleRepo;
        this.clientRepo   = clientRepo;
        this.productRepo  = productRepo;
        this.employeeRepo = employeeRepo;
    }

    /* ------------------------------------------------------------------
     *  CREAR VENTA
     * ------------------------------------------------------------------ */
    @Transactional
    public SaleDto createSale(Long clientId, SaleRequest req) {

        /* 1. Validaciones básicas */
        Client client = clientRepo.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Cliente no encontrado: " + clientId));

        Employee employee = null;
        if (req.getEmployeeId() != null) {
            employee = employeeRepo.findById(req.getEmployeeId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Empleado no encontrado: " + req.getEmployeeId()));
        }

        /* 2. Instanciamos la venta vacía */
        Sale sale = new Sale(client, employee, req.getPaymentMethod(), req.getSaleDate());

        int totalQty = 0; // acumulamos el total de unidades vendidas

        /* 3. Añadimos los ítems y actualizamos stock */
        for (SaleItemRequest itemReq : req.getItems()) {

            Product product = productRepo.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Producto no encontrado (ID): " + itemReq.getProductId()));

            int currentStock = product.getQuantity();
            int qtyRequested = itemReq.getQuantity();

            System.out.printf("[DEBUG] Producto %s: stock=%d, request=%d%n",
                    product.getName(), currentStock, qtyRequested);

            if (currentStock - qtyRequested < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Stock insuficiente para %s: quedan %d unidades"
                                .formatted(product.getName(), currentStock));
            }

            product.setQuantity(currentStock - qtyRequested);

            SaleItem item = new SaleItem(product, qtyRequested, product.getPrice());
            sale.addItem(item);

            totalQty += qtyRequested;
        }

        /* 4. Guardamos y devolvemos DTO */
        Sale saved = saleRepo.save(sale);

        return new SaleDto(
                saved.getId(),
                client.getName(),
                totalQty,
                saved.getTotalAmount(),
                saved.getPaymentMethod(),
                saved.getCreatedAt()
        );
    }

    /* ------------------------------------------------------------------
     *  LECTURA DE VENTAS
     * ------------------------------------------------------------------ */
    @Transactional(readOnly = true)
    public List<SaleDto> findByClientId(Long clientId) {

        if (!clientRepo.existsById(clientId)) {
            throw new IllegalArgumentException("Cliente no encontrado: " + clientId);
        }

        return saleRepo.findByClientId(clientId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private SaleDto toDto(Sale sale) {

        int totalQty = sale.getItems()
                .stream()
                .mapToInt(SaleItem::getQuantity)
                .sum();

        return new SaleDto(
                sale.getId(),
                sale.getClient().getName(),
                totalQty,
                sale.getTotalAmount(),
                sale.getPaymentMethod(),
                sale.getCreatedAt()
        );
    }

    /* ------------------------------------------------------------------
     *  CONTEO DEL DÍA
     * ------------------------------------------------------------------ */
    @Transactional(readOnly = true)
    public long countSalesToday(Long clientId) {

        if (!clientRepo.existsById(clientId)) {
            throw new IllegalArgumentException("Cliente no encontrado: " + clientId);
        }

        LocalDate today = LocalDate.now();
        return saleRepo.countBetween(
                clientId,
                today.atStartOfDay(),
                today.plusDays(1).atStartOfDay()
        );
    }

    /* ------------------------------------------------------------------
     *  RESÚMENES DIARIOS Y RENTABILIDAD
     * ------------------------------------------------------------------ */
    @Transactional(readOnly = true)
    public List<SalesDailySummaryDto> summaryLastDays(Long clientId, int days) {

        if (!clientRepo.existsById(clientId)) {
            throw new IllegalArgumentException("Cliente no encontrado: " + clientId);
        }

        LocalDate start = LocalDate.now().minusDays(days - 1);

        List<Object[]> raw = saleRepo.findDailySummaryNative(
                clientId, start.atStartOfDay());

        Map<LocalDate, SalesDailySummaryDto> map = raw.stream()
                .collect(Collectors.toMap(
                        r -> ((java.sql.Date) r[0]).toLocalDate(),
                        r -> new SalesDailySummaryDto(
                                ((java.sql.Date) r[0]).toLocalDate(),
                                ((Number)      r[1]).longValue(),
                                (BigDecimal)   r[2])));

        List<SalesDailySummaryDto> result = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate d = start.plusDays(i);
            result.add(map.getOrDefault(
                    d, new SalesDailySummaryDto(d, 0, BigDecimal.ZERO)));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<ProfitabilitySummaryDto> getProfitabilitySummaryLastDays(Long clientId, int days) {

        if (!clientRepo.existsById(clientId)) {
            throw new IllegalArgumentException("Cliente no encontrado: " + clientId);
        }

        LocalDate startDate = LocalDate.now().minusDays(days - 1);

        List<Object[]> rawData = saleRepo.findDailyProfitabilitySummaryNative(
                clientId, startDate.atStartOfDay());

        Map<LocalDate, ProfitabilitySummaryDto> map = rawData.stream()
                .collect(Collectors.toMap(
                        row -> ((java.sql.Date) row[0]).toLocalDate(),
                        row -> {
                            BigDecimal revenue = (BigDecimal) row[1];
                            BigDecimal cost    = (BigDecimal) row[2];
                            BigDecimal profit  = revenue.subtract(cost);
                            return new ProfitabilitySummaryDto(
                                    ((java.sql.Date) row[0]).toLocalDate(),
                                    revenue,
                                    cost,
                                    profit
                            );
                        }
                ));

        List<ProfitabilitySummaryDto> result = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate day = startDate.plusDays(i);
            result.add(map.getOrDefault(
                    day, new ProfitabilitySummaryDto(day, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO)
            ));
        }
        return result;
    }

    /* ------------------------------------------------------------------
     *  VENTAS POR EMPLEADO
     * ------------------------------------------------------------------ */
    public List<SalesByEmployeeDTO> getSalesByEmployee(
            Long clientId, String startDate, String endDate) {

        LocalDateTime from = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime to   = LocalDate.parse(endDate).atTime(LocalTime.MAX);

        return saleRepo.findSalesByEmployee(clientId, from, to);
    }
}
