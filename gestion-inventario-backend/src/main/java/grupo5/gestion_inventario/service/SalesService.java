// src/main/java/grupo5/gestion_inventario/service/SalesService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.SaleDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleItemDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleItemRequest;
import grupo5.gestion_inventario.clientpanel.dto.SaleRequest;
import grupo5.gestion_inventario.clientpanel.dto.SalesByEmployeeDTO;
import grupo5.gestion_inventario.clientpanel.dto.SalesDailySummaryDto;
import grupo5.gestion_inventario.clientpanel.dto.ProfitabilitySummaryDto;
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
        Client client = clientRepo.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Cliente no encontrado: " + clientId));

        Employee employee = null;
        if (req.getEmployeeId() != null) {
            employee = employeeRepo.findById(req.getEmployeeId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Empleado no encontrado: " + req.getEmployeeId()));
        }

        Sale sale = new Sale(client, employee, req.getPaymentMethod(), req.getSaleDate());

        int totalQty = 0;
        for (SaleItemRequest itemReq : req.getItems()) {
            Product product = productRepo.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Producto no encontrado (ID): " + itemReq.getProductId()));

            int currentStock = product.getQuantity();
            int qtyRequested = itemReq.getQuantity();
            if (currentStock - qtyRequested < 0) {
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

        // Mapear ítems a DTOs
        List<SaleItemDto> itemDtos = saved.getItems().stream()
                .map(item -> new SaleItemDto(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getQuantity(),
                        item.getUnitPrice()
                ))
                .collect(Collectors.toList());

        return new SaleDto(
                saved.getId(),
                client.getName(),
                totalQty,
                saved.getTotalAmount(),
                saved.getPaymentMethod(),
                saved.getCreatedAt(),
                itemDtos
        );
    }

    /* ------------------------------------------------------------------
     *  LECTURA DE VENTAS
     * ------------------------------------------------------------------ */
    @Transactional(readOnly = true)
    public List<SaleDto> findByClientId(Long clientId) {
        if (!clientRepo.existsById(clientId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Cliente no encontrado: " + clientId);
        }
        return saleRepo.findByClientId(clientId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private SaleDto toDto(Sale sale) {
        int totalQty = sale.getItems().stream()
                .mapToInt(SaleItem::getQuantity)
                .sum();

        List<SaleItemDto> itemDtos = sale.getItems().stream()
                .map(item -> new SaleItemDto(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getQuantity(),
                        item.getUnitPrice()
                ))
                .collect(Collectors.toList());

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

    @Transactional(readOnly = true)
    public long countSalesToday(Long clientId) {
        if (!clientRepo.existsById(clientId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Cliente no encontrado: " + clientId);
        }
        LocalDate today = LocalDate.now();
        return saleRepo.countBetween(
                clientId,
                today.atStartOfDay(),
                today.plusDays(1).atStartOfDay()
        );
    }

    @Transactional(readOnly = true)
    public List<SalesDailySummaryDto> summaryLastDays(Long clientId, int days) {
        if (!clientRepo.existsById(clientId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Cliente no encontrado: " + clientId);
        }
        LocalDate start = LocalDate.now().minusDays(days - 1);
        List<Object[]> raw = saleRepo.findDailySummaryNative(clientId, start.atStartOfDay());

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
            result.add(map.getOrDefault(d, new SalesDailySummaryDto(d, 0, BigDecimal.ZERO)));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<ProfitabilitySummaryDto> getProfitabilitySummaryLastDays(Long clientId, int days) {
        if (!clientRepo.existsById(clientId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Cliente no encontrado: " + clientId);
        }
        LocalDate start = LocalDate.now().minusDays(days - 1);
        List<Object[]> raw = saleRepo.findDailyProfitabilitySummaryNative(clientId, start.atStartOfDay());

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
            result.add(map.getOrDefault(d, new ProfitabilitySummaryDto(d, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO)));
        }
        return result;
    }

    /* ------------------------------------------------------------------
     *  VENTAS POR EMPLEADO
     * ------------------------------------------------------------------ */
    public List<SalesByEmployeeDTO> getSalesByEmployee(Long clientId, String startDate, String endDate) {
        LocalDateTime from = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime to   = LocalDate.parse(endDate).atTime(LocalTime.MAX);
        return saleRepo.findSalesByEmployee(clientId, from, to);
    }

    /* ------------------------------------------------------------------
     *  OBTENER VENTA POR ID (DETALLES)
     * ------------------------------------------------------------------ */
    @Transactional(readOnly = true)
    public SaleDto findByIdAndClientId(Long clientId, Long saleId) {
        if (!clientRepo.existsById(clientId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Cliente no encontrado: " + clientId);
        }
        Sale sale = saleRepo.findByIdAndClientId(saleId, clientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Venta no encontrada: clientId=" + clientId + ", saleId=" + saleId
                ));
        return toDto(sale);
    }
}
