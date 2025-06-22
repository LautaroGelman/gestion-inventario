package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.clientpanel.model.Alert;
import grupo5.gestion_inventario.clientpanel.repository.AlertRepository;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.service.ProductService;
import grupo5.gestion_inventario.service.SalesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}")
// Permitimos al propietario (CLIENT) y a los empleados (ADMINISTRADOR, CAJERO, MULTIFUNCION)
@PreAuthorize("hasAnyRole('CLIENT','ADMINISTRADOR','CAJERO','MULTIFUNCION')")
public class ClientPanelController {

    private final ClientRepository clientRepo;
    private final ProductService productService;
    private final SalesService salesService;

    @Autowired
    public ClientPanelController(ClientRepository clientRepo,
                                 ProductService productService,
                                 SalesService salesService) {
        this.clientRepo     = clientRepo;
        this.productService = productService;
        this.salesService   = salesService;
    }

    private Client validateClient(Long clientId, Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    // — GETS ya existentes —

    @GetMapping("/dashboard")
    public ResponseEntity<ClientDashboardDto> getDashboard(
            @PathVariable Long clientId,
            Authentication auth) {
        validateClient(clientId, auth);
        long lowStock   = productService.countLowStock(clientId);
        long salesToday = salesService.countSalesToday(clientId);
        return ResponseEntity.ok(new ClientDashboardDto(lowStock, salesToday));
    }

    @GetMapping("/reports/daily-sales")
    public ResponseEntity<List<SalesDailySummaryDto>> getDailySales(
            @PathVariable Long clientId,
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {
        validateClient(clientId, auth);
        return ResponseEntity.ok(salesService.summaryLastDays(clientId, days));
    }

    @GetMapping("/reports/profitability")
    public ResponseEntity<List<ProfitabilitySummaryDto>> getProfitability(
            @PathVariable Long clientId,
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {
        validateClient(clientId, auth);
        return ResponseEntity.ok(salesService.getProfitabilitySummaryLastDays(clientId, days));
    }

    @GetMapping("/reports/sales-by-employee")
    public ResponseEntity<List<SalesByEmployeeDTO>> getByEmployee(
            @PathVariable Long clientId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication auth) {
        validateClient(clientId, auth);
        return ResponseEntity.ok(salesService.getSalesByEmployee(clientId, startDate, endDate));
    }

}
