// backend/src/main/java/grupo5/gestion_inventario/service/SalesService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.clientpanel.model.Sale;
import grupo5.gestion_inventario.clientpanel.model.SaleItem;
import grupo5.gestion_inventario.clientpanel.repository.SaleRepository;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SalesService {

    private final SaleRepository     saleRepo;
    private final SucursalRepository sucursalRepo;
    private final ProductRepository  productRepo;
    private final EmployeeRepository employeeRepo;

    public SalesService(SaleRepository     saleRepo,
                        SucursalRepository sucursalRepo,
                        ProductRepository  productRepo,
                        EmployeeRepository employeeRepo) {
        this.saleRepo     = saleRepo;
        this.sucursalRepo = sucursalRepo;
        this.productRepo  = productRepo;
        this.employeeRepo = employeeRepo;
    }

    /* ------------------------------------------------------------------
     *  CREAR VENTA
     * ------------------------------------------------------------------ */
    @Transactional
    public SaleDto createSale(Long sucursalId, SaleRequest req) {

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Sucursal no encontrada: " + sucursalId));

        Employee employee = null;
        if (req.getEmployeeId() != null) {
            employee = employeeRepo.findById(req.getEmployeeId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Empleado no encontrado: " + req.getEmployeeId()));
        }

        Sale sale = new Sale(
                sucursal.getClient(),
                employee,
                sucursal,
                req.getPaymentMethod(),
                req.getSaleDate()
        );

        int totalQty = 0;
        for (SaleItemRequest itemReq : req.getItems()) {

            Product product = productRepo.findById(itemReq.getProductId())
                    .filter(p -> p.getSucursal().getId().equals(sucursalId))
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Producto no pertenece a esta sucursal: " + itemReq.getProductId()));

            int currentStock = product.getQuantity();
            int qtyRequested = itemReq.getQuantity();

            if (currentStock < qtyRequested) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Stock insuficiente para " + product.getName() + ": quedan " + currentStock + " unidades");
            }

            product.setQuantity(currentStock - qtyRequested);

            SaleItem item = new SaleItem(product, qtyRequested, product.getPrice());
            sale.addItem(item);
            totalQty += qtyRequested;
        }

        Sale saved = saleRepo.save(sale);
        return toDto(saved, totalQty);
    }

    /* ------------------------------------------------------------------
     *  LECTURA DE VENTAS
     * ------------------------------------------------------------------ */
    @Transactional(readOnly = true)
    public List<SaleDto> findBySucursalId(Long sucursalId) {
        confirmarSucursalExiste(sucursalId);
        return saleRepo.findBySucursalId(sucursalId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countSalesToday(Long sucursalId) {
        confirmarSucursalExiste(sucursalId);
        LocalDate today = LocalDate.now();
        return saleRepo.countBetweenSucursal(
                sucursalId,
                today.atStartOfDay(),
                today.plusDays(1).atStartOfDay()
        );
    }

    @Transactional(readOnly = true)
    public List<SalesDailySummaryDto> summaryLastDays(Long sucursalId, int days) {
        confirmarSucursalExiste(sucursalId);
        LocalDate start = LocalDate.now().minusDays(days - 1);

        List<Object[]> raw = saleRepo.findDailySummarySucursalNative(
                sucursalId,
                start.atStartOfDay()
        );

        Map<LocalDate, SalesDailySummaryDto> map = raw.stream()
                .collect(Collectors.toMap(
                        r -> ((java.sql.Date) r[0]).toLocalDate(),
                        r -> new SalesDailySummaryDto(
                                ((java.sql.Date) r[0]).toLocalDate(),
                                ((Number) r[1]).longValue(),
                                (BigDecimal) r[2]
                        )
                ));

        List<SalesDailySummaryDto> result = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate d = start.plusDays(i);
            result.add(map.getOrDefault(d,
                    new SalesDailySummaryDto(d, 0, BigDecimal.ZERO)));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<ProfitabilitySummaryDto> getProfitabilitySummaryLastDays(Long sucursalId, int days) {
        confirmarSucursalExiste(sucursalId);
        LocalDate start = LocalDate.now().minusDays(days - 1);

        List<Object[]> raw = saleRepo.findDailyProfitabilitySummarySucursalNative(
                sucursalId,
                start.atStartOfDay()
        );

        Map<LocalDate, ProfitabilitySummaryDto> map = raw.stream()
                .collect(Collectors.toMap(
                        r -> ((java.sql.Date) r[0]).toLocalDate(),
                        r -> {
                            BigDecimal revenue = (BigDecimal) r[1];
                            BigDecimal cost    = (BigDecimal) r[2];
                            return new ProfitabilitySummaryDto(
                                    ((java.sql.Date) r[0]).toLocalDate(),
                                    revenue,
                                    cost,
                                    revenue.subtract(cost)
                            );
                        }
                ));

        List<ProfitabilitySummaryDto> result = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate d = start.plusDays(i);
            result.add(map.getOrDefault(d,
                    new ProfitabilitySummaryDto(d, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO)));
        }
        return result;
    }

    /* ------------------------------------------------------------------
     *  VENTAS POR EMPLEADO
     * ------------------------------------------------------------------ */
    @Transactional(readOnly = true)
    public List<SalesByEmployeeDTO> getSalesByEmployee(Long sucursalId,
                                                       String startDate,
                                                       String endDate) {
        confirmarSucursalExiste(sucursalId);
        LocalDateTime from = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime to   = LocalDate.parse(endDate).atTime(LocalTime.MAX);
        return saleRepo.findSalesByEmployeeSucursal(sucursalId, from, to);
    }

    /* ------------------------------------------------------------------
     *  OBTENER VENTA POR ID (DETALLES)
     * ------------------------------------------------------------------ */
    @Transactional(readOnly = true)
    public SaleDto findByIdAndSucursalId(Long sucursalId, Long saleId) {
        confirmarSucursalExiste(sucursalId);
        Sale sale = saleRepo.findByIdAndSucursalId(saleId, sucursalId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Venta no encontrada: sucursalId=" + sucursalId + ", saleId=" + saleId
                ));
        return toDto(sale);
    }

    /* ------------------------------------------------------------------
     *  HELPERS
     * ------------------------------------------------------------------ */
    private void confirmarSucursalExiste(Long id) {
        if (!sucursalRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sucursal no encontrada: " + id);
        }
    }

    private SaleDto toDto(Sale sale) {
        int totalQty = sale.getItems().stream().mapToInt(SaleItem::getQuantity).sum();
        return toDto(sale, totalQty);
    }

    private SaleDto toDto(Sale sale, int totalQty) {
        List<SaleItemDto> itemDtos = sale.getItems().stream()
                .map(item -> new SaleItemDto(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getQuantity(),
                        item.getUnitPrice()
                )).collect(Collectors.toList());

        return new SaleDto(
                sale.getId(),
                sale.getClient().getName(),
                totalQty,
                sale.getTotalAmount(),
                sale.getPaymentMethod(),
                sale.getCreatedAt(),
                itemDtos
        );
    }
}
